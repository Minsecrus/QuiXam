import {
  DEFAULT_LAYOUT,
  type CompositionStyle,
  type LeafQuestionType,
  type Paper,
  type Question,
  type QuestionType,
  type Section,
} from '../types'
import { uid } from './id'

export interface RecognizedSolutionPart {
  stem: string
  score: number
  answerLines: number
}

export interface RecognizedReadingBlank {
  answer: string
  score: number
  options: string[]
}

export interface RecognizedLeafQuestion {
  type: LeafQuestionType
  stem: string
  score: number
  options: string[]
  answer: string
  answerLines: number
  segmentationText: string
  compositionStyle: CompositionStyle
  parts: RecognizedSolutionPart[]
}

export interface RecognizedQuestion {
  type: QuestionType
  stem: string
  score: number
  options: string[]
  answer: string
  answerLines: number
  segmentationText: string
  compositionStyle: CompositionStyle
  parts: RecognizedSolutionPart[]
  material: string
  materialAlign: 'left' | 'center'
  children: RecognizedLeafQuestion[]
  readingBlanks: RecognizedReadingBlank[]
}

export interface RecognizedSection {
  title: string
  description: string
  questions: RecognizedQuestion[]
}

export interface RecognizedPaper {
  name: string
  info: {
    school: string
    title: string
    subtitle: string
    duration: number
    fullScore: number
    notices: string[]
  }
  sections: RecognizedSection[]
}

interface PreparedInputFile {
  name: string
  mimeType: string
  dataUrl: string
}

interface RecognitionConfig {
  apiKey: string
  baseUrl: string
  model: string
}

const leafQuestionProperties = {
  type: {
    type: 'string',
    enum: [
      'single',
      'multiple',
      'fill',
      'segmentation',
      'calculation',
      'shortAnswer',
      'solution',
      'composition',
    ],
    description: '题型。材料题的子题不能再是 material。',
  },
  stem: {
    type: 'string',
    description: '不含题号的题干，保留必要换行；公式使用 $...$。',
  },
  score: {
    type: 'number',
    minimum: 0,
    maximum: 200,
    description: '本题分值。',
  },
  options: {
    type: 'array',
    maxItems: 10,
    items: { type: 'string' },
    description: '不带 A、B、C、D 标号的选项；非选择题为空数组。',
  },
  answer: {
    type: 'string',
    description: '原文件明确给出参考答案时照录，否则必须为空字符串，禁止解题。',
  },
  answerLines: {
    type: 'integer',
    minimum: 0,
    maximum: 100,
    description:
      '题后答题区行数。calculation 表示纯留白，shortAnswer 表示横线，composition 表示作文行；solution 和客观题必须为 0。',
  },
  segmentationText: {
    type: 'string',
    description: '断句题的待断句原文；只有 segmentation 使用，其余题型为空字符串。',
  },
  compositionStyle: {
    type: 'string',
    enum: ['grid', 'lines'],
    description: '作文答题区：语文通常 grid，英语通常 lines；非作文题统一填 lines。',
  },
  parts: {
    type: 'array',
    maxItems: 30,
    items: {
      type: 'object',
      additionalProperties: false,
      properties: {
        stem: {
          type: 'string',
          description: '不含整题题号的小问题干；句中答题位在准确位置写成 ______。',
        },
        score: {
          type: 'number',
          minimum: 0,
          maximum: 200,
          description: '该小问分值；原卷未单列时为 0。',
        },
        answerLines: {
          type: 'integer',
          minimum: 0,
          maximum: 60,
          description: '只表示该小问结束后追加的横线数；句中已有 ______ 时不计入。',
        },
      },
      required: ['stem', 'score', 'answerLines'],
    },
    description: 'solution 的小问数组；其他题型为空数组。',
  },
} as const

const leafQuestionSchema = {
  type: 'object',
  additionalProperties: false,
  properties: leafQuestionProperties,
  required: [
    'type',
    'stem',
    'score',
    'options',
    'answer',
    'answerLines',
    'segmentationText',
    'compositionStyle',
    'parts',
  ],
} as const

const questionSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ...leafQuestionProperties,
    type: {
      type: 'string',
      enum: [
        'single',
        'multiple',
        'sevenChoice',
        'cloze',
        'fill',
        'segmentation',
        'calculation',
        'shortAnswer',
        'solution',
        'composition',
        'material',
      ],
      description: '共享文章或材料及其若干子题使用 material，其余使用对应叶子题型。',
    },
    material: {
      type: 'string',
      description: '材料题或英语语篇题的原文；普通非材料题为空字符串。长文章必须放在这里以支持逐行分页。',
    },
    materialAlign: {
      type: 'string',
      enum: ['left', 'center'],
      description: '材料或英语语篇整体对齐方式，通常为 left。',
    },
    children: {
      type: 'array',
      maxItems: 100,
      items: leafQuestionSchema,
      description: '材料题的子题；非材料题为空数组。',
    },
    readingBlanks: {
      type: 'array',
      maxItems: 100,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          answer: { type: 'string', description: '该空的参考答案；没有答案时为空字符串。' },
          score: { type: 'number', minimum: 0, maximum: 200 },
          options: {
            type: 'array',
            maxItems: 10,
            items: { type: 'string' },
            description: '完形填空该空的选项；七选五为空数组，选项写入 material 末尾。',
          },
        },
        required: ['answer', 'score', 'options'],
      },
      description: '七选五/完形填空的空；这些空不要拆成 children。',
    },
  },
  required: [
    'type',
    'stem',
    'score',
    'options',
    'answer',
    'answerLines',
    'segmentationText',
    'compositionStyle',
    'parts',
    'material',
    'materialAlign',
    'children',
    'readingBlanks',
  ],
} as const

/**
 * 直接交给多模态模型的最终导入契约。
 * id、时间戳和图片 assetId 属于本地运行时字段，不要求模型伪造。
 */
export const PAPER_RECOGNITION_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: {
      type: 'string',
      description: '试卷在 QuiXam 列表中的简短名称。',
    },
    info: {
      type: 'object',
      additionalProperties: false,
      properties: {
        school: { type: 'string' },
        title: { type: 'string' },
        subtitle: { type: 'string' },
        duration: {
          type: 'integer',
          minimum: 1,
          maximum: 600,
          description: '考试时长（分钟）；原卷未注明时按常见考试时长合理设置。',
        },
        fullScore: {
          type: 'number',
          minimum: 1,
          maximum: 1000,
          description: '卷面满分。',
        },
        notices: {
          type: 'array',
          maxItems: 30,
          items: { type: 'string' },
          description: '注意事项，每条一项；原卷没有时为空数组。',
        },
      },
      required: ['school', 'title', 'subtitle', 'duration', 'fullScore', 'notices'],
    },
    sections: {
      type: 'array',
      minItems: 1,
      maxItems: 30,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: {
            type: 'string',
            description: '不含“一、”等自动序号的大题标题。',
          },
          description: {
            type: 'string',
            description: '大题说明，如题数、分值和作答要求。',
          },
          questions: {
            type: 'array',
            minItems: 1,
            maxItems: 200,
            items: questionSchema,
          },
        },
        required: ['title', 'description', 'questions'],
      },
    },
  },
  required: ['name', 'info', 'sections'],
} as const

const RECOGNITION_INSTRUCTIONS = `你是严谨的试卷转录器。读取用户按顺序提供的试卷图片或 PDF，直接输出符合 JSON Schema 的完整 QuiXam 试卷结构。

只转录原文件，不命题、不解题、不补写答案、不改写内容。无法确认的文字保留“[无法辨认]”；题内图片、示意图、地图或表格暂不能裁切进编辑器，请在原位置保留“[图表见原卷]”，不要编造图表内容。

结构规则：
1. 大题 title 不带“一、二、三”等序号；题干 stem 不带题号；选项不带 A/B/C/D 标号。
2. 普通阅读文章、文言文和共享材料放在 material 字段，并把相关小题放入 children，保证文章可逐行跨页。英语七选五和完形填空使用独立题型 sevenChoice/cloze：文章放 material，各空放 readingBlanks，绝对不要拆成 children。非材料题的 material 为空、children 为空数组。
3. 材料中的居中标题行以“#”开头；古诗作者行以“@”开头。保留自然段和必要换行。
4. 数学公式转为可由 KaTeX 渲染的 $...$；化学式可使用 $\\ce{...}$。不要把普通正文误包成公式。
5. 只有原文件明确提供参考答案时才填写 answer，否则使用空字符串。
6. 按语义选择题型：数学、物理的书写推导题用 calculation；历史、政治等整段作答题用 shortAnswer；生物、化学、地理及物理实验等由若干小问组成的题用 solution；写作用 composition；断句题必须用 segmentation，不能伪装成多选题。
7. solution 必须把每个“（1）（2）……”拆进 parts。题干句中原有答题线时，在准确位置写 ______；只有原卷在该小问结束后另留横线时才设置 parts[].answerLines。两种答题位可以在同题混用，不得给每个小问机械追加横线。
8. segmentation 的 stem 只放作答说明，待断句句子单独放 segmentationText，options 必须为空。
9. 非选择题 options 为空；非 solution 题 parts 为空；非 segmentation 题 segmentationText 为空；非作文题 compositionStyle 统一填 lines。sevenChoice 的选项作为文章末尾内容保留，readingBlanks[].options 为空；cloze 的每个 readingBlanks[].options 保留四个选项。
10. 按卷面说明提取分值；材料题自身 score 为 0，分值写在 children。`

const QUESTION_TYPES: QuestionType[] = [
  'single',
  'multiple',
  'sevenChoice',
  'cloze',
  'fill',
  'segmentation',
  'calculation',
  'shortAnswer',
  'solution',
  'composition',
  'material',
]
const LEAF_TYPES: LeafQuestionType[] = [
  'single',
  'multiple',
  'fill',
  'segmentation',
  'calculation',
  'shortAnswer',
  'solution',
  'composition',
]
const COMPOSITION_STYLES: CompositionStyle[] = ['grid', 'lines']

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${path} 应为对象`)
  }
  return value as Record<string, unknown>
}

function string(value: unknown, path: string, maxLength: number): string {
  if (typeof value !== 'string') throw new Error(`${path} 应为字符串`)
  if (value.length > maxLength) throw new Error(`${path} 内容过长`)
  return value.trim()
}

function number(
  value: unknown,
  path: string,
  minimum: number,
  maximum: number,
  integer = false,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${path} 应为数字`)
  if (value < minimum || value > maximum) throw new Error(`${path} 超出允许范围`)
  if (integer && !Number.isInteger(value)) throw new Error(`${path} 应为整数`)
  return value
}

function array(value: unknown, path: string, maximum: number): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${path} 应为数组`)
  if (value.length > maximum) throw new Error(`${path} 数量过多`)
  return value
}

function enumValue<T extends string>(value: unknown, values: readonly T[], path: string): T {
  if (typeof value !== 'string' || !values.includes(value as T)) {
    throw new Error(`${path} 不是支持的取值`)
  }
  return value as T
}

function parseSolutionPart(value: unknown, path: string): RecognizedSolutionPart {
  const item = record(value, path)
  return {
    stem: string(item.stem, `${path}.stem`, 20_000),
    score: number(item.score, `${path}.score`, 0, 200),
    answerLines: number(item.answerLines, `${path}.answerLines`, 0, 60, true),
  }
}

function parseReadingBlank(value: unknown, path: string): RecognizedReadingBlank {
  const item = record(value, path)
  return {
    answer: string(item.answer, `${path}.answer`, 200),
    score: number(item.score, `${path}.score`, 0, 200),
    options: array(item.options, `${path}.options`, 10).map((option, index) =>
      string(option, `${path}.options[${index}]`, 5_000),
    ),
  }
}

function parseLeafQuestion(value: unknown, path: string): RecognizedLeafQuestion {
  const item = record(value, path)
  const question: RecognizedLeafQuestion = {
    type: enumValue(item.type, LEAF_TYPES, `${path}.type`),
    stem: string(item.stem, `${path}.stem`, 20_000),
    score: number(item.score, `${path}.score`, 0, 200),
    options: array(item.options, `${path}.options`, 10).map((option, index) =>
      string(option, `${path}.options[${index}]`, 5_000),
    ),
    answer: string(item.answer, `${path}.answer`, 20_000),
    answerLines: number(item.answerLines, `${path}.answerLines`, 0, 100, true),
    segmentationText: string(item.segmentationText, `${path}.segmentationText`, 50_000),
    compositionStyle: enumValue(
      item.compositionStyle,
      COMPOSITION_STYLES,
      `${path}.compositionStyle`,
    ),
    parts: array(item.parts, `${path}.parts`, 30).map((part, index) =>
      parseSolutionPart(part, `${path}.parts[${index}]`),
    ),
  }
  if (question.type === 'solution' && question.parts.length === 0) {
    throw new Error(`${path}.parts：解答题至少需要一个小问`)
  }
  return question
}

function parseQuestion(value: unknown, path: string): RecognizedQuestion {
  const item = record(value, path)
  const question: RecognizedQuestion = {
    type: enumValue(item.type, QUESTION_TYPES, `${path}.type`),
    stem: string(item.stem, `${path}.stem`, 20_000),
    score: number(item.score, `${path}.score`, 0, 200),
    options: array(item.options, `${path}.options`, 10).map((option, index) =>
      string(option, `${path}.options[${index}]`, 5_000),
    ),
    answer: string(item.answer, `${path}.answer`, 20_000),
    answerLines: number(item.answerLines, `${path}.answerLines`, 0, 100, true),
    segmentationText: string(item.segmentationText, `${path}.segmentationText`, 50_000),
    compositionStyle: enumValue(
      item.compositionStyle,
      COMPOSITION_STYLES,
      `${path}.compositionStyle`,
    ),
    parts: array(item.parts, `${path}.parts`, 30).map((part, index) =>
      parseSolutionPart(part, `${path}.parts[${index}]`),
    ),
    material: string(item.material, `${path}.material`, 200_000),
    materialAlign: enumValue(item.materialAlign, ['left', 'center'], `${path}.materialAlign`),
    children: array(item.children, `${path}.children`, 100).map((child, index) =>
      parseLeafQuestion(child, `${path}.children[${index}]`),
    ),
    readingBlanks: array(item.readingBlanks ?? [], `${path}.readingBlanks`, 100).map((blank, index) =>
      parseReadingBlank(blank, `${path}.readingBlanks[${index}]`),
    ),
  }
  if (question.type === 'solution' && question.parts.length === 0) {
    throw new Error(`${path}.parts：解答题至少需要一个小问`)
  }
  return question
}

/** 对模型输出做本地边界校验，防止兼容接口忽略 strict schema。 */
export function parseRecognizedPaper(value: unknown): RecognizedPaper {
  const paper = record(value, 'root')
  const info = record(paper.info, 'info')
  const sections = array(paper.sections, 'sections', 30)
  if (sections.length === 0) throw new Error('没有识别到任何大题')

  return {
    name: string(paper.name, 'name', 200),
    info: {
      school: string(info.school, 'info.school', 500),
      title: string(info.title, 'info.title', 500),
      subtitle: string(info.subtitle, 'info.subtitle', 500),
      duration: number(info.duration, 'info.duration', 1, 600, true),
      fullScore: number(info.fullScore, 'info.fullScore', 1, 1000),
      notices: array(info.notices, 'info.notices', 30).map((notice, index) =>
        string(notice, `info.notices[${index}]`, 5_000),
      ),
    },
    sections: sections.map((section, sectionIndex) => {
      const item = record(section, `sections[${sectionIndex}]`)
      const questions = array(item.questions, `sections[${sectionIndex}].questions`, 200)
      if (questions.length === 0) throw new Error(`第 ${sectionIndex + 1} 个大题没有题目`)
      return {
        title: string(item.title, `sections[${sectionIndex}].title`, 500),
        description: string(item.description, `sections[${sectionIndex}].description`, 5_000),
        questions: questions.map((question, questionIndex) =>
          parseQuestion(question, `sections[${sectionIndex}].questions[${questionIndex}]`),
        ),
      }
    }),
  }
}

function hydrateLeafQuestion(question: RecognizedLeafQuestion): Question {
  const base: Question = {
    id: uid(),
    type: question.type,
    stem: question.stem,
    score: question.score,
    options: [...question.options],
    answer: question.answer,
    answerLines: question.answerLines,
  }
  if (question.type === 'segmentation') {
    return { ...base, options: [], answerLines: 0, segmentationText: question.segmentationText }
  }
  if (question.type === 'solution') {
    return {
      ...base,
      options: [],
      answerLines: 0,
      parts: question.parts.map((part) => ({ ...part, id: uid() })),
    }
  }
  if (question.type === 'composition') {
    return { ...base, options: [], compositionStyle: question.compositionStyle }
  }
  return base
}

function hydrateQuestion(question: RecognizedQuestion): Question {
  if (question.type === 'material') {
    return {
      id: uid(),
      type: 'material',
      stem: question.stem,
      score: 0,
      options: [],
      answer: question.answer,
      answerLines: 0,
      material: question.material,
      materialAlign: question.materialAlign,
      children: question.children.map(hydrateLeafQuestion),
    }
  }
  if (question.type === 'sevenChoice' || question.type === 'cloze') {
    return {
      id: uid(),
      type: question.type,
      stem: question.stem,
      score: question.readingBlanks.reduce((sum, blank) => sum + blank.score, 0),
      options: [],
      answer: question.answer,
      answerLines: 0,
      material: question.material,
      materialAlign: question.materialAlign,
      readingBlanks: question.readingBlanks.map((blank) => ({ ...blank, id: uid() })),
    }
  }
  return hydrateLeafQuestion({
    type: question.type,
    stem: question.stem,
    score: question.score,
    options: question.options,
    answer: question.answer,
    answerLines: question.answerLines,
    segmentationText: question.segmentationText,
    compositionStyle: question.compositionStyle,
    parts: question.parts,
  })
}

/** 补齐只属于本地运行时的 id、时间戳和固定排版默认值。 */
export function hydrateRecognizedPaper(draft: RecognizedPaper): Paper {
  const now = Date.now()
  const sections: Section[] = draft.sections.map((section) => ({
    id: uid(),
    title: section.title,
    description: section.description,
    questions: section.questions.map(hydrateQuestion),
  }))
  return {
    id: uid(),
    name: draft.name || draft.info.title || '扫描识别试卷',
    info: {
      school: draft.info.school,
      title: draft.info.title || '试卷标题',
      subtitle: draft.info.subtitle,
      duration: draft.info.duration,
      fullScore: draft.info.fullScore,
      notices: [...draft.info.notices],
    },
    layout: { ...DEFAULT_LAYOUT },
    sections,
    createdAt: now,
    updatedAt: now,
  }
}

export function normalizeResponsesUrl(baseUrl: string): string {
  const input = baseUrl.trim()
  if (!input) throw new Error('请填写 Responses API 地址')
  let url: URL
  try {
    url = new URL(input)
  } catch {
    throw new Error('Responses API 地址格式不正确')
  }
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]'
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) {
    throw new Error('为保护 API Key，远程接口必须使用 HTTPS')
  }
  if (!url.pathname.replace(/\/+$/, '').endsWith('/responses')) {
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/responses`
  }
  return url.toString().replace(/\/$/, '')
}

export function buildRecognitionRequest(model: string, files: PreparedInputFile[]): Record<string, unknown> {
  const content: Record<string, unknown>[] = [
    {
      type: 'input_text',
      text: `以下 ${files.length} 个文件按上传顺序组成同一套试卷，请完整转录。`,
    },
  ]
  files.forEach((file, index) => {
    content.push({
      type: 'input_text',
      text: `第 ${index + 1} 个文件：${file.name}`,
    })
    if (file.mimeType === 'application/pdf') {
      content.push({
        type: 'input_file',
        filename: file.name,
        file_data: file.dataUrl,
        detail: 'auto',
      })
    } else {
      content.push({
        type: 'input_image',
        image_url: file.dataUrl,
        detail: 'auto',
      })
    }
  })

  return {
    model: model.trim(),
    store: false,
    instructions: RECOGNITION_INSTRUCTIONS,
    input: [{ role: 'user', content }],
    text: {
      format: {
        type: 'json_schema',
        name: 'quixam_paper',
        strict: true,
        schema: PAPER_RECOGNITION_JSON_SCHEMA,
      },
    },
    max_output_tokens: 40_000,
  }
}

function responseText(value: unknown): string {
  const response = record(value, 'response')
  if (response.status === 'incomplete') {
    const incomplete =
      response.incomplete_details && typeof response.incomplete_details === 'object'
        ? (response.incomplete_details as Record<string, unknown>).reason
        : undefined
    throw new Error(
      typeof incomplete === 'string' ? `模型输出不完整：${incomplete}` : '模型输出不完整，请重试',
    )
  }
  if (response.status === 'failed') {
    const error =
      response.error && typeof response.error === 'object'
        ? (response.error as Record<string, unknown>).message
        : undefined
    throw new Error(typeof error === 'string' ? `模型请求失败：${error}` : '模型请求失败，请重试')
  }
  if (typeof response.output_text === 'string' && response.output_text) return response.output_text

  const texts: string[] = []
  if (Array.isArray(response.output)) {
    for (const output of response.output) {
      if (!output || typeof output !== 'object') continue
      const item = output as Record<string, unknown>
      if (!Array.isArray(item.content)) continue
      for (const content of item.content) {
        if (!content || typeof content !== 'object') continue
        const part = content as Record<string, unknown>
        if (part.type === 'refusal' && typeof part.refusal === 'string') {
          throw new Error(`模型拒绝处理：${part.refusal}`)
        }
        if (part.type === 'output_text' && typeof part.text === 'string') texts.push(part.text)
        if (part.type === 'output_json' && part.json !== undefined) return JSON.stringify(part.json)
      }
    }
  }
  if (texts.length > 0) return texts.join('')

  // 少数兼容服务会沿用 Chat Completions 的响应外壳。
  const choices = response.choices
  if (Array.isArray(choices)) {
    const first = choices[0] as Record<string, unknown> | undefined
    const message =
      first?.message && typeof first.message === 'object'
        ? (first.message as Record<string, unknown>)
        : undefined
    if (typeof message?.content === 'string') return message.content
  }

  throw new Error('接口没有返回可解析的试卷 JSON')
}

export function parseRecognitionResponse(value: unknown): RecognizedPaper {
  const text = responseText(value)
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('模型返回的内容不是有效 JSON，请确认接口支持严格 JSON Schema')
  }
  return parseRecognizedPaper(parsed)
}

function mimeTypeFor(file: File): string {
  if (file.type) return file.type.toLowerCase()
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'pdf') return 'application/pdf'
  if (extension === 'png') return 'image/png'
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg'
  if (extension === 'webp') return 'image/webp'
  if (extension === 'gif') return 'image/gif'
  return ''
}

function fileDataUrl(file: File, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`无法读取文件「${file.name}」`))
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error(`无法读取文件「${file.name}」`))
        return
      }
      const dataUrl = reader.result.startsWith('data:;')
        ? reader.result.replace('data:;', `data:${mimeType};`)
        : reader.result
      resolve(dataUrl)
    }
    reader.readAsDataURL(file)
  })
}

async function prepareFiles(files: File[]): Promise<PreparedInputFile[]> {
  if (files.length === 0) throw new Error('请先上传试卷图片或 PDF')
  if (files.length > 100) throw new Error('一次最多上传 100 个文件')
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  if (files.some((file) => file.size >= 50 * 1024 * 1024) || totalSize >= 50 * 1024 * 1024) {
    throw new Error('每个文件及全部文件合计都必须小于 50 MB')
  }

  const supported = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif'])
  const prepared: PreparedInputFile[] = []
  for (const file of files) {
    const mimeType = mimeTypeFor(file)
    if (!supported.has(mimeType)) {
      throw new Error(`不支持「${file.name}」，请使用 PDF、PNG、JPG、WEBP 或非动态图 GIF`)
    }
    prepared.push({
      name: file.name,
      mimeType,
      dataUrl: await fileDataUrl(file, mimeType),
    })
  }
  return prepared
}

function apiErrorMessage(status: number, value: unknown): string {
  let detail = ''
  if (value && typeof value === 'object') {
    const error = (value as Record<string, unknown>).error
    if (error && typeof error === 'object') {
      const message = (error as Record<string, unknown>).message
      if (typeof message === 'string') detail = message
    }
  }
  const prefix =
    status === 401
      ? 'API Key 无效或没有访问权限'
      : status === 403
        ? '接口拒绝了本次请求'
        : status === 413
          ? '上传文件超过接口限制'
          : status === 429
            ? '接口限流或账户额度不足'
            : `接口请求失败（HTTP ${status}）`
  return detail ? `${prefix}：${detail}` : prefix
}

/**
 * 图片/PDF → 多模态 Responses API + JSON Schema → 可导入试卷。
 * apiKey 只进入本次请求头，不写入模型输出或错误信息；浏览器持久化由界面层负责。
 */
export async function recognizePaper(
  files: File[],
  config: RecognitionConfig,
  signal?: AbortSignal,
): Promise<RecognizedPaper> {
  if (!config.apiKey.trim()) throw new Error('请填写 API Key')
  if (!config.model.trim()) throw new Error('请填写支持视觉与结构化输出的模型')
  const endpoint = normalizeResponsesUrl(config.baseUrl)
  const prepared = await prepareFiles(files)
  if (signal?.aborted) throw new Error('已停止识别')

  const controller = new AbortController()
  let timedOut = false
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort, { once: true })
  const timer = globalThis.setTimeout(() => {
    timedOut = true
    controller.abort()
  }, 180_000)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildRecognitionRequest(config.model, prepared)),
      signal: controller.signal,
      referrerPolicy: 'no-referrer',
    })
    const text = await response.text()
    let value: unknown = {}
    if (text) {
      try {
        value = JSON.parse(text)
      } catch {
        if (!response.ok) throw new Error(`接口请求失败（HTTP ${response.status}）`)
        throw new Error('接口返回的响应不是有效 JSON')
      }
    }
    if (!response.ok) throw new Error(apiErrorMessage(response.status, value))
    return parseRecognitionResponse(value)
  } catch (error) {
    if (timedOut) throw new Error('识别超过 3 分钟，已自动停止')
    if (signal?.aborted) throw new Error('已停止识别')
    if (error instanceof TypeError) {
      throw new Error('无法连接接口。请检查地址、网络及接口是否允许浏览器跨域访问（CORS）')
    }
    throw error
  } finally {
    globalThis.clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}
