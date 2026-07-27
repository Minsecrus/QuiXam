import { describe, expect, it } from 'vitest'
import { collectAssetIds } from './transfer'
import { DEFAULT_LAYOUT, type Paper, type Question } from '../types'

function q(id: string, extra: Partial<Question> = {}): Question {
  return { id, type: 'essay', stem: '', score: 5, options: [], answer: '', answerLines: 0, ...extra }
}

function withImages(id: string, ...assetIds: string[]): Question {
  return q(id, {
    images: assetIds.map((assetId) => ({ assetId, widthPercent: 60, align: 'center' as const })),
  })
}

function paper(questions: Question[]): Paper {
  return {
    id: 'p1',
    name: '卷',
    info: { school: '', title: '', subtitle: '', duration: 120, fullScore: 150, notices: [] },
    layout: { ...DEFAULT_LAYOUT },
    sections: [{ id: 's1', title: '大题', description: '', questions }],
    createdAt: 0,
    updatedAt: 0,
  }
}

describe('collectAssetIds', () => {
  it('无图片时返回空集合', () => {
    expect(collectAssetIds(paper([q('a')])).size).toBe(0)
  })

  it('收集顶层题目的图片', () => {
    expect([...collectAssetIds(paper([withImages('a', 'x1', 'x2')]))]).toEqual(['x1', 'x2'])
  })

  it('收集材料题子题里的图片（嵌套一层）', () => {
    const material = q('m', {
      type: 'material',
      material: '',
      materialAlign: 'left',
      children: [withImages('c1', 'x1'), q('c2')],
    })
    expect([...collectAssetIds(paper([material]))]).toEqual(['x1'])
  })

  it('同时收集材料题自身与其子题的图片', () => {
    const material = q('m', {
      type: 'material',
      material: '',
      materialAlign: 'left',
      images: [{ assetId: 'fig', widthPercent: 60, align: 'center' }],
      children: [withImages('c1', 'x1')],
    })
    expect([...collectAssetIds(paper([material]))].sort()).toEqual(['fig', 'x1'])
  })

  it('内置静态插图不作为数据库资源导出', () => {
    expect([
      ...collectAssetIds(
        paper([
          withImages('a', 'static:/papers/official-2024/figure.svg', 'uploaded-image'),
        ]),
      ),
    ]).toEqual(['uploaded-image'])
  })

  it('重复引用同一资源只收集一次', () => {
    expect([...collectAssetIds(paper([withImages('a', 'x1'), withImages('b', 'x1')]))]).toEqual(['x1'])
  })

  it('跨大题收集', () => {
    const p = paper([withImages('a', 'x1')])
    p.sections.push({ id: 's2', title: '大题二', description: '', questions: [withImages('b', 'x2')] })
    expect([...collectAssetIds(p)].sort()).toEqual(['x1', 'x2'])
  })
})
