/**
 * 一个可排版的片段。
 *
 * 分页的第一原则是**绝不溢出**：装不下就必须切分或换页，任何情况下内容都不能越过页边。
 * 为此片段按可切分程度分三类，优先用语义边界切，切不动才裁切。
 */
/**
 * 间隙的"灵活度"：竖排两端对齐时，页面剩余空间优先摊到灵活度高的间隙上。
 *
 * 灵活度 0 不是"不能拉"，而是"最后才拉"——正权重的间隙按比例吃满各自上限后，
 * 余量仍会落到 0 权重间隙；正文行距不参与撑页。
 */
export const GAP_WEIGHT = {
  /** 题内（题干↔选项↔答题区）、大题标题与其首题之间：标题向下绑定，最后才拉 */
  tight: 0,
  /** 小题之间 */
  question: 1,
  /** 大题之间、卷头与正文之间：最自然的断点 */
  section: 2,
} as const

export interface FlowPiece {
  id: string
  /** 实测高度（px），含外边距 */
  height: number
  /** 可在任意高度处切开（解答题的空白留白） */
  divisible?: boolean
  /** 正文流，可利用当前栏的剩余空间按文本行切开（语文/英语文章材料） */
  lineBreakable?: boolean
  /** 可按整行切开（答题横线） */
  rows?: { height: number; count: number }
  /** 该片段的行高（px），裁切兜底时用来把切点吸附到行间，避免切穿字形 */
  lineHeight?: number
  /** 本片段之前那个间隙的灵活度，见 GAP_WEIGHT */
  gapWeight?: number
}

/** 一组片段，通常对应一道题；组内可切，组是否尽量整体不跨页由 keepTogether 决定 */
export interface FlowGroup {
  id: string
  pieces: FlowPiece[]
  /** 尽量整组同页同栏；装不下整栏时仍会被切开 */
  keepTogether?: boolean
  /** 尽量与下一组同页同栏（大题标题不落单） */
  keepWithNext?: boolean
}

/** 片段落在某一栏里的一片 */
export interface PlacedSlice {
  pieceId: string
  /** 距片段顶部的偏移（px）；>0 表示这是续片 */
  offset: number
  /** 本片占用的高度（px） */
  height: number
  /** 是否是该片段的最后一片 */
  last: boolean
  /** rows 型片段：本片承载的行区间 */
  rowStart?: number
  rowCount?: number
  /** 需要用 overflow:hidden 裁切渲染（不可分原子被强行切开） */
  clipped?: boolean
  /** 本片之前那个间隙的灵活度；续片恒为 0（它与上一片是同一内容，不该被拉开） */
  gapWeight: number
  /** 两端对齐后本片额外增加的上间距（px） */
  gapBefore?: number
  /**
   * 估计的文本行数，用于行距这一档的分配。
   * 用"高度 ÷ 行高"估，只会高估（含图片、留白的块尤甚），
   * 因此算出的行距增量必然偏小，实际增长不会超过剩余空间 —— 不溢出这条硬约束不受影响。
   */
  estLines: number
}

export interface PlannedPage {
  /** 通栏页眉：首页卷头，或答案页标题 */
  banner: 'paper-head' | 'answer-head' | null
  /** 每栏的片列表，长度恒等于 columnCount */
  columns: PlacedSlice[][]
  /** 本页每栏的可用高度（px）；首页扣掉了页眉 */
  columnCapacity: number
  /** 两端对齐后页眉与正文之间额外增加的间距（px）；页眉横跨各栏，故这一份是共享的 */
  bannerGap?: number
  /** 两端对齐后各栏额外增加的行距（px），下标与 columns 对应 */
  columnLineStretch?: number[]
}

export interface PaginateOptions {
  columnCount: number
  /** 单栏可用高度（px） */
  columnHeight: number
  /** 首页通栏页眉高度（px），从首页各栏容量中扣除 */
  bannerHeight: number
  banner: PlannedPage['banner']
  /** 关闭后连"尽量"都不做，一律按片段顺序紧凑排布 */
  keepTogether?: boolean
  keepWithNext?: boolean
  /** 自然拉伸撑满整页（末页不生效） */
  justify?: boolean
  /** 正文行高（px），用于推算各档拉伸的上限 */
  baseLineHeight?: number
}

/** 切出的片小于这个高度就不值得切（约一行），宁可整片换栏 */
const MIN_SLICE_PX = 24

/**
 * 把片段序列铺进"页 × 栏"。
 *
 * 之所以自己分页而不依赖 CSS 分页/多栏：CSS 多栏在打印时才切成"N 页 × 2 栏"，
 * 屏幕上却是两根等高长柱，阅读顺序与打印稿对不上；且绝对定位的密封线无法逐页重复。
 * 显式分配后，屏幕上看到的每一页就是打印出来的每一页。
 */
export function paginate(groups: FlowGroup[], options: PaginateOptions): PlannedPage[] {
  const { columnCount, bannerHeight, banner } = options
  // 页眉比整栏还高属于配置异常，兜一个正数容量，否则下面的推进循环无法收敛
  const columnHeight = Math.max(options.columnHeight, MIN_SLICE_PX)
  const pages: PlannedPage[] = []

  const emptyPage = (pageBanner: PlannedPage['banner'], pageCapacity: number): PlannedPage => ({
    banner: pageBanner,
    columns: Array.from({ length: columnCount }, () => []),
    columnCapacity: pageCapacity,
  })

  let capacity = Math.max(columnHeight - bannerHeight, MIN_SLICE_PX)
  let page = emptyPage(banner, capacity)
  let columnIndex = 0
  let used = 0

  const nextColumn = () => {
    columnIndex += 1
    if (columnIndex >= columnCount) {
      pages.push(page)
      page = emptyPage(null, columnHeight)
      columnIndex = 0
    }
    // 通栏页眉横跨首页的所有栏；只从左栏切到右栏时仍须使用首页扣减后的容量。
    capacity = page.columnCapacity
    used = 0
  }

  const push = (slice: PlacedSlice) => {
    page.columns[columnIndex].push(slice)
    used += slice.height
  }

  const groupHeight = (group: FlowGroup) =>
    group.pieces.reduce((sum, piece) => sum + piece.height, 0)

  /** 把一个片段铺进去，必要时切成多片；返回时该片段已全部安置 */
  const placePiece = (piece: FlowPiece) => {
    let offset = 0
    let rowStart = 0
    // 续片与上一片是同一内容，两端对齐时不能被拉开
    const gapWeight = () => (offset === 0 ? (piece.gapWeight ?? 0) : 0)
    // 只有随行距变化的文本块参与行距档；答题横线与留白是定高的，不会因行距变高
    const lines = (height: number) =>
      piece.rows || piece.divisible || !piece.lineHeight ? 0 : height / piece.lineHeight

    // 每轮至少推进 MIN_SLICE_PX 或整片，故必然收敛
    for (;;) {
      const rest = piece.height - offset
      const remaining = capacity - used

      if (rest <= remaining) {
        push({
          pieceId: piece.id,
          offset,
          height: rest,
          last: true,
          gapWeight: gapWeight(),
          estLines: lines(rest),
          clipped: offset > 0,
          ...(piece.rows ? { rowStart, rowCount: piece.rows.count - rowStart } : {}),
        })
        return
      }

      // 按整行切：优先，切点天然落在行间
      if (piece.rows && piece.rows.height > 0) {
        const fit = Math.floor(remaining / piece.rows.height)
        if (fit >= 1) {
          const height = fit * piece.rows.height
          push({
            pieceId: piece.id,
            offset,
            height,
            last: false,
            gapWeight: gapWeight(),
            estLines: 0,
            rowStart,
            rowCount: fit,
          })
          offset += height
          rowStart += fit
          nextColumn()
          continue
        }
      }

      // 任意高度切：空白留白，切在哪里都一样
      if (piece.divisible && remaining >= MIN_SLICE_PX) {
        push({
          pieceId: piece.id,
          offset,
          height: remaining,
          last: false,
          gapWeight: gapWeight(),
          estLines: 0,
        })
        offset += remaining
        nextColumn()
        continue
      }

      // 文章材料是连续正文流：当前栏只要还能容纳一行，就在行边界切开，
      // 不为保住整个自然段而提前换栏。诗歌等不可拆内容不会带此标记。
      if (piece.lineBreakable) {
        const line = piece.lineHeight && piece.lineHeight > 0 ? piece.lineHeight : 0
        const height = line > 0
          ? Math.floor(remaining / line) * line
          : remaining >= MIN_SLICE_PX
            ? remaining
            : 0
        if (height > 0) {
          push({
            pieceId: piece.id,
            offset,
            height: Math.min(height, rest),
            last: false,
            gapWeight: gapWeight(),
            estLines: lines(Math.min(height, rest)),
            clipped: true,
          })
          offset += Math.min(height, rest)
          nextColumn()
          continue
        }
      }

      // 换一栏重试：整片在空栏里放得下就不必裁切
      if (used > 0) {
        nextColumn()
        continue
      }

      // 空栏仍放不下的不可分原子：只能裁切，切点吸附到行间以免切穿字形
      const line = piece.lineHeight && piece.lineHeight > 0 ? piece.lineHeight : 0
      const snapped = line > 0 ? Math.floor(remaining / line) * line : remaining
      // 异常配置下整栏可能比一行还矮；此时“不溢出”优先，只能按剩余高度裁切。
      const height = Math.min(snapped > 0 ? snapped : remaining, rest, remaining)
      push({
        pieceId: piece.id,
        offset,
        height,
        last: false,
        gapWeight: gapWeight(),
        estLines: lines(height),
        clipped: true,
      })
      offset += height
      nextColumn()
    }
  }

  for (let i = 0; i < groups.length; i += 1) {
    const group = groups[i]
    if (group.pieces.length === 0) continue

    const total = groupHeight(group)

    // 绑定链：标题→材料→首个子题可能层层相连，只看下一组会让链头独自留在栏底。
    // 沿链累加到第一个不再绑定的组为止；整条链高于一整栏时不强求，否则会无限推页。
    if (options.keepWithNext && group.keepWithNext) {
      let needed = 0
      for (let j = i; j < groups.length; j += 1) {
        needed += groupHeight(groups[j])
        if (!groups[j].keepWithNext) break
      }
      if (needed <= columnHeight && used > 0 && used + needed > capacity) nextColumn()
    }

    // 整组优先：装得下就整组放，装不下则退回逐片切
    if (options.keepTogether && group.keepTogether && total <= columnHeight) {
      if (used > 0 && used + total > capacity) nextColumn()
      // 换栏后仍要对着**当前**容量复核：首页扣掉页眉后容量小于整栏高，
      // 若只比 columnHeight 就放行，整组会被硬塞进首页而溢出。
      if (used + total <= capacity) {
        for (const piece of group.pieces) {
          push({
            pieceId: piece.id,
            offset: 0,
            height: piece.height,
            last: true,
            gapWeight: piece.gapWeight ?? 0,
            estLines:
              piece.rows || piece.divisible || !piece.lineHeight ? 0 : piece.height / piece.lineHeight,
          })
        }
        continue
      }
    }

    for (const piece of group.pieces) placePiece(piece)
  }

  pages.push(page)

  if (options.justify) {
    justifyPages(pages, options.baseLineHeight ?? 0)
  }
  return pages
}

/** 正权重间隙的单个上限：约三行高 */
const MAX_GAP_LINES = 3
/** 0 权重间隙的单个上限：约半行高，它们本就该紧贴 */
const MAX_TIGHT_GAP_LINES = 0.5
/** 行距不参与撑页，避免正文在内容较少的页面被二次拉松 */
const MAX_LINE_STRETCH_RATIO = 0
/** 页眉与正文之间最多吃掉共享余量的比例 */
const MAX_BANNER_SHARE = 0.4

/**
 * 竖排两端对齐：把剩余空间按灵活度分级摊出去，让版面自然撑满整页。
 *
 * 分三档注水，前一档吃满上限后余量才落到下一档：
 *   1. 正权重间隙（大题之间 2、小题之间 1）按权重比例分
 *   2. 0 权重间隙（题内、大题标题与其首题）—— 灵活度 0 是"最后才拉"，不是"不能拉"
 *   3. 仍有余量就留在页底
 *
 * 末页不参与 —— 卷子的最后一页本就该自然收尾，硬撑满反而不像话。
 * 每档都有单项上限：否则一页只有两道题时，剩余空间会全摊到一个间隙上，
 * 拉出十几厘米的空当，比底部留白更难看。
 */
function justifyPages(pages: PlannedPage[], baseLineHeight: number) {
  const line = baseLineHeight > 0 ? baseLineHeight : 0
  const maxGap = line > 0 ? line * MAX_GAP_LINES : Number.POSITIVE_INFINITY
  const maxTightGap = line > 0 ? line * MAX_TIGHT_GAP_LINES : 0

  /** 在一组间隙上按权重注水，返回实际消耗量 */
  const pour = (slices: PlacedSlice[], budget: number, cap: number, weightOf: (s: PlacedSlice) => number) => {
    let slack = budget
    let pending = slices.filter((slice) => weightOf(slice) > 0)
    while (slack > 0.5 && pending.length > 0) {
      const totalWeight = pending.reduce((sum, slice) => sum + weightOf(slice), 0)
      if (totalWeight <= 0) break
      const share = slack
      let consumed = 0
      const next: PlacedSlice[] = []
      for (const slice of pending) {
        const want = (share * weightOf(slice)) / totalWeight
        const room = cap - (slice.gapBefore ?? 0)
        const add = Math.max(Math.min(want, room), 0)
        slice.gapBefore = (slice.gapBefore ?? 0) + add
        consumed += add
        // 没吃满说明已触顶，下一轮不再参与，把余量让给别人
        if (add >= want - 0.01) next.push(slice)
      }
      if (consumed <= 0.5) break
      slack -= consumed
      pending = next
    }
    return budget - slack
  }

  for (const page of pages.slice(0, -1)) {
    const slack = page.columns.map(
      (column) => page.columnCapacity - column.reduce((sum, slice) => sum + slice.height, 0),
    )

    // 页眉横跨各栏，拉开它会同时吃掉每一栏的余量，故只能动各栏中最少的那份
    if (page.banner) {
      const shared = Math.max(Math.min(...slack), 0)
      const bannerGap = Math.min(shared * MAX_BANNER_SHARE, maxGap)
      if (bannerGap > 0.5) {
        page.bannerGap = bannerGap
        for (let i = 0; i < slack.length; i += 1) slack[i] -= bannerGap
      }
    }

    const lineStretch = page.columns.map(() => 0)

    page.columns.forEach((column, index) => {
      // 首片之上是页顶或页眉，其间距已由 bannerGap 处理，不再参与
      const gaps = column.slice(1)
      let remaining = slack[index]
      if (remaining <= 0.5 || gaps.length === 0) return

      remaining -= pour(gaps, remaining, maxGap, (slice) => slice.gapWeight)
      if (remaining > 0.5 && maxTightGap > 0) {
        remaining -= pour(gaps, remaining, maxTightGap, (slice) => (slice.gapWeight === 0 ? 1 : 0))
      }

      // 保留计算支路便于以后按需恢复；当前比例为 0，正文行距始终保持用户选择值。
      if (remaining > 0.5 && line > 0 && MAX_LINE_STRETCH_RATIO > 0) {
        const totalLines = column.reduce((sum, slice) => sum + slice.estLines, 0)
        if (totalLines > 0) {
          lineStretch[index] = Math.min(remaining / totalLines, line * MAX_LINE_STRETCH_RATIO)
        }
      }
    })

    if (lineStretch.some((value) => value > 0)) page.columnLineStretch = lineStretch
  }
}
