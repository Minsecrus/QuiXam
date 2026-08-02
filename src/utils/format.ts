import type { Paper, Question, QuestionType, ReadingBlank, Section } from '../types'

const CN_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

/** 1 → 一，12 → 十二（支持 1–99） */
export function cnNumber(n: number): string {
  if (n <= 10) return CN_DIGITS[n] ?? String(n)
  if (n < 20) return `十${CN_DIGITS[n - 10]}`
  if (n < 100) {
    const tens = Math.floor(n / 10)
    const rest = n % 10
    return `${CN_DIGITS[tens]}十${rest ? CN_DIGITS[rest] : ''}`
  }
  return String(n)
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single: '单选题',
  multiple: '多选题',
  sevenChoice: '七选五',
  cloze: '完形填空',
  fill: '填空题',
  segmentation: '断句题',
  calculation: '计算题',
  shortAnswer: '简答题',
  solution: '解答题',
  composition: '作文',
  material: '材料题',
}

/** 全部题型（单一来源：新增题型只需改 QUESTION_TYPE_LABELS） */
export const QUESTION_TYPES = Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]

/** 叶子题型：材料题不能嵌套材料题，故子题只能取这些 */
export const LEAF_QUESTION_TYPES = QUESTION_TYPES.filter((type) => type !== 'material')

export const READING_QUESTION_TYPES: QuestionType[] = ['sevenChoice', 'cloze']

export function isReadingQuestion(question: Question): boolean {
  return READING_QUESTION_TYPES.includes(question.type)
}

/** 一道题占用的题号数：材料题按子题数计，其余为 1 */
export function leafCount(question: Question): number {
  if (question.type === 'material') return question.children?.length ?? 0
  if (isReadingQuestion(question)) return question.readingBlanks?.length ?? 0
  return 1
}

/** 一道题的分值：材料题为子题分值合计 */
export function questionScore(question: Question): number {
  if (question.type === 'material') {
    return (question.children ?? []).reduce((sum, child) => sum + (child.score || 0), 0)
  }
  if (isReadingQuestion(question)) {
    return (question.readingBlanks ?? []).reduce((sum, blank) => sum + (blank.score || 0), 0)
  }
  return question.score || 0
}

export function sectionLeafCount(section: Section): number {
  return section.questions.reduce((sum, q) => sum + leafCount(q), 0)
}

export function sectionScore(section: Section): number {
  return section.questions.reduce((sum, q) => sum + questionScore(q), 0)
}

export function paperScore(paper: Paper): number {
  return paper.sections.reduce((sum, s) => sum + sectionScore(s), 0)
}

export function questionCount(paper: Paper): number {
  return paper.sections.reduce((sum, s) => sum + sectionLeafCount(s), 0)
}

/** 各大题起始题号（跨大题连续编号），返回 sectionId → 起始号 */
export function sectionStartNumbers(paper: Paper): Map<string, number> {
  const map = new Map<string, number>()
  let next = 1
  for (const section of paper.sections) {
    map.set(section.id, next)
    next += sectionLeafCount(section)
  }
  return map
}

/** 大题内每道顶层题的起始题号（材料题占连续多个号） */
export function sectionItemNumbers(section: Section, startNumber: number): number[] {
  const numbers: number[] = []
  let next = startNumber
  for (const question of section.questions) {
    numbers.push(next)
    next += leafCount(question)
  }
  return numbers
}

/** 展平为「题号 + 叶子题」序列（参考答案、导出用） */
export interface FlattenedQuestion {
  number: number
  question: Question
  /** 七选五/完形的空；普通题和材料题子题没有该字段。 */
  blank?: ReadingBlank
}

export function flattenLeaves(section: Section, startNumber: number): FlattenedQuestion[] {
  const leaves: FlattenedQuestion[] = []
  let next = startNumber
  for (const question of section.questions) {
    if (question.type === 'material') {
      for (const child of question.children ?? []) {
        leaves.push({ number: next, question: child })
        next += 1
      }
    } else if (isReadingQuestion(question)) {
      for (const blank of question.readingBlanks ?? []) {
        leaves.push({ number: next, question, blank })
        next += 1
      }
    } else {
      leaves.push({ number: next, question })
      next += 1
    }
  }
  return leaves
}

export interface QuestionLocation {
  sectionId: string
  /** 子题所在材料题 id；顶层题为 null */
  parentId: string | null
  index: number
  question: Question
}

/** 在整卷中定位题目（含材料题子题） */
export function locateQuestion(paper: Paper, id: string): QuestionLocation | null {
  for (const section of paper.sections) {
    const index = section.questions.findIndex((q) => q.id === id)
    if (index >= 0) {
      return { sectionId: section.id, parentId: null, index, question: section.questions[index] }
    }
    for (const question of section.questions) {
      if (question.type !== 'material' || !question.children) continue
      const childIndex = question.children.findIndex((c) => c.id === id)
      if (childIndex >= 0) {
        return {
          sectionId: section.id,
          parentId: question.id,
          index: childIndex,
          question: question.children[childIndex],
        }
      }
    }
  }
  return null
}

/** 题目的全卷题号；材料题返回首个子题号（无子题返回 null） */
export function questionNumber(paper: Paper, id: string): number | null {
  const starts = sectionStartNumbers(paper)
  for (const section of paper.sections) {
    let next = starts.get(section.id) ?? 1
    for (const question of section.questions) {
      if (question.id === id) return question.type === 'material' && leafCount(question) === 0 ? null : next
      if (question.type === 'material') {
        for (const child of question.children ?? []) {
          if (child.id === id) return next
          next += 1
        }
      } else {
        next += 1
      }
    }
  }
  return null
}

export function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
