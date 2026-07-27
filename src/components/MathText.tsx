import { useMemo } from 'react'
import katex from 'katex'

type Segment = { math: boolean; value: string }

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

/** 把文本按 $...$ 切分成普通文本与公式段 */
function splitMath(text: string): Segment[] {
  const segments: Segment[] = []
  const pattern = /\$([^$]+)\$/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ math: false, value: text.slice(lastIndex, match.index) })
    }
    segments.push({ math: true, value: match[1] })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    segments.push({ math: false, value: text.slice(lastIndex) })
  }
  return segments
}

/** 渲染带 $...$ 行内公式的多行文本 */
export function MathText({ text }: { text: string }) {
  const segments = useMemo(() => splitMath(text), [text])

  return (
    <>
      {segments.map((segment, index) =>
        segment.math ? (
          <span
            key={index}
            className="math-inline"
            dangerouslySetInnerHTML={{ __html: renderMath(segment.value) }}
          />
        ) : (
          <span key={index}>{segment.value}</span>
        ),
      )}
    </>
  )
}
