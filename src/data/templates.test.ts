import { describe, expect, it } from 'vitest'
import { sectionLeafCount, sectionScore } from '../utils/format'
import { paperTemplates } from './templates'

describe('official paper templates', () => {
  it('only exposes blank plus the three sourced subject papers', () => {
    expect(paperTemplates.map((template) => template.id)).toEqual([
      'blank',
      'gaokao-math',
      'gaokao-chinese',
      'gaokao-english',
    ])
  })

  it.each([
    ['gaokao-math', 19],
    ['gaokao-chinese', 23],
    ['gaokao-english', 67],
  ])('%s is a complete 150-point paper', (templateId, leafCount) => {
    const paper = paperTemplates.find((template) => template.id === templateId)?.create()
    expect(paper).toBeDefined()
    expect(paper?.sections.reduce((sum, section) => sum + sectionScore(section), 0)).toBe(150)
    expect(paper?.sections.reduce((sum, section) => sum + sectionLeafCount(section), 0)).toBe(
      leafCount,
    )
    expect(paper?.name).not.toMatch(/模拟|示例|结构模板/)
  })
})
