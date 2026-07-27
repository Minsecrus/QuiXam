import { useRef } from 'react'
import { ArrowDown, ArrowUp, Copy, Plus, Trash2, X } from 'lucide-react'
import { usePaperStore } from '../store/paperStore'
import {
  cnNumber,
  leafCount,
  LEAF_QUESTION_TYPES,
  locateQuestion,
  questionNumber,
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
} from '../utils/format'
import { createQuestion } from '../data/templates'
import { AssetImage } from './AssetImage'
import type {
  AnswerAreaStyle,
  FontPreset,
  FontSizeLevel,
  LineHeightLevel,
  PageSize,
  Question,
  QuestionType,
  Section,
} from '../types'

function ImagesEditor({ question }: { question: Question }) {
  const addQuestionImage = usePaperStore((s) => s.addQuestionImage)
  const updateQuestionImage = usePaperStore((s) => s.updateQuestionImage)
  const removeQuestionImage = usePaperStore((s) => s.removeQuestionImage)
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="field">
      <span>附图</span>
      <div className="image-editor">
        {(question.images ?? []).map((image, index) => (
          <div key={`${image.assetId}-${index}`} className="image-editor__row">
            <AssetImage assetId={image.assetId} className="image-thumb" />
            <label className="image-editor__width">
              <input
                type="number"
                min={10}
                max={100}
                value={image.widthPercent}
                onChange={(e) =>
                  updateQuestionImage(question.id, index, {
                    widthPercent: Math.min(100, Math.max(10, Number(e.target.value) || 60)),
                  })
                }
              />
              %
            </label>
            <select
              value={image.align}
              onChange={(e) =>
                updateQuestionImage(question.id, index, { align: e.target.value as 'center' | 'right' })
              }
            >
              <option value="center">居中</option>
              <option value="right">靠右</option>
            </select>
            <button
              type="button"
              className="icon-button is-danger"
              title="移除"
              onClick={() => removeQuestionImage(question.id, index)}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <button type="button" className="mini-button" onClick={() => fileRef.current?.click()}>
          <Plus size={13} />
          图片
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void addQuestionImage(question.id, file)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}

function ItemActions({
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
}: {
  onMoveUp: () => void
  onMoveDown: () => void
  onDuplicate?: () => void
  onRemove: () => void
}) {
  return (
    <div className="button-row">
      <button type="button" className="icon-button" title="上移" onClick={onMoveUp}>
        <ArrowUp size={15} />
      </button>
      <button type="button" className="icon-button" title="下移" onClick={onMoveDown}>
        <ArrowDown size={15} />
      </button>
      {onDuplicate ? (
        <button type="button" className="icon-button" title="复制" onClick={onDuplicate}>
          <Copy size={15} />
        </button>
      ) : null}
      <button type="button" className="icon-button is-danger" title="删除" onClick={onRemove}>
        <Trash2 size={15} />
      </button>
    </div>
  )
}

function PaperInspector() {
  const paper = usePaperStore((s) => s.paper)
  const renamePaper = usePaperStore((s) => s.renamePaper)
  const updateInfo = usePaperStore((s) => s.updateInfo)
  const updateLayout = usePaperStore((s) => s.updateLayout)
  const addSection = usePaperStore((s) => s.addSection)
  const addQuestion = usePaperStore((s) => s.addQuestion)

  if (!paper) return null

  return (
    <>
      <section className="panel">
        <div className="panel__header">
          <h2>试卷信息</h2>
          {/* 窄屏下左栏被隐藏，这里是「新增大题」的唯一入口 */}
          <button type="button" className="icon-button" title="新增大题" aria-label="新增大题" onClick={addSection}>
            <Plus size={15} />
          </button>
        </div>
        <div className="field-list">
          <label className="field">
            <span>试卷名称</span>
            <input value={paper.name} onChange={(e) => renamePaper(e.target.value)} />
          </label>
          <label className="field">
            <span>学校 / 届别</span>
            <input value={paper.info.school} onChange={(e) => updateInfo({ school: e.target.value })} />
          </label>
          <label className="field">
            <span>标题</span>
            <input value={paper.info.title} onChange={(e) => updateInfo({ title: e.target.value })} />
          </label>
          <label className="field">
            <span>副标题</span>
            <input value={paper.info.subtitle} onChange={(e) => updateInfo({ subtitle: e.target.value })} />
          </label>
          <div className="field-row">
            <label className="field">
              <span>时长（分钟）</span>
              <input
                type="number"
                min={0}
                value={paper.info.duration}
                onChange={(e) => updateInfo({ duration: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="field">
              <span>满分</span>
              <input
                type="number"
                min={0}
                value={paper.info.fullScore}
                onChange={(e) => updateInfo({ fullScore: Number(e.target.value) || 0 })}
              />
            </label>
          </div>
          <label className="field">
            <span>注意事项（每行一条）</span>
            <textarea
              rows={4}
              value={paper.info.notices.join('\n')}
              onChange={(e) => updateInfo({ notices: e.target.value.split('\n') })}
            />
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h2>排版</h2>
        </div>
        <div className="field-list">
          <div className="field-row">
            <label className="field">
              <span>正文字体</span>
              <select
                value={paper.layout.bodyFont}
                onChange={(e) => updateLayout({ bodyFont: e.target.value as FontPreset })}
              >
                <option value="song">宋体</option>
                <option value="kai">楷体</option>
                <option value="hei">黑体</option>
              </select>
            </label>
            <label className="field">
              <span>字号</span>
              <select
                value={paper.layout.fontSize}
                onChange={(e) => updateLayout({ fontSize: e.target.value as FontSizeLevel })}
              >
                <option value="small">五号</option>
                <option value="medium">小四</option>
                <option value="large">四号</option>
              </select>
            </label>
          </div>
          <div className="field-row">
            <label className="field">
              <span>行距</span>
              <select
                value={paper.layout.lineHeight}
                onChange={(e) => updateLayout({ lineHeight: e.target.value as LineHeightLevel })}
              >
                <option value="compact">紧凑</option>
                <option value="normal">标准</option>
                <option value="loose">宽松</option>
              </select>
            </label>
            <label className="field">
              <span>纸张</span>
              <select
                value={paper.layout.pageSize}
                onChange={(e) => updateLayout({ pageSize: e.target.value as PageSize })}
              >
                <option value="a4">A4 单栏</option>
                <option value="a3-2col">A3 两栏</option>
              </select>
            </label>
          </div>
          <label className="field">
            <span>答题区</span>
            <select
              value={paper.layout.answerStyle}
              onChange={(e) => updateLayout({ answerStyle: e.target.value as AnswerAreaStyle })}
            >
              <option value="blank">空白（数学 / 物理）</option>
              <option value="lines">横线（其他科目）</option>
            </select>
          </label>
          <label className="field field--inline">
            <input
              type="checkbox"
              checked={paper.layout.sealLine}
              onChange={(e) => updateLayout({ sealLine: e.target.checked })}
            />
            <span>密封线</span>
          </label>
          <label className="field field--inline">
            <input
              type="checkbox"
              checked={paper.layout.keepQuestionTogether}
              onChange={(e) => updateLayout({ keepQuestionTogether: e.target.checked })}
            />
            <span>整题尽量不跨页</span>
          </label>
          <label className="field field--inline">
            <input
              type="checkbox"
              checked={paper.layout.keepHeadingWithNext}
              onChange={(e) => updateLayout({ keepHeadingWithNext: e.target.checked })}
            />
            <span>大题标题不落单</span>
          </label>
          <label className="field field--inline">
            <input
              type="checkbox"
              checked={paper.layout.justifyPages}
              onChange={(e) => updateLayout({ justifyPages: e.target.checked })}
            />
            <span>自然撑满整页</span>
          </label>
        </div>
      </section>

      {paper.sections.length === 0 ? (
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
      ) : null}
    </>
  )
}

function SectionInspector({ section, index }: { section: Section; index: number }) {
  const updateSection = usePaperStore((s) => s.updateSection)
  const moveSection = usePaperStore((s) => s.moveSection)
  const removeSection = usePaperStore((s) => s.removeSection)
  const addQuestion = usePaperStore((s) => s.addQuestion)

  const handleRemove = () => {
    const message =
      section.questions.length > 0
        ? `大题「${section.title}」下有 ${section.questions.length} 道题，将一并删除。确定？`
        : `删除大题「${section.title}」？`
    if (window.confirm(message)) removeSection(section.id)
  }

  return (
    <>
      <section className="panel">
        <div className="panel__header">
          <h2>
          {cnNumber(index + 1)}、{section.title}
        </h2>
          <ItemActions
            onMoveUp={() => moveSection(section.id, -1)}
            onMoveDown={() => moveSection(section.id, 1)}
            onRemove={handleRemove}
          />
        </div>
        <div className="field-list">
          <label className="field">
            <span>名称</span>
            <input value={section.title} onChange={(e) => updateSection(section.id, { title: e.target.value })} />
          </label>
          <label className="field">
            <span>说明</span>
            <textarea
              rows={3}
              placeholder="本题共 8 小题，每小题 5 分，共 40 分。"
              value={section.description}
              onChange={(e) => updateSection(section.id, { description: e.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h2>添加题目</h2>
        </div>
        <div className="quick-actions">
          {QUESTION_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className="quick-action"
              onClick={() => addQuestion(section.id, type)}
            >
              <Plus size={13} />
              {QUESTION_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </section>
    </>
  )
}

function MaterialInspector({ question, number }: { question: Question; number: number | null }) {
  const updateQuestion = usePaperStore((s) => s.updateQuestion)
  const addChildQuestion = usePaperStore((s) => s.addChildQuestion)
  const moveQuestion = usePaperStore((s) => s.moveQuestion)
  const duplicateQuestion = usePaperStore((s) => s.duplicateQuestion)
  const removeQuestion = usePaperStore((s) => s.removeQuestion)

  const count = leafCount(question)
  const range = number !== null && count > 0 ? `（第 ${number}${count > 1 ? `–${number + count - 1}` : ''} 题）` : ''

  return (
    <section className="panel">
      <div className="panel__header">
        <h2>材料题{range}</h2>
        <ItemActions
          onMoveUp={() => moveQuestion(question.id, -1)}
          onMoveDown={() => moveQuestion(question.id, 1)}
          onDuplicate={() => duplicateQuestion(question.id)}
          onRemove={() => {
            if (window.confirm(`删除该材料题${count > 0 ? `及其 ${count} 道子题` : ''}？`)) {
              removeQuestion(question.id)
            }
          }}
        />
      </div>

      <div className="field-list">
        <label className="field">
          <span>引导语</span>
          <textarea
            rows={2}
            placeholder="阅读下面的文字，完成下面小题。"
            value={question.stem}
            onChange={(e) => updateQuestion(question.id, { stem: e.target.value })}
          />
        </label>

        <label className="field">
          <span>材料（# 标题行 · @ 作者行）</span>
          <textarea
            rows={8}
            value={question.material ?? ''}
            placeholder={'#山居秋暝\n@王维〔唐〕\n空山新雨后，天气晚来秋。'}
            onChange={(e) => updateQuestion(question.id, { material: e.target.value })}
          />
        </label>

        <label className="field">
          <span>对齐</span>
          <select
            value={question.materialAlign ?? 'left'}
            onChange={(e) => updateQuestion(question.id, { materialAlign: e.target.value as 'left' | 'center' })}
          >
            <option value="left">左对齐</option>
            <option value="center">居中（诗歌）</option>
          </select>
        </label>

        <ImagesEditor question={question} />

        <div className="field">
          <span>添加子题</span>
          <div className="quick-actions">
            {LEAF_QUESTION_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className="quick-action"
                onClick={() => addChildQuestion(question.id, type)}
              >
                <Plus size={13} />
                {QUESTION_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function QuestionInspector({
  question,
  number,
  isChild,
}: {
  question: Question
  number: number | null
  isChild: boolean
}) {
  const updateQuestion = usePaperStore((s) => s.updateQuestion)
  const moveQuestion = usePaperStore((s) => s.moveQuestion)
  const duplicateQuestion = usePaperStore((s) => s.duplicateQuestion)
  const removeQuestion = usePaperStore((s) => s.removeQuestion)

  const isChoice = question.type === 'single' || question.type === 'multiple'

  const handleTypeChange = (type: QuestionType) => {
    if (type === 'material') return
    const defaults = createQuestion(type)
    updateQuestion(question.id, {
      type,
      options:
        type === 'single' || type === 'multiple'
          ? question.options.length >= 2
            ? question.options
            : defaults.options
          : [],
      answerLines: type === 'essay' ? question.answerLines || defaults.answerLines : 0,
    })
  }

  const setOption = (index: number, value: string) => {
    const options = [...question.options]
    options[index] = value
    updateQuestion(question.id, { options })
  }

  return (
    <section className="panel">
      <div className="panel__header">
        <h2>
          {number !== null ? `第 ${number} 题` : '题目'}
          {isChild ? ' · 子题' : ''}
        </h2>
        <ItemActions
          onMoveUp={() => moveQuestion(question.id, -1)}
          onMoveDown={() => moveQuestion(question.id, 1)}
          onDuplicate={() => duplicateQuestion(question.id)}
          onRemove={() => {
            if (window.confirm('删除这道题？')) removeQuestion(question.id)
          }}
        />
      </div>

      <div className="field-list">
        <div className="field-row">
          <label className="field">
            <span>题型</span>
            <select value={question.type} onChange={(e) => handleTypeChange(e.target.value as QuestionType)}>
              {LEAF_QUESTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {QUESTION_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>分值</span>
            <input
              type="number"
              min={0}
              value={question.score}
              onChange={(e) => updateQuestion(question.id, { score: Number(e.target.value) || 0 })}
            />
          </label>
        </div>

        <label className="field">
          <span>题干（$…$ 公式 · 化学式用 \ce{'{…}'}）</span>
          <textarea
            rows={5}
            value={question.stem}
            onChange={(e) => updateQuestion(question.id, { stem: e.target.value })}
          />
        </label>

        <ImagesEditor question={question} />

        {isChoice ? (
          <div className="field">
            <span>选项</span>
            <div className="option-editor">
              {question.options.map((option, index) => (
                <div key={index} className="option-editor__row">
                  <span className="option-editor__label">{String.fromCharCode(65 + index)}</span>
                  <input value={option} onChange={(e) => setOption(index, e.target.value)} />
                  <button
                    type="button"
                    className="icon-button is-danger"
                    title="删除选项"
                    onClick={() =>
                      updateQuestion(question.id, {
                        options: question.options.filter((_, i) => i !== index),
                      })
                    }
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {question.options.length < 7 ? (
                <button
                  type="button"
                  className="mini-button"
                  onClick={() => updateQuestion(question.id, { options: [...question.options, ''] })}
                >
                  <Plus size={13} />
                  选项
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {question.type === 'essay' ? (
          <div className="field-row">
            <label className="field">
              <span>答题区行数</span>
              <input
                type="number"
                min={0}
                max={40}
                value={question.answerLines}
                onChange={(e) => updateQuestion(question.id, { answerLines: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="field">
              <span>答题区样式</span>
              <select
                value={question.answerStyle ?? ''}
                onChange={(e) =>
                  updateQuestion(question.id, {
                    answerStyle: e.target.value ? (e.target.value as AnswerAreaStyle) : undefined,
                  })
                }
              >
                <option value="">跟随试卷</option>
                <option value="blank">空白</option>
                <option value="lines">横线</option>
              </select>
            </label>
          </div>
        ) : null}

        <label className="field">
          <span>参考答案</span>
          <textarea
            rows={3}
            value={question.answer}
            placeholder={isChoice ? 'B / ABD' : ''}
            onChange={(e) => updateQuestion(question.id, { answer: e.target.value })}
          />
        </label>
      </div>
    </section>
  )
}

export function Inspector() {
  const paper = usePaperStore((s) => s.paper)
  const selection = usePaperStore((s) => s.selection)

  if (!paper) return null

  let content = null
  if (selection.kind === 'paper') {
    content = <PaperInspector />
  } else if (selection.kind === 'section') {
    const index = paper.sections.findIndex((s) => s.id === selection.id)
    if (index >= 0) {
      content = <SectionInspector section={paper.sections[index]} index={index} />
    }
  } else {
    const location = locateQuestion(paper, selection.id)
    if (location) {
      const number = questionNumber(paper, selection.id)
      content =
        location.question.type === 'material' ? (
          <MaterialInspector question={location.question} number={number} />
        ) : (
          <QuestionInspector question={location.question} number={number} isChild={location.parentId !== null} />
        )
    }
  }

  return (
    <aside className="sidebar sidebar--right">
      {content ?? (
        <section className="panel">
          <p className="panel-hint">点击画布中的元素进行编辑</p>
        </section>
      )}
    </aside>
  )
}
