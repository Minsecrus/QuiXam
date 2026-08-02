import {
  DEFAULT_LAYOUT,
  type Paper,
  type Question,
  type QuestionType,
  type ReadingBlank,
  type Section,
  type SolutionPart,
} from '../types'
import { uid } from '../utils/id'

const PART_MARKER = /^\s*[（(]\d+[）)]/
const INLINE_BLANK = /_{3,}|＿{2,}/

function readingBlanks(count: number, score: number, options: string[] = []): ReadingBlank[] {
  return Array.from({ length: count }, () => ({
    id: uid(),
    score,
    answer: '',
    options: [...options],
  }))
}

function partScore(stem: string): number {
  const match = stem.match(/[（(](\d{1,3})\s*分[）)]/)
  return match ? Number(match[1]) : 0
}

/**
 * 把旧式“整段题干 + （1）（2）”转成真正的小问结构。
 * answerLines 只分配给没有句中空位的小问；带 `______` 的小问默认直接在题干中作答。
 */
export function splitSolutionText(
  text: string,
  answerLines = 0,
): { stem: string; parts: SolutionPart[] } {
  const intro: string[] = []
  const chunks: string[] = []
  let current: string[] | null = null

  for (const line of text.split('\n')) {
    if (PART_MARKER.test(line)) {
      if (current) chunks.push(current.join('\n').trim())
      current = [line]
    } else if (current) {
      current.push(line)
    } else {
      intro.push(line)
    }
  }
  if (current) chunks.push(current.join('\n').trim())

  // 没有显式小问标号时，整段内容就是一个小问。
  if (chunks.length === 0) {
    chunks.push(text.trim())
    intro.length = 0
  }

  const lineTargets = chunks
    .map((chunk, index) => (!INLINE_BLANK.test(chunk) ? index : -1))
    .filter((index) => index >= 0)
  // 全部都是句中填空但仍声明了问后横线时，尊重原数据并平均分配。
  if (lineTargets.length === 0 && answerLines > 0) {
    lineTargets.push(...chunks.map((_, index) => index))
  }

  const perTarget = lineTargets.length > 0 ? Math.floor(answerLines / lineTargets.length) : 0
  const remainder = lineTargets.length > 0 ? answerLines % lineTargets.length : 0
  const linesByIndex = new Map<number, number>()
  lineTargets.forEach((index, targetIndex) => {
    linesByIndex.set(index, perTarget + (targetIndex < remainder ? 1 : 0))
  })

  return {
    stem: intro.join('\n').trim(),
    parts: chunks.map((stem, index) => ({
      id: uid(),
      stem,
      score: partScore(stem),
      answerLines: linesByIndex.get(index) ?? 0,
    })),
  }
}

/** 旧断句题常把说明和待断文本塞在同一个 stem 中；迁移时拆开。 */
export function splitSegmentationText(text: string): { stem: string; segmentationText: string } {
  const lines = text.split('\n')
  const index = lines.findIndex((line) => {
    const markers = line.match(/[A-Z]/g) ?? []
    return (
      /[\u3400-\u9fff]/.test(line) &&
      markers.length >= 3 &&
      markers.every((marker, markerIndex) => marker === String.fromCharCode(65 + markerIndex))
    )
  })
  if (index < 0) return { stem: text, segmentationText: '' }
  return {
    stem: lines.slice(0, index).join('\n').trim(),
    segmentationText: lines.slice(index).join('\n').trim(),
  }
}

export function createQuestion(type: QuestionType): Question {
  const base: Question = {
    id: uid(),
    type,
    stem: '',
    score: 5,
    options: [],
    answer: '',
    answerLines: 0,
  }
  switch (type) {
    case 'single':
      return { ...base, options: ['', '', '', ''] }
    case 'multiple':
      return { ...base, score: 6, options: ['', '', '', ''] }
    case 'sevenChoice':
      return {
        ...base,
        score: 12.5,
        stem: '阅读下面短文，从短文后的选项中选出可以填入空白处的最佳选项。',
        material: '',
        materialAlign: 'left',
        readingBlanks: readingBlanks(5, 2.5),
      }
    case 'cloze':
      return {
        ...base,
        score: 15,
        stem: '阅读下面短文，从每题所给的 A、B、C、D 四个选项中选出最佳选项。',
        material: '',
        materialAlign: 'left',
        readingBlanks: readingBlanks(15, 1, ['', '', '', '']),
      }
    case 'fill':
      return { ...base, stem: '______。' }
    case 'segmentation':
      return {
        ...base,
        stem: '下列材料中有三处需要断句，请标出相应位置。',
        segmentationText: '',
      }
    case 'calculation':
      return { ...base, score: 10, answerLines: 8 }
    case 'shortAnswer':
      return { ...base, score: 10, answerLines: 4 }
    case 'solution':
      return {
        ...base,
        score: 10,
        parts: [{ id: uid(), stem: '（1）', score: 0, answerLines: 2 }],
      }
    case 'composition':
      return { ...base, score: 60, answerLines: 25, compositionStyle: 'grid' }
    case 'material':
      return { ...base, score: 0, material: '', materialAlign: 'left', children: [] }
  }
}

export function createSection(title = '新大题', description = ''): Section {
  return { id: uid(), title, description, questions: [] }
}

export function question(
  partial: Partial<Question> & Pick<Question, 'type' | 'stem' | 'score'>,
): Question {
  const merged = { ...createQuestion(partial.type), ...partial, id: uid() }
  if (merged.type === 'solution' && partial.parts === undefined) {
    const structured = splitSolutionText(merged.stem, merged.answerLines)
    return { ...merged, ...structured, answerLines: 0 }
  }
  if (merged.type === 'segmentation' && partial.segmentationText === undefined) {
    return { ...merged, ...splitSegmentationText(merged.stem) }
  }
  return merged
}

export function material(
  text: string,
  children: Question[],
  options: Partial<Pick<Question, 'stem' | 'materialAlign' | 'images'>> = {},
): Question {
  return question({
    type: 'material',
    stem: options.stem ?? '',
    score: 0,
    material: text,
    materialAlign: options.materialAlign ?? 'left',
    children,
    images: options.images,
  })
}

export function readingQuestion(
  type: 'sevenChoice' | 'cloze',
  text: string,
  blanks: Array<Pick<ReadingBlank, 'answer' | 'score' | 'options'>>,
  options: Pick<Question, 'stem'>,
): Question {
  const score = blanks.reduce((sum, blank) => sum + blank.score, 0)
  return question({
    type,
    stem: options.stem,
    score,
    material: text,
    materialAlign: 'left',
    readingBlanks: blanks.map((blank) => ({ ...blank, id: uid(), options: [...blank.options] })),
  })
}

export function basePaper(name: string, subject = '试卷标题', duration = 120): Paper {
  const now = Date.now()
  return {
    id: uid(),
    name,
    info: {
      school: '',
      title: subject,
      subtitle: '',
      duration,
      fullScore: 150,
      notices: [
        '答卷前，考生务必将自己的姓名、准考证号填写在答题卡上。',
        '回答选择题时，选出每小题答案后，用铅笔把答题卡上对应题目的答案标号涂黑。如需改动，用橡皮擦干净后，再选涂其他答案标号。回答非选择题时，将答案写在答题卡上，写在本试卷上无效。',
        '考试结束后，将本试卷和答题卡一并交回。',
      ],
    },
    layout: { ...DEFAULT_LAYOUT },
    sections: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function blankPaper(): Paper {
  const paper = basePaper('未命名试卷')
  paper.sections = [
    createSection('选择题', ''),
    createSection('填空题', ''),
    createSection('解答题', ''),
  ]
  return paper
}
