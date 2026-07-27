import type { Paper } from '../types'
import { blankPaper } from './paperFactory'
import { official2024ChinesePaper } from './papers/official2024Chinese'
import { official2024EnglishPaper } from './papers/official2024English'
import { official2024MathPaper } from './papers/official2024Math'

export { createQuestion, createSection } from './paperFactory'

export interface PaperTemplate {
  id: string
  name: string
  description: string
  create: () => Paper
}

/**
 * 三套学科模板均采用教育部教育考试院公开的
 * “2024 年高考综合改革适应性测试”原题，不再混放自编示例题。
 */
export const paperTemplates: PaperTemplate[] = [
  {
    id: 'blank',
    name: '空白试卷',
    description: '从空白的大题结构开始',
    create: blankPaper,
  },
  {
    id: 'gaokao-math',
    name: '2024 适应性测试·数学',
    description: '教育部教育考试院命制，完整 150 分原卷',
    create: official2024MathPaper,
  },
  {
    id: 'gaokao-chinese',
    name: '2024 适应性测试·语文',
    description: '教育部教育考试院命制，“交错带”作文版',
    create: official2024ChinesePaper,
  },
  {
    id: 'gaokao-english',
    name: '2024 适应性测试·英语',
    description: '教育部教育考试院命制，含听力题面的完整原卷',
    create: official2024EnglishPaper,
  },
]

export function createFromTemplate(templateId: string): Paper {
  const template = paperTemplates.find((item) => item.id === templateId) ?? paperTemplates[0]
  return template.create()
}
