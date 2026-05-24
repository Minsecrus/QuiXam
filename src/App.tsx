import './App.css'

type QuestionType = 'single' | 'fill' | 'essay'

type Question = {
  id: string
  number: string
  type: QuestionType
  stem: string
  score: number
  options?: string[]
  answerLines?: number
}

type Section = {
  id: string
  title: string
  totalScore: number
  description: string
  questions: Question[]
}

const sections: Section[] = [
  {
    id: 'section-1',
    title: '一、选择题',
    totalScore: 24,
    description: '本大题共 8 小题，每小题 3 分。在每小题给出的四个选项中，只有一项符合题目要求。',
    questions: [
      {
        id: 'q-1',
        number: '1',
        type: 'single',
        stem: '已知集合 A = {1, 2, 3}，B = {2, 3, 4}，则 A ∩ B =',
        score: 3,
        options: ['{1}', '{2, 3}', '{1, 2}', '{1, 2, 3, 4}'],
      },
      {
        id: 'q-2',
        number: '2',
        type: 'single',
        stem: '函数 y = 2x + 1 的图像一定经过下列哪个点？',
        score: 3,
        options: ['(0, 1)', '(1, 1)', '(1, 3)', '(2, 1)'],
      },
    ],
  },
  {
    id: 'section-2',
    title: '二、填空题',
    totalScore: 20,
    description: '本大题共 4 小题，每小题 5 分。',
    questions: [
      {
        id: 'q-3',
        number: '9',
        type: 'fill',
        stem: '若 sin A = 1/2，且 A 为锐角，则 A = ______。',
        score: 5,
      },
      {
        id: 'q-4',
        number: '10',
        type: 'fill',
        stem: '已知等差数列 {an} 中，a1 = 3，d = 2，则 a5 = ______。',
        score: 5,
      },
    ],
  },
  {
    id: 'section-3',
    title: '三、解答题',
    totalScore: 56,
    description: '解答应写出文字说明、证明过程或演算步骤。',
    questions: [
      {
        id: 'q-5',
        number: '17',
        type: 'essay',
        stem: '在平面直角坐标系中，已知抛物线 y = x² - 2x - 3。\n(1) 求该抛物线的顶点坐标；\n(2) 判断该抛物线与 x 轴的交点个数，并说明理由。',
        score: 12,
        answerLines: 8,
      },
    ],
  },
]

const templateTags = ['高考数学', 'A4 单栏', '正式打印']

const outlineItems = [
  { label: '试卷信息', meta: '标题 / 科目 / 时间' },
  { label: '一、选择题', meta: '8 小题' },
  { label: '二、填空题', meta: '4 小题' },
  { label: '三、解答题', meta: '6 小题' },
]

const propertyItems = [
  { label: '当前节点', value: '第 17 题' },
  { label: '题型', value: '解答题' },
  { label: '分值', value: '12 分' },
  { label: '答题区', value: '8 行' },
  { label: '分页策略', value: '尽量整题不拆分' },
]

function App() {
  return (
    <div className="editor-shell">
      <header className="topbar">
        <div className="topbar__brand">
          <div className="brand-mark">QX</div>
          <div>
            <p className="eyebrow">试卷编辑器</p>
            <h1>高中试卷工作台</h1>
          </div>
        </div>

        <div className="topbar__actions">
          <button type="button" className="ghost-button">
            新建
          </button>
          <button type="button" className="ghost-button">
            导入 JSON
          </button>
          <button type="button" className="ghost-button">
            保存草稿
          </button>
          <button type="button" className="primary-button">
            导出 PDF
          </button>
        </div>
      </header>

      <main className="workspace">
        <aside className="sidebar sidebar--left">
          <section className="panel">
            <div className="panel__header">
              <h2>结构</h2>
              <button type="button" className="inline-button">
                新增大题
              </button>
            </div>

            <div className="outline-list">
              {outlineItems.map((item) => (
                <button key={item.label} type="button" className="outline-item">
                  <span>{item.label}</span>
                  <small>{item.meta}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel__header">
              <h2>模板</h2>
            </div>

            <div className="tag-list">
              {templateTags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </section>
        </aside>

        <section className="canvas-panel">
          <div className="canvas-toolbar">
            <div className="canvas-toolbar__group">
              <span className="toolbar-label">模板</span>
              <strong>2026 高考数学模拟卷</strong>
            </div>
            <div className="canvas-toolbar__group">
              <span className="toolbar-label">缩放</span>
              <strong>92%</strong>
            </div>
          </div>

          <div className="paper-stage">
            <article className="paper-sheet">
              <header className="paper-header">
                <p className="paper-header__school">青禾高级中学 2026 届高三年级</p>
                <h2>数学试卷</h2>
                <div className="paper-meta">
                  <span>考试时间：120 分钟</span>
                  <span>满分：150 分</span>
                  <span>命题模板：高考标准版</span>
                </div>
              </header>

              <section className="notice-block">
                <strong>注意事项</strong>
                <ol>
                  <li>答题前，考生务必将自己的姓名、班级填写清楚。</li>
                  <li>选择题请用 2B 铅笔填涂，非选择题请用黑色签字笔作答。</li>
                  <li>请保持卷面整洁，作图可先使用铅笔后描黑。</li>
                </ol>
              </section>

              {sections.map((section) => (
                <section key={section.id} className="paper-section">
                  <div className="paper-section__title">
                    <h3>{section.title}</h3>
                    <span>{section.totalScore} 分</span>
                  </div>
                  <p className="paper-section__description">{section.description}</p>

                  <div className="question-list">
                    {section.questions.map((question) => (
                      <article
                        key={question.id}
                        className={`question-card question-card--${question.type}`}
                      >
                        <div className="question-card__head">
                          <strong>第 {question.number} 题</strong>
                          <span>{question.score} 分</span>
                        </div>
                        <p className="question-card__stem">{question.stem}</p>

                        {question.options ? (
                          <div className="option-grid">
                            {question.options.map((option, index) => (
                              <div key={option} className="option-item">
                                <span>{String.fromCharCode(65 + index)}.</span>
                                <span>{option}</span>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {question.answerLines ? (
                          <div className="answer-area" aria-hidden="true">
                            {Array.from({ length: question.answerLines }).map((_, index) => (
                              <span key={`${question.id}-line-${index}`} />
                            ))}
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </article>
          </div>
        </section>

        <aside className="sidebar sidebar--right">
          <section className="panel">
            <div className="panel__header">
              <h2>属性</h2>
              <button type="button" className="inline-button">
                切换题型
              </button>
            </div>

            <div className="property-list">
              {propertyItems.map((item) => (
                <div key={item.label} className="property-item">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel__header">
              <h2>快捷操作</h2>
            </div>

            <div className="quick-actions">
              <button type="button" className="quick-action">
                新增选择题
              </button>
              <button type="button" className="quick-action">
                新增填空题
              </button>
              <button type="button" className="quick-action">
                新增解答题
              </button>
              <button type="button" className="quick-action">
                复制当前题目
              </button>
            </div>
          </section>
        </aside>
      </main>
    </div>
  )
}

export default App
