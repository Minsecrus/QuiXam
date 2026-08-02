import { create } from 'zustand'
import {
  DEFAULT_LAYOUT,
  type Paper,
  type PaperSnapshot,
  type PaperInfo,
  type PaperLayout,
  type PaperMeta,
  type CustomPaperTemplate,
  type QuestionBankEntry,
  type Question,
  type QuestionImage,
  type QuestionType,
  type ReadingBlank,
  type Section,
} from '../types'
import * as db from '../db'
import { createFromTemplate, createQuestion, createSection } from '../data/templates'
import { splitSegmentationText, splitSolutionText } from '../data/paperFactory'
import { isReadingQuestion, locateQuestion, QUESTION_TYPES, READING_QUESTION_TYPES } from '../utils/format'
import { collectAssetIds, dataUrlToBlob } from '../utils/transfer'
import { uid } from '../utils/id'
import {
  clonePaperAsNew,
  cloneQuestion as cloneQuestionForReuse,
  cloneSection,
  makeQuestionBankEntry,
  normalizeQuestionMetadata,
  topLevelQuestions,
} from '../utils/questionBank'

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
  showAnswerSheet: boolean
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
  /** 保存并打开由扫描识别生成的新试卷 */
  addRecognizedPaper: (paper: Paper) => Promise<void>
  duplicatePaper: () => Promise<void>
  createPaperFromCustomTemplate: (template: CustomPaperTemplate) => Promise<void>
  saveCurrentAsTemplate: (name: string) => Promise<CustomPaperTemplate | null>

  createSnapshot: (label?: string) => Promise<void>
  restoreSnapshot: (snapshot: PaperSnapshot) => Promise<void>

  undo: () => void
  redo: () => void

  setSelection: (selection: Selection) => void
  setZoom: (zoom: number) => void
  toggleAnswers: () => void
  toggleAnswerSheet: () => void

  renamePaper: (name: string) => void
  updateInfo: (patch: Partial<PaperInfo>) => void
  updateLayout: (patch: Partial<PaperLayout>) => void

  addSection: () => void
  updateSection: (id: string, patch: Partial<Omit<Section, 'id' | 'questions'>>) => void
  moveSection: (id: string, dir: -1 | 1) => void
  reorderSection: (id: string, beforeId: string) => void
  duplicateSection: (id: string) => void
  removeSection: (id: string) => void
  /** 粘贴导入：把解析出的大题追加到当前试卷 */
  appendSections: (sections: Section[]) => void

  addQuestion: (sectionId: string | null, type: QuestionType) => void
  /** 向材料题添加子题（type 不允许再是 material） */
  addChildQuestion: (parentId: string, type: QuestionType) => void
  updateQuestion: (id: string, patch: Partial<Omit<Question, 'id'>>) => void
  moveQuestion: (id: string, dir: -1 | 1) => void
  reorderQuestion: (id: string, beforeId: string) => void
  duplicateQuestion: (id: string) => void
  removeQuestion: (id: string) => void
  updateQuestionScores: (ids: string[], score: number) => void
  removeQuestions: (ids: string[]) => void
  /** 从本地题库批量添加，若当前没有大题则自动创建。 */
  addQuestionsFromBank: (entries: QuestionBankEntry[], sectionId?: string | null) => void
  /** 新建或更新当前题关联的本地题库条目。 */
  saveQuestionToBank: (id: string) => Promise<QuestionBankEntry | null>
  /** 把当前试卷的顶层题目批量存入本地题库，材料题会连同子题一并保存。 */
  saveAllQuestionsToBank: () => Promise<number>

  addQuestionImage: (questionId: string, file: File) => Promise<void>
  /** 裁剪/旋转后写入新的本地图片资产，避免影响其他题目对同一图片的引用。 */
  replaceQuestionImageAsset: (questionId: string, index: number, blob: Blob) => Promise<void>
  updateQuestionImage: (questionId: string, index: number, patch: Partial<QuestionImage>) => void
  removeQuestionImage: (questionId: string, index: number) => void
}

const LAST_OPEN_KEY = 'lastOpenPaperId'
const HISTORY_LIMIT = 100
/** 该时间窗内的连续编辑合并为一个撤销步骤（连续打字不会一字一撤销） */
const COALESCE_MS = 800
/** 自动保存点的节流窗口：高频输入不应制造成百上千条历史版本。 */
const AUTO_SNAPSHOT_MS = 5 * 60 * 1000

let saveTimer: number | undefined
let initStarted = false
let lastSnapshotAt = 0
const lastBackupAt = new Map<string, number>()
/** 独立的脏标记：不能用 saveState 代替，否则落库 await 期间产生的编辑会被静默丢弃 */
let dirty = false

function copyPaperForSnapshot(paper: Paper): Paper {
  // Paper 只包含 JSON 可序列化数据；保留原 id，恢复时才会写回同一张试卷。
  return structuredClone(paper)
}

function makeSnapshot(paper: Paper, label: string): PaperSnapshot {
  return {
    id: uid(),
    paperId: paper.id,
    paperName: paper.name,
    label,
    createdAt: Date.now(),
    paper: copyPaperForSnapshot(paper),
  }
}

function queueAutomaticSnapshot(paper: Paper) {
  const now = Date.now()
  const previous = lastBackupAt.get(paper.id) ?? 0
  if (now - previous < AUTO_SNAPSHOT_MS) return
  lastBackupAt.set(paper.id, now)
  void db.putPaperSnapshot(makeSnapshot(paper, '自动保存点')).catch(() => {
    // 浏览器拒绝 IndexedDB 写入时不影响当前编辑和既有自动保存。
  })
}

function toMeta(paper: Paper): PaperMeta {
  return { id: paper.id, name: paper.name, updatedAt: paper.updatedAt }
}

type LegacyAnswerStyle = 'blank' | 'lines'

function inferLegacyEssayType(
  subject: string,
  stem: string,
  answerStyle: LegacyAnswerStyle,
): QuestionType {
  if (/作文|写作|写一篇|续写|不少于\s*\d+\s*字|词数应为/.test(stem)) return 'composition'
  if (/生物|化学|地理|技术/.test(subject)) return 'solution'
  if (/物理/.test(subject) && /实验|探究|测定|传感器|装置|电路/.test(stem)) return 'solution'
  if (/数学|物理/.test(subject)) return 'calculation'
  if (/历史|政治|语文/.test(subject)) return 'shortAnswer'
  return answerStyle === 'blank' ? 'calculation' : 'shortAnswer'
}

function normalizeReadingBlanks(value: unknown): ReadingBlank[] | undefined {
  if (!Array.isArray(value)) return undefined
  const blanks = value.flatMap((raw) => {
    if (!raw || typeof raw !== 'object') return []
    const item = raw as Record<string, unknown>
    const options = Array.isArray(item.options)
      ? item.options.filter((option): option is string => typeof option === 'string')
      : []
    return [{
      id: typeof item.id === 'string' && item.id ? item.id : uid(),
      score: typeof item.score === 'number' && Number.isFinite(item.score) ? Math.max(0, item.score) : 0,
      answer: typeof item.answer === 'string' ? item.answer : '',
      options,
    }]
  })
  return blanks.length > 0 ? blanks : undefined
}

function migrateStoredQuestion(
  source: Question,
  subject: string,
  legacyPaperStyle: LegacyAnswerStyle,
  allowMaterial = true,
): Question {
  const legacy = source as unknown as Omit<Question, 'type'> & {
    type: QuestionType | 'essay'
    answerStyle?: LegacyAnswerStyle
  }
  const effectiveStyle = legacy.answerStyle ?? legacyPaperStyle
  let type: QuestionType =
    legacy.type === 'essay'
      ? inferLegacyEssayType(subject, legacy.stem ?? '', effectiveStyle)
      : QUESTION_TYPES.includes(legacy.type as QuestionType)
        ? (legacy.type as QuestionType)
        : inferLegacyEssayType(subject, legacy.stem ?? '', effectiveStyle)
  if (type === 'material' && !allowMaterial) {
    type = inferLegacyEssayType(subject, legacy.stem ?? '', effectiveStyle)
  }

  const {
    answerStyle: _legacyAnswerStyle,
    children: legacyChildren,
    parts: legacyParts,
    readingBlanks: legacyReadingBlanks,
    segmentationText: legacySegmentationText,
    compositionStyle: legacyCompositionStyle,
    metadata: legacyMetadata,
    bankEntryId: legacyBankEntryId,
    ...rest
  } = legacy
  void _legacyAnswerStyle

  const base: Question = {
    ...rest,
    type,
    stem: typeof legacy.stem === 'string' ? legacy.stem : '',
    score: Number.isFinite(legacy.score) ? legacy.score : 5,
    options: Array.isArray(legacy.options) ? [...legacy.options] : [],
    answer: typeof legacy.answer === 'string' ? legacy.answer : '',
    answerLines: Number.isFinite(legacy.answerLines) ? Math.max(0, legacy.answerLines) : 0,
    images: legacy.images?.map((image) => ({ ...image })),
    readingBlanks: normalizeReadingBlanks(legacyReadingBlanks),
    metadata: legacyMetadata ? normalizeQuestionMetadata(legacyMetadata) : undefined,
    bankEntryId: typeof legacyBankEntryId === 'string' ? legacyBankEntryId : undefined,
  }

  if (
    type === 'segmentation' ||
    (type === 'fill' && base.stem.includes('断句') && splitSegmentationText(base.stem).segmentationText)
  ) {
    const split = splitSegmentationText(base.stem)
    return {
      ...base,
      type: 'segmentation',
      stem: legacySegmentationText ? base.stem : split.stem,
      segmentationText: legacySegmentationText ?? split.segmentationText,
      answerLines: 0,
      options: [],
    }
  }

  if (type === 'solution') {
    const structured =
      Array.isArray(legacyParts) && legacyParts.length > 0
        ? {
            stem: base.stem,
            parts: legacyParts.map((part) => ({
              id: part.id || uid(),
              stem: typeof part.stem === 'string' ? part.stem : '',
              score: Number.isFinite(part.score) ? Math.max(0, part.score) : 0,
              answerLines: Number.isFinite(part.answerLines) ? Math.max(0, part.answerLines) : 0,
            })),
          }
        : splitSolutionText(base.stem, base.answerLines)
    return { ...base, ...structured, answerLines: 0, options: [] }
  }

  if (type === 'composition') {
    const english = /英语|English/.test(subject)
    return {
      ...base,
      options: [],
      compositionStyle: legacyCompositionStyle ?? (english ? 'lines' : 'grid'),
    }
  }

  if (type === 'sevenChoice' || type === 'cloze') {
    return {
      ...base,
      options: [],
      answerLines: 0,
      material: typeof legacy.material === 'string' ? legacy.material : '',
      materialAlign: 'left',
      readingBlanks: normalizeReadingBlanks(legacyReadingBlanks) ?? [],
    }
  }

  if (type === 'material') {
    return {
      ...base,
      score: 0,
      material: typeof legacy.material === 'string' ? legacy.material : '',
      materialAlign: legacy.materialAlign === 'center' ? 'center' : 'left',
      children: (legacyChildren ?? []).map((child) =>
        migrateStoredQuestion(child, subject, legacyPaperStyle, false),
      ),
      answerLines: 0,
      options: [],
    }
  }

  return base
}

/** 旧版本存量数据迁移：旧 essay/answerStyle 转为明确语义题型，并补齐新结构。 */
export function hydratePaper(paper: Paper): Paper {
  const legacyLayout = paper.layout as PaperLayout & { answerStyle?: LegacyAnswerStyle }
  const { answerStyle: legacyAnswerStyle = 'blank', ...layout } = legacyLayout
  const subject = `${paper.name ?? ''} ${paper.info?.title ?? ''}`
  return {
    ...paper,
    layout: { ...DEFAULT_LAYOUT, ...layout },
    sections: paper.sections.map((section) => ({
      ...section,
      questions: section.questions.map((question) =>
        migrateStoredQuestion(question, subject, legacyAnswerStyle),
      ),
    })),
  }
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
  // 先保留编辑前的可恢复版本；节流保证连续打字不会污染历史列表。
  queueAutomaticSnapshot(state.paper)
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

function moveBefore<T>(items: T[], from: number, before: number): T[] {
  if (from < 0 || before < 0 || from >= items.length || before >= items.length || from === before) return items
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(from < before ? before - 1 : before, 0, item)
  return next
}

function cloneQuestion(question: Question): Question {
  return cloneQuestionForReuse(question)
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
  const legacyPaperStyle: LegacyAnswerStyle = layout.answerStyle === 'lines' ? 'lines' : 'blank'
  const subject = `${str(obj.name)} ${str(info.title)}`

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
    const rawType = str(q.type)
    const effectiveStyle: LegacyAnswerStyle =
      q.answerStyle === 'lines' || q.answerStyle === 'blank' ? q.answerStyle : legacyPaperStyle
    let type: QuestionType =
      rawType === 'essay'
        ? inferLegacyEssayType(subject, str(q.stem), effectiveStyle)
        : QUESTION_TYPES.includes(rawType as QuestionType)
          ? (rawType as QuestionType)
          : inferLegacyEssayType(subject, str(q.stem), effectiveStyle)
    if (type === 'material' && !allowChildren) {
      type = inferLegacyEssayType(subject, str(q.stem), effectiveStyle)
    }

    const base: Question = {
      id: uid(),
      type,
      stem: str(q.stem),
      score: num(q.score, 5),
      options: Array.isArray(q.options) ? q.options.map((o) => str(o)) : [],
      answer: str(q.answer),
      answerLines: num(q.answerLines, 0),
      images: normalizeImages(q.images),
      readingBlanks: normalizeReadingBlanks(q.readingBlanks),
      metadata: q.metadata ? normalizeQuestionMetadata(q.metadata) : undefined,
      bankEntryId: str(q.bankEntryId) || undefined,
    }

    if (
      type === 'segmentation' ||
      (type === 'fill' && base.stem.includes('断句') && splitSegmentationText(base.stem).segmentationText)
    ) {
      const split = splitSegmentationText(base.stem)
      return {
        ...base,
        type: 'segmentation',
        stem: str(q.segmentationText) ? base.stem : split.stem,
        segmentationText: str(q.segmentationText) || split.segmentationText,
        options: [],
        answerLines: 0,
      }
    }

    if (type === 'solution') {
      const parts = (Array.isArray(q.parts) ? q.parts : []).map((rawPart) => {
        const part = (typeof rawPart === 'object' && rawPart ? rawPart : {}) as Record<string, unknown>
        return {
          id: uid(),
          stem: str(part.stem),
          score: Math.max(0, num(part.score, 0)),
          answerLines: Math.max(0, num(part.answerLines, 0)),
        }
      })
      const structured =
        parts.length > 0 ? { stem: base.stem, parts } : splitSolutionText(base.stem, base.answerLines)
      return { ...base, ...structured, options: [], answerLines: 0 }
    }

    if (type === 'composition') {
      return {
        ...base,
        options: [],
        compositionStyle:
          q.compositionStyle === 'lines'
            ? 'lines'
            : q.compositionStyle === 'grid'
              ? 'grid'
              : /英语|English/.test(subject)
                ? 'lines'
                : 'grid',
      }
    }

    if (type === 'sevenChoice' || type === 'cloze') {
      return {
        ...base,
        options: [],
        answerLines: 0,
        material: str(q.material),
        materialAlign: 'left',
        readingBlanks: normalizeReadingBlanks(q.readingBlanks) ?? [],
      }
    }

    if (type === 'material') {
      return {
        ...base,
        score: 0,
        options: [],
        answerLines: 0,
        material: str(q.material),
        materialAlign: q.materialAlign === 'center' ? 'center' : 'left',
        children: (Array.isArray(q.children) ? q.children : []).map((c) =>
          normalizeQuestion(c, false),
        ),
      }
    }

    return base
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
  showAnswerSheet: false,
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
    await db.deletePaperSnapshots(id)
    lastBackupAt.delete(id)
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

  addRecognizedPaper: async (paper) => {
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
  },

  duplicatePaper: async () => {
    const source = get().paper
    if (!source) return
    await flushSave()
    const paper = clonePaperAsNew(source)
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

  createPaperFromCustomTemplate: async (template) => {
    await flushSave()
    const paper = clonePaperAsNew(template.paper, template.name)
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

  saveCurrentAsTemplate: async (name) => {
    const paper = get().paper
    const trimmed = name.trim()
    if (!paper || !trimmed) return null
    const now = Date.now()
    const template: CustomPaperTemplate = {
      id: uid(),
      name: trimmed,
      createdAt: now,
      updatedAt: now,
      paper: copyPaperForSnapshot(paper),
    }
    await db.putCustomTemplate(template)
    return template
  },

  createSnapshot: async (label = '手动保存点') => {
    await flushSave()
    const paper = get().paper
    if (!paper) return
    await db.putPaperSnapshot(makeSnapshot(paper, label.trim() || '手动保存点'))
    lastBackupAt.set(paper.id, Date.now())
  },

  restoreSnapshot: async (snapshot) => {
    const current = get().paper
    if (!current || snapshot.paperId !== current.id) return
    await flushSave()
    await db.putPaperSnapshot(makeSnapshot(current, '恢复前版本'))
    const restored: Paper = {
      ...copyPaperForSnapshot(snapshot.paper),
      id: current.id,
      updatedAt: Date.now(),
    }
    await db.putPaper(restored)
    lastSnapshotAt = 0
    lastBackupAt.set(restored.id, Date.now())
    set((state) => ({
      paper: hydratePaper(restored),
      paperList: state.paperList.map((meta) => (meta.id === restored.id ? toMeta(restored) : meta)),
      selection: { kind: 'paper' },
      past: [],
      future: [],
      saveState: 'saved',
      lastSavedAt: Date.now(),
    }))
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
  toggleAnswerSheet: () => set((state) => ({ showAnswerSheet: !state.showAnswerSheet })),

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

  reorderSection: (id, beforeId) =>
    mutatePaper((paper) => ({
      ...paper,
      sections: moveBefore(
        paper.sections,
        paper.sections.findIndex((section) => section.id === id),
        paper.sections.findIndex((section) => section.id === beforeId),
      ),
    })),

  duplicateSection: (id) => {
    const paper = get().paper
    if (!paper) return
    const index = paper.sections.findIndex((section) => section.id === id)
    if (index < 0) return
    const copy = cloneSection(paper.sections[index])
    mutatePaper((current) => {
      const sections = [...current.sections]
      sections.splice(index + 1, 0, copy)
      return { ...current, sections }
    })
    set({ selection: { kind: 'section', id: copy.id } })
  },

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
    if (!paper || type === 'material' || READING_QUESTION_TYPES.includes(type)) return
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

  reorderQuestion: (id, beforeId) => {
    const { paper } = get()
    if (!paper || id === beforeId) return
    const source = locateQuestion(paper, id)
    const target = locateQuestion(paper, beforeId)
    // 只允许在同一大题、同一材料题层级中排序，避免拖动时意外改变材料题归属。
    if (!source || !target || source.sectionId !== target.sectionId || source.parentId !== target.parentId) return
    mutateQuestionList(source.sectionId, source.parentId, (questions) => moveBefore(questions, source.index, target.index))
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

  updateQuestionScores: (ids, score) => {
    const targetIds = new Set(ids)
    if (targetIds.size === 0) return
    const nextScore = Math.max(0, score)
    mutatePaper((paper) => ({
      ...paper,
      sections: paper.sections.map((section) => ({
        ...section,
        questions: section.questions.map((question) => ({
          ...question,
          ...(question.type !== 'material' && !isReadingQuestion(question) && targetIds.has(question.id)
            ? { score: nextScore }
            : {}),
          ...(isReadingQuestion(question) && targetIds.has(question.id)
            ? { readingBlanks: (question.readingBlanks ?? []).map((blank) => ({ ...blank, score: nextScore })) }
            : {}),
          children: question.children?.map((child) =>
            targetIds.has(child.id) ? { ...child, score: nextScore } : child,
          ),
        })),
      })),
    }))
  },

  removeQuestions: (ids) => {
    const targetIds = new Set(ids)
    if (targetIds.size === 0) return
    mutatePaper((paper) => ({
      ...paper,
      sections: paper.sections.map((section) => ({
        ...section,
        questions: section.questions
          .filter((question) => !targetIds.has(question.id))
          .map((question) => ({
            ...question,
            children: question.children?.filter((child) => !targetIds.has(child.id)),
          })),
      })),
    }))
    set({ selection: { kind: 'paper' } })
  },

  addQuestionsFromBank: (entries, sectionId) => {
    if (entries.length === 0) return
    const { paper, selection } = get()
    if (!paper) return
    const copies = entries.map((entry) => {
      const copy = cloneQuestion(entry.question)
      copy.bankEntryId = entry.id
      return copy
    })
    let target = sectionId ? paper.sections.find((section) => section.id === sectionId) : undefined
    if (!target && selection.kind === 'section') target = paper.sections.find((section) => section.id === selection.id)
    if (!target && selection.kind === 'question') {
      const location = locateQuestion(paper, selection.id)
      if (location) target = paper.sections.find((section) => section.id === location.sectionId)
    }
    target ??= paper.sections[paper.sections.length - 1]
    if (target) {
      mutateQuestionList(target.id, null, (questions) => [...questions, ...copies])
    } else {
      const section = createSection('题库组卷')
      mutatePaper((current) => ({ ...current, sections: [{ ...section, questions: copies }] }))
    }
    const usedAt = Date.now()
    void Promise.all(entries.map((entry) => db.putQuestionBankEntry({
      ...entry,
      usageCount: entry.usageCount + 1,
      updatedAt: usedAt,
    }))).catch(() => {
      // 题目已加进当前试卷；题库使用次数写入失败不应中断本地编辑。
    })
    set({ selection: { kind: 'question', id: copies[0].id } })
  },

  saveQuestionToBank: async (id) => {
    const paper = get().paper
    if (!paper) return null
    const location = locateQuestion(paper, id)
    if (!location) return null
    const existing = location.question.bankEntryId
      ? (await db.getQuestionBankEntries()).find((entry) => entry.id === location.question.bankEntryId)
      : undefined
    const entry = makeQuestionBankEntry(location.question, existing)
    await db.putQuestionBankEntry(entry)
    if (location.question.bankEntryId !== entry.id) get().updateQuestion(id, { bankEntryId: entry.id })
    return entry
  },

  saveAllQuestionsToBank: async () => {
    const paper = get().paper
    if (!paper) return 0
    const questions = topLevelQuestions(paper)
    const existingById = new Map((await db.getQuestionBankEntries()).map((entry) => [entry.id, entry]))
    const entries = questions.map((question) =>
      makeQuestionBankEntry(question, question.bankEntryId ? existingById.get(question.bankEntryId) : undefined),
    )
    await Promise.all(entries.map((entry) => db.putQuestionBankEntry(entry)))
    const idByQuestionId = new Map(entries.map((entry, index) => [questions[index].id, entry.id]))
    mutatePaper((current) => ({
      ...current,
      sections: current.sections.map((section) => ({
        ...section,
        questions: section.questions.map((question) => ({
          ...question,
          bankEntryId: idByQuestionId.get(question.id) ?? question.bankEntryId,
        })),
      })),
    }))
    return entries.length
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

  replaceQuestionImageAsset: async (questionId, index, blob) => {
    const assetId = uid()
    await db.putAsset(assetId, blob)
    const { paper } = get()
    if (!paper) return
    const location = locateQuestion(paper, questionId)
    if (!location) return
    mutateQuestionList(location.sectionId, location.parentId, (questions) =>
      questions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              images: (question.images ?? []).map((image, imageIndex) =>
                imageIndex === index ? { ...image, assetId } : image,
              ),
            }
          : question,
      ),
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
