import { describe, expect, it } from 'vitest'
import { sectionLeafCount, sectionScore } from '../utils/format'
import type { Paper, Question } from '../types'
import { paperTemplates } from './templates'

function allQuestions(paper: Paper): Question[] {
  return paper.sections.flatMap((section) =>
    section.questions.flatMap((item) => [
      item,
      ...(item.type === 'material' ? (item.children ?? []) : []),
    ]),
  )
}

describe('paper templates', () => {
  it('exposes blank, three sourced papers, and seven clearly labelled simulations', () => {
    expect(paperTemplates.map((template) => template.id)).toEqual([
      'blank',
      'gaokao-math',
      'gaokao-chinese',
      'gaokao-english',
      'sim-physics',
      'sim-history',
      'sim-chemistry',
      'sim-biology',
      'sim-politics',
      'sim-geography',
      'sim-technology',
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

  it.each([
    ['sim-physics', 15],
    ['sim-history', 18],
    ['sim-chemistry', 18],
    ['sim-biology', 24],
    ['sim-politics', 20],
    ['sim-geography', 26],
    ['sim-technology', 30],
  ])('%s is a complete, honestly labelled 100-point simulation', (templateId, leafCount) => {
    const template = paperTemplates.find((item) => item.id === templateId)
    const paper = template?.create()
    expect(paper).toBeDefined()
    expect(paper?.sections.reduce((sum, section) => sum + sectionScore(section), 0)).toBe(100)
    expect(paper?.sections.reduce((sum, section) => sum + sectionLeafCount(section), 0)).toBe(
      leafCount,
    )
    expect(`${template?.name} ${template?.description} ${paper?.name}`).toMatch(/模拟/)
    expect(`${template?.description} ${paper?.name} ${paper?.info.school}`).toMatch(/非真题/)
  })

  it('subject simulations exercise their subject-specific layout paths', () => {
    const physics = paperTemplates.find((item) => item.id === 'sim-physics')?.create()
    const history = paperTemplates.find((item) => item.id === 'sim-history')?.create()
    const chemistry = paperTemplates.find((item) => item.id === 'sim-chemistry')?.create()
    const biology = paperTemplates.find((item) => item.id === 'sim-biology')?.create()
    const politics = paperTemplates.find((item) => item.id === 'sim-politics')?.create()
    const geography = paperTemplates.find((item) => item.id === 'sim-geography')?.create()
    const technology = paperTemplates.find((item) => item.id === 'sim-technology')?.create()
    expect(
      physics && history && chemistry && biology && politics && geography && technology,
    ).toBeTruthy()
    if (
      !physics ||
      !history ||
      !chemistry ||
      !biology ||
      !politics ||
      !geography ||
      !technology
    )
      return

    expect(physics.layout.answerStyle).toBe('blank')
    expect(allQuestions(physics).flatMap((item) => item.images ?? []).length).toBeGreaterThanOrEqual(6)

    expect(history.layout.answerStyle).toBe('lines')
    expect(
      history.sections
        .flatMap((section) => section.questions)
        .filter((item) => item.type === 'material'),
    ).toHaveLength(3)
    expect(
      history.sections
        .flatMap((section) => section.questions)
        .map((item) => item.material ?? '')
        .join('\n').length,
    ).toBeGreaterThan(1000)

    const chemistryText = allQuestions(chemistry)
      .flatMap((item) => [item.stem, ...item.options, item.answer])
      .join('\n')
    expect(chemistryText.match(/\\ce\{/g)?.length ?? 0).toBeGreaterThanOrEqual(30)

    expect(allQuestions(biology).filter((item) => item.type === 'multiple')).toHaveLength(4)
    expect(allQuestions(biology).flatMap((item) => item.images ?? []).length).toBeGreaterThanOrEqual(
      7,
    )

    const politicsMaterials = politics.sections
      .flatMap((section) => section.questions)
      .filter((item) => item.type === 'material')
    expect(politicsMaterials).toHaveLength(5)
    expect(politicsMaterials.map((item) => item.material ?? '').join('\n').length).toBeGreaterThan(
      1200,
    )

    expect(
      geography.sections
        .flatMap((section) => section.questions)
        .filter((item) => item.type === 'material'),
    ).toHaveLength(3)
    expect(
      allQuestions(geography).flatMap((item) => item.images ?? []).length,
    ).toBeGreaterThanOrEqual(8)

    expect(technology.info.duration).toBe(90)
    expect(technology.info.subtitle).toMatch(/信息技术.*通用技术/)
    expect(technology.sections.map((section) => sectionScore(section))).toEqual([24, 26, 24, 26])
    expect(
      allQuestions(technology).flatMap((item) => item.images ?? []).length,
    ).toBeGreaterThanOrEqual(10)

    for (const paper of [
      physics,
      history,
      chemistry,
      biology,
      politics,
      geography,
      technology,
    ]) {
      for (const image of allQuestions(paper).flatMap((item) => item.images ?? [])) {
        expect(image.assetId).toMatch(/^static:\/papers\/simulated\/.+\.svg$/)
      }
    }
  })
})
