import { Plus } from 'lucide-react'
import { usePaperStore } from '../store/paperStore'
import {
  cnNumber,
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  sectionLeafCount,
  sectionScore,
} from '../utils/format'

export function OutlinePanel() {
  const paper = usePaperStore((s) => s.paper)
  const selection = usePaperStore((s) => s.selection)
  const setSelection = usePaperStore((s) => s.setSelection)
  const addSection = usePaperStore((s) => s.addSection)
  const addQuestion = usePaperStore((s) => s.addQuestion)

  if (!paper) return null

  return (
    <aside className="sidebar sidebar--left">
      <section className="panel">
        <div className="panel__header">
          <h2>结构</h2>
          <button type="button" className="icon-button" title="新增大题" onClick={addSection}>
            <Plus size={15} />
          </button>
        </div>

        <div className="outline-list">
          <button
            type="button"
            className={`outline-item ${selection.kind === 'paper' ? 'is-active' : ''}`}
            onClick={() => setSelection({ kind: 'paper' })}
          >
            <span>试卷信息</span>
            <small>{paper.info.title || '未命名'}</small>
          </button>

          {paper.sections.map((section, index) => (
            <button
              key={section.id}
              type="button"
              className={`outline-item ${
                selection.kind === 'section' && selection.id === section.id ? 'is-active' : ''
              }`}
              onClick={() => setSelection({ kind: 'section', id: section.id })}
            >
              <span>
                {cnNumber(index + 1)}、{section.title}
              </span>
              <small>
                {sectionLeafCount(section)} 题 · {sectionScore(section)} 分
              </small>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h2>添加题目</h2>
        </div>
        <div className="quick-actions">
          {QUESTION_TYPES.map((type) => (
            <button key={type} type="button" className="quick-action" onClick={() => addQuestion(null, type)}>
              <Plus size={13} />
              {QUESTION_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </section>
    </aside>
  )
}
