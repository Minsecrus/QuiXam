import type {
  Paper,
  Question,
  QuestionBankEntry,
  QuestionDifficulty,
  QuestionMetadata,
  QuestionType,
  Section,
} from '../types'
import { questionScore } from './format'
import { uid } from './id'

export interface QuestionBankFilter {
  query?: string
  type?: QuestionType | 'all'
  difficulty?: QuestionDifficulty | 'all'
  tag?: string
}

export interface RandomAssemblyOptions extends QuestionBankFilter {
  /** 0 表示不限制题数。 */
  count: number
  /** 0 表示不按分值逼近。 */
  targetScore: number
}

const DIFFICULTIES: QuestionDifficulty[] = ['unknown', 'easy', 'medium', 'hard']

function cleanStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  return [...new Set(values.filter((value): value is string => typeof value === 'string').map((value) => value.trim()).filter(Boolean))]
}

export function normalizeQuestionMetadata(value: unknown): QuestionMetadata {
  const raw = value && typeof value === 'object' ? (value as Partial<QuestionMetadata>) : {}
  const difficulty = DIFFICULTIES.includes(raw.difficulty as QuestionDifficulty)
    ? (raw.difficulty as QuestionDifficulty)
    : 'unknown'
  const year = typeof raw.year === 'number' && Number.isInteger(raw.year) && raw.year >= 1900 && raw.year <= 2100
    ? raw.year
    : undefined
  return {
    knowledgePoints: cleanStrings(raw.knowledgePoints),
    tags: cleanStrings(raw.tags),
    difficulty,
    source: typeof raw.source === 'string' ? raw.source.trim() : '',
    ...(year === undefined ? {} : { year }),
  }
}

/** 给新文档/题库复用分配新 id，图片资源仍复用原有本地引用。 */
export function cloneQuestion(question: Question): Question {
  return {
    ...question,
    id: uid(),
    options: [...question.options],
    images: question.images?.map((image) => ({ ...image })),
    parts: question.parts?.map((part) => ({ ...part, id: uid() })),
    readingBlanks: question.readingBlanks?.map((blank) => ({ ...blank, id: uid(), options: [...blank.options] })),
    children: question.children?.map(cloneQuestion),
    metadata: question.metadata ? normalizeQuestionMetadata(question.metadata) : undefined,
  }
}

export function cloneSection(section: Section): Section {
  return {
    ...section,
    id: uid(),
    questions: section.questions.map(cloneQuestion),
  }
}

export function clonePaperAsNew(paper: Paper, name = `${paper.name || '未命名试卷'}（副本）`): Paper {
  const now = Date.now()
  return {
    ...paper,
    id: uid(),
    name,
    info: { ...paper.info, notices: [...paper.info.notices] },
    layout: { ...paper.layout },
    sections: paper.sections.map(cloneSection),
    createdAt: now,
    updatedAt: now,
  }
}

export function questionSummary(question: Question, maxLength = 76): string {
  const raw = question.type === 'material'
    ? question.stem || question.material || ''
    : question.type === 'sevenChoice' || question.type === 'cloze'
      ? question.stem || question.material || ''
    : question.type === 'segmentation'
      ? question.segmentationText || question.stem
      : question.type === 'solution'
        ? question.stem || question.parts?.map((part) => part.stem).join(' ') || ''
        : question.stem
  const text = raw.replace(/^[#@]\s*/gm, '').replace(/\s+/g, ' ').trim() || '未填写题干'
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text
}

export function makeQuestionBankEntry(question: Question, existing?: QuestionBankEntry): QuestionBankEntry {
  const now = Date.now()
  const id = existing?.id ?? question.bankEntryId ?? uid()
  const saved = cloneQuestion(question)
  saved.bankEntryId = id
  saved.metadata = normalizeQuestionMetadata(question.metadata)
  return {
    id,
    question: saved,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    usageCount: existing?.usageCount ?? 0,
  }
}

function normalizedSearchText(entry: QuestionBankEntry): string {
  const meta = normalizeQuestionMetadata(entry.question.metadata)
  return [
    questionSummary(entry.question, Number.MAX_SAFE_INTEGER),
    entry.question.type,
    ...meta.knowledgePoints,
    ...meta.tags,
    meta.source,
    meta.year ? String(meta.year) : '',
  ].join('\n').toLocaleLowerCase()
}

export function filterQuestionBank(entries: QuestionBankEntry[], filter: QuestionBankFilter): QuestionBankEntry[] {
  const query = filter.query?.trim().toLocaleLowerCase() ?? ''
  const tag = filter.tag?.trim().toLocaleLowerCase() ?? ''
  return entries.filter((entry) => {
    const metadata = normalizeQuestionMetadata(entry.question.metadata)
    if (filter.type && filter.type !== 'all' && entry.question.type !== filter.type) return false
    if (filter.difficulty && filter.difficulty !== 'all' && metadata.difficulty !== filter.difficulty) return false
    if (tag && !metadata.tags.some((item) => item.toLocaleLowerCase().includes(tag))) return false
    return !query || normalizedSearchText(entry).includes(query)
  })
}

function shuffled<T>(items: T[]): T[] {
  const next = [...items]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[target]] = [next[target], next[index]]
  }
  return next
}

/**
 * 本地随机组卷：先按筛选条件缩小候选集，再在题数上限内贪心逼近目标分。
 * 分数留空时就是等概率随机抽题；目标分没有精确组合时，返回最接近的一组。
 */
export function pickRandomQuestions(
  entries: QuestionBankEntry[],
  options: RandomAssemblyOptions,
): QuestionBankEntry[] {
  const candidates = shuffled(filterQuestionBank(entries, options))
  if (candidates.length === 0) return []
  const maxCount = options.count > 0 ? Math.min(options.count, candidates.length) : candidates.length
  if (options.targetScore <= 0) return candidates.slice(0, maxCount)

  const selected: QuestionBankEntry[] = []
  let total = 0
  const remaining = [...candidates]
  while (remaining.length > 0 && selected.length < maxCount) {
    const need = options.targetScore - total
    let bestIndex = 0
    let bestDistance = Number.POSITIVE_INFINITY
    remaining.forEach((entry, index) => {
      const distance = Math.abs(need - questionScore(entry.question))
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = index
      }
    })
    const [next] = remaining.splice(bestIndex, 1)
    if (!next) break
    const nextTotal = total + questionScore(next.question)
    // 已经达到或越过目标时，仅保留能让误差变小的下一题。
    if (selected.length > 0 && Math.abs(options.targetScore - nextTotal) > Math.abs(options.targetScore - total)) break
    selected.push(next)
    total = nextTotal
    if (total === options.targetScore) break
  }
  return selected.length > 0 ? selected : candidates.slice(0, maxCount)
}

/** 顶层题目入库能保留材料题与其子题的关系，避免重复存两份。 */
export function topLevelQuestions(paper: Paper): Question[] {
  return paper.sections.flatMap((section) => section.questions)
}
