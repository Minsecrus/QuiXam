import { useMemo } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'

type Segment = {
  kind: 'text' | 'math' | 'displayMath' | 'code' | 'blank' | 'bold' | 'underline' | 'emphasis' | 'sup' | 'sub'
  value: string
}

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

/**
 * 轻量富文本约定：`$...$` 行内公式，`$$...$$` 独立公式，`**加粗**`，
 * `__下划线__`，`==着重==`，`^上标^`，`~下标~`，以及行内代码和答题空位。
 */
function splitRichText(text: string): Segment[] {
  const segments: Segment[] = []
  const pattern = /\$\$([\s\S]+?)\$\$|\$([^$]+)\$|`([^`\n]+)`|(_{3,}|＿{2,})|\*\*([^*\n]+)\*\*|__([^_\n]+)__|==([^=\n]+)==|\^([^^\n]+)\^|~([^~\n]+)~/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: 'text', value: text.slice(lastIndex, match.index) })
    }
    const kind: Segment['kind'] =
      match[1] !== undefined ? 'displayMath'
        : match[2] !== undefined ? 'math'
          : match[3] !== undefined ? 'code'
            : match[4] !== undefined ? 'blank'
              : match[5] !== undefined ? 'bold'
                : match[6] !== undefined ? 'underline'
                  : match[7] !== undefined ? 'emphasis'
                    : match[8] !== undefined ? 'sup'
                      : match[9] !== undefined ? 'sub'
                        : 'text'
    segments.push({
      kind,
      value: match[1] ?? match[2] ?? match[3] ?? match[4] ?? match[5] ?? match[6] ?? match[7] ?? match[8] ?? match[9] ?? '',
    })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    segments.push({ kind: 'text', value: text.slice(lastIndex) })
  }
  return segments
}

/**
 * 渲染带轻量富文本、公式与句中答题横线的多行文本。
 * mhchem 已注册到 KaTeX，因此化学式可写成 `$\ce{2H2 + O2 -> 2H2O}$`。
 */
export function MathText({ text }: { text: string }) {
  const segments = useMemo(() => splitRichText(text), [text])

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.kind === 'math' || segment.kind === 'displayMath') {
          return (
          <span
            key={index}
            className={segment.kind === 'displayMath' ? 'math-display' : 'math-inline'}
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
        if (segment.kind === 'bold') return <strong key={index} className="rich-bold">{segment.value}</strong>
        if (segment.kind === 'underline') return <span key={index} className="rich-underline">{segment.value}</span>
        if (segment.kind === 'emphasis') return <span key={index} className="rich-emphasis">{segment.value}</span>
        if (segment.kind === 'sup') return <sup key={index} className="rich-sup">{segment.value}</sup>
        if (segment.kind === 'sub') return <sub key={index} className="rich-sub">{segment.value}</sub>
        return <span key={index}>{segment.value}</span>
      })}
    </>
  )
}
