export type LeafQuestionType =
  | 'single'
  | 'multiple'
  | 'sevenChoice'
  | 'cloze'
  | 'fill'
  | 'segmentation'
  | 'calculation'
  | 'shortAnswer'
  | 'solution'
  | 'composition'

export type QuestionType = LeafQuestionType | 'material'

export type CompositionStyle = 'grid' | 'lines'

/** 题库筛选和智能组卷使用的难度档位；unknown 表示尚未标注。 */
export type QuestionDifficulty = 'unknown' | 'easy' | 'medium' | 'hard'

/**
 * 题目可选元数据。它随题目走，既可以留在一张试卷中，也可以被保存进本地题库。
 * 不把这些字段设为必填，保证旧 JSON 和扫描导入仍可直接打开。
 */
export interface QuestionMetadata {
  knowledgePoints: string[]
  tags: string[]
  difficulty: QuestionDifficulty
  source: string
  year?: number
}

export interface SolutionPart {
  id: string
  /** 小问题干；需要在句中作答的位置直接写 `______` */
  stem: string
  /** 小问分值；原卷未单独标注时为 0 */
  score: number
  /** 小问末尾追加的横线数；句中空位不计入这里，0 表示不追加 */
  answerLines: number
}

/** 题目附图：图片二进制存 IndexedDB assets 表，这里只存引用 */
export interface QuestionImage {
  assetId: string
  /** 相对正文宽度的百分比（10–100） */
  widthPercent: number
  align: 'center' | 'right'
  /** 图片说明，打印时显示在题图下方。 */
  caption?: string
}

/** 英语语篇题中的一个空；cloze 还保存该空的四个选项。 */
export interface ReadingBlank {
  id: string
  score: number
  answer: string
  options: string[]
}

export interface Question {
  id: string
  type: QuestionType
  /** 题干，支持 `$...$` 行内公式与单反引号代码，换行用 \n；材料题可留空（材料放 material 字段） */
  stem: string
  score: number
  /** 选择题选项（single / multiple 使用） */
  options: string[]
  /** 参考答案（教师版打印用） */
  answer: string
  /**
   * 题后答题区行数：
   * - calculation：纯留白
   * - shortAnswer：横线
   * - composition：方格或横线
   * - solution：不用此字段，改由每个 parts[].answerLines 控制
   */
  answerLines: number
  /** 断句题中与作答说明分开的待断句文本 */
  segmentationText?: string
  /** 解答题的小问；题干内空位和题后横线可按小问混用 */
  parts?: SolutionPart[]
  /** 作文答题纸样式；语文通常为 grid，英语通常为 lines */
  compositionStyle?: CompositionStyle
  /**
   * 材料题（type='material'）共享材料，楷体渲染。
   * 行首标记：`#` 居中标题；`@` 居中仿宋作者行（古诗作者惯例）。
   */
  material?: string
  materialAlign?: 'left' | 'center'
  /** 材料题子题；仅一层嵌套，子题不能再是材料题 */
  children?: Question[]
  /** 七选五/完形填空的空；这些空在卷面上不再渲染为附加子题。 */
  readingBlanks?: ReadingBlank[]
  /** 附图（几何图、图表等），渲染在题干之后 */
  images?: QuestionImage[]
  /** 题库检索、难度配比与来源追溯使用的可选字段。 */
  metadata?: QuestionMetadata
  /** 保存进本地题库后关联的条目 id；不影响题目独立编辑。 */
  bankEntryId?: string
}

export interface Section {
  id: string
  /** 大题名，不含"一、"序号前缀，序号自动生成 */
  title: string
  /** 大题说明，如"本大题共 8 小题…"，可留空 */
  description: string
  questions: Question[]
}

export interface PaperInfo {
  school: string
  title: string
  subtitle: string
  /** 考试时长（分钟） */
  duration: number
  /** 声明的卷面满分 */
  fullScore: number
  /** 注意事项，每条一行 */
  notices: string[]
}

/** 正文字体方案：宋体 / 楷体 / 黑体（均为系统内置中文字体，打印无需下载） */
export type FontPreset = 'song' | 'kai' | 'hei'
/** 字号档位，对应五号 / 小四 / 四号 */
export type FontSizeLevel = 'small' | 'medium' | 'large'
export type LineHeightLevel = 'compact' | 'normal' | 'loose'

/** 纸张：A4 单栏 或 A3 横向两栏（8K 对折卷） */
export type PageSize = 'a4' | 'a3-2col'

export interface PaperLayout {
  bodyFont: FontPreset
  fontSize: FontSizeLevel
  lineHeight: LineHeightLevel
  pageSize: PageSize
  /** 左侧密封线（装订线 + 竖排班级/姓名/考号） */
  sealLine: boolean
  /**
   * 尽量让整题落在同一页/同一栏。关闭后按内容紧凑排布，版面更省纸。
   * 无论开关，单题高于一整栏时都会被切开——不溢出是硬约束。
   */
  keepQuestionTogether: boolean
  /** 尽量让大题标题与其首题同页，避免标题孤零零落在栏底 */
  keepHeadingWithNext: boolean
  /**
   * 自然拉伸撑满整页：把每页的剩余空间按"灵活度"摊到各间隙上，
   * 优先拉大题之间、其次小题之间；正文行距保持不变。末页不生效。
   */
  justifyPages: boolean
}

export interface Paper {
  id: string
  /** 试卷在列表中的名称 */
  name: string
  info: PaperInfo
  layout: PaperLayout
  sections: Section[]
  createdAt: number
  updatedAt: number
}

export const DEFAULT_LAYOUT: PaperLayout = {
  bodyFont: 'song',
  fontSize: 'medium',
  lineHeight: 'normal',
  pageSize: 'a4',
  sealLine: false,
  keepQuestionTogether: true,
  keepHeadingWithNext: true,
  justifyPages: true,
}

export interface PaperMeta {
  id: string
  name: string
  updatedAt: number
}

/** 本地题库的一条独立记录。题目本体保留为快照，添加回试卷时会分配新 id。 */
export interface QuestionBankEntry {
  id: string
  question: Question
  createdAt: number
  updatedAt: number
  usageCount: number
}

/** 浏览器本地的可恢复版本；不会上传或同步到任何服务器。 */
export interface PaperSnapshot {
  id: string
  paperId: string
  paperName: string
  label: string
  createdAt: number
  paper: Paper
}

/** 用户把当前试卷保存为可复用结构后得到的本地模板。 */
export interface CustomPaperTemplate {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  paper: Paper
}
