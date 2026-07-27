import type { Question, Section } from '../types'
import { createQuestion, createSection } from '../data/templates'

export interface ParseResult {
  sections: Section[]
  questionCount: number
}

const SECTION_RE = /^[一二三四五六七八九十]+\s*[、.．]\s*(.+)$/
const QUESTION_RE = /^(\d{1,3})\s*[.、．]\s*(.*)$/
const OPTION_RE = /^[A-H]\s*[.、．]/
/** 题干开头的分值标记：（12分）/（本小题满分12分）等 */
const SCORE_RE = /^[（(]\s*(?:本?小?题\s*)?(?:满分\s*)?(\d{1,3})\s*分\s*[）)]\s*/

interface Draft {
  stem: string[]
  options: string[]
  score: number | null
}

function finishQuestion(draft: Draft | null, into: Question[]) {
  if (!draft) return
  let stem = draft.stem.join('\n').trim()
  if (!stem && draft.options.length === 0) return
  const hasOptions = draft.options.length >= 2
  // 只识别出一个选项，说明多半是误切；并回题干而不是丢弃
  if (!hasOptions && draft.options.length === 1) {
    stem = [stem, draft.options[0]].filter(Boolean).join('\n')
  }
  const type = hasOptions ? 'single' : /_{3,}|＿{2,}/.test(stem) ? 'fill' : 'essay'
  const question = createQuestion(type)
  question.stem = stem
  if (hasOptions) question.options = draft.options
  if (draft.score !== null) question.score = draft.score
  into.push(question)
}

/**
 * 把一行里的多个选项拆开：`A．3  B．4` → ['3', '4']。
 * 切点必须从行首开始且标号字母连续递增，否则选项正文里的
 * 「连接 A、B 两点」会被当成新选项，把前一项腰斩。
 */
function splitOptions(line: string): string[] {
  const marks = [...line.matchAll(/([A-H])\s*[.、．]\s*/g)]
  const kept: RegExpMatchArray[] = []
  for (const mark of marks) {
    const expected =
      kept.length === 0 ? null : String.fromCharCode(kept[kept.length - 1][1].charCodeAt(0) + 1)
    if (kept.length === 0 ? mark.index === 0 : mark[1] === expected) {
      kept.push(mark)
    }
  }
  return kept
    .map((mark, index) => {
      const start = (mark.index ?? 0) + mark[0].length
      const end = kept[index + 1]?.index ?? line.length
      return line.slice(start, end).trim()
    })
    .filter(Boolean)
}

/**
 * 把整卷纯文本（通常从 Word 复制）解析为大题/题目结构。
 * 识别规则：`一、` 开头 = 大题；`1.` 开头 = 题目（可带分值标记）；`A.` 开头 = 选项。
 */
export function parseExamText(text: string): ParseResult {
  const sections: Section[] = []
  let currentSection: Section | null = null
  let draft: Draft | null = null
  /** 已识别的最大题号，用于把 `0.5 mol/L…` 这类小数续行挡在题号判定之外 */
  let lastNumber = 0

  const ensureSection = (): Section => {
    if (!currentSection) {
      currentSection = createSection('题目', '')
      sections.push(currentSection)
    }
    return currentSection
  }

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue

    const sectionMatch = SECTION_RE.exec(line)
    // 大题行：排除"一、xxx"实为题干序号的误判 —— 大题行通常较短或含"题"字，这里从宽处理
    if (sectionMatch) {
      finishQuestion(draft, ensureSection().questions)
      draft = null
      const rest = sectionMatch[1]
      const colonIndex = rest.search(/[：:]/)
      const section =
        colonIndex >= 0
          ? createSection(rest.slice(0, colonIndex).trim(), rest.slice(colonIndex + 1).trim())
          : createSection(rest.trim(), '')
      sections.push(section)
      currentSection = section
      lastNumber = 0
      continue
    }

    const questionMatch = QUESTION_RE.exec(line)
    // 题号必须递增；若点号后紧跟数字（`0.5 mol/L`、`12.5 g`），还要求恰好是下一题，
    // 否则视作续行——小数被误判成题号会吞掉整数部分并打乱后续选项归属
    if (questionMatch) {
      const number = Number(questionMatch[1])
      const rest = questionMatch[2]
      const looksLikeDecimal = /^\d/.test(rest)
      if (number > lastNumber && (!looksLikeDecimal || number === lastNumber + 1)) {
        finishQuestion(draft, ensureSection().questions)
        lastNumber = number
        let stem = rest
        let score: number | null = null
        const scoreMatch = SCORE_RE.exec(stem)
        if (scoreMatch) {
          score = Number(scoreMatch[1])
          stem = stem.slice(scoreMatch[0].length)
        }
        draft = { stem: stem ? [stem] : [], options: [], score }
        continue
      }
    }

    if (OPTION_RE.test(line) && draft) {
      draft.options.push(...splitOptions(line))
      continue
    }

    // 普通行：还没进入选项则续题干，否则续到最后一个选项
    if (draft) {
      if (draft.options.length > 0) {
        draft.options[draft.options.length - 1] += ` ${line}`
      } else {
        draft.stem.push(line)
      }
    }
    // 第一道题之前的散行（卷头、注意事项等）忽略 —— 卷头在试卷信息里维护
  }

  finishQuestion(draft, ensureSection().questions)

  const questionCount = sections.reduce((sum, s) => sum + s.questions.length, 0)
  return { sections: sections.filter((s) => s.questions.length > 0), questionCount }
}
