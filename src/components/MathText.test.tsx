import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MathText } from './MathText'

describe('MathText', () => {
  it('renders mhchem chemical equations through the shared inline-math path', () => {
    const html = renderToStaticMarkup(
      <MathText text={'反应：$\\ce{2H2 + O2 -> 2H2O}$'} />,
    )

    expect(html).toContain('katex')
    expect(html).not.toContain('katex-error')
    expect(html).toContain('H')
    expect(html).toContain('O')
  })
})
