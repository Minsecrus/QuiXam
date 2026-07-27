import { describe, expect, it } from 'vitest'
import {
  GAP_WEIGHT,
  paginate,
  type FlowGroup,
  type FlowPiece,
  type PaginateOptions,
  type PlannedPage,
} from './paginate'

const piece = (id: string, height: number, extra: Partial<FlowPiece> = {}): FlowPiece => ({
  id,
  height,
  ...extra,
})

/** 单片段成组的便捷构造 */
const group = (id: string, height: number, extra: Partial<FlowGroup> = {}): FlowGroup => ({
  id,
  pieces: [piece(id, height)],
  ...extra,
})

const base: PaginateOptions = {
  columnCount: 1,
  columnHeight: 100,
  bannerHeight: 0,
  banner: null,
  keepTogether: true,
  keepWithNext: true,
}

const twoCol = { ...base, columnCount: 2 }

/** 每栏实际用掉的高度 */
function columnHeights(pages: PlannedPage[]): number[] {
  return pages.flatMap((page) =>
    page.columns.map((column) => column.reduce((sum, slice) => sum + slice.height, 0)),
  )
}

/** 片段被切开后，各片高度之和必须等于原高度，且偏移首尾相接 */
function assertPieceIntegrity(pages: PlannedPage[], pieces: FlowPiece[]) {
  for (const p of pieces) {
    const slices = pages.flatMap((page) => page.columns.flat()).filter((s) => s.pieceId === p.id)
    if (slices.length === 0) continue
    expect(slices.reduce((sum, s) => sum + s.height, 0)).toBeCloseTo(p.height, 5)
    let expectedOffset = 0
    for (const slice of slices) {
      expect(slice.offset).toBeCloseTo(expectedOffset, 5)
      expectedOffset += slice.height
    }
    expect(slices[slices.length - 1].last).toBe(true)
  }
}

describe('paginate — 不溢出是硬约束', () => {
  it('任何一栏都不超过容量（首页扣除页眉后亦然）', () => {
    const pages = paginate(
      [group('a', 70), group('b', 70), group('c', 70)],
      { ...base, bannerHeight: 40, banner: 'paper-head' },
    )
    const [first, ...rest] = columnHeights(pages)
    expect(first).toBeLessThanOrEqual(100 - 40)
    for (const height of rest) expect(height).toBeLessThanOrEqual(100)
  })

  it('高于整栏的空白留白被切成多片，每片都不超容量', () => {
    const pieces = [piece('space', 250, { divisible: true })]
    const pages = paginate([{ id: 'g', pieces }], base)
    for (const height of columnHeights(pages)) expect(height).toBeLessThanOrEqual(100)
    assertPieceIntegrity(pages, pieces)
  })

  it('高于整栏的答题横线按整行切，不会切在行中间', () => {
    const pieces = [piece('lines', 240, { rows: { height: 20, count: 12 } })]
    const pages = paginate([{ id: 'g', pieces }], base)
    const slices = pages.flatMap((p) => p.columns.flat())
    for (const slice of slices) {
      expect(slice.height % 20).toBe(0)
      expect(slice.rowCount).toBeGreaterThan(0)
    }
    expect(slices.reduce((sum, s) => sum + (s.rowCount ?? 0), 0)).toBe(12)
    for (const height of columnHeights(pages)) expect(height).toBeLessThanOrEqual(100)
  })

  it('不可分且高于整栏的原子被裁切，绝不溢出', () => {
    const pieces = [piece('huge', 250)]
    const pages = paginate([{ id: 'g', pieces }], base)
    for (const height of columnHeights(pages)) expect(height).toBeLessThanOrEqual(100)
    const slices = pages.flatMap((p) => p.columns.flat())
    expect(slices.length).toBeGreaterThan(1)
    expect(slices.slice(0, -1).every((s) => s.clipped)).toBe(true)
    assertPieceIntegrity(pages, pieces)
  })

  it('裁切点吸附到行高，避免切穿字形', () => {
    const pieces = [piece('huge', 250, { lineHeight: 30 })]
    const pages = paginate([{ id: 'g', pieces }], base)
    const slices = pages.flatMap((p) => p.columns.flat())
    // 非末片的高度应是行高的整数倍
    for (const slice of slices.slice(0, -1)) expect(slice.height % 30).toBe(0)
    for (const height of columnHeights(pages)) expect(height).toBeLessThanOrEqual(100)
  })

  it('文章材料利用当前栏剩余空间，按行边界随处换页', () => {
    const article = piece('article', 80, { lineHeight: 10, lineBreakable: true })
    const pages = paginate([group('filler', 70), { id: 'material', pieces: [article] }], base)
    const slices = pages.flatMap((page) => page.columns.flat()).filter((slice) => slice.pieceId === 'article')

    expect(slices.map((slice) => slice.height)).toEqual([30, 50])
    expect(slices.map((slice) => slice.offset)).toEqual([0, 30])
    expect(pages[0].columns[0].map((slice) => slice.pieceId)).toEqual(['filler', 'article'])
    assertPieceIntegrity(pages, [article])
  })

  it('文章材料剩余空间不足一行时换栏，不切穿文字', () => {
    const article = piece('article', 20, { lineHeight: 10, lineBreakable: true })
    const pages = paginate([group('filler', 95), { id: 'material', pieces: [article] }], base)

    expect(pages[0].columns[0].map((slice) => slice.pieceId)).toEqual(['filler'])
    expect(pages[1].columns[0].map((slice) => slice.pieceId)).toEqual(['article'])
  })

  it('随机高度的大量片段，任何一栏都不溢出且顺序不乱', () => {
    const heights = [17, 240, 33, 96, 5, 150, 61, 28, 99, 200, 12, 74]
    const groups = heights.map((h, i) => group(`g${i}`, h))
    const pages = paginate(groups, base)
    for (const height of columnHeights(pages)) expect(height).toBeLessThanOrEqual(100)
    const order = pages.flatMap((p) => p.columns.flat()).map((s) => s.pieceId)
    // 同一片段的多片相邻，去重后应与输入顺序一致
    const deduped = order.filter((id, i) => id !== order[i - 1])
    expect(deduped).toEqual(groups.map((g) => g.id))
  })
})

describe('paginate — 页与栏的分配', () => {
  it('装得下就只有一页', () => {
    const pages = paginate([group('a', 30), group('b', 30)], base)
    expect(pages).toHaveLength(1)
    expect(pages[0].columns[0].map((s) => s.pieceId)).toEqual(['a', 'b'])
  })

  it('通栏页眉只占首页', () => {
    const pages = paginate([group('a', 40), group('b', 40)], {
      ...base,
      bannerHeight: 70,
      banner: 'paper-head',
    })
    expect(pages[0].banner).toBe('paper-head')
    expect(pages[1].banner).toBeNull()
  })

  it('通栏页眉从首页每一栏扣除相同容量', () => {
    const pages = paginate(
      [group('a', 50), group('b', 90), group('c', 50)],
      { ...twoCol, bannerHeight: 40, banner: 'paper-head' },
    )

    for (const column of pages[0].columns) {
      expect(column.reduce((sum, slice) => sum + slice.height, 0)).toBeLessThanOrEqual(60)
    }
  })

  it('两栏：先填满左栏再填右栏，满了才开新页', () => {
    const pages = paginate([group('a', 60), group('b', 60), group('c', 60)], twoCol)
    expect(pages).toHaveLength(2)
    expect(pages[0].columns.map((c) => c.map((s) => s.pieceId))).toEqual([['a'], ['b']])
    expect(pages[1].columns.map((c) => c.map((s) => s.pieceId))).toEqual([['c'], []])
  })

  it('每页栏数恒定，未用满的栏是空数组', () => {
    const pages = paginate([group('a', 10)], twoCol)
    expect(pages[0].columns).toHaveLength(2)
    expect(pages[0].columns[1]).toEqual([])
  })

  it('空输入返回一张空页', () => {
    const pages = paginate([], base)
    expect(pages).toHaveLength(1)
    expect(pages[0].columns[0]).toEqual([])
  })

  it('空组被跳过，不产生空片', () => {
    const pages = paginate([{ id: 'empty', pieces: [] }, group('a', 10)], base)
    expect(pages[0].columns[0].map((s) => s.pieceId)).toEqual(['a'])
  })
})

describe('paginate — 两端对齐（自然撑满整页）', () => {
  const justified: PaginateOptions = { ...base, justify: true, baseLineHeight: 20 }

  /** 一栏内所有间隙拉伸之和 */
  const stretchOf = (page: PlannedPage, column = 0) =>
    page.columns[column].reduce((sum, slice) => sum + (slice.gapBefore ?? 0), 0)

  it('末页不拉伸，保持自然收尾', () => {
    const pages = paginate([group('a', 60), group('b', 60), group('c', 10)], justified)
    expect(stretchOf(pages[pages.length - 1])).toBe(0)
  })

  it('非末页把剩余空间摊到间隙上', () => {
    const groups = [
      { ...group('a', 20), pieces: [piece('a', 20, { gapWeight: GAP_WEIGHT.question })] },
      { ...group('b', 20), pieces: [piece('b', 20, { gapWeight: GAP_WEIGHT.question })] },
      { ...group('c', 90), pieces: [piece('c', 90, { gapWeight: GAP_WEIGHT.question })] },
    ]
    const pages = paginate(groups, justified)
    expect(pages.length).toBeGreaterThan(1)
    expect(stretchOf(pages[0])).toBeGreaterThan(0)
  })

  it('拉伸后仍不超过容量', () => {
    const groups = [
      { ...group('a', 20), pieces: [piece('a', 20, { gapWeight: GAP_WEIGHT.section })] },
      { ...group('b', 20), pieces: [piece('b', 20, { gapWeight: GAP_WEIGHT.question })] },
      { ...group('c', 90), pieces: [piece('c', 90, { gapWeight: GAP_WEIGHT.question })] },
    ]
    const pages = paginate(groups, justified)
    for (const page of pages) {
      for (const column of page.columns) {
        const total = column.reduce((sum, s) => sum + s.height + (s.gapBefore ?? 0), 0)
        expect(total).toBeLessThanOrEqual(page.columnCapacity + 0.01)
      }
    }
  })

  it('灵活度高的间隙分到更多空间', () => {
    const groups = [
      { ...group('a', 10), pieces: [piece('a', 10, { gapWeight: GAP_WEIGHT.question })] },
      { ...group('big', 10), pieces: [piece('big', 10, { gapWeight: GAP_WEIGHT.section })] },
      { ...group('small', 10), pieces: [piece('small', 10, { gapWeight: GAP_WEIGHT.question })] },
      { ...group('c', 95), pieces: [piece('c', 95, { gapWeight: GAP_WEIGHT.question })] },
    ]
    const pages = paginate(groups, { ...justified, baseLineHeight: 200 })
    const byId = new Map(pages[0].columns[0].map((s) => [s.pieceId, s.gapBefore ?? 0]))
    expect(byId.get('big')).toBeGreaterThan(byId.get('small') ?? 0)
    // 权重 2 : 1，故应约为两倍
    expect(byId.get('big')).toBeCloseTo((byId.get('small') ?? 0) * 2, 1)
  })

  it('灵活度 0 的间隙在正权重吃满上限后仍会被拉开', () => {
    // 上限 = baseLineHeight*3 = 3；正权重间隙远不够消化剩余空间。
    // c 必须挤到第二页，否则首页即末页、按设计本就不拉伸
    const groups = [
      { ...group('a', 10), pieces: [piece('a', 10, { gapWeight: GAP_WEIGHT.question })] },
      { ...group('tight', 10), pieces: [piece('tight', 10, { gapWeight: GAP_WEIGHT.tight })] },
      { ...group('c', 95), pieces: [piece('c', 95, { gapWeight: GAP_WEIGHT.question })] },
    ]
    const pages = paginate(groups, { ...justified, baseLineHeight: 1 })
    const tight = pages[0].columns[0].find((s) => s.pieceId === 'tight')
    expect(tight?.gapBefore ?? 0).toBeGreaterThan(0)
  })

  it('间隙全部吃满后余量转给行距', () => {
    const groups = [
      { ...group('a', 10), pieces: [piece('a', 10, { gapWeight: GAP_WEIGHT.question, lineHeight: 1 })] },
      { ...group('b', 10), pieces: [piece('b', 10, { gapWeight: GAP_WEIGHT.question, lineHeight: 1 })] },
      { ...group('c', 95), pieces: [piece('c', 95, { gapWeight: GAP_WEIGHT.question })] },
    ]
    const pages = paginate(groups, { ...justified, baseLineHeight: 1 })
    expect(pages[0].columnLineStretch?.[0] ?? 0).toBeGreaterThan(0)
  })

  it('关闭后完全不拉伸', () => {
    const pages = paginate([group('a', 20), group('b', 20), group('c', 90)], {
      ...justified,
      justify: false,
    })
    expect(stretchOf(pages[0])).toBe(0)
    expect(pages[0].columnLineStretch).toBeUndefined()
  })

  it('页眉与正文之间的间距被优先拉开', () => {
    const groups = [
      { ...group('a', 20), pieces: [piece('a', 20, { gapWeight: GAP_WEIGHT.section })] },
      { ...group('c', 90), pieces: [piece('c', 90, { gapWeight: GAP_WEIGHT.question })] },
    ]
    const pages = paginate(groups, { ...justified, bannerHeight: 10, banner: 'paper-head' })
    expect(pages[0].bannerGap ?? 0).toBeGreaterThan(0)
  })
})

describe('paginate — keepTogether 与 keepWithNext 是偏好而非铁律', () => {
  it('keepTogether 开启时整题优先不跨栏', () => {
    const pieces = [piece('stem', 20), piece('opts', 40)]
    const pages = paginate([group('filler', 60), { id: 'q', pieces, keepTogether: true }], base)
    expect(pages[0].columns[0].map((s) => s.pieceId)).toEqual(['filler'])
    expect(pages[1].columns[0].map((s) => s.pieceId)).toEqual(['stem', 'opts'])
  })

  it('keepTogether 关闭时整题被紧凑切开，不浪费版面', () => {
    const pieces = [piece('stem', 20), piece('opts', 40)]
    const pages = paginate([group('filler', 60), { id: 'q', pieces, keepTogether: true }], {
      ...base,
      keepTogether: false,
    })
    expect(pages[0].columns[0].map((s) => s.pieceId)).toEqual(['filler', 'stem'])
    expect(pages[1].columns[0].map((s) => s.pieceId)).toEqual(['opts'])
  })

  it('整题高于一整栏时，即便 keepTogether 也必须切开', () => {
    const pieces = [piece('stem', 60), piece('space', 120, { divisible: true })]
    const pages = paginate([{ id: 'q', pieces, keepTogether: true }], base)
    for (const height of columnHeights(pages)) expect(height).toBeLessThanOrEqual(100)
    assertPieceIntegrity(pages, pieces)
  })

  it('keepWithNext 把大题标题与首题一起挪到下一栏', () => {
    const pages = paginate(
      [group('filler', 50), group('title', 10, { keepWithNext: true }), group('q1', 50)],
      base,
    )
    expect(pages[0].columns[0].map((s) => s.pieceId)).toEqual(['filler'])
    expect(pages[1].columns[0].map((s) => s.pieceId)).toEqual(['title', 'q1'])
  })

  it('keepWithNext 关闭时标题可以留在栏底', () => {
    const pages = paginate(
      [group('filler', 50), group('title', 10, { keepWithNext: true }), group('q1', 50)],
      { ...base, keepWithNext: false },
    )
    expect(pages[0].columns[0].map((s) => s.pieceId)).toEqual(['filler', 'title'])
    expect(pages[1].columns[0].map((s) => s.pieceId)).toEqual(['q1'])
  })

  it('绑定链沿链前瞻：标题→材料→子题一起挪，链头不会独自留在栏底', () => {
    const pages = paginate(
      [
        group('filler', 50),
        group('title', 10, { keepWithNext: true }),
        group('material', 10, { keepWithNext: true }),
        group('child', 40),
      ],
      base,
    )
    expect(pages[0].columns[0].map((s) => s.pieceId)).toEqual(['filler'])
    expect(pages[1].columns[0].map((s) => s.pieceId)).toEqual(['title', 'material', 'child'])
  })

  it('绑定链高于一整栏时不强求，否则会无限推页', () => {
    const pages = paginate(
      [
        group('filler', 50),
        group('title', 10, { keepWithNext: true }),
        group('material', 10, { keepWithNext: true }),
        group('child', 95),
      ],
      base,
    )
    // 整条链 115 > 100，放弃绑定，标题与材料留在首栏
    expect(pages[0].columns[0].map((s) => s.pieceId)).toEqual(['filler', 'title', 'material'])
  })

  it('序列末尾的 keepWithNext 不越界', () => {
    const pages = paginate([group('a', 30), group('title', 10, { keepWithNext: true })], base)
    expect(pages[0].columns[0].map((s) => s.pieceId)).toEqual(['a', 'title'])
  })
})
