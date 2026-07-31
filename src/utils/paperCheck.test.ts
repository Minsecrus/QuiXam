import { describe, expect, it } from 'vitest'
import { DEFAULT_LAYOUT, type Paper, type Question, type Section } from '../types'
import { inspectPaper } from './paperCheck'

function question(id: string, extra: Partial<Question> = {}): Question {
  return {
    id,
    type: 'single',
    stem: '选择正确答案。',
    score: 2,
    options: ['A', 'B', 'C', 'D'],
    answer: 'A',
    answerLines: 0,
    ...extra,
  }
}

function paper(sections: Section[], fullScore = 2): Paper {
  return {
    id: 'paper-1',
    name: '测试卷',
    info: { school: '', title: '测试卷', subtitle: '', duration: 90, fullScore, notices: [] },
    layout: { ...DEFAULT_LAYOUT },
    sections,
    createdAt: 0,
    updatedAt: 0,
  }
}

describe('inspectPaper', () => {
  it('识别会影响交付的选择题和分值问题', () => {
    const broken = paper([
      {
        id: 's1',
        title: '选择题',
        description: '',
        questions: [question('q1', { stem: '', options: ['A', ''], answer: '' })],
      },
    ], 5)

    const ids = inspectPaper(broken, { includeAnswers: true }).map((item) => item.id)

    expect(ids).toContain('paper-score-mismatch')
    expect(ids).toContain('empty:q1')
    expect(ids).toContain('blank-option:q1')
    expect(ids).toContain('answer:q1')
  })

  it('校验解答题小问、扫描占位符和材料题子题', () => {
    const checked = paper([
      {
        id: 's1',
        title: '综合题',
        description: '',
        questions: [
          question('solution', {
            type: 'solution',
            stem: '完成下列问题。',
            score: 6,
            options: [],
            answer: '',
            parts: [{ id: 'part-1', stem: '', score: 2, answerLines: 1 }],
          }),
          question('scan', { stem: '[图表见原卷] [无法辨认]', score: 2 }),
          question('material', { type: 'material', stem: '', material: '阅读材料。', score: 0, options: [], children: [] }),
        ],
      },
    ], 8)

    const ids = inspectPaper(checked).map((item) => item.id)

    expect(ids).toContain('blank-part:solution')
    expect(ids).toContain('part-score:solution')
    expect(ids).toContain('figure:scan')
    expect(ids).toContain('unclear:scan')
    expect(ids).toContain('material-children:material')
  })

  it('按材料题子题汇总分值，不把材料容器本身当作一道试题', () => {
    const valid = paper([
      {
        id: 's1',
        title: '材料题',
        description: '',
        questions: [question('material', {
          type: 'material',
          stem: '',
          material: '共享材料。',
          score: 999,
          options: [],
          children: [question('child', { score: 6 })],
        })],
      },
    ], 6)

    const ids = inspectPaper(valid).map((item) => item.id)

    expect(ids).not.toContain('paper-score-mismatch')
    expect(ids).not.toContain('score:material')
  })
})
