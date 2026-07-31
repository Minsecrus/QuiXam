import { useState, type DragEvent } from 'react'
import { ChevronDown, ChevronRight, ListChecks, Plus, Trash2 } from 'lucide-react'
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
  bulkMode = false,
  bulkSelected = false,
  onToggleBulk,
}: {
  question: Question
  number: number
  nested?: boolean
  bulkMode?: boolean
  bulkSelected?: boolean
  onToggleBulk?: (id: string) => void
}) {
  const selection = usePaperStore((s) => s.selection)
  const setSelection = usePaperStore((s) => s.setSelection)
  const reorderQuestion = usePaperStore((s) => s.reorderQuestion)
  const onQuestionDragStart = (event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('application/x-quixam-question', question.id)
  }
  const onQuestionDrop = (event: DragEvent<HTMLButtonElement>) => {
    const sourceId = event.dataTransfer.getData('application/x-quixam-question')
    if (!sourceId) return
    event.preventDefault()
    reorderQuestion(sourceId, question.id)
  }
  return (
    <button
      type="button"
      className={`outline-question ${nested ? 'is-nested' : ''} ${bulkSelected ? 'is-bulk-selected' : ''} ${
        selection.kind === 'question' && selection.id === question.id ? 'is-active' : ''
      }`}
      onClick={() => bulkMode ? onToggleBulk?.(question.id) : setSelection({ kind: 'question', id: question.id })}
      title={questionSummary(question)}
      draggable
      onDragStart={onQuestionDragStart}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onQuestionDrop}
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
  const reorderSection = usePaperStore((s) => s.reorderSection)
  const reorderQuestion = usePaperStore((s) => s.reorderQuestion)
  const updateQuestionScores = usePaperStore((s) => s.updateQuestionScores)
  const removeQuestions = usePaperStore((s) => s.removeQuestions)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set())
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkIds, setBulkIds] = useState<Set<string>>(() => new Set())
  const [bulkScore, setBulkScore] = useState('5')

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

  const toggleBulkQuestion = (id: string) => {
    setBulkIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const exitBulkMode = () => {
    setBulkMode(false)
    setBulkIds(new Set())
  }

  return (
    <aside className="sidebar sidebar--left">
      <section className="panel">
        <div className="panel__header">
          <h2>结构</h2>
          <div className="button-row">
            <button
              type="button"
              className={`icon-button${bulkMode ? ' is-active' : ''}`}
              title="批量编辑题目"
              aria-label="批量编辑题目"
              onClick={() => bulkMode ? exitBulkMode() : setBulkMode(true)}
            >
              <ListChecks size={15} />
            </button>
            <button type="button" className="icon-button" title="新增大题" onClick={addSection}>
              <Plus size={15} />
            </button>
          </div>
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
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('application/x-quixam-section', section.id)
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    const sourceId = event.dataTransfer.getData('application/x-quixam-section')
                    if (!sourceId) return
                    event.preventDefault()
                    reorderSection(sourceId, section.id)
                  }}
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
                              bulkMode={bulkMode}
                              bulkSelected={bulkIds.has(question.id)}
                              onToggleBulk={toggleBulkQuestion}
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
                                bulkMode ? toggleBulkQuestion(question.id) : setSelection({ kind: 'question', id: question.id })
                              }
                            title={questionSummary(question)}
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.effectAllowed = 'move'
                              event.dataTransfer.setData('application/x-quixam-question', question.id)
                            }}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                              const sourceId = event.dataTransfer.getData('application/x-quixam-question')
                              if (!sourceId) return
                              event.preventDefault()
                              reorderQuestion(sourceId, question.id)
                            }}
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
                              bulkMode={bulkMode}
                              bulkSelected={bulkIds.has(child.id)}
                              onToggleBulk={toggleBulkQuestion}
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

        {bulkMode ? (
          <div className="outline-bulk-actions">
            <strong>已选择 {bulkIds.size} 道题</strong>
            <div>
              <label>
                分值
                <input
                  type="number"
                  min={0}
                  value={bulkScore}
                  onChange={(event) => setBulkScore(event.target.value)}
                />
              </label>
              <button
                type="button"
                className="mini-button"
                disabled={bulkIds.size === 0}
                onClick={() => updateQuestionScores([...bulkIds], Number(bulkScore) || 0)}
              >
                批量设置
              </button>
              <button
                type="button"
                className="icon-button is-danger"
                title="批量删除"
                aria-label="批量删除"
                disabled={bulkIds.size === 0}
                onClick={() => {
                  if (!window.confirm(`删除选中的 ${bulkIds.size} 道题？`)) return
                  removeQuestions([...bulkIds])
                  exitBulkMode()
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
            <button type="button" className="ghost-button" onClick={exitBulkMode}>完成</button>
          </div>
        ) : null}
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
