import { DEFAULT_LAYOUT, type Paper, type Question, type QuestionType, type Section } from '../types'
import { uid } from '../utils/id'

export function createQuestion(type: QuestionType): Question {
  const base: Question = {
    id: uid(),
    type,
    stem: '',
    score: 5,
    options: [],
    answer: '',
    answerLines: 0,
  }
  switch (type) {
    case 'single':
      return { ...base, options: ['', '', '', ''] }
    case 'multiple':
      return { ...base, score: 6, options: ['', '', '', ''] }
    case 'fill':
      return { ...base, stem: '______。' }
    case 'essay':
      return { ...base, score: 10, answerLines: 8 }
    case 'material':
      return { ...base, score: 0, material: '', materialAlign: 'left', children: [] }
  }
}

export function createSection(title = '新大题', description = ''): Section {
  return { id: uid(), title, description, questions: [] }
}

export function question(
  partial: Partial<Question> & Pick<Question, 'type' | 'stem' | 'score'>,
): Question {
  return { ...createQuestion(partial.type), ...partial, id: uid() }
}

export function material(
  text: string,
  children: Question[],
  options: Partial<Pick<Question, 'stem' | 'materialAlign' | 'images'>> = {},
): Question {
  return question({
    type: 'material',
    stem: options.stem ?? '',
    score: 0,
    material: text,
    materialAlign: options.materialAlign ?? 'left',
    children,
    images: options.images,
  })
}

export function basePaper(name: string, subject = '试卷标题', duration = 120): Paper {
  const now = Date.now()
  return {
    id: uid(),
    name,
    info: {
      school: '',
      title: subject,
      subtitle: '',
      duration,
      fullScore: 150,
      notices: [
        '答卷前，考生务必将自己的姓名、准考证号填写在答题卡上。',
        '回答选择题时，选出每小题答案后，用铅笔把答题卡上对应题目的答案标号涂黑。如需改动，用橡皮擦干净后，再选涂其他答案标号。回答非选择题时，将答案写在答题卡上，写在本试卷上无效。',
        '考试结束后，将本试卷和答题卡一并交回。',
      ],
    },
    layout: { ...DEFAULT_LAYOUT },
    sections: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function blankPaper(): Paper {
  const paper = basePaper('未命名试卷')
  paper.sections = [
    createSection('选择题', ''),
    createSection('填空题', ''),
    createSection('解答题', ''),
  ]
  return paper
}
