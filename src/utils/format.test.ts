import { describe, expect, it } from 'vitest'
import {
  cnNumber,
  flattenLeaves,
  leafCount,
  locateQuestion,
  paperScore,
  questionCount,
  questionNumber,
  questionScore,
  sectionItemNumbers,
  sectionLeafCount,
  sectionScore,
  sectionStartNumbers,
} from './format'
import { DEFAULT_LAYOUT, type Paper, type Question, type Section } from '../types'

function q(id: string, score: number, extra: Partial<Question> = {}): Question {
  return {
    id,
    type: 'single',
    stem: '',
    score,
    options: [],
    answer: '',
    answerLines: 0,
    ...extra,
  }
}

function material(id: string, children: Question[]): Question {
  return q(id, 0, { type: 'material', material: '', materialAlign: 'left', children })
}

function section(id: string, questions: Question[]): Section {
  return { id, title: '大题', description: '', questions }
}

function paper(sections: Section[]): Paper {
  return {
    id: 'p1',
    name: '卷',
    info: { school: '', title: '', subtitle: '', duration: 120, fullScore: 150, notices: [] },
    layout: { ...DEFAULT_LAYOUT },
    sections,
    createdAt: 0,
    updatedAt: 0,
  }
}

describe('cnNumber', () => {
  it('覆盖 1–99 的中文数字', () => {
    expect(cnNumber(1)).toBe('一')
    expect(cnNumber(10)).toBe('十')
    expect(cnNumber(11)).toBe('十一')
    expect(cnNumber(19)).toBe('十九')
    expect(cnNumber(20)).toBe('二十')
    expect(cnNumber(21)).toBe('二十一')
    expect(cnNumber(99)).toBe('九十九')
  })

  it('超出范围回退为阿拉伯数字', () => {
    expect(cnNumber(100)).toBe('100')
  })
})

describe('题号与分值统计', () => {
  it('普通题按 1 计，材料题按子题数计', () => {
    expect(leafCount(q('a', 5))).toBe(1)
    expect(leafCount(material('m', [q('c1', 3), q('c2', 6)]))).toBe(2)
  })

  it('空材料题不占题号', () => {
    expect(leafCount(material('m', []))).toBe(0)
  })

  it('材料题分值为子题合计，自身 score 被忽略', () => {
    const m = material('m', [q('c1', 3), q('c2', 6)])
    m.score = 999
    expect(questionScore(m)).toBe(9)
  })

  it('大题分值与题数正确汇总材料题', () => {
    const s = section('s1', [q('a', 5), material('m', [q('c1', 3), q('c2', 6)])])
    expect(sectionLeafCount(s)).toBe(3)
    expect(sectionScore(s)).toBe(14)
  })

  it('全卷汇总跨大题累加', () => {
    const p = paper([section('s1', [q('a', 5)]), section('s2', [material('m', [q('c', 10)])])])
    expect(questionCount(p)).toBe(2)
    expect(paperScore(p)).toBe(15)
  })
})

describe('跨大题连续编号', () => {
  const p = paper([
    section('s1', [q('a', 5), q('b', 5)]),
    section('s2', [material('m', [q('c1', 3), q('c2', 6)]), q('d', 8)]),
  ])

  it('大题起始号按前面大题的叶子题数累加', () => {
    const starts = sectionStartNumbers(p)
    expect(starts.get('s1')).toBe(1)
    expect(starts.get('s2')).toBe(3)
  })

  it('材料题在大题内占用连续多个题号', () => {
    expect(sectionItemNumbers(p.sections[1], 3)).toEqual([3, 5])
  })

  it('展平后每个叶子题拿到唯一连续题号', () => {
    expect(flattenLeaves(p.sections[1], 3).map((l) => [l.number, l.question.id])).toEqual([
      [3, 'c1'],
      [4, 'c2'],
      [5, 'd'],
    ])
  })

  it('单题题号在全卷范围内正确', () => {
    expect(questionNumber(p, 'a')).toBe(1)
    expect(questionNumber(p, 'b')).toBe(2)
    expect(questionNumber(p, 'c1')).toBe(3)
    expect(questionNumber(p, 'c2')).toBe(4)
    expect(questionNumber(p, 'd')).toBe(5)
  })

  it('材料题自身返回首个子题号', () => {
    expect(questionNumber(p, 'm')).toBe(3)
  })

  it('空材料题不占号且不影响后续编号', () => {
    const withEmpty = paper([section('s1', [material('empty', []), q('a', 5)])])
    expect(questionNumber(withEmpty, 'empty')).toBeNull()
    expect(questionNumber(withEmpty, 'a')).toBe(1)
  })

  it('不存在的 id 返回 null', () => {
    expect(questionNumber(p, 'nope')).toBeNull()
  })
})

describe('locateQuestion', () => {
  const p = paper([
    section('s1', [q('a', 5)]),
    section('s2', [material('m', [q('c1', 3), q('c2', 6)])]),
  ])

  it('定位顶层题', () => {
    expect(locateQuestion(p, 'a')).toMatchObject({ sectionId: 's1', parentId: null, index: 0 })
  })

  it('定位材料题子题并带出父题 id', () => {
    expect(locateQuestion(p, 'c2')).toMatchObject({ sectionId: 's2', parentId: 'm', index: 1 })
  })

  it('材料题本身按顶层题定位', () => {
    expect(locateQuestion(p, 'm')).toMatchObject({ sectionId: 's2', parentId: null, index: 0 })
  })

  it('找不到返回 null', () => {
    expect(locateQuestion(p, 'nope')).toBeNull()
  })
})
