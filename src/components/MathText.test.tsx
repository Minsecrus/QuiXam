import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MathText } from './MathText'

describe('MathText', () => {
  it('渲染行内代码并移除反引号', () => {
    const html = renderToStaticMarkup(<MathText text="执行 `s=s+i*i` 后结束。" />)

    expect(html).toContain('<code class="code-inline">s=s+i*i</code>')
    expect(html).not.toContain('`')
  })

  it('公式、代码与普通文本可以混排', () => {
    const html = renderToStaticMarkup(<MathText text="由 $x^2$ 计算 `x*x`。" />)

    expect(html).toContain('class="katex"')
    expect(html).toContain('<code class="code-inline">x*x</code>')
    expect(html).toContain('计算')
  })

  it('把连续下划线渲染成不会断开的句中答题空位', () => {
    const html = renderToStaticMarkup(<MathText text="模板链为______，随后与核糖体结合。" />)

    expect(html).toContain('class="inline-answer-blank"')
    expect(html).not.toContain('______')
  })

  it('渲染轻量富文本和独立公式', () => {
    const html = renderToStaticMarkup(<MathText text="**重点** __下划线__ ==着重== ^2^ ~x~ $$x^2$$" />)

    expect(html).toContain('class="rich-bold"')
    expect(html).toContain('class="rich-underline"')
    expect(html).toContain('class="rich-emphasis"')
    expect(html).toContain('class="rich-sup"')
    expect(html).toContain('class="rich-sub"')
    expect(html).toContain('class="math-display"')
  })
})
