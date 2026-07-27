import type { Paper, Question } from '../types'
import { getAsset } from '../db'

function collectQuestionAssetIds(question: Question, into: Set<string>) {
  // static: 资源随应用发布；JSON 导出时无需复制，也不能当作 IndexedDB 资产清理。
  for (const image of question.images ?? []) {
    if (!image.assetId.startsWith('static:')) into.add(image.assetId)
  }
  for (const child of question.children ?? []) collectQuestionAssetIds(child, into)
}

export function collectAssetIds(paper: Paper): Set<string> {
  const ids = new Set<string>()
  for (const section of paper.sections) {
    for (const question of section.questions) collectQuestionAssetIds(question, ids)
  }
  return ids
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('读取图片失败'))
    reader.readAsDataURL(blob)
  })
}

/** 导出试卷 JSON：引用的图片以 dataURL 内联在 assets 字段，跨设备可用 */
export async function exportPaperJson(paper: Paper): Promise<string> {
  const assets: Record<string, string> = {}
  for (const id of collectAssetIds(paper)) {
    const blob = await getAsset(id)
    if (blob) assets[id] = await blobToDataUrl(blob)
  }
  return JSON.stringify({ schemaVersion: 3, ...paper, assets }, null, 2)
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob()
}
