import { useMemo } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'

type Segment = { kind: 'text' | 'math' | 'code' | 'blank'; value: string }

/**
 * 公式 → HTML 的缓存。
 * 预分页要把整卷渲染两份（离屏测量 + 实际页面），每次编辑都重来一遍；
 * KaTeX 的 renderToString 不便宜，同一条公式反复编译会让公式多的卷子明显发卡。
 */
const htmlCache = new Map<string, string>()
const CACHE_LIMIT = 1000

function renderMath(tex: string): string {
  const cached = htmlCache.get(tex)
  if (cached !== undefined) return cached
  const html = katex.renderToString(tex, { throwOnError: false, output: 'html' })
  // 简单封顶：整卷公式数远小于此，触顶说明已换过多份试卷，整体丢弃即可
  if (htmlCache.size >= CACHE_LIMIT) htmlCache.clear()
  htmlCache.set(tex, html)
  return html
}

/** 把文本按 `$...$` 公式、单反引号行内代码和句中答题横线切分。 */
function splitRichText(text: string): Segment[] {
  const segments: Segment[] = []
  const pattern = /\$([^$]+)\$|`([^`\n]+)`|(_{3,}|＿{2,})/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: 'text', value: text.slice(lastIndex, match.index) })
    }
    segments.push({
      kind: match[1] !== undefined ? 'math' : match[2] !== undefined ? 'code' : 'blank',
      value: match[1] ?? match[2] ?? match[3],
    })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    segments.push({ kind: 'text', value: text.slice(lastIndex) })
  }
  return segments
}

/**
 * 渲染带 `$...$` 行内公式与单反引号代码的多行文本。
 * mhchem 已注册到 KaTeX，因此化学式可写成 `$\ce{2H2 + O2 -> 2H2O}$`。
 */
export function MathText({ text }: { text: string }) {
  const segments = useMemo(() => splitRichText(text), [text])

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.kind === 'math') {
          return (
          <span
            key={index}
            className="math-inline"
            dangerouslySetInnerHTML={{ __html: renderMath(segment.value) }}
          />
          )
        }
        if (segment.kind === 'code') {
          return (
            <code key={index} className="code-inline">
              {segment.value}
            </code>
          )
        }
        if (segment.kind === 'blank') {
          return (
            <span
              key={index}
              className="inline-answer-blank"
              style={{ width: `${Math.max(2.5, segment.value.length * 0.72)}em` }}
              aria-label="答题空位"
            />
          )
        }
        return <span key={index}>{segment.value}</span>
      })}
    </>
  )
}
