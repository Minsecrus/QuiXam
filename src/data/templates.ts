import type { Paper } from '../types'
import { blankPaper } from './paperFactory'
import { official2024ChinesePaper } from './papers/official2024Chinese'
import { official2024EnglishPaper } from './papers/official2024English'
import { official2024MathPaper } from './papers/official2024Math'
import { simulatedBiologyPaper } from './papers/simulatedBiology'
import { simulatedChemistryPaper } from './papers/simulatedChemistry'
import { simulatedGeographyPaper } from './papers/simulatedGeography'
import { simulatedHistoryPaper } from './papers/simulatedHistory'
import { simulatedPhysicsPaper } from './papers/simulatedPhysics'
import { simulatedPoliticsPaper } from './papers/simulatedPolitics'
import { simulatedTechnologyPaper } from './papers/simulatedTechnology'

export { createQuestion, createSection } from './paperFactory'

export interface PaperTemplate {
  id: string
  name: string
  description: string
  create: () => Paper
}

/**
 * 语数英采用教育部教育考试院公开原题；省级选考科目没有可直接复用的
 * 统一官方全文，提供明确标注“非真题”的高考等长结构模拟卷。
 * “技术”按浙江选考（信息技术 + 通用技术）口径提供，并在模板中标明地区。
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
  {
    id: 'sim-physics',
    name: '高考结构模拟·物理',
    description: '原创等长完整卷，100 分，非真题',
    create: simulatedPhysicsPaper,
  },
  {
    id: 'sim-history',
    name: '高考结构模拟·历史',
    description: '原创长材料完整卷，100 分，非真题',
    create: simulatedHistoryPaper,
  },
  {
    id: 'sim-chemistry',
    name: '高考结构模拟·化学',
    description: '原创完整卷，支持 mhchem 化学式，非真题',
    create: simulatedChemistryPaper,
  },
  {
    id: 'sim-biology',
    name: '高考结构模拟·生物学',
    description: '原创完整卷，含实验、遗传和生态图示，非真题',
    create: simulatedBiologyPaper,
  },
  {
    id: 'sim-politics',
    name: '高考结构模拟·思想政治',
    description: '原创长材料完整卷，100 分，非真题',
    create: simulatedPoliticsPaper,
  },
  {
    id: 'sim-geography',
    name: '高考结构模拟·地理',
    description: '原创图表与区域材料完整卷，100 分，非真题',
    create: simulatedGeographyPaper,
  },
  {
    id: 'sim-technology',
    name: '浙江选考结构模拟·技术',
    description: '信息技术 + 通用技术，90 分钟，非真题',
    create: simulatedTechnologyPaper,
  },
]

export function createFromTemplate(templateId: string): Paper {
  const template = paperTemplates.find((item) => item.id === templateId) ?? paperTemplates[0]
  return template.create()
}
