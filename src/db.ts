import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { CustomPaperTemplate, Paper, PaperSnapshot, QuestionBankEntry } from './types'

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
  snapshots: {
    key: string
    value: PaperSnapshot
    indexes: {
      'by-paper': string
      'by-created': number
    }
  }
  questionBank: {
    key: string
    value: QuestionBankEntry
    indexes: {
      'by-updated': number
    }
  }
  customTemplates: {
    key: string
    value: CustomPaperTemplate
    indexes: {
      'by-updated': number
    }
  }
}

let dbPromise: Promise<IDBPDatabase<QuixamDB>> | null = null

function getDB() {
  dbPromise ??= openDB<QuixamDB>('quixam', 5, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('papers')
        db.createObjectStore('meta')
      }
      if (oldVersion < 2) {
        db.createObjectStore('assets')
      }
      if (oldVersion < 3) {
        const snapshots = db.createObjectStore('snapshots', { keyPath: 'id' })
        snapshots.createIndex('by-paper', 'paperId')
        snapshots.createIndex('by-created', 'createdAt')
      }
      if (oldVersion < 4) {
        const questionBank = db.createObjectStore('questionBank', { keyPath: 'id' })
        questionBank.createIndex('by-updated', 'updatedAt')
      }
      if (oldVersion < 5) {
        const customTemplates = db.createObjectStore('customTemplates', { keyPath: 'id' })
        customTemplates.createIndex('by-updated', 'updatedAt')
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

export async function getPaperSnapshots(paperId: string): Promise<PaperSnapshot[]> {
  const snapshots = await (await getDB()).getAllFromIndex('snapshots', 'by-paper', paperId)
  return snapshots.sort((a, b) => b.createdAt - a.createdAt)
}

export async function putPaperSnapshot(snapshot: PaperSnapshot, keep = 30): Promise<void> {
  const database = await getDB()
  await database.put('snapshots', snapshot)
  const snapshots = await database.getAllFromIndex('snapshots', 'by-paper', snapshot.paperId)
  const expired = snapshots
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(Math.max(keep, 1))
  await Promise.all(expired.map((entry) => database.delete('snapshots', entry.id)))
}

export async function deletePaperSnapshot(id: string): Promise<void> {
  await (await getDB()).delete('snapshots', id)
}

export async function deletePaperSnapshots(paperId: string): Promise<void> {
  const database = await getDB()
  const snapshots = await database.getAllFromIndex('snapshots', 'by-paper', paperId)
  await Promise.all(snapshots.map((snapshot) => database.delete('snapshots', snapshot.id)))
}

export async function getQuestionBankEntries(): Promise<QuestionBankEntry[]> {
  const entries = await (await getDB()).getAll('questionBank')
  return entries.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function putQuestionBankEntry(entry: QuestionBankEntry): Promise<void> {
  await (await getDB()).put('questionBank', entry)
}

export async function deleteQuestionBankEntry(id: string): Promise<void> {
  await (await getDB()).delete('questionBank', id)
}

export async function getCustomTemplates(): Promise<CustomPaperTemplate[]> {
  const templates = await (await getDB()).getAll('customTemplates')
  return templates.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function putCustomTemplate(template: CustomPaperTemplate): Promise<void> {
  await (await getDB()).put('customTemplates', template)
}

export async function deleteCustomTemplate(id: string): Promise<void> {
  await (await getDB()).delete('customTemplates', id)
}
