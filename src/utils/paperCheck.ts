import { getAsset } from '../db'
import type { Paper, Question, QuestionType, Section } from '../types'
import { paperScore, questionScore } from './format'

export type PaperIssueSeverity = 'error' | 'warning'

export interface PaperIssueTarget {
  kind: 'paper' | 'section' | 'question'
  id?: string
}

export interface PaperIssue {
  id: string
  severity: PaperIssueSeverity
  title: string
  detail: string
  target: PaperIssueTarget
}

export interface PaperCheckOptions {
  /** 只有用户选择打印教师答案页时，空答案才是一个需要提示的问题。 */
  includeAnswers?: boolean
}

function issue(
  severity: PaperIssueSeverity,
  id: string,
  title: string,
  detail: string,
  target: PaperIssueTarget,
): PaperIssue {
  return { severity, id, title, detail, target }
}

function hasQuestionBody(question: Question): boolean {
  if (question.type === 'material') {
    return Boolean(question.stem.trim() || question.material?.trim() || (question.children?.length ?? 0) > 0)
  }
  if (question.type === 'sevenChoice' || question.type === 'cloze') {
    return Boolean(question.stem.trim() || question.material?.trim() || (question.readingBlanks?.length ?? 0) > 0)
  }
  if (question.type === 'solution') {
    return Boolean(question.stem.trim() || question.parts?.some((part) => part.stem.trim()))
  }
  if (question.type === 'segmentation') {
    return Boolean(question.stem.trim() || question.segmentationText?.trim())
  }
  return Boolean(question.stem.trim())
}

function questionTypeName(type: QuestionType): string {
  const names: Record<QuestionType, string> = {
    single: '单选题',
    multiple: '多选题',
    sevenChoice: '七选五',
    cloze: '完形填空',
    fill: '填空题',
    segmentation: '断句题',
    calculation: '计算题',
    shortAnswer: '简答题',
    solution: '解答题',
    composition: '作文',
    material: '材料题',
  }
  return names[type]
}

function checkQuestion(question: Question, options: PaperCheckOptions, issues: PaperIssue[]) {
  const target: PaperIssueTarget = { kind: 'question', id: question.id }
  const label = questionTypeName(question.type)
  if (!hasQuestionBody(question)) {
    issues.push(issue('error', `empty:${question.id}`, `${label}内容为空`, '请填写题干、材料或小问后再打印。', target))
  }

  if (question.type !== 'material' && question.score <= 0) {
    issues.push(issue('warning', `score:${question.id}`, `${label}分值为 0`, '如果这是一道正式试题，请补充分值。', target))
  }

  if (question.type === 'single' || question.type === 'multiple') {
    if (question.options.length < 2) {
      issues.push(issue('error', `options:${question.id}`, '选择题选项不足', '选择题至少需要两个选项。', target))
    }
    if (question.options.some((option) => !option.trim())) {
      issues.push(issue('error', `blank-option:${question.id}`, '选择题存在空选项', '请补全或删除空选项。', target))
    }
  }

  if (question.type === 'sevenChoice' || question.type === 'cloze') {
    const blanks = question.readingBlanks ?? []
    if (blanks.length === 0) {
      issues.push(issue('error', `reading-blanks:${question.id}`, `${label}没有设置空`, '请添加文章中的空，并为每个空录入答案信息。', target))
    }
    if (question.type === 'cloze') {
      blanks.forEach((blank, index) => {
        if (blank.options.length < 2) {
          issues.push(issue('error', `cloze-options:${question.id}:${blank.id}`, `完形填空第 ${index + 1} 空选项不足`, '每个空至少需要两个选项。', target))
        }
        if (blank.options.some((option) => !option.trim())) {
          issues.push(issue('error', `cloze-blank-option:${question.id}:${blank.id}`, `完形填空第 ${index + 1} 空存在空选项`, '请补全或删除空选项。', target))
        }
      })
    }
  }

  if (question.type === 'solution') {
    const parts = question.parts ?? []
    if (parts.length === 0) {
      issues.push(issue('error', `parts:${question.id}`, '解答题没有小问', '请至少添加一个小问，或改为其他题型。', target))
    }
    if (parts.some((part) => !part.stem.trim())) {
      issues.push(issue('warning', `blank-part:${question.id}`, '解答题存在空小问', '请补全或删除空小问。', target))
    }
    const partScore = parts.reduce((sum, part) => sum + part.score, 0)
    if (partScore > 0 && Math.abs(partScore - question.score) > 1e-9) {
      issues.push(issue('warning', `part-score:${question.id}`, '解答题小问分值不等于题目分值', `小问合计 ${partScore} 分，题目为 ${question.score} 分。`, target))
    }
  }

  if (question.type === 'composition' && question.answerLines <= 0) {
    issues.push(issue('warning', `composition-lines:${question.id}`, '作文没有答题区', '建议设置作文格或横线行数。', target))
  }

  if (question.type === 'material' && (question.children?.length ?? 0) === 0) {
    issues.push(issue('warning', `material-children:${question.id}`, '材料题没有子题', '材料将打印出来，但不会占用题号。', target))
  }

  const text = [
    question.stem,
    question.material,
    question.segmentationText,
    question.answer,
    ...(question.parts ?? []).map((part) => part.stem),
    ...(question.readingBlanks ?? []).flatMap((blank) => [blank.answer, ...blank.options]),
  ].filter(Boolean).join('\n')
  if (text.includes('[无法辨认]')) {
    issues.push(issue('warning', `unclear:${question.id}`, '含有“无法辨认”标记', '扫描识别结果尚未校对完成。', target))
  }
  if (text.includes('[图表见原卷]')) {
    issues.push(issue('warning', `figure:${question.id}`, '题目仍引用原卷图表', '请补入题图，或打印时确保原卷图表可供学生查看。', target))
  }

  if (options.includeAnswers && question.type !== 'material' && !question.answer.trim() && !['sevenChoice', 'cloze'].includes(question.type)) {
    issues.push(issue('warning', `answer:${question.id}`, '教师答案页存在空答案', '这不会阻止打印，但答案页会显示“—”。', target))
  }

  if (options.includeAnswers && (question.type === 'sevenChoice' || question.type === 'cloze')) {
    for (const blank of question.readingBlanks ?? []) {
      if (!blank.answer.trim()) {
        issues.push(issue('warning', `reading-answer:${question.id}:${blank.id}`, '语篇题存在空答案', '这不会阻止打印，但答案页会显示“—”。', target))
      }
    }
  }

  for (const child of question.children ?? []) checkQuestion(child, options, issues)
}

function checkSection(section: Section, options: PaperCheckOptions, issues: PaperIssue[]) {
  const target: PaperIssueTarget = { kind: 'section', id: section.id }
  if (!section.title.trim()) {
    issues.push(issue('warning', `section-title:${section.id}`, '大题名称为空', '建议填写大题名称，便于打印和结构导航。', target))
  }
  if (section.questions.length === 0) {
    issues.push(issue('warning', `section-empty:${section.id}`, '大题没有题目', '空大题会打印标题，请补题或删除该大题。', target))
  }
  for (const question of section.questions) checkQuestion(question, options, issues)
}

/** 纯数据检查，可在 UI 外稳定单测。 */
export function inspectPaper(paper: Paper, options: PaperCheckOptions = {}): PaperIssue[] {
  const issues: PaperIssue[] = []
  if (!paper.name.trim()) {
    issues.push(issue('warning', 'paper-name', '试卷名称为空', '建议设置名称，便于本地管理与导出备份。', { kind: 'paper' }))
  }
  if (!paper.info.title.trim()) {
    issues.push(issue('error', 'paper-title', '试卷标题为空', '请填写打印在卷头上的标题。', { kind: 'paper' }))
  }
  if (paper.info.duration <= 0) {
    issues.push(issue('warning', 'paper-duration', '考试时长未设置', '建议填写有效的考试时长。', { kind: 'paper' }))
  }
  if (paper.info.fullScore <= 0) {
    issues.push(issue('error', 'paper-full-score', '卷面满分无效', '卷面满分必须大于 0。', { kind: 'paper' }))
  }
  const total = paperScore(paper)
  if (Math.abs(total - paper.info.fullScore) > 1e-9) {
    issues.push(issue('error', 'paper-score-mismatch', '题目分值与卷面满分不一致', `题目合计 ${total} 分，卷头填写 ${paper.info.fullScore} 分。`, { kind: 'paper' }))
  }
  if (paper.sections.length === 0) {
    issues.push(issue('error', 'paper-sections', '试卷没有大题', '请添加至少一个大题和题目。', { kind: 'paper' }))
  }
  for (const section of paper.sections) checkSection(section, options, issues)
  return issues
}

async function checkQuestionAssets(question: Question, issues: PaperIssue[]): Promise<void> {
  await Promise.all((question.images ?? []).map(async (image, index) => {
    if (image.assetId.startsWith('static:')) return
    const asset = await getAsset(image.assetId)
    if (!asset) {
      issues.push(issue(
        'error',
        `image:${question.id}:${index}`,
        '题图文件缺失',
        '该图片引用在当前浏览器中找不到；请重新上传题图。',
        { kind: 'question', id: question.id },
      ))
    }
  }))
  await Promise.all((question.children ?? []).map((child) => checkQuestionAssets(child, issues)))
}

/** 需要读 IndexedDB 的补充检查，供打印对话框异步加载。 */
export async function inspectPaperAssets(paper: Paper): Promise<PaperIssue[]> {
  const issues: PaperIssue[] = []
  await Promise.all(paper.sections.flatMap((section) => section.questions.map((question) => checkQuestionAssets(question, issues))))
  return issues
}

export function checkedPaperScore(paper: Paper): number {
  return paper.sections.reduce((sum, section) => sum + section.questions.reduce((questionSum, question) => questionSum + questionScore(question), 0), 0)
}
