import { describe, expect, it } from 'vitest'
import {
  createQuestion,
  question,
  splitSegmentationText,
  splitSolutionText,
} from './paperFactory'

describe('question model helpers', () => {
  it('为不同主观题建立不同的默认答题语义', () => {
    expect(createQuestion('calculation')).toMatchObject({ type: 'calculation', answerLines: 8 })
    expect(createQuestion('shortAnswer')).toMatchObject({ type: 'shortAnswer', answerLines: 4 })
    expect(createQuestion('composition')).toMatchObject({
      type: 'composition',
      compositionStyle: 'grid',
    })
  })

  it('解答题同时支持句中空位和小问后横线', () => {
    const structured = splitSolutionText(
      '阅读材料，回答问题。\n（1）模板链为______。\n（2）说明实验结论。',
      3,
    )

    expect(structured.stem).toBe('阅读材料，回答问题。')
    expect(structured.parts).toHaveLength(2)
    expect(structured.parts[0]).toMatchObject({
      stem: '（1）模板链为______。',
      answerLines: 0,
    })
    expect(structured.parts[1]).toMatchObject({
      stem: '（2）说明实验结论。',
      answerLines: 3,
    })
  })

  it('模板中的旧式多小问题干会在构造时转换为 parts', () => {
    const result = question({
      type: 'solution',
      stem: '实验如下。\n（1）填写______。\n（2）解释原因。',
      score: 8,
      answerLines: 2,
    })

    expect(result.stem).toBe('实验如下。')
    expect(result.answerLines).toBe(0)
    expect(result.parts?.map((part) => part.stem)).toEqual([
      '（1）填写______。',
      '（2）解释原因。',
    ])
  })

  it('断句说明与待断文本可以从旧 stem 中无损拆开', () => {
    expect(
      splitSegmentationText('下列文字有三处需要断句。\n甲A乙B丙C丁D戊'),
    ).toEqual({
      stem: '下列文字有三处需要断句。',
      segmentationText: '甲A乙B丙C丁D戊',
    })
  })
})
