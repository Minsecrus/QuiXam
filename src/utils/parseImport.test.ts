import { describe, expect, it } from 'vitest'
import { parseExamText } from './parseImport'

describe('parseExamText', () => {
  it('按"一、"拆分大题，冒号后作为大题说明', () => {
    const { sections } = parseExamText(
      ['一、选择题：本题共 2 小题，每小题 5 分。', '1. 第一题', '2. 第二题'].join('\n'),
    )
    expect(sections).toHaveLength(1)
    expect(sections[0].title).toBe('选择题')
    expect(sections[0].description).toBe('本题共 2 小题，每小题 5 分。')
    expect(sections[0].questions).toHaveLength(2)
  })

  it('识别题干开头的分值标记并从题干中剥离', () => {
    const { sections } = parseExamText('一、解答题\n17.（12分）证明：三角形内角和为 180 度。')
    const question = sections[0].questions[0]
    expect(question.score).toBe(12)
    expect(question.stem).toBe('证明：三角形内角和为 180 度。')
  })

  it('识别"本小题满分X分"形式的分值', () => {
    const { sections } = parseExamText('一、解答题\n17.（本小题满分 15 分）解方程。')
    expect(sections[0].questions[0].score).toBe(15)
  })

  it('单行多选项自动拆开', () => {
    const { sections } = parseExamText('一、选择题\n1. 题干\nA. 甲  B. 乙  C. 丙  D. 丁')
    const question = sections[0].questions[0]
    expect(question.type).toBe('single')
    expect(question.options).toEqual(['甲', '乙', '丙', '丁'])
  })

  it('每行一个选项也能识别', () => {
    const { sections } = parseExamText('一、选择题\n1. 题干\nA. 甲\nB. 乙\nC. 丙\nD. 丁')
    expect(sections[0].questions[0].options).toEqual(['甲', '乙', '丙', '丁'])
  })

  it('含下划线且无选项的题识别为填空题', () => {
    const { sections } = parseExamText('一、填空题\n9. 已知 a = 2，则 2a = ______。')
    expect(sections[0].questions[0].type).toBe('fill')
  })

  it('无选项无下划线的题默认识别为简答题', () => {
    const { sections } = parseExamText('一、解答题\n17. 求证：根号 2 是无理数。')
    expect(sections[0].questions[0].type).toBe('shortAnswer')
  })

  it('带明确小问结构的题识别为解答题并拆出小问', () => {
    const { sections } = parseExamText(
      '一、解答题\n17. 阅读材料。\n（1）填写______。\n（2）说明理由。',
    )
    const question = sections[0].questions[0]
    expect(question.type).toBe('solution')
    expect(question.parts?.map((part) => part.stem)).toEqual(['（1）填写______。', '（2）说明理由。'])
  })

  it('题干多行合并，换行保留', () => {
    const { sections } = parseExamText('一、解答题\n17. 第一行\n第二行\n第三行')
    expect(sections[0].questions[0].stem).toBe('第一行\n第二行\n第三行')
  })

  it('中文顿号与全角句点的题号都能识别', () => {
    const { sections } = parseExamText('一、选择题\n1．题干甲\n2、题干乙')
    expect(sections[0].questions.map((q) => q.stem)).toEqual(['题干甲', '题干乙'])
  })

  it('没有大题行时自动兜底建一个大题', () => {
    const { sections, questionCount } = parseExamText('1. 甲\n2. 乙')
    expect(sections).toHaveLength(1)
    expect(questionCount).toBe(2)
  })

  it('第一道题之前的散行（卷头等）被忽略', () => {
    const { sections } = parseExamText(
      ['某某中学 2026 届模拟考试', '数学', '考试时间 120 分钟', '一、选择题', '1. 题干'].join('\n'),
    )
    expect(sections).toHaveLength(1)
    expect(sections[0].questions).toHaveLength(1)
    expect(sections[0].questions[0].stem).toBe('题干')
  })

  it('空文本返回空结果', () => {
    expect(parseExamText('')).toEqual({ sections: [], questionCount: 0 })
  })

  it('丢弃没有题目的大题', () => {
    const { sections } = parseExamText('一、听力\n二、阅读理解\n1. 题干')
    expect(sections.map((s) => s.title)).toEqual(['阅读理解'])
  })

  it('多个大题各自归属自己的题目', () => {
    const { sections } = parseExamText(
      ['一、选择题', '1. 甲', '2. 乙', '二、解答题', '17. 丙'].join('\n'),
    )
    expect(sections.map((s) => s.questions.length)).toEqual([2, 1])
  })

  it('以小数开头的续行不被误判为新题号', () => {
    const { sections } = parseExamText(
      ['一、选择题', '1. 某溶液的浓度为', '0.5 mol/L 时 pH = 3', '2. 下一题'].join('\n'),
    )
    expect(sections[0].questions).toHaveLength(2)
    expect(sections[0].questions[0].stem).toBe('某溶液的浓度为\n0.5 mol/L 时 pH = 3')
  })

  it('题号跳号仍然识别（真实卷常见 1..8 后接 17）', () => {
    const { sections } = parseExamText('一、解答题\n17. 甲\n18. 乙')
    expect(sections[0].questions).toHaveLength(2)
  })

  it('题干以数字开头且题号连续时仍识别为新题', () => {
    const { sections } = parseExamText('一、选择题\n1．2016 年某地降水量为多少\n2．下一题')
    expect(sections[0].questions).toHaveLength(2)
    expect(sections[0].questions[0].stem).toBe('2016 年某地降水量为多少')
  })

  it('选项正文里的「A、B 两点」不会被当作新选项切开', () => {
    const { sections } = parseExamText(
      '一、选择题\n1. 题干\nA．连接 A、B 两点后所得线段最短　B．以上都不对',
    )
    expect(sections[0].questions[0].options).toEqual(['连接 A、B 两点后所得线段最短', '以上都不对'])
  })

  it('标号字母不连续时不切分', () => {
    const { sections } = parseExamText('一、选择题\n1. 题干\nA. 甲 D. 这不是选项\nB. 乙')
    expect(sections[0].questions[0].options).toEqual(['甲 D. 这不是选项', '乙'])
  })

  it('只识别出一个选项时并回题干而不是丢弃', () => {
    const { sections } = parseExamText('一、解答题\n17. 题干\nA. 某个被误判的行')
    const question = sections[0].questions[0]
    expect(question.options).toEqual([])
    expect(question.stem).toBe('题干\n某个被误判的行')
  })

  it('选项后的续行并入最后一个选项而非题干', () => {
    const { sections } = parseExamText('一、选择题\n1. 题干\nA. 甲\nB. 乙\n续行内容')
    const question = sections[0].questions[0]
    expect(question.stem).toBe('题干')
    expect(question.options[1]).toBe('乙 续行内容')
  })
})
