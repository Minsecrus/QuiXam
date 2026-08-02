import { memo, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, Copy, X } from 'lucide-react'
import { usePaperStore } from '../store/paperStore'
import {
  cnNumber,
  flattenLeaves,
  isReadingQuestion,
  sectionItemNumbers,
  sectionLeafCount,
  sectionScore,
  sectionStartNumbers,
  type FlattenedQuestion,
} from '../utils/format'
import { mmToPx, paperGeometry, PAGE_SAFETY_MM } from '../utils/paperGeometry'
import {
  GAP_WEIGHT,
  paginate,
  type FlowGroup,
  type FlowPiece,
  type PlacedSlice,
  type PlannedPage,
} from '../utils/paginate'
import { MathText } from './MathText'
import { AssetImage } from './AssetImage'
import type { Paper, Question, QuestionImage, SolutionPart } from '../types'

/** 页脚"第 X 页 共 Y 页"占用的高度 */
const FOOTER_MM = 8

function QuestionImages({ images }: { images?: QuestionImage[] }) {
  if (!images || images.length === 0) return null
  return (
    <div className="q-images">
      {images.map((image, index) => (
        <figure
          key={`${image.assetId}-${index}`}
          className={`q-image-figure ${image.align === 'right' ? 'is-right' : 'is-center'}`}
          style={{ width: `${image.widthPercent}%` }}
        >
          <AssetImage assetId={image.assetId} className="q-image" />
          {image.caption ? <figcaption>{image.caption}</figcaption> : null}
        </figure>
      ))}
    </div>
  )
}

/**
 * 把 $…$ 公式折算成渲染后的可见符号，避免按 LaTeX 源码长度计宽 ——
 * `$\dfrac{\pi}{2}$` 源码 14 字符但渲染只有约 2 字符宽，否则短公式选择题会被误排成 2 列。
 */
function visibleText(text: string): string {
  return text.replace(/\$([^$]*)\$/g, (_, tex: string) =>
    tex
      .replace(/\\(?:dfrac|frac|tfrac)/g, 'xx') // 分数占两字符宽
      .replace(/\\[a-zA-Z]+/g, 'x') // 其余命令占一字符宽
      .replace(/[{}^_&\s]/g, ''),
  )
}

/** 估算选项显示宽度（中文按 2、西文按 1），决定选项排 4 / 2 / 1 列 —— 高考卷惯例 */
function optionColumns(options: string[]): 1 | 2 | 4 {
  const width = (text: string) =>
    [...visibleText(text)].reduce((sum, ch) => sum + (/[⺀-꓏豈-﫿＀-￯]/.test(ch) ? 2 : 1), 0)
  const max = Math.max(0, ...options.map(width))
  if (max <= 12) return 4
  if (max <= 30) return 2
  return 1
}

function tableCells(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim())
}

function isTableLine(line: string): boolean {
  return /^\s*\|?.+\|.+\|?\s*$/.test(line)
}

function isTableDivider(line: string): boolean {
  return tableCells(line).every((cell) => /^:?-{3,}:?$/.test(cell))
}

/** 支持 Markdown 风格的 | 表头 | 单元格 |，适合从 Word 粘贴后快速整理小表格。 */
function QuestionStemText({ text }: { text: string }) {
  const lines = text.split('\n')
  const nodes: ReactNode[] = []
  for (let index = 0; index < lines.length;) {
    if (isTableLine(lines[index])) {
      const start = index
      const tableLines: string[] = []
      while (index < lines.length && isTableLine(lines[index])) {
        tableLines.push(lines[index])
        index += 1
      }
      const rows = tableLines.filter((line) => !isTableDivider(line)).map(tableCells)
      if (rows.length >= 2) {
        nodes.push(
          <table className="rich-table" key={`table-${start}`}>
            <tbody>
              {rows.map((cells, rowIndex) => (
                <tr key={rowIndex}>
                  {cells.map((cell, cellIndex) => rowIndex === 0
                    ? <th key={cellIndex}><MathText text={cell} /></th>
                    : <td key={cellIndex}><MathText text={cell} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>,
        )
        continue
      }
      tableLines.forEach((line, tableIndex) => {
        nodes.push(<span key={`line-${start + tableIndex}`} className={start + tableIndex > 0 ? 'q-stem__line' : undefined}><MathText text={line} /></span>)
      })
      continue
    }
    nodes.push(
      <span key={`line-${index}`} className={index > 0 ? 'q-stem__line' : undefined}>
        <MathText text={lines[index]} />
      </span>,
    )
    index += 1
  }
  return <>{nodes}</>
}

function QuestionActions({ questionId }: { questionId: string }) {
  const moveQuestion = usePaperStore((s) => s.moveQuestion)
  const duplicateQuestion = usePaperStore((s) => s.duplicateQuestion)
  const removeQuestion = usePaperStore((s) => s.removeQuestion)

  return (
    <div className="q-actions no-print">
      <button
        type="button"
        className="icon-button"
        title="上移"
        aria-label="上移"
        onClick={(e) => { e.stopPropagation(); moveQuestion(questionId, -1) }}
      >
        <ArrowUp size={13} />
      </button>
      <button
        type="button"
        className="icon-button"
        title="下移"
        aria-label="下移"
        onClick={(e) => { e.stopPropagation(); moveQuestion(questionId, 1) }}
      >
        <ArrowDown size={13} />
      </button>
      <button
        type="button"
        className="icon-button"
        title="复制"
        aria-label="复制"
        onClick={(e) => { e.stopPropagation(); duplicateQuestion(questionId) }}
      >
        <Copy size={13} />
      </button>
      <button
        type="button"
        className="icon-button is-danger"
        title="删除"
        aria-label="删除"
        onClick={(e) => {
          e.stopPropagation()
          if (window.confirm('删除这道题？')) removeQuestion(questionId)
        }}
      >
        <X size={13} />
      </button>
    </div>
  )
}

const MATERIAL_LABEL_PATTERN = /^材料(?:[一二三四五六七八九十\d]+)?[：:]?$/
const MATERIAL_SOURCE_PATTERN = /^[（(](?:摘编自|节选自|选自|改编自|有删改|原载于).*[）)]$/

/**
 * 材料的一行：
 * `#` 为居中标题，`@` 为居中仿宋作者行，来源说明右对齐，
 * “材料一：”等标签不缩进，其余行作为正文段落渲染。
 */
function materialLine(line: string, key: number) {
  const trimmed = line.trim()
  if (line.startsWith('#')) {
    return (
      <p key={key} className="material-title">
        <MathText text={line.slice(1).trim()} />
      </p>
    )
  }
  if (line.startsWith('@')) {
    return (
      <p key={key} className="material-author">
        <MathText text={line.slice(1).trim()} />
      </p>
    )
  }
  if (MATERIAL_SOURCE_PATTERN.test(trimmed)) {
    return (
      <p key={key} className="material-source">
        <MathText text={trimmed} />
      </p>
    )
  }
  if (MATERIAL_LABEL_PATTERN.test(trimmed)) {
    return (
      <p key={key} className="material-label">
        <MathText text={trimmed} />
      </p>
    )
  }
  return (
    <p key={key} className="material-line material-prose">
      <MathText text={line} />
    </p>
  )
}

/** 材料正文：整块渲染（诗歌等不宜拆分的材料用） */
function MaterialBody({ material }: { material: string }) {
  return <>{material.split('\n').map((line, index) => materialLine(line, index))}</>
}

function useSelectHandler(questionId: string) {
  const setSelection = usePaperStore((s) => s.setSelection)
  return (e: MouseEvent) => {
    e.stopPropagation()
    setSelection({ kind: 'question', id: questionId })
  }
}

/**
 * 只订阅"我是否被选中"这一个布尔值，而不是整个 selection ——
 * 否则点任意一题都会让全卷每一个题块重新渲染。
 */
function useIsSelectedQuestion(questionId: string) {
  return usePaperStore((s) => s.selection.kind === 'question' && s.selection.id === questionId)
}

/** 材料题的材料区整块渲染：诗歌等不宜拆分的材料走这条路 */
const MaterialLead = memo(function MaterialLead({ question }: { question: Question }) {
  const select = useSelectHandler(question.id)
  const selected = useIsSelectedQuestion(question.id)

  return (
    <div className={`q-block q-block--material ${selected ? 'is-selected' : ''}`} onClick={select}>
      <QuestionActions questionId={question.id} />
      {question.stem ? (
        <div className="q-stem">
          <MathText text={question.stem} />
        </div>
      ) : null}
      <div className={`material-block ${question.materialAlign === 'center' ? 'is-center' : ''}`}>
        {question.material ? (
          <MaterialBody material={question.material} />
        ) : (
          <p className="material-line no-print">（空材料）</p>
        )}
      </div>
      <QuestionImages images={question.images} />
      {(question.children ?? []).length === 0 ? (
        <p className="p-section__empty no-print">暂无子题</p>
      ) : null}
    </div>
  )
})

/**
 * 材料的一个自然段，自成排版块。
 * 散文类材料动辄上千字，按段切分才是自然的分页边界；
 * 整块不可分只能靠裁切兜底，那是最后手段，不该是常态。
 */
const MaterialPart = memo(function MaterialPart({
  questionId,
  showActions,
  center,
  children,
}: {
  questionId: string
  showActions?: boolean
  center?: boolean
  children: ReactNode
}) {
  const select = useSelectHandler(questionId)
  const selected = useIsSelectedQuestion(questionId)

  return (
    <div
      className={`material-part ${center ? 'is-center' : ''} ${selected ? 'is-selected' : ''}`}
      onClick={select}
    >
      {showActions ? <QuestionActions questionId={questionId} /> : null}
      {children}
    </div>
  )
})

const ClozeOptions = memo(function ClozeOptions({
  startNumber,
  question,
}: {
  startNumber: number
  question: Question
}) {
  return (
    <div className="cloze-options">
      {(question.readingBlanks ?? []).map((blank, index) => (
        <div key={blank.id} className="cloze-option-row">
          <strong>{startNumber + index}．</strong>
          {blank.options.map((option, optionIndex) => (
            <span key={optionIndex} className="cloze-option">
              {String.fromCharCode(65 + optionIndex)}．<MathText text={option} />
            </span>
          ))}
        </div>
      ))}
    </div>
  )
})

/** 题目主体：题号、分值、题干、附图、选项。答题区是独立片段，不在这里。 */
const QuestionBlock = memo(function QuestionBlock({
  question,
  number,
}: {
  question: Question
  number: number
}) {
  const select = useSelectHandler(question.id)
  const selected = useIsSelectedQuestion(question.id)

  const columns = optionColumns(question.options)
  // 靠右的图要排在题干之前，行盒才会环绕它；排在题干之后浮动起点已在文字下方，环绕无从谈起
  const floatImages = (question.images ?? []).filter((image) => image.align === 'right')
  const blockImages = (question.images ?? []).filter((image) => image.align !== 'right')

  return (
    <div className={`q-block ${selected ? 'is-selected' : ''}`} onClick={select}>
      <QuestionActions questionId={question.id} />
      <QuestionImages images={floatImages} />
      <div className="q-stem">
        <span className="q-number">{number}．</span>
        {question.type === 'calculation' ||
        question.type === 'shortAnswer' ||
        question.type === 'solution' ||
        question.type === 'composition' ? (
          <span className="q-score">（本小题满分{question.score}分）</span>
        ) : null}
        {question.stem ? (
          <QuestionStemText text={question.stem} />
        ) : question.type === 'solution' && (question.parts?.length ?? 0) > 0 ? null : (
          <span className="no-print">（空题干）</span>
        )}
        {question.type === 'segmentation' && question.segmentationText ? (
          <span className="q-stem__segmentation">
            <MathText text={question.segmentationText} />
          </span>
        ) : (
          null
        )}
      </div>

      <QuestionImages images={blockImages} />

      {question.options.length > 0 ? (
        <div className="q-options" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {question.options.map((option, index) => (
            <div key={index} className="q-option">
              <span className="q-option__label">{String.fromCharCode(65 + index)}．</span>
              <span className="q-option__text">
                <MathText text={option} />
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
})

/** 解答题的小问正文。句中 `______` 由 MathText 渲染为内嵌答题线。 */
const SolutionPartBlock = memo(function SolutionPartBlock({
  questionId,
  part,
}: {
  questionId: string
  part: SolutionPart
}) {
  const select = useSelectHandler(questionId)
  const selected = useIsSelectedQuestion(questionId)
  return (
    <div
      className={`q-solution-part ${selected ? 'is-selected' : ''}`}
      onClick={select}
    >
      <QuestionStemText text={part.stem} />
    </div>
  )
})

/** 答题横线：每条一格，等高，故可按整行切分到下一页 */
function AnswerLines({ count }: { count: number }) {
  return (
    <div className="answer-area" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <span key={index} className="answer-line" />
      ))}
    </div>
  )
}

/** 作文方格按整行分页；每行固定 20 格，避免切到半格。 */
function CompositionRows({ count, style }: { count: number; style: 'grid' | 'lines' }) {
  if (style === 'lines') return <AnswerLines count={count} />
  return (
    <div className="composition-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, row) => (
        <span key={row} className="composition-grid__row">
          {Array.from({ length: 20 }).map((__, column) => (
            <span key={column} className="composition-grid__cell" />
          ))}
        </span>
      ))}
    </div>
  )
}

const SectionTitle = memo(function SectionTitle({
  sectionId,
  index,
  text,
}: {
  sectionId: string
  index: number
  text: string
}) {
  const setSelection = usePaperStore((s) => s.setSelection)
  const selected = usePaperStore(
    (s) => s.selection.kind === 'section' && s.selection.id === sectionId,
  )

  return (
    <p
      className={`p-section__title font-hei ${selected ? 'is-selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        setSelection({ kind: 'section', id: sectionId })
      }}
    >
      {cnNumber(index + 1)}、{text}
    </p>
  )
})

/**
 * 密封线：左侧装订区，竖排考生信息 + 虚线。每一页各自渲染一条。
 * 填写空位用带边框的空元素而非全角下划线 —— 竖排下全角字符直立渲染，
 * 连排下划线会变成一列互不相连的短横段，无法竖着写名字。
 * 虚线用元素自身的 border 而非背景图：打印对话框的"背景图形"默认关闭，背景印不出来。
 */
function SealLine({ widthMm }: { widthMm: number }) {
  return (
    <div className="seal-line" aria-hidden="true" style={{ width: `${widthMm}mm` }}>
      <div className="seal-line__fields">
        {['班级', '姓名', '考号'].map((label) => (
          <span key={label} className="seal-field">
            {label}：<span className="seal-blank" />
          </span>
        ))}
      </div>
      <div className="seal-line__rule">{'⋯⋯⋯⋯　密　封　线　内　不　得　答　题　⋯⋯⋯⋯'}</div>
    </div>
  )
}

/**
 * 一个可测量、可切分的渲染片段。
 * - atom：整块测量，装不下时优先换栏，实在放不下才按行裁切
 *   - lineBreakable：文章正文例外，当前栏能放下一行就直接续排
 * - rows：等高行（答题横线），按整行切
 * - space：纯留白（数学解答区），任意高度切
 */
type RenderPiece = { gapWeight: number } & (
  | { id: string; kind: 'atom'; node: ReactNode; lineBreakable?: boolean }
  | { id: string; kind: 'rows'; count: number; render: (start: number, count: number) => ReactNode }
  | { id: string; kind: 'space'; em: number }
)

interface RenderGroup {
  id: string
  pieces: RenderPiece[]
  keepTogether?: boolean
  keepWithNext?: boolean
}

/**
 * 材料题的排版片段。散文类材料按自然段组织，但每段都是可按行续排的正文流，
 * 当前栏只要还能容纳一行就继续使用，不因保段而留下大片空白；
 * 居中排版的材料（诗歌）整体保留 —— 一首诗被切开就毁了。
 */
function materialPieces(question: Question, firstInSection: boolean): RenderPiece[] {
  const gapWeight = firstInSection ? GAP_WEIGHT.tight : GAP_WEIGHT.question
  const lines = (question.material ?? '').split('\n')
  const isPoem = question.materialAlign === 'center'

  if (isPoem || !question.material) {
    return [
      {
        id: `mat:${question.id}`,
        kind: 'atom',
        gapWeight,
        node: <MaterialLead question={question} />,
      },
    ]
  }

  const pieces: RenderPiece[] = lines.map((line, index) => ({
    id: `mat:${question.id}:${index}`,
    kind: 'atom' as const,
    lineBreakable: true,
    // 段间不该被两端对齐优先拉开，材料要读起来是连贯的一整段文字
    gapWeight: index === 0 ? gapWeight : GAP_WEIGHT.tight,
    node: (
      <MaterialPart questionId={question.id} showActions={index === 0}>
        {/* 引导语并进首段，避免它单独落在栏底 */}
        {index === 0 && question.stem ? (
          <div className="q-stem">
            <MathText text={question.stem} />
          </div>
        ) : null}
        {materialLine(line, index)}
      </MaterialPart>
    ),
  }))

  if ((question.images ?? []).length > 0) {
    pieces.push({
      id: `mat:${question.id}:img`,
      kind: 'atom',
      gapWeight: GAP_WEIGHT.tight,
      node: (
        <MaterialPart questionId={question.id}>
          <QuestionImages images={question.images} />
        </MaterialPart>
      ),
    })
  }

  return pieces
}

/** 七选五和完形填空共享文章排版，但不再把每个空渲染成普通附加小题。 */
function readingPieces(question: Question, firstInSection: boolean, startNumber: number): RenderPiece[] {
  const gapWeight = firstInSection ? GAP_WEIGHT.tight : GAP_WEIGHT.question
  const lines = (question.material ?? '').split('\n')
  const pieces: RenderPiece[] = []

  lines.forEach((line, index) => {
    pieces.push({
      id: `reading:${question.id}:${index}`,
      kind: 'atom',
      lineBreakable: true,
      gapWeight: index === 0 ? gapWeight : GAP_WEIGHT.tight,
      node: (
        <MaterialPart questionId={question.id} showActions={index === 0}>
          {index === 0 && question.stem ? (
            <div className="q-stem">
              <MathText text={question.stem} />
            </div>
          ) : null}
          {materialLine(line, index)}
        </MaterialPart>
      ),
    })
  })

  if (question.type === 'cloze' && (question.readingBlanks?.length ?? 0) > 0) {
    pieces.push({
      id: `reading:${question.id}:options`,
      kind: 'atom',
      gapWeight: GAP_WEIGHT.tight,
      node: (
        <MaterialPart questionId={question.id}>
          <ClozeOptions startNumber={startNumber} question={question} />
        </MaterialPart>
      ),
    })
  }

  return pieces
}

/** 题后答题区由语义题型决定，不再依赖全卷或单题的样式开关。 */
function answerPieces(question: Question): RenderPiece[] {
  if (question.answerLines <= 0) return []
  if (question.type === 'shortAnswer') {
    return [
      {
        id: `lines:${question.id}`,
        kind: 'rows',
        gapWeight: GAP_WEIGHT.tight, // 答题区必须紧贴题干
        count: question.answerLines,
        render: (_start, count) => <AnswerLines count={count} />,
      },
    ]
  }
  if (question.type === 'calculation') {
    return [
      {
        id: `space:${question.id}`,
        kind: 'space',
        gapWeight: GAP_WEIGHT.tight,
        em: question.answerLines * 2.2,
      },
    ]
  }
  if (question.type === 'composition') {
    return [
      {
        id: `composition:${question.id}`,
        kind: 'rows',
        gapWeight: GAP_WEIGHT.tight,
        count: question.answerLines,
        render: (_start, count) => (
          <CompositionRows count={count} style={question.compositionStyle ?? 'grid'} />
        ),
      },
    ]
  }
  return []
}

/** 解答题按小问拆分；只有 answerLines > 0 的小问才在其后追加横线。 */
function solutionPieces(question: Question): RenderPiece[] {
  if (question.type !== 'solution') return []
  return (question.parts ?? []).flatMap((part): RenderPiece[] => {
    const pieces: RenderPiece[] = [
      {
        id: `part:${question.id}:${part.id}`,
        kind: 'atom',
        gapWeight: GAP_WEIGHT.tight,
        node: <SolutionPartBlock questionId={question.id} part={part} />,
      },
    ]
    if (part.answerLines > 0) {
      pieces.push({
        id: `part-lines:${question.id}:${part.id}`,
        kind: 'rows',
        gapWeight: GAP_WEIGHT.tight,
        count: part.answerLines,
        render: (_start, count) => <AnswerLines count={count} />,
      })
    }
    return pieces
  })
}

/** 把整卷摊平成线性的分组序列；分页只认这个序列，不关心题目结构 */
function buildGroups(paper: Paper): { body: RenderGroup[]; answers: RenderGroup[] } {
  const starts = sectionStartNumbers(paper)
  const body: RenderGroup[] = []

  /** first：本大题的第一题，它与大题标题之间不该被拉开（标题向下绑定） */
  const questionGroup = (question: Question, number: number, first: boolean): RenderGroup => {
    if (isReadingQuestion(question)) {
      return {
        id: `reading:${question.id}`,
        pieces: readingPieces(question, first, number),
      }
    }
    return {
      id: `q:${question.id}`,
      keepTogether: true,
      pieces: [
        {
          id: `q:${question.id}`,
          kind: 'atom',
          gapWeight: first ? GAP_WEIGHT.tight : GAP_WEIGHT.question,
          node: <QuestionBlock question={question} number={number} />,
        },
        ...solutionPieces(question),
        ...answerPieces(question),
      ],
    }
  }

  paper.sections.forEach((section, index) => {
    const autoSummary = `本题共${sectionLeafCount(section)}小题，共${sectionScore(section)}分`
    body.push({
      id: `title:${section.id}`,
      keepWithNext: true,
      pieces: [
        {
          id: `title:${section.id}`,
          kind: 'atom',
          gapWeight: GAP_WEIGHT.section, // 大题之间、卷头与正文之间是最自然的断点
          node: (
            <SectionTitle
              sectionId={section.id}
              index={index}
              text={`${section.title}${section.description ? `：${section.description}` : `（${autoSummary}）`}`}
            />
          ),
        },
      ],
    })

    if (section.questions.length === 0) {
      body.push({
        id: `empty:${section.id}`,
        pieces: [
          {
            id: `empty:${section.id}`,
            kind: 'atom',
            gapWeight: GAP_WEIGHT.tight,
            node: <p className="p-section__empty no-print">暂无题目</p>,
          },
        ],
      })
      return
    }

    const itemNumbers = sectionItemNumbers(section, starts.get(section.id) ?? 1)
    section.questions.forEach((question, qIndex) => {
      const number = itemNumbers[qIndex]
      if (question.type === 'material') {
        const children = question.children ?? []
        body.push({
          id: `mat:${question.id}`,
          // 材料整体尽量与首个子题同页；但材料本身通常比一栏还长，
          // 这时绑定会自动放弃（见 paginate 的链长封顶），不会把整页推空
          keepWithNext: children.length > 0,
          pieces: materialPieces(question, qIndex === 0),
        })
        children.forEach((child, childIndex) => {
          body.push(questionGroup(child, number + childIndex, childIndex === 0))
        })
        return
      }
      body.push(questionGroup(question, number, qIndex === 0))
    })
  })

  const answers: RenderGroup[] = paper.sections.map((section, index) => {
    const leaves = flattenLeaves(section, starts.get(section.id) ?? 1)
    const isChoice = (leaf: FlattenedQuestion) =>
      leaf.blank !== undefined || leaf.question.type === 'single' || leaf.question.type === 'multiple'
    const choice = leaves.filter(isChoice)
    const rest = leaves.filter((leaf) => !isChoice(leaf))
    return {
      id: `ans:${section.id}`,
      pieces: [
        {
          id: `ans:${section.id}`,
          kind: 'atom',
          gapWeight: index === 0 ? GAP_WEIGHT.tight : GAP_WEIGHT.section,
          node: (
            <div className="answer-key__section">
              <p className="font-hei">
                {cnNumber(index + 1)}、{section.title}
              </p>
              {/* 选择题答案横排合并成一行，非选择题一题一段并带【答案】黑体标签 */}
              {choice.length > 0 ? (
                <p className="answer-key__row">
                  {choice.map(({ number, question, blank }) => `${number}．${blank?.answer || question.answer || '—'}`).join('　')}
                </p>
              ) : null}
              {rest.map(({ number, question }) => (
                <p key={question.id} className="answer-key__item">
                  <span className="font-hei">{number}．【答案】</span>
                  <MathText text={question.answer || '—'} />
                </p>
              ))}
            </div>
          ),
        },
      ],
    }
  })

  return { body, answers }
}

function answerSheetRows(question: Question): number {
  if (question.type === 'composition') return Math.max(question.answerLines, 12)
  if (question.type === 'solution') {
    const configured = (question.parts ?? []).reduce((sum, part) => sum + part.answerLines, 0)
    return Math.max(configured, Math.max(question.parts?.length ?? 0, 1) * 2)
  }
  if (question.type === 'shortAnswer') return Math.max(question.answerLines, 2)
  if (question.type === 'calculation') return Math.max(question.answerLines, 4)
  return 2
}

const AnswerSheetChoices = memo(function AnswerSheetChoices({
  items,
}: {
  items: FlattenedQuestion[]
}) {
  return (
    <section className="answer-sheet-choice-grid">
      {items.map(({ number, question, blank }) => {
        const optionCount = question.type === 'sevenChoice'
          ? Math.max(blank?.options.length ?? 0, 7)
          : Math.max(blank?.options.length ?? question.options.length, 4)
        return (
          <div key={`${question.id}:${blank?.id ?? 'question'}`} className="answer-sheet-choice-item">
            <strong>{number}</strong>
            {Array.from({ length: optionCount }).map((_, index) => (
              <span key={index}>○ {String.fromCharCode(65 + index)}</span>
            ))}
          </div>
        )
      })}
    </section>
  )
})

const AnswerSheetSubjective = memo(function AnswerSheetSubjective({
  number,
  question,
}: {
  number: number
  question: Question
}) {
  return (
    <p className="answer-sheet-subjective-label">
      <strong>第 {number} 题</strong>
      <span>{question.score} 分</span>
      {question.type === 'composition' ? <em>作文答题区</em> : null}
    </p>
  )
})

/** 独立答题卡与试卷正文共用分页器，保证预览、页码和打印结果一致。 */
function buildAnswerSheetGroups(paper: Paper): RenderGroup[] {
  const starts = sectionStartNumbers(paper)
  const leaves = paper.sections.flatMap((section) => flattenLeaves(section, starts.get(section.id) ?? 1))
  const isChoice = (leaf: FlattenedQuestion) =>
    leaf.blank !== undefined || leaf.question.type === 'single' || leaf.question.type === 'multiple'
  const choices = leaves.filter(isChoice)
  const subjective = leaves.filter((leaf) => !isChoice(leaf))
  const groups: RenderGroup[] = []

  if (choices.length > 0) {
    groups.push({
      id: 'answer-sheet-choice-title',
      keepWithNext: true,
      pieces: [{
        id: 'answer-sheet-choice-title',
        kind: 'atom',
        gapWeight: GAP_WEIGHT.tight,
        node: <h4 className="answer-sheet-section-title font-hei">选择题填涂区</h4>,
      }],
    })
    for (let index = 0; index < choices.length; index += 10) {
      const chunk = choices.slice(index, index + 10)
      groups.push({
        id: `answer-sheet-choice:${index}`,
        keepTogether: true,
        pieces: [{
          id: `answer-sheet-choice:${index}`,
          kind: 'atom',
          gapWeight: index === 0 ? GAP_WEIGHT.tight : GAP_WEIGHT.question,
          node: <AnswerSheetChoices items={chunk} />,
        }],
      })
    }
  }

  if (subjective.length > 0) {
    groups.push({
      id: 'answer-sheet-subjective-title',
      keepWithNext: true,
      pieces: [{
        id: 'answer-sheet-subjective-title',
        kind: 'atom',
        gapWeight: choices.length > 0 ? GAP_WEIGHT.section : GAP_WEIGHT.tight,
        node: <h4 className="answer-sheet-section-title font-hei">非选择题答题区</h4>,
      }],
    })
    subjective.forEach(({ number, question }, index) => {
      const rows = answerSheetRows(question)
      groups.push({
        id: `answer-sheet-subjective:${question.id}`,
        pieces: [
          {
            id: `answer-sheet-subjective:${question.id}`,
            kind: 'atom',
            gapWeight: index === 0 ? GAP_WEIGHT.tight : GAP_WEIGHT.question,
            node: <AnswerSheetSubjective number={number} question={question} />,
          },
          {
            id: `answer-sheet-rows:${question.id}`,
            kind: 'rows',
            gapWeight: GAP_WEIGHT.tight,
            count: rows,
            render: (_start, count) =>
              question.type === 'composition'
                ? <CompositionRows count={count} style={question.compositionStyle ?? 'grid'} />
                : <AnswerLines count={count} />,
          },
        ],
      })
    })
  }

  return groups
}

/** 测量期用来渲染片段；rows/space 型片段在测量时按全量渲染 */
function renderPieceFull(piece: RenderPiece): ReactNode {
  if (piece.kind === 'atom') return piece.node
  if (piece.kind === 'rows') return piece.render(0, piece.count)
  return <div className="answer-space" aria-hidden="true" style={{ height: `${piece.em}em` }} />
}

export function PaperCanvas() {
  const paper = usePaperStore((s) => s.paper)
  if (!paper) return null
  return <PaperPages paper={paper} />
}

function PaperPages({ paper }: { paper: Paper }) {
  // 同样只订阅布尔值：否则选中任意一题都会重渲染整个画布
  const paperSelected = usePaperStore((s) => s.selection.kind === 'paper')
  const setSelection = usePaperStore((s) => s.setSelection)
  const zoom = usePaperStore((s) => s.zoom)
  const showAnswers = usePaperStore((s) => s.showAnswers)
  const showAnswerSheet = usePaperStore((s) => s.showAnswerSheet)

  const measureRef = useRef<HTMLDivElement>(null)
  /** 分页结果与它所依据的行高一并落到同一份 state，避免两次 setState 造成级联渲染 */
  const [plan, setPlan] = useState<{ pages: PlannedPage[]; baseLineHeight: number }>({
    pages: [],
    baseLineHeight: 0,
  })
  /** 离屏测量容器里任何一块的尺寸变化都会推高它，从而触发重新分页 */
  const [contentEpoch, setContentEpoch] = useState(0)

  const geometry = useMemo(() => paperGeometry(paper.layout), [paper.layout])
  const { body, answers } = useMemo(() => buildGroups(paper), [paper])
  const answerSheet = useMemo(() => buildAnswerSheetGroups(paper), [paper])
  const pieceById = useMemo(() => {
    const map = new Map<string, RenderPiece>()
    for (const group of [...body, ...answerSheet, ...answers]) {
      for (const piece of group.pieces) map.set(piece.id, piece)
    }
    return map
  }, [body, answerSheet, answers])

  const isChinesePaper = /语文/.test(`${paper.name} ${paper.info.title}`)
  const typographyClass = `paper-type body-${paper.layout.bodyFont} size-${paper.layout.fontSize} lh-${paper.layout.lineHeight}${isChinesePaper ? ' is-chinese' : ''}`

  const paperHead = (
    <>
      <header
        className={`p-header ${paperSelected ? 'is-selected' : ''}`}
        onClick={() => setSelection({ kind: 'paper' })}
      >
        {paper.info.school ? <p className="p-header__school">{paper.info.school}</p> : null}
        <h2 className="p-header__title font-hei">
          {paper.info.title || <span className="no-print">（未填写标题）</span>}
        </h2>
        {paper.info.subtitle ? <p className="p-header__subtitle">{paper.info.subtitle}</p> : null}
        <p className="p-header__meta">
          考试时间：{paper.info.duration}分钟{'　'}满分：{paper.info.fullScore}分
        </p>
      </header>
      {paper.info.notices.filter(Boolean).length > 0 ? (
        <section className="p-notice">
          <strong className="font-hei">注意事项：</strong>
          <ol>
            {paper.info.notices.filter(Boolean).map((notice, index) => (
              <li key={index}>{notice}</li>
            ))}
          </ol>
        </section>
      ) : null}
    </>
  )

  const answerHead = <h3 className="answer-key__title font-hei">参考答案</h3>
  const answerSheetHead = (
    <header className="answer-sheet-head">
      <h3 className="font-hei">{paper.info.title || '试卷'}答题卡</h3>
      <p>
        <span>班级：＿＿＿＿＿＿</span>{' '}
        <span>姓名：＿＿＿＿＿＿</span>{' '}
        <span>考号：＿＿＿＿＿＿</span>
      </p>
    </header>
  )

  // 测量必须在浏览器绘制前完成，否则会闪一下未分页的内容
  useLayoutEffect(() => {
    const root = measureRef.current
    if (!root) return

    // 一次遍历建表：片段 id 含 ':' 与 uuid，逐个 querySelector 既慢又要依赖 CSS.escape 转义
    const measured = new Map<string, { height: number; lineHeight: number }>()
    for (const element of root.querySelectorAll<HTMLElement>('[data-piece-id]')) {
      const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight)
      measured.set(element.dataset.pieceId ?? '', {
        height: element.offsetHeight,
        lineHeight: Number.isFinite(lineHeight) ? lineHeight : 0,
      })
    }

    const heightOf = (selector: string) =>
      root.querySelector<HTMLElement>(selector)?.offsetHeight ?? 0

    const toFlow = (groups: RenderGroup[]): FlowGroup[] =>
      groups.map((group) => ({
        id: group.id,
        keepTogether: group.keepTogether,
        keepWithNext: group.keepWithNext,
        pieces: group.pieces.map((piece): FlowPiece => {
          const { height, lineHeight } = measured.get(piece.id) ?? { height: 0, lineHeight: 0 }
          const gapWeight = piece.gapWeight
          if (piece.kind === 'rows' && piece.count > 0) {
            // 各行等高，故行高由总高均分得出，切点必然落在行边界
            return {
              id: piece.id,
              height,
              gapWeight,
              rows: { height: height / piece.count, count: piece.count },
            }
          }
          if (piece.kind === 'space') {
            return { id: piece.id, height, gapWeight, divisible: true }
          }
          if (piece.kind === 'atom') {
            return { id: piece.id, height, gapWeight, lineHeight, lineBreakable: piece.lineBreakable }
          }
          return { id: piece.id, height, gapWeight, lineHeight }
        }),
      }))

    const parsedLineHeight = Number.parseFloat(getComputedStyle(root).lineHeight)
    const lineHeight = Number.isFinite(parsedLineHeight) ? parsedLineHeight : 0
    const columnHeight = mmToPx(geometry.contentHeightMm - FOOTER_MM - PAGE_SAFETY_MM)
    const shared = {
      columnCount: geometry.columnCount,
      columnHeight,
      keepTogether: paper.layout.keepQuestionTogether,
      keepWithNext: paper.layout.keepHeadingWithNext,
      justify: paper.layout.justifyPages,
      baseLineHeight: lineHeight,
    }

    const bodyPages = paginate(toFlow(body), {
      ...shared,
      bannerHeight: heightOf('[data-measure="paper-head"]'),
      banner: 'paper-head',
    })

    // 参考答案另起一页
    const answerPages = showAnswers
      ? paginate(toFlow(answers), {
          ...shared,
          bannerHeight: heightOf('[data-measure="answer-head"]'),
          banner: 'answer-head',
      })
      : []

    const answerSheetPages = showAnswerSheet
      ? paginate(toFlow(answerSheet), {
          ...shared,
          bannerHeight: heightOf('[data-measure="answer-sheet-head"]'),
          banner: 'answer-sheet-head',
        })
      : []

    setPlan({ pages: [...bodyPages, ...answerSheetPages, ...answerPages], baseLineHeight: lineHeight })
  }, [body, answerSheet, answers, geometry, showAnswerSheet, showAnswers, contentEpoch, paper.layout])

  /**
   * 测量必须由真实的 DOM 尺寸变化驱动，不能只靠 React 依赖 ——
   * 图片是异步取 Blob 再异步解码的，这两步都不改变 paper/body 等依赖，
   * 单靠依赖数组会拿着"图片加载中"时量到的小高度分页，题目该翻页却不翻。
   * ResizeObserver 同时覆盖了图片、字体、KaTeX 等一切异步影响高度的情况。
   */
  useLayoutEffect(() => {
    const root = measureRef.current
    if (!root) return
    const observer = new ResizeObserver(() => setContentEpoch((epoch) => epoch + 1))
    for (const element of root.querySelectorAll('[data-piece-id]')) observer.observe(element)
    return () => observer.disconnect()
  }, [body, answerSheet, answers, geometry])

  /** 把分页结果里的一片还原成 DOM。切开的片用 overflow:hidden + 负 margin 承接上一片。 */
  const renderSlice = (slice: PlacedSlice): ReactNode => {
    const piece = pieceById.get(slice.pieceId)
    if (!piece) return null

    if (piece.kind === 'space') {
      return <div className="answer-space" aria-hidden="true" style={{ height: slice.height }} />
    }
    if (piece.kind === 'rows') {
      return piece.render(slice.rowStart ?? 0, slice.rowCount ?? piece.count)
    }
    if (slice.offset === 0 && slice.last) return piece.node
    return (
      <div style={{ height: slice.height, overflow: 'hidden' }}>
        <div style={{ marginTop: -slice.offset }}>{piece.node}</div>
      </div>
    )
  }

  const pageStyle = {
    width: `${geometry.pageWidthMm}mm`,
    height: `${geometry.pageHeightMm}mm`,
    paddingTop: `${geometry.paddingTopMm}mm`,
    paddingRight: `${geometry.paddingRightMm}mm`,
    paddingBottom: `${geometry.paddingBottomMm}mm`,
    paddingLeft: `${geometry.paddingLeftMm}mm`,
  }

  const columnsStyle = {
    gridTemplateColumns: `repeat(${geometry.columnCount}, ${geometry.columnWidthMm}mm)`,
    columnGap: `${geometry.columnGapMm}mm`,
  }

  const { pages, baseLineHeight } = plan

  return (
    <section className="canvas-panel">
      {/* @page 只声明纸张；页边距恒为 0，由页面自身的 padding 提供，保证屏幕与打印同几何 */}
      <style>{`@page { size: ${paper.layout.pageSize === 'a3-2col' ? 'A3 landscape' : 'A4'}; margin: 0; }`}</style>

      <div className="paper-stage">
        <div className="paper-scale" style={{ zoom: zoom / 100 }}>
          {pages.map((page, pageIndex) => (
            <article
              key={pageIndex}
              className={`paper-page ${typographyClass}`}
              style={pageStyle}
            >
              {paper.layout.sealLine ? <SealLine widthMm={geometry.paddingLeftMm} /> : null}
              {page.banner ? (
                // 页眉与正文之间的间距是"灵活度 2"的那一档，两端对齐时优先被拉开
                <div style={{ marginBottom: page.bannerGap }}>
                  {page.banner === 'paper-head'
                    ? paperHead
                    : page.banner === 'answer-head'
                      ? answerHead
                      : answerSheetHead}
                </div>
              ) : null}
              <div className="page-columns" style={columnsStyle}>
                {page.columns.map((slices, columnIndex) => (
                  <div
                    className="page-column"
                    key={columnIndex}
                    style={
                      page.columnLineStretch?.[columnIndex]
                        ? { lineHeight: `${baseLineHeight + page.columnLineStretch[columnIndex]}px` }
                        : undefined
                    }
                  >
                    {slices.map((slice) => (
                      <div
                        className="p-block"
                        key={`${slice.pieceId}@${slice.offset}`}
                        style={slice.gapBefore ? { marginTop: slice.gapBefore } : undefined}
                      >
                        {renderSlice(slice)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div
                className="page-footer"
                style={{ bottom: `${geometry.paddingBottomMm}mm`, left: `${geometry.paddingLeftMm}mm`, right: `${geometry.paddingRightMm}mm` }}
              >
                {paper.info.title || '试卷'}
                {'　'}第 {pageIndex + 1} 页{'　'}共 {pages.length} 页
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* 离屏测量：与真实页面同宽、同字体，量到的高度才作数 */}
      <div ref={measureRef} className={`paper-measure ${typographyClass}`} aria-hidden="true">
        <div data-measure="paper-head" style={{ width: `${geometry.contentWidthMm}mm` }}>
          {paperHead}
        </div>
        <div data-measure="answer-head" style={{ width: `${geometry.contentWidthMm}mm` }}>
          {answerHead}
        </div>
        <div data-measure="answer-sheet-head" style={{ width: `${geometry.contentWidthMm}mm` }}>
          {answerSheetHead}
        </div>
        <div style={{ width: `${geometry.columnWidthMm}mm` }}>
          {[...body, ...answerSheet, ...answers].flatMap((group) =>
            group.pieces.map((piece) => (
              <div className="p-block" data-piece-id={piece.id} key={piece.id}>
                {renderPieceFull(piece)}
              </div>
            )),
          )}
        </div>
      </div>
    </section>
  )
}
