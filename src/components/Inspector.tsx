import { useRef, useState } from 'react'
import { Archive, ArrowDown, ArrowUp, Copy, Crop, Plus, Trash2, X } from 'lucide-react'
import { usePaperStore } from '../store/paperStore'
import {
  cnNumber,
  isReadingQuestion,
  leafCount,
  LEAF_QUESTION_TYPES,
  locateQuestion,
  questionNumber,
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  READING_QUESTION_TYPES,
} from '../utils/format'
import { createQuestion } from '../data/templates'
import { splitSegmentationText, splitSolutionText } from '../data/paperFactory'
import { AssetImage } from './AssetImage'
import { ImageCropDialog } from './ImageCropDialog'
import { uid } from '../utils/id'
import { normalizeQuestionMetadata } from '../utils/questionBank'
import type {
  FontPreset,
  FontSizeLevel,
  LineHeightLevel,
  PageSize,
  Question,
  QuestionDifficulty,
  QuestionType,
  ReadingBlank,
  Section,
} from '../types'

const DIFFICULTY_LABELS: Record<QuestionDifficulty, string> = {
  unknown: '未标注',
  easy: '基础',
  medium: '中等',
  hard: '较难',
}

function splitMetadataList(value: string): string[] {
  return [...new Set(value.split(/[，,\n]/).map((item) => item.trim()).filter(Boolean))]
}

function QuestionMetadataEditor({ question }: { question: Question }) {
  const updateQuestion = usePaperStore((s) => s.updateQuestion)
  const metadata = normalizeQuestionMetadata(question.metadata)
  const patchMetadata = (patch: Partial<typeof metadata>) => {
    updateQuestion(question.id, { metadata: { ...metadata, ...patch } })
  }

  return (
    <div className="metadata-editor">
      <span className="metadata-editor__title">题库信息</span>
      <div className="field-row">
        <label className="field">
          <span>难度</span>
          <select value={metadata.difficulty} onChange={(event) => patchMetadata({ difficulty: event.target.value as QuestionDifficulty })}>
            {(Object.keys(DIFFICULTY_LABELS) as QuestionDifficulty[]).map((value) => <option key={value} value={value}>{DIFFICULTY_LABELS[value]}</option>)}
          </select>
        </label>
        <label className="field">
          <span>年份</span>
          <input
            type="number"
            min={1900}
            max={2100}
            placeholder="如 2026"
            value={metadata.year ?? ''}
            onChange={(event) => patchMetadata({ year: event.target.value ? Number(event.target.value) : undefined })}
          />
        </label>
      </div>
      <label className="field">
        <span>知识点（逗号分隔）</span>
        <input value={metadata.knowledgePoints.join('，')} onChange={(event) => patchMetadata({ knowledgePoints: splitMetadataList(event.target.value) })} />
      </label>
      <label className="field">
        <span>标签（逗号分隔）</span>
        <input value={metadata.tags.join('，')} onChange={(event) => patchMetadata({ tags: splitMetadataList(event.target.value) })} />
      </label>
      <label className="field">
        <span>来源</span>
        <input value={metadata.source} placeholder="如：2026 江苏适应性测试" onChange={(event) => patchMetadata({ source: event.target.value })} />
      </label>
    </div>
  )
}

function ImagesEditor({ question }: { question: Question }) {
  const addQuestionImage = usePaperStore((s) => s.addQuestionImage)
  const replaceQuestionImageAsset = usePaperStore((s) => s.replaceQuestionImageAsset)
  const updateQuestionImage = usePaperStore((s) => s.updateQuestionImage)
  const removeQuestionImage = usePaperStore((s) => s.removeQuestionImage)
  const fileRef = useRef<HTMLInputElement>(null)
  const [cropTarget, setCropTarget] = useState<{ index: number; assetId: string } | null>(null)

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
            <input
              className="image-editor__caption"
              value={image.caption ?? ''}
              placeholder="图注（可选）"
              aria-label="图注"
              onChange={(e) => updateQuestionImage(question.id, index, { caption: e.target.value || undefined })}
            />
            <button
              type="button"
              className="icon-button"
              title="裁剪或旋转"
              aria-label="裁剪或旋转"
              onClick={() => setCropTarget({ index, assetId: image.assetId })}
            >
              <Crop size={14} />
            </button>
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
      {cropTarget ? (
        <ImageCropDialog
          assetId={cropTarget.assetId}
          onClose={() => setCropTarget(null)}
          onApply={(blob) => replaceQuestionImageAsset(question.id, cropTarget.index, blob)}
        />
      ) : null}
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
  const duplicateSection = usePaperStore((s) => s.duplicateSection)
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
            onDuplicate={() => duplicateSection(section.id)}
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
  const saveQuestionToBank = usePaperStore((s) => s.saveQuestionToBank)
  const [bankMessage, setBankMessage] = useState('')

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

        <QuestionMetadataEditor question={question} />

        <div className="field">
          <button
            type="button"
            className="mini-button"
            onClick={() => {
              void saveQuestionToBank(question.id).then((entry) => {
                setBankMessage(entry ? (question.bankEntryId ? '已更新本地题库。' : '已存入本地题库。') : '未能保存到题库。')
              })
            }}
          >
            <Archive size={13} />
            {question.bankEntryId ? '更新题库材料' : '材料题存入本地题库'}
          </button>
          {bankMessage ? <small className="field-hint">{bankMessage}</small> : null}
        </div>

        <div className="field">
          <span>添加子题</span>
          <div className="quick-actions">
            {LEAF_QUESTION_TYPES.filter((type) => !READING_QUESTION_TYPES.includes(type)).map((type) => (
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

function ReadingBlanksEditor({ question }: { question: Question }) {
  const updateQuestion = usePaperStore((s) => s.updateQuestion)
  const blanks = question.readingBlanks ?? []
  const isCloze = question.type === 'cloze'

  const patchBlanks = (next: ReadingBlank[]) => {
    updateQuestion(question.id, {
      readingBlanks: next,
      score: next.reduce((sum, blank) => sum + blank.score, 0),
    })
  }

  const patchBlank = (id: string, patch: Partial<ReadingBlank>) => {
    patchBlanks(blanks.map((blank) => (blank.id === id ? { ...blank, ...patch } : blank)))
  }

  return (
    <div className="field">
      <span>{isCloze ? '各空（文章后的选项按空排列）' : '各空（文章内保留 ____ 编号）'}</span>
      <div className="reading-blank-editor">
        {blanks.map((blank, index) => (
          <div key={blank.id} className="reading-blank-editor__item">
            <div className="reading-blank-editor__head">
              <span>第 {index + 1} 空</span>
              <button
                type="button"
                className="icon-button is-danger"
                title="删除该空"
                onClick={() => patchBlanks(blanks.filter((item) => item.id !== blank.id))}
              >
                <X size={14} />
              </button>
            </div>
            <div className="field-row">
              <label className="field">
                <span>答案</span>
                <input
                  value={blank.answer}
                  placeholder={isCloze ? '如 C' : '如 B'}
                  onChange={(event) => patchBlank(blank.id, { answer: event.target.value })}
                />
              </label>
              <label className="field">
                <span>分值</span>
                <input
                  type="number"
                  min={0}
                  value={blank.score}
                  onChange={(event) => patchBlank(blank.id, { score: Number(event.target.value) || 0 })}
                />
              </label>
            </div>
            {isCloze ? (
              <div className="reading-blank-editor__options">
                {Array.from({ length: Math.max(blank.options.length, 4) }).map((_, optionIndex) => (
                  <label key={optionIndex} className="field">
                    <span>{String.fromCharCode(65 + optionIndex)}</span>
                    <input
                      value={blank.options[optionIndex] ?? ''}
                      onChange={(event) => {
                        const options = [...blank.options]
                        options[optionIndex] = event.target.value
                        patchBlank(blank.id, { options })
                      }}
                    />
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        <button
          type="button"
          className="mini-button"
          onClick={() => patchBlanks([
            ...blanks,
            {
              id: uid(),
              score: isCloze ? 1 : 2.5,
              answer: '',
              options: isCloze ? ['', '', '', ''] : [],
            },
          ])}
        >
          <Plus size={13} />
          添加空
        </button>
      </div>
      {!isCloze ? <small className="field-hint">七选五的 A–G 选项请作为文章末尾内容录入，卷面不再生成附加小题。</small> : null}
    </div>
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
  const saveQuestionToBank = usePaperStore((s) => s.saveQuestionToBank)
  const [bankMessage, setBankMessage] = useState('')

  const isChoice = question.type === 'single' || question.type === 'multiple'
  const isReading = isReadingQuestion(question)

  const handleTypeChange = (type: QuestionType) => {
    if (type === 'material') return
    const defaults = createQuestion(type)
    const nextIsReading = READING_QUESTION_TYPES.includes(type)
    const carriedStem =
      question.type === 'solution'
        ? [question.stem, ...(question.parts ?? []).map((part) => part.stem)].filter(Boolean).join('\n')
        : question.type === 'segmentation'
          ? [question.stem, question.segmentationText].filter(Boolean).join('\n')
          : question.stem
    const structuredSolution =
      type === 'solution' ? splitSolutionText(carriedStem, question.answerLines) : null
    const structuredSegmentation =
      type === 'segmentation' ? splitSegmentationText(carriedStem) : null
    const usesQuestionAnswerLines =
      type === 'calculation' || type === 'shortAnswer' || type === 'composition'

    updateQuestion(question.id, {
      type,
      stem:
        structuredSolution?.stem ??
        structuredSegmentation?.stem ??
        carriedStem,
      options:
        type === 'single' || type === 'multiple'
          ? question.options.length >= 2
            ? question.options
            : defaults.options
          : [],
      answerLines: usesQuestionAnswerLines ? question.answerLines || defaults.answerLines : 0,
      segmentationText: structuredSegmentation?.segmentationText,
      parts: structuredSolution?.parts,
      compositionStyle:
        type === 'composition' ? question.compositionStyle ?? defaults.compositionStyle : undefined,
      material: nextIsReading ? question.material ?? '' : undefined,
      readingBlanks: nextIsReading
        ? (question.readingBlanks?.length
          ? question.readingBlanks.map((blank) => ({
              ...blank,
              options: type === 'cloze' ? (blank.options.length >= 2 ? [...blank.options] : ['', '', '', '']) : [],
            }))
          : defaults.readingBlanks)
        : undefined,
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
              {LEAF_QUESTION_TYPES.filter((type) => !isChild || !READING_QUESTION_TYPES.includes(type) || type === question.type).map((type) => (
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
          <span>
            {question.type === 'solution'
              ? '引导语（可留空）'
              : question.type === 'segmentation'
                ? '作答说明'
                : isReading
                  ? '作答说明'
                : '题干（$…$ 公式 · **加粗** · __下划线__ · | 表格 |）'}
          </span>
          <textarea
            rows={question.type === 'solution' || question.type === 'segmentation' ? 3 : 5}
            value={question.stem}
            onChange={(e) => updateQuestion(question.id, { stem: e.target.value })}
          />
        </label>

        {isReading ? (
          <label className="field">
            <span>文章（保留空号和换行）</span>
            <textarea
              rows={12}
              value={question.material ?? ''}
              onChange={(event) => updateQuestion(question.id, { material: event.target.value })}
            />
          </label>
        ) : null}

        {question.type === 'segmentation' ? (
          <label className="field">
            <span>待断句文本（自动缩进并拉开字距）</span>
            <textarea
              rows={4}
              value={question.segmentationText ?? ''}
              onChange={(e) => updateQuestion(question.id, { segmentationText: e.target.value })}
            />
          </label>
        ) : null}

        {question.type === 'solution' ? (
          <div className="field">
            <span>小问（`______` 表示句中答题横线）</span>
            <div className="solution-part-editor">
              {(question.parts ?? []).map((part, index) => (
                <div key={part.id} className="solution-part-editor__item">
                  <div className="solution-part-editor__head">
                    <span>小问 {index + 1}</span>
                    <button
                      type="button"
                      className="icon-button is-danger"
                      title="删除小问"
                      onClick={() =>
                        updateQuestion(question.id, {
                          parts: (question.parts ?? []).filter((item) => item.id !== part.id),
                        })
                      }
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={part.stem}
                    onChange={(e) =>
                      updateQuestion(question.id, {
                        parts: (question.parts ?? []).map((item) =>
                          item.id === part.id ? { ...item, stem: e.target.value } : item,
                        ),
                      })
                    }
                  />
                  <div className="field-row">
                    <label className="field">
                      <span>小问分值</span>
                      <input
                        type="number"
                        min={0}
                        value={part.score}
                        onChange={(e) =>
                          updateQuestion(question.id, {
                            parts: (question.parts ?? []).map((item) =>
                              item.id === part.id
                                ? { ...item, score: Number(e.target.value) || 0 }
                                : item,
                            ),
                          })
                        }
                      />
                    </label>
                    <label className="field">
                      <span>问后横线</span>
                      <input
                        type="number"
                        min={0}
                        max={40}
                        value={part.answerLines}
                        onChange={(e) =>
                          updateQuestion(question.id, {
                            parts: (question.parts ?? []).map((item) =>
                              item.id === part.id
                                ? { ...item, answerLines: Number(e.target.value) || 0 }
                                : item,
                            ),
                          })
                        }
                      />
                    </label>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="mini-button"
                onClick={() =>
                  updateQuestion(question.id, {
                    parts: [
                      ...(question.parts ?? []),
                      {
                        id: uid(),
                        stem: `（${(question.parts?.length ?? 0) + 1}）`,
                        score: 0,
                        answerLines: 0,
                      },
                    ],
                  })
                }
              >
                <Plus size={13} />
                小问
              </button>
            </div>
          </div>
        ) : null}

        {isReading ? <ReadingBlanksEditor question={question} /> : null}

        {!isReading ? <ImagesEditor question={question} /> : null}

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

        {question.type === 'calculation' || question.type === 'shortAnswer' ? (
          <label className="field">
            <span>{question.type === 'calculation' ? '题后留白行数' : '题后横线行数'}</span>
            <input
              type="number"
              min={0}
              max={40}
              value={question.answerLines}
              onChange={(e) => updateQuestion(question.id, { answerLines: Number(e.target.value) || 0 })}
            />
          </label>
        ) : null}

        {question.type === 'composition' ? (
          <div className="field-row">
            <label className="field">
              <span>答题区行数</span>
              <input
                type="number"
                min={0}
                max={100}
                value={question.answerLines}
                onChange={(e) => updateQuestion(question.id, { answerLines: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="field">
              <span>答题区样式</span>
              <select
                value={question.compositionStyle ?? 'grid'}
                onChange={(e) =>
                  updateQuestion(question.id, {
                    compositionStyle: e.target.value as 'grid' | 'lines',
                  })
                }
              >
                <option value="lines">横线</option>
                <option value="grid">方格</option>
              </select>
            </label>
          </div>
        ) : null}

        <QuestionMetadataEditor question={question} />

        <div className="field">
          <button
            type="button"
            className="mini-button"
            onClick={() => {
              void saveQuestionToBank(question.id).then((entry) => {
                setBankMessage(entry ? (question.bankEntryId ? '已更新本地题库。' : '已存入本地题库。') : '未能保存到题库。')
              })
            }}
          >
            <Archive size={13} />
            {question.bankEntryId ? '更新题库题目' : '存入本地题库'}
          </button>
          {bankMessage ? <small className="field-hint">{bankMessage}</small> : null}
        </div>

        {!isReading ? (
          <label className="field">
            <span>参考答案</span>
            <textarea
              rows={3}
              value={question.answer}
              placeholder={isChoice ? 'B / ABD' : ''}
              onChange={(e) => updateQuestion(question.id, { answer: e.target.value })}
            />
          </label>
        ) : null}
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
