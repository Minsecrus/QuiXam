import { describe, expect, it } from 'vitest'
import { DEFAULT_LAYOUT, type Paper } from '../types'
import { hydratePaper } from './paperStore'

function legacyPaper(
  subject: string,
  question: Record<string, unknown>,
  answerStyle: 'blank' | 'lines',
): Paper {
  return {
    id: 'legacy',
    name: `${subject}旧试卷`,
    info: {
      school: '',
      title: `${subject}试卷`,
      subtitle: '',
      duration: 90,
      fullScore: 100,
      notices: [],
    },
    layout: { ...DEFAULT_LAYOUT, answerStyle } as unknown as Paper['layout'],
    sections: [
      {
        id: 's1',
        title: '题目',
        description: '',
        questions: [
          {
            id: 'q1',
            type: 'essay',
            stem: '',
            score: 10,
            options: [],
            answer: '',
            answerLines: 0,
            ...question,
          } as unknown as Paper['sections'][number]['questions'][number],
        ],
      },
    ],
    createdAt: 1,
    updatedAt: 1,
  }
}

describe('legacy paper migration', () => {
  it('把旧数学 essay 迁移为计算题并移除全卷 answerStyle', () => {
    const migrated = hydratePaper(
      legacyPaper('数学', { stem: '求函数的单调区间。', answerLines: 6 }, 'blank'),
    )

    expect(migrated.sections[0].questions[0].type).toBe('calculation')
    expect(migrated.sections[0].questions[0].answerLines).toBe(6)
    expect(migrated.layout).not.toHaveProperty('answerStyle')
  })

  it('把旧生物多小问 essay 拆成解答题 parts，并区分两种答题位', () => {
    const migrated = hydratePaper(
      legacyPaper(
        '生物',
        {
          stem: '完成实验。\n（1）试剂为______。\n（2）说明实验结论。',
          answerLines: 3,
        },
        'lines',
      ),
    )
    const question = migrated.sections[0].questions[0]

    expect(question.type).toBe('solution')
    expect(question.stem).toBe('完成实验。')
    expect(question.parts?.map((part) => part.answerLines)).toEqual([0, 3])
  })

  it('把旧 fill 断句题迁移为独立断句结构', () => {
    const migrated = hydratePaper(
      legacyPaper(
        '语文',
        {
          type: 'fill',
          stem: '下列文字有三处需要断句。\n甲A乙B丙C丁D戊',
        },
        'lines',
      ),
    )
    const question = migrated.sections[0].questions[0]

    expect(question.type).toBe('segmentation')
    expect(question.stem).toBe('下列文字有三处需要断句。')
    expect(question.segmentationText).toBe('甲A乙B丙C丁D戊')
  })
})
