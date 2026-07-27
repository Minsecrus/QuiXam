import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Paper } from './types'

interface QuixamDB extends DBSchema {
  papers: {
    key: string
    value: Paper
  }
  meta: {
    key: string
    value: string
  }
  /** 题目附图等二进制资源，与试卷 JSON 分表存，避免试卷对象膨胀 */
  assets: {
    key: string
    value: Blob
  }
}

let dbPromise: Promise<IDBPDatabase<QuixamDB>> | null = null

function getDB() {
  dbPromise ??= openDB<QuixamDB>('quixam', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('papers')
        db.createObjectStore('meta')
      }
      if (oldVersion < 2) {
        db.createObjectStore('assets')
      }
    },
  })
  return dbPromise
}

export async function getAllPapers(): Promise<Paper[]> {
  return (await getDB()).getAll('papers')
}

export async function getPaper(id: string): Promise<Paper | undefined> {
  return (await getDB()).get('papers', id)
}

export async function putPaper(paper: Paper): Promise<void> {
  await (await getDB()).put('papers', paper, paper.id)
}

export async function deletePaperRecord(id: string): Promise<void> {
  await (await getDB()).delete('papers', id)
}

export async function getMeta(key: string): Promise<string | undefined> {
  return (await getDB()).get('meta', key)
}

export async function setMeta(key: string, value: string): Promise<void> {
  await (await getDB()).put('meta', value, key)
}

export async function getAsset(id: string): Promise<Blob | undefined> {
  return (await getDB()).get('assets', id)
}

export async function putAsset(id: string, blob: Blob): Promise<void> {
  await (await getDB()).put('assets', blob, id)
}

export async function deleteAsset(id: string): Promise<void> {
  await (await getDB()).delete('assets', id)
}
