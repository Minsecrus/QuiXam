import type { PaperLayout } from '../types'

/** CSS 参考像素与毫米的换算（CSS 规定 1in = 96px = 25.4mm） */
export const PX_PER_MM = 96 / 25.4

export const PAGE_PADDING_Y_MM = 15
export const PAGE_PADDING_X_MM = 13
/** 密封线装订区总宽（25–30mm 是装订惯例） */
export const SEAL_GUTTER_MM = 26
export const COLUMN_GAP_MM = 14
/**
 * 每列容量在名义高度上留出的余量。测量值是浮点，累加后若与容量正好相等，
 * 浏览器的亚像素舍入可能让最后一块溢出到下一页，进而多印一张几乎空白的纸。
 */
export const PAGE_SAFETY_MM = 2

export interface PaperGeometry {
  pageWidthMm: number
  pageHeightMm: number
  paddingTopMm: number
  paddingRightMm: number
  paddingBottomMm: number
  paddingLeftMm: number
  /** 版心宽（通栏，如卷头） */
  contentWidthMm: number
  /** 版心高，即一页可容纳的内容高度 */
  contentHeightMm: number
  columnCount: number
  columnGapMm: number
  /** 单栏宽；单栏版式下等于 contentWidthMm */
  columnWidthMm: number
}

/** 由排版配置推出纸面几何。屏幕与打印共用这一组数值。 */
export function paperGeometry(layout: PaperLayout): PaperGeometry {
  const twoColumn = layout.pageSize === 'a3-2col'
  // A4 纵向与 A3 横向的页高同为 297mm
  const pageWidthMm = twoColumn ? 420 : 210
  const pageHeightMm = 297
  const paddingLeftMm = layout.sealLine ? SEAL_GUTTER_MM : PAGE_PADDING_X_MM
  const contentWidthMm = pageWidthMm - paddingLeftMm - PAGE_PADDING_X_MM
  const columnCount = twoColumn ? 2 : 1
  const columnGapMm = twoColumn ? COLUMN_GAP_MM : 0

  return {
    pageWidthMm,
    pageHeightMm,
    paddingTopMm: PAGE_PADDING_Y_MM,
    paddingRightMm: PAGE_PADDING_X_MM,
    paddingBottomMm: PAGE_PADDING_Y_MM,
    paddingLeftMm,
    contentWidthMm,
    contentHeightMm: pageHeightMm - PAGE_PADDING_Y_MM * 2,
    columnCount,
    columnGapMm,
    columnWidthMm: (contentWidthMm - columnGapMm * (columnCount - 1)) / columnCount,
  }
}

export const mmToPx = (mm: number) => mm * PX_PER_MM
