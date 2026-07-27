import { describe, expect, it } from 'vitest'
import {
  buildRecognitionRequest,
  hydrateRecognizedPaper,
  normalizeResponsesUrl,
  PAPER_RECOGNITION_JSON_SCHEMA,
  parseRecognitionResponse,
  parseRecognizedPaper,
  type RecognizedPaper,
} from './paperRecognition'

function draft(): RecognizedPaper {
  return {
    name: '2026 年测试卷',
    info: {
      school: '',
      title: '2026 年测试卷',
      subtitle: '数学',
      duration: 120,
      fullScore: 15,
      notices: ['请规范作答。'],
    },
    sections: [
      {
        title: '选择题',
        description: '本题共 1 小题，共 5 分。',
        questions: [
          {
            type: 'single',
            stem: '若 $x=1$，则 $2x=$',
            score: 5,
            options: ['1', '2', '3', '4'],
            answer: '',
            answerLines: 0,
            segmentationText: '',
            compositionStyle: 'lines',
            parts: [],
            material: '',
            materialAlign: 'left',
            children: [],
          },
        ],
      },
      {
        title: '阅读材料',
        description: '',
        questions: [
          {
            type: 'material',
            stem: '',
            score: 0,
            options: [],
            answer: '',
            answerLines: 0,
            segmentationText: '',
            compositionStyle: 'lines',
            parts: [],
            material: '#材料标题\n材料正文。',
            materialAlign: 'left',
            children: [
              {
                type: 'shortAnswer',
                stem: '概括材料。',
                score: 10,
                options: [],
                answer: '',
                answerLines: 5,
                segmentationText: '',
                compositionStyle: 'lines',
                parts: [],
              },
            ],
          },
        ],
      },
    ],
  }
}

describe('PAPER_RECOGNITION_JSON_SCHEMA', () => {
  it('根对象与嵌套对象都禁用额外字段', () => {
    expect(PAPER_RECOGNITION_JSON_SCHEMA.additionalProperties).toBe(false)
    expect(PAPER_RECOGNITION_JSON_SCHEMA.properties.info.additionalProperties).toBe(false)
    expect(PAPER_RECOGNITION_JSON_SCHEMA.properties.sections.items.additionalProperties).toBe(false)
  })

  it('要求模型一次返回完整试卷字段', () => {
    expect(PAPER_RECOGNITION_JSON_SCHEMA.required).toEqual(['name', 'info', 'sections'])
    expect(PAPER_RECOGNITION_JSON_SCHEMA.properties.sections.minItems).toBe(1)
  })
})

describe('parseRecognizedPaper', () => {
  it('校验并接受符合契约的试卷', () => {
    expect(parseRecognizedPaper(draft())).toEqual(draft())
  })

  it('拒绝材料题中再次嵌套材料题', () => {
    const value = draft() as unknown as Record<string, unknown>
    const sections = value.sections as Array<Record<string, unknown>>
    const questions = sections[1].questions as Array<Record<string, unknown>>
    const children = questions[0].children as Array<Record<string, unknown>>
    children[0].type = 'material'
    expect(() => parseRecognizedPaper(value)).toThrow('不是支持的取值')
  })

  it('拒绝没有题目的大题', () => {
    const value = draft()
    value.sections[0].questions = []
    expect(() => parseRecognizedPaper(value)).toThrow('没有题目')
  })

  it('保留解答题中句内空位与小问后横线的不同位置', () => {
    const value = draft()
    const child = value.sections[1].questions[0].children[0]
    child.type = 'solution'
    child.stem = '完成实验。'
    child.answerLines = 0
    child.parts = [
      { stem: '（1）试剂为______。', score: 2, answerLines: 0 },
      { stem: '（2）说明理由。', score: 8, answerLines: 3 },
    ]

    const parsed = parseRecognizedPaper(value)
    expect(parsed.sections[1].questions[0].children[0].parts).toEqual(child.parts)
  })
})

describe('hydrateRecognizedPaper', () => {
  it('只在本地补齐 id、时间戳和完整排版默认值', () => {
    const paper = hydrateRecognizedPaper(draft())
    expect(paper.id).toBeTruthy()
    expect(paper.createdAt).toBeGreaterThan(0)
    expect(paper.layout.pageSize).toBe('a4')
    expect(paper.sections[0].id).toBeTruthy()
    expect(paper.sections[0].questions[0].id).toBeTruthy()
    expect(paper.sections[1].questions[0].children?.[0].type).toBe('shortAnswer')
    expect(paper.sections[1].questions[0].children?.[0].answerLines).toBe(5)
  })

  it('材料题分值固定由子题汇总，忽略父题分值', () => {
    const value = draft()
    value.sections[1].questions[0].score = 99
    const material = hydrateRecognizedPaper(value).sections[1].questions[0]
    expect(material.score).toBe(0)
    expect(material.children?.[0].score).toBe(10)
  })

  it('为解答题的小问补本地 id，但不改动答题位', () => {
    const value = draft()
    const child = value.sections[1].questions[0].children[0]
    child.type = 'solution'
    child.parts = [
      { stem: '（1）填写______。', score: 4, answerLines: 0 },
      { stem: '（2）分析。', score: 6, answerLines: 2 },
    ]

    const hydrated = hydrateRecognizedPaper(value).sections[1].questions[0].children?.[0]
    expect(hydrated?.parts?.[0].id).toBeTruthy()
    expect(hydrated?.parts?.map((part) => part.answerLines)).toEqual([0, 2])
  })
})

describe('Responses API request', () => {
  it('规范化 API 根地址和完整 endpoint', () => {
    expect(normalizeResponsesUrl('https://api.openai.com/v1/')).toBe(
      'https://api.openai.com/v1/responses',
    )
    expect(normalizeResponsesUrl('https://example.com/openai/v1/responses')).toBe(
      'https://example.com/openai/v1/responses',
    )
  })

  it('拒绝把 API Key 发往远程明文 HTTP 地址', () => {
    expect(() => normalizeResponsesUrl('http://example.com/v1')).toThrow('必须使用 HTTPS')
    expect(normalizeResponsesUrl('http://localhost:11434/v1')).toBe(
      'http://localhost:11434/v1/responses',
    )
  })

  it('图片和 PDF 直接进入同一个严格 JSON Schema 请求', () => {
    const request = buildRecognitionRequest('gpt-5.6-luna', [
      { name: '1.png', mimeType: 'image/png', dataUrl: 'data:image/png;base64,AA==' },
      {
        name: 'paper.pdf',
        mimeType: 'application/pdf',
        dataUrl: 'data:application/pdf;base64,AA==',
      },
    ])
    const input = request.input as Array<Record<string, unknown>>
    const content = input[0].content as Array<Record<string, unknown>>
    expect(content.map((item) => item.type)).toEqual([
      'input_text',
      'input_text',
      'input_image',
      'input_text',
      'input_file',
    ])
    expect(content[2].detail).toBe('auto')
    expect(content[4].detail).toBe('auto')
    expect(request.store).toBe(false)
    expect((request.text as Record<string, Record<string, unknown>>).format).toMatchObject({
      type: 'json_schema',
      name: 'quixam_paper',
      strict: true,
    })
  })
})

describe('parseRecognitionResponse', () => {
  it('从 Responses API output_text 内容读取 JSON', () => {
    const result = parseRecognitionResponse({
      output: [
        {
          type: 'message',
          content: [{ type: 'output_text', text: JSON.stringify(draft()) }],
        },
      ],
    })
    expect(result.info.title).toBe('2026 年测试卷')
  })

  it('把模型拒绝作为清晰错误返回', () => {
    expect(() =>
      parseRecognitionResponse({
        output: [
          {
            type: 'message',
            content: [{ type: 'refusal', refusal: '无法处理该文件' }],
          },
        ],
      }),
    ).toThrow('模型拒绝处理')
  })

  it('优先报告因输出上限导致的不完整响应', () => {
    expect(() =>
      parseRecognitionResponse({
        status: 'incomplete',
        incomplete_details: { reason: 'max_output_tokens' },
        output: [{ type: 'message', content: [{ type: 'output_text', text: '{"name":' }] }],
      }),
    ).toThrow('模型输出不完整：max_output_tokens')
  })
})
