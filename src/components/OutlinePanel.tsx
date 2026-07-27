import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { usePaperStore } from '../store/paperStore'
import {
  cnNumber,
  leafCount,
  locateQuestion,
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  sectionItemNumbers,
  sectionLeafCount,
  sectionScore,
  sectionStartNumbers,
} from '../utils/format'
import type { Question } from '../types'

function questionSummary(question: Question): string {
  const text =
    question.type === 'material'
      ? question.stem || question.material || ''
      : question.type === 'segmentation'
        ? question.segmentationText || question.stem
        : question.type === 'solution'
          ? question.stem || question.parts?.[0]?.stem || ''
          : question.stem
  return text
    .replace(/^[#@]\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim() || '未填写题干'
}

function QuestionOutlineItem({
  question,
  number,
  nested = false,
}: {
  question: Question
  number: number
  nested?: boolean
}) {
  const selection = usePaperStore((s) => s.selection)
  const setSelection = usePaperStore((s) => s.setSelection)
  return (
    <button
      type="button"
      className={`outline-question ${nested ? 'is-nested' : ''} ${
        selection.kind === 'question' && selection.id === question.id ? 'is-active' : ''
      }`}
      onClick={() => setSelection({ kind: 'question', id: question.id })}
      title={questionSummary(question)}
    >
      <span className="outline-question__number">{number}．</span>
      <span className="outline-question__content">
        <span className="outline-question__stem">{questionSummary(question)}</span>
        <small>{QUESTION_TYPE_LABELS[question.type]}</small>
      </span>
    </button>
  )
}

export function OutlinePanel() {
  const paper = usePaperStore((s) => s.paper)
  const selection = usePaperStore((s) => s.selection)
  const setSelection = usePaperStore((s) => s.setSelection)
  const addSection = usePaperStore((s) => s.addSection)
  const addQuestion = usePaperStore((s) => s.addQuestion)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set())

  if (!paper) return null

  const starts = sectionStartNumbers(paper)
  const selectedLocation =
    selection.kind === 'question' ? locateQuestion(paper, selection.id) : null

  const toggleSection = (sectionId: string, currentlyExpanded: boolean) => {
    setExpandedSections((current) => {
      const next = new Set(current)
      if (currentlyExpanded) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
    setSelection({ kind: 'section', id: sectionId })
  }

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

          {paper.sections.map((section, index) => {
            const expanded =
              expandedSections.has(section.id) || selectedLocation?.sectionId === section.id
            const numbers = sectionItemNumbers(section, starts.get(section.id) ?? 1)
            const listId = `outline-section-${section.id}`
            return (
              <div key={section.id} className="outline-section">
                <button
                  type="button"
                  className={`outline-item outline-section__button ${
                    selection.kind === 'section' && selection.id === section.id ? 'is-active' : ''
                  }`}
                  aria-expanded={expanded}
                  aria-controls={listId}
                  onClick={() => toggleSection(section.id, expanded)}
                >
                  <span className="outline-section__title">
                    {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span>
                      {cnNumber(index + 1)}、{section.title}
                    </span>
                  </span>
                  <small>
                    {sectionLeafCount(section)} 题 · {sectionScore(section)} 分
                  </small>
                </button>

                {expanded ? (
                  <div id={listId} className="outline-question-list">
                    {section.questions.length > 0 ? (
                      section.questions.map((question, questionIndex) => {
                        const number = numbers[questionIndex]
                        if (question.type !== 'material') {
                          return (
                            <QuestionOutlineItem
                              key={question.id}
                              question={question}
                              number={number}
                            />
                          )
                        }
                        const count = leafCount(question)
                        return (
                          <div key={question.id} className="outline-material">
                            <button
                              type="button"
                              className={`outline-question outline-question--material ${
                                selection.kind === 'question' && selection.id === question.id
                                  ? 'is-active'
                                  : ''
                              }`}
                              onClick={() =>
                                setSelection({ kind: 'question', id: question.id })
                              }
                              title={questionSummary(question)}
                            >
                              <span className="outline-question__number">
                                {count > 1 ? `${number}–${number + count - 1}` : number}
                              </span>
                              <span className="outline-question__content">
                                <span className="outline-question__stem">
                                  {questionSummary(question)}
                                </span>
                                <small>材料题 · {count} 题</small>
                              </span>
                            </button>
                            {(question.children ?? []).map((child, childIndex) => (
                              <QuestionOutlineItem
                                key={child.id}
                                question={child}
                                number={number + childIndex}
                                nested
                              />
                            ))}
                          </div>
                        )
                      })
                    ) : (
                      <p className="outline-question-list__empty">暂无题目</p>
                    )}
                  </div>
                ) : null}
              </div>
            )
          })}
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
