import { create } from 'zustand'
import {
  DEFAULT_LAYOUT,
  type Paper,
  type PaperInfo,
  type PaperLayout,
  type PaperMeta,
  type Question,
  type QuestionImage,
  type QuestionType,
  type Section,
} from '../types'
import * as db from '../db'
import { createFromTemplate, createQuestion, createSection } from '../data/templates'
import { locateQuestion, QUESTION_TYPES } from '../utils/format'
import { collectAssetIds, dataUrlToBlob } from '../utils/transfer'
import { uid } from '../utils/id'

export type Selection =
  | { kind: 'paper' }
  | { kind: 'section'; id: string }
  | { kind: 'question'; id: string }

export type SaveState = 'idle' | 'saving' | 'saved'

interface PaperStore {
  ready: boolean
  paperList: PaperMeta[]
  paper: Paper | null
  selection: Selection
  zoom: number
  showAnswers: boolean
  saveState: SaveState
  lastSavedAt: number | null
  /** undo/redo 历史（仅内存，不落库） */
  past: Paper[]
  future: Paper[]

  init: () => Promise<void>
  createPaper: (templateId: string) => Promise<void>
  openPaper: (id: string) => Promise<void>
  deletePaper: (id: string) => Promise<void>
  /** 返回错误信息，成功返回 null */
  importPaper: (json: string) => Promise<string | null>

  undo: () => void
  redo: () => void

  setSelection: (selection: Selection) => void
  setZoom: (zoom: number) => void
  toggleAnswers: () => void

  renamePaper: (name: string) => void
  updateInfo: (patch: Partial<PaperInfo>) => void
  updateLayout: (patch: Partial<PaperLayout>) => void

  addSection: () => void
  updateSection: (id: string, patch: Partial<Omit<Section, 'id' | 'questions'>>) => void
  moveSection: (id: string, dir: -1 | 1) => void
  removeSection: (id: string) => void
  /** 粘贴导入：把解析出的大题追加到当前试卷 */
  appendSections: (sections: Section[]) => void

  addQuestion: (sectionId: string | null, type: QuestionType) => void
  /** 向材料题添加子题（type 不允许再是 material） */
  addChildQuestion: (parentId: string, type: QuestionType) => void
  updateQuestion: (id: string, patch: Partial<Omit<Question, 'id'>>) => void
  moveQuestion: (id: string, dir: -1 | 1) => void
  duplicateQuestion: (id: string) => void
  removeQuestion: (id: string) => void

  addQuestionImage: (questionId: string, file: File) => Promise<void>
  updateQuestionImage: (questionId: string, index: number, patch: Partial<QuestionImage>) => void
  removeQuestionImage: (questionId: string, index: number) => void
}

const LAST_OPEN_KEY = 'lastOpenPaperId'
const HISTORY_LIMIT = 100
/** 该时间窗内的连续编辑合并为一个撤销步骤（连续打字不会一字一撤销） */
const COALESCE_MS = 800

let saveTimer: number | undefined
let initStarted = false
let lastSnapshotAt = 0
/** 独立的脏标记：不能用 saveState 代替，否则落库 await 期间产生的编辑会被静默丢弃 */
let dirty = false

function toMeta(paper: Paper): PaperMeta {
  return { id: paper.id, name: paper.name, updatedAt: paper.updatedAt }
}

/** 旧版本存量数据的轻量迁移：补齐后加的 layout 字段 */
function hydratePaper(paper: Paper): Paper {
  return { ...paper, layout: { ...DEFAULT_LAYOUT, ...paper.layout } }
}

function schedulePersist() {
  dirty = true
  usePaperStore.setState({ saveState: 'saving' })
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => void flushSave(), 500)
}

/** 丢弃挂起的保存（删除当前试卷前调用，避免把已删记录写回去） */
function cancelPendingSave() {
  window.clearTimeout(saveTimer)
  saveTimer = undefined
  dirty = false
}

/** 立即落库当前试卷（切卷、关页前调用） */
export async function flushSave(): Promise<void> {
  window.clearTimeout(saveTimer)
  saveTimer = undefined
  const { paper } = usePaperStore.getState()
  if (!paper || !dirty) return
  dirty = false
  await db.putPaper(paper)
  // 落库期间又有新编辑：立刻再存一轮，否则这批改动永远不会落盘
  if (dirty) {
    await flushSave()
    return
  }
  usePaperStore.setState({ saveState: 'saved', lastSavedAt: Date.now() })
}

function mutatePaper(recipe: (paper: Paper) => Paper) {
  const state = usePaperStore.getState()
  if (!state.paper) return
  const next = { ...recipe(state.paper), updatedAt: Date.now() }
  const now = Date.now()
  const coalesce = now - lastSnapshotAt < COALESCE_MS
  lastSnapshotAt = now
  usePaperStore.setState({
    paper: next,
    paperList: state.paperList.map((meta) => (meta.id === next.id ? toMeta(next) : meta)),
    ...(coalesce
      ? {}
      : { past: [...state.past.slice(-(HISTORY_LIMIT - 1)), state.paper], future: [] }),
  })
  schedulePersist()
}

function mutateSection(sectionId: string, recipe: (section: Section) => Section) {
  mutatePaper((paper) => ({
    ...paper,
    sections: paper.sections.map((section) => (section.id === sectionId ? recipe(section) : section)),
  }))
}

/** 对某个题目列表（大题顶层 或 材料题子题列表）做不可变更新 */
function mutateQuestionList(
  sectionId: string,
  parentId: string | null,
  recipe: (questions: Question[]) => Question[],
) {
  mutateSection(sectionId, (section) => {
    if (!parentId) {
      return { ...section, questions: recipe(section.questions) }
    }
    return {
      ...section,
      questions: section.questions.map((question) =>
        question.id === parentId ? { ...question, children: recipe(question.children ?? []) } : question,
      ),
    }
  })
}

function moveInArray<T>(items: T[], index: number, dir: -1 | 1): T[] {
  const target = index + dir
  if (index < 0 || target < 0 || target >= items.length) return items
  const next = [...items]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

function cloneQuestion(question: Question): Question {
  return {
    ...question,
    id: uid(),
    options: [...question.options],
    images: question.images?.map((image) => ({ ...image })),
    children: question.children?.map(cloneQuestion),
  }
}

/** 导入 JSON 的归一化 + 版本迁移入口。宽松解析，缺字段补默认值。 */
function normalizeImportedPaper(raw: unknown, assetIdMap: Map<string, string>): Paper {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('文件内容不是有效的试卷 JSON')
  }
  const obj = raw as Record<string, unknown>
  if (!Array.isArray(obj.sections)) {
    throw new Error('缺少 sections 字段，可能不是 QuiXam 导出的试卷文件')
  }
  const info = (typeof obj.info === 'object' && obj.info ? obj.info : {}) as Record<string, unknown>
  const layout = (typeof obj.layout === 'object' && obj.layout ? obj.layout : {}) as Record<string, unknown>
  const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
  const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback)

  const normalizeImages = (raw: unknown): QuestionImage[] | undefined => {
    if (!Array.isArray(raw)) return undefined
    const images = raw.flatMap((item): QuestionImage[] => {
      const r = (typeof item === 'object' && item ? item : {}) as Record<string, unknown>
      const assetId = str(r.assetId)
      if (!assetId) return []
      return [
        {
          assetId: assetIdMap.get(assetId) ?? assetId,
          widthPercent: Math.min(100, Math.max(10, num(r.widthPercent, 60))),
          align: r.align === 'right' ? 'right' : 'center',
        },
      ]
    })
    return images.length > 0 ? images : undefined
  }

  const normalizeQuestion = (rawQuestion: unknown, allowChildren: boolean): Question => {
    const q = (typeof rawQuestion === 'object' && rawQuestion ? rawQuestion : {}) as Record<string, unknown>
    let type = QUESTION_TYPES.includes(q.type as QuestionType) ? (q.type as QuestionType) : 'essay'
    if (type === 'material' && !allowChildren) type = 'essay'
    return {
      id: uid(),
      type,
      stem: str(q.stem),
      score: num(q.score, 5),
      options: Array.isArray(q.options) ? q.options.map((o) => str(o)) : [],
      answer: str(q.answer),
      answerLines: num(q.answerLines, 0),
      answerStyle:
        q.answerStyle === 'lines' || q.answerStyle === 'blank' ? q.answerStyle : undefined,
      images: normalizeImages(q.images),
      ...(type === 'material'
        ? {
            material: str(q.material),
            materialAlign: q.materialAlign === 'center' ? ('center' as const) : ('left' as const),
            children: (Array.isArray(q.children) ? q.children : []).map((c) => normalizeQuestion(c, false)),
          }
        : {}),
    }
  }

  const now = Date.now()
  return {
    id: uid(),
    name: str(obj.name, '导入的试卷'),
    info: {
      school: str(info.school),
      title: str(info.title, '试卷标题'),
      subtitle: str(info.subtitle),
      duration: num(info.duration, 120),
      fullScore: num(info.fullScore, 150),
      notices: Array.isArray(info.notices) ? info.notices.map((n) => str(n)) : [],
    },
    layout: {
      bodyFont: layout.bodyFont === 'kai' || layout.bodyFont === 'hei' ? layout.bodyFont : DEFAULT_LAYOUT.bodyFont,
      fontSize:
        layout.fontSize === 'small' || layout.fontSize === 'large' ? layout.fontSize : DEFAULT_LAYOUT.fontSize,
      lineHeight:
        layout.lineHeight === 'compact' || layout.lineHeight === 'loose'
          ? layout.lineHeight
          : DEFAULT_LAYOUT.lineHeight,
      pageSize: layout.pageSize === 'a3-2col' ? 'a3-2col' : 'a4',
      sealLine: layout.sealLine === true,
      answerStyle: layout.answerStyle === 'lines' ? 'lines' : 'blank',
      keepQuestionTogether: layout.keepQuestionTogether !== false,
      keepHeadingWithNext: layout.keepHeadingWithNext !== false,
      justifyPages: layout.justifyPages !== false,
    },
    sections: obj.sections.map((rawSection): Section => {
      const s = (typeof rawSection === 'object' && rawSection ? rawSection : {}) as Record<string, unknown>
      return {
        id: uid(),
        title: str(s.title, '大题'),
        description: str(s.description),
        questions: (Array.isArray(s.questions) ? s.questions : []).map((q) => normalizeQuestion(q, true)),
      }
    }),
    createdAt: num(obj.createdAt, now),
    updatedAt: now,
  }
}

export const usePaperStore = create<PaperStore>((set, get) => ({
  ready: false,
  paperList: [],
  paper: null,
  selection: { kind: 'paper' },
  zoom: 100,
  showAnswers: false,
  saveState: 'idle',
  lastSavedAt: null,
  past: [],
  future: [],

  init: async () => {
    if (initStarted) return
    initStarted = true
    const papers = (await db.getAllPapers()).map(hydratePaper)
    if (papers.length === 0) {
      const sample = createFromTemplate('gaokao-math')
      await db.putPaper(sample)
      papers.push(sample)
    }
    papers.sort((a, b) => b.updatedAt - a.updatedAt)
    const lastOpenId = await db.getMeta(LAST_OPEN_KEY)
    const current = papers.find((p) => p.id === lastOpenId) ?? papers[0]
    set({
      ready: true,
      paperList: papers.map(toMeta),
      paper: current,
      selection: { kind: 'paper' },
    })
  },

  createPaper: async (templateId) => {
    await flushSave()
    const paper = createFromTemplate(templateId)
    await db.putPaper(paper)
    await db.setMeta(LAST_OPEN_KEY, paper.id)
    lastSnapshotAt = 0
    set((state) => ({
      paper,
      paperList: [toMeta(paper), ...state.paperList],
      selection: { kind: 'paper' },
      past: [],
      future: [],
    }))
  },

  openPaper: async (id) => {
    if (get().paper?.id === id) return
    await flushSave()
    const paper = await db.getPaper(id)
    if (!paper) return
    await db.setMeta(LAST_OPEN_KEY, id)
    lastSnapshotAt = 0
    set({ paper: hydratePaper(paper), selection: { kind: 'paper' }, past: [], future: [] })
  },

  deletePaper: async (id) => {
    // 必须在任何 await 之前同步取消：挂起的 put 事务会排在 delete 之后执行，把记录写回去
    if (get().paper?.id === id) {
      cancelPendingSave()
      set({ saveState: 'idle' })
    }
    const doomed = await db.getPaper(id)
    await db.deletePaperRecord(id)
    // 回收只被这张卷引用的图片，否则 Blob 会在 IndexedDB 里无限累积
    if (doomed) {
      const orphans = collectAssetIds(doomed)
      for (const survivor of await db.getAllPapers()) {
        for (const stillUsed of collectAssetIds(survivor)) orphans.delete(stillUsed)
      }
      for (const assetId of orphans) await db.deleteAsset(assetId)
    }
    const remaining = get().paperList.filter((meta) => meta.id !== id)
    set({ paperList: remaining })
    if (get().paper?.id !== id) return
    // 删除的是当前卷：打开列表中的下一张，一张不剩则新建空白卷
    if (remaining.length > 0) {
      const next = await db.getPaper(remaining[0].id)
      if (next) {
        await db.setMeta(LAST_OPEN_KEY, next.id)
        lastSnapshotAt = 0
        set({
          paper: hydratePaper(next),
          selection: { kind: 'paper' },
          saveState: 'idle',
          past: [],
          future: [],
        })
        return
      }
    }
    const blank = createFromTemplate('blank')
    await db.putPaper(blank)
    await db.setMeta(LAST_OPEN_KEY, blank.id)
    lastSnapshotAt = 0
    set({
      paper: blank,
      paperList: [toMeta(blank)],
      selection: { kind: 'paper' },
      saveState: 'idle',
      past: [],
      future: [],
    })
  },

  importPaper: async (json) => {
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch {
      return '文件不是有效的 JSON'
    }
    let paper: Paper
    try {
      // 先落图片资源（dataURL → Blob），再归一化并重映射引用
      const assetIdMap = new Map<string, string>()
      const rawAssets =
        parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>).assets : undefined
      if (rawAssets && typeof rawAssets === 'object') {
        for (const [oldId, dataUrl] of Object.entries(rawAssets as Record<string, unknown>)) {
          if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) continue
          const newId = uid()
          await db.putAsset(newId, await dataUrlToBlob(dataUrl))
          assetIdMap.set(oldId, newId)
        }
      }
      paper = normalizeImportedPaper(parsed, assetIdMap)
    } catch (error) {
      return error instanceof Error ? error.message : '解析失败'
    }
    await flushSave()
    await db.putPaper(paper)
    await db.setMeta(LAST_OPEN_KEY, paper.id)
    lastSnapshotAt = 0
    set((state) => ({
      paper,
      paperList: [toMeta(paper), ...state.paperList],
      selection: { kind: 'paper' },
      past: [],
      future: [],
    }))
    return null
  },

  undo: () => {
    const { past, future, paper, paperList } = get()
    if (!paper || past.length === 0) return
    const prev = past[past.length - 1]
    lastSnapshotAt = 0
    set({
      paper: prev,
      past: past.slice(0, -1),
      future: [paper, ...future].slice(0, HISTORY_LIMIT),
      paperList: paperList.map((meta) => (meta.id === prev.id ? toMeta(prev) : meta)),
    })
    schedulePersist()
  },

  redo: () => {
    const { past, future, paper, paperList } = get()
    if (!paper || future.length === 0) return
    const [next, ...rest] = future
    lastSnapshotAt = 0
    set({
      paper: next,
      past: [...past.slice(-(HISTORY_LIMIT - 1)), paper],
      future: rest,
      paperList: paperList.map((meta) => (meta.id === next.id ? toMeta(next) : meta)),
    })
    schedulePersist()
  },

  setSelection: (selection) => set({ selection }),
  setZoom: (zoom) => set({ zoom: Math.min(150, Math.max(50, zoom)) }),
  toggleAnswers: () => set((state) => ({ showAnswers: !state.showAnswers })),

  renamePaper: (name) => mutatePaper((paper) => ({ ...paper, name })),
  updateInfo: (patch) => mutatePaper((paper) => ({ ...paper, info: { ...paper.info, ...patch } })),
  updateLayout: (patch) => mutatePaper((paper) => ({ ...paper, layout: { ...paper.layout, ...patch } })),

  addSection: () => {
    const section = createSection()
    mutatePaper((paper) => ({ ...paper, sections: [...paper.sections, section] }))
    set({ selection: { kind: 'section', id: section.id } })
  },

  updateSection: (id, patch) => mutateSection(id, (section) => ({ ...section, ...patch })),

  moveSection: (id, dir) =>
    mutatePaper((paper) => ({
      ...paper,
      sections: moveInArray(paper.sections, paper.sections.findIndex((s) => s.id === id), dir),
    })),

  removeSection: (id) => {
    mutatePaper((paper) => ({ ...paper, sections: paper.sections.filter((s) => s.id !== id) }))
    set({ selection: { kind: 'paper' } })
  },

  appendSections: (sections) => {
    if (sections.length === 0) return
    lastSnapshotAt = 0
    mutatePaper((paper) => ({ ...paper, sections: [...paper.sections, ...sections] }))
    set({ selection: { kind: 'section', id: sections[0].id } })
  },

  addQuestion: (sectionId, type) => {
    const { paper, selection } = get()
    if (!paper) return
    let target = sectionId ? paper.sections.find((s) => s.id === sectionId) : undefined
    if (!target && selection.kind === 'section') {
      target = paper.sections.find((s) => s.id === selection.id)
    }
    if (!target && selection.kind === 'question') {
      const location = locateQuestion(paper, selection.id)
      if (location) target = paper.sections.find((s) => s.id === location.sectionId)
    }
    target ??= paper.sections[paper.sections.length - 1]
    if (!target) {
      // 连大题都没有：先建一个
      const section = createSection()
      const question = createQuestion(type)
      mutatePaper((p) => ({ ...p, sections: [{ ...section, questions: [question] }] }))
      set({ selection: { kind: 'question', id: question.id } })
      return
    }
    const question = createQuestion(type)
    mutateQuestionList(target.id, null, (questions) => [...questions, question])
    set({ selection: { kind: 'question', id: question.id } })
  },

  addChildQuestion: (parentId, type) => {
    const { paper } = get()
    if (!paper || type === 'material') return
    const location = locateQuestion(paper, parentId)
    if (!location || location.question.type !== 'material') return
    const child = createQuestion(type)
    mutateQuestionList(location.sectionId, parentId, (children) => [...children, child])
    set({ selection: { kind: 'question', id: child.id } })
  },

  updateQuestion: (id, patch) => {
    const { paper } = get()
    if (!paper) return
    const location = locateQuestion(paper, id)
    if (!location) return
    mutateQuestionList(location.sectionId, location.parentId, (questions) =>
      questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    )
  },

  moveQuestion: (id, dir) => {
    const { paper } = get()
    if (!paper) return
    const location = locateQuestion(paper, id)
    if (!location) return
    mutateQuestionList(location.sectionId, location.parentId, (questions) =>
      moveInArray(questions, location.index, dir),
    )
  },

  duplicateQuestion: (id) => {
    const { paper } = get()
    if (!paper) return
    const location = locateQuestion(paper, id)
    if (!location) return
    const copy = cloneQuestion(location.question)
    mutateQuestionList(location.sectionId, location.parentId, (questions) => {
      const next = [...questions]
      next.splice(location.index + 1, 0, copy)
      return next
    })
    set({ selection: { kind: 'question', id: copy.id } })
  },

  removeQuestion: (id) => {
    const { paper } = get()
    if (!paper) return
    const location = locateQuestion(paper, id)
    if (!location) return
    mutateQuestionList(location.sectionId, location.parentId, (questions) =>
      questions.filter((q) => q.id !== id),
    )
    set({
      selection: location.parentId
        ? { kind: 'question', id: location.parentId }
        : { kind: 'section', id: location.sectionId },
    })
  },

  addQuestionImage: async (questionId, file) => {
    const assetId = uid()
    await db.putAsset(assetId, file)
    const { paper } = get()
    if (!paper) return
    const location = locateQuestion(paper, questionId)
    if (!location) return
    const image: QuestionImage = { assetId, widthPercent: 60, align: 'center' }
    lastSnapshotAt = 0
    mutateQuestionList(location.sectionId, location.parentId, (questions) =>
      questions.map((q) => (q.id === questionId ? { ...q, images: [...(q.images ?? []), image] } : q)),
    )
  },

  updateQuestionImage: (questionId, index, patch) => {
    const { paper } = get()
    if (!paper) return
    const location = locateQuestion(paper, questionId)
    if (!location) return
    mutateQuestionList(location.sectionId, location.parentId, (questions) =>
      questions.map((q) =>
        q.id === questionId
          ? { ...q, images: (q.images ?? []).map((img, i) => (i === index ? { ...img, ...patch } : img)) }
          : q,
      ),
    )
  },

  removeQuestionImage: (questionId, index) => {
    const { paper } = get()
    if (!paper) return
    const location = locateQuestion(paper, questionId)
    if (!location) return
    // 仅移除引用；Blob 留在 assets 表（复制的题目可能共享同一资源，MVP 不做引用计数回收）
    mutateQuestionList(location.sectionId, location.parentId, (questions) =>
      questions.map((q) =>
        q.id === questionId ? { ...q, images: (q.images ?? []).filter((_, i) => i !== index) } : q,
      ),
    )
  },
}))
