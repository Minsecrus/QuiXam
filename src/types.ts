export type QuestionType = 'single' | 'multiple' | 'fill' | 'essay' | 'material'

/** 题目附图：图片二进制存 IndexedDB assets 表，这里只存引用 */
export interface QuestionImage {
  assetId: string
  /** 相对正文宽度的百分比（10–100） */
  widthPercent: number
  align: 'center' | 'right'
}

export interface Question {
  id: string
  type: QuestionType
  /** 题干，支持 $...$ 行内公式，换行用 \n；材料题可留空（材料放 material 字段） */
  stem: string
  score: number
  /** 选择题选项（single / multiple 使用） */
  options: string[]
  /** 参考答案（教师版打印用） */
  answer: string
  /** 解答题答题区行数（决定预留高度） */
  answerLines: number
  /** 答题区样式覆盖；留空则跟随试卷级 PaperLayout.answerStyle */
  answerStyle?: AnswerAreaStyle
  /**
   * 材料题（type='material'）共享材料，楷体渲染。
   * 行首标记：`#` 居中标题；`@` 居中仿宋作者行（古诗作者惯例）。
   */
  material?: string
  materialAlign?: 'left' | 'center'
  /** 材料题子题；仅一层嵌套，子题不能再是材料题 */
  children?: Question[]
  /** 附图（几何图、图表等），渲染在题干之后 */
  images?: QuestionImage[]
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

/** 答题区样式：空白（数学、物理）或横线（其余科目） */
export type AnswerAreaStyle = 'blank' | 'lines'

export interface PaperLayout {
  bodyFont: FontPreset
  fontSize: FontSizeLevel
  lineHeight: LineHeightLevel
  pageSize: PageSize
  /** 左侧密封线（装订线 + 竖排班级/姓名/考号） */
  sealLine: boolean
  /** 全卷解答题答题区默认样式，可被单题 Question.answerStyle 覆盖 */
  answerStyle: AnswerAreaStyle
  /**
   * 尽量让整题落在同一页/同一栏。关闭后按内容紧凑排布，版面更省纸。
   * 无论开关，单题高于一整栏时都会被切开——不溢出是硬约束。
   */
  keepQuestionTogether: boolean
  /** 尽量让大题标题与其首题同页，避免标题孤零零落在栏底 */
  keepHeadingWithNext: boolean
  /**
   * 自然拉伸撑满整页：把每页的剩余空间按"灵活度"摊到各间隙上，
   * 优先拉大题之间、其次小题之间，再不够才动行距。末页不生效。
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
  answerStyle: 'blank',
  keepQuestionTogether: true,
  keepHeadingWithNext: true,
  justifyPages: true,
}

export interface PaperMeta {
  id: string
  name: string
  updatedAt: number
}
