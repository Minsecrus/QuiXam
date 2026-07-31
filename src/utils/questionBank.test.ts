import { describe, expect, it } from 'vitest'
import type { Question, QuestionBankEntry } from '../types'
import {
  cloneQuestion,
  filterQuestionBank,
  makeQuestionBankEntry,
  normalizeQuestionMetadata,
  pickRandomQuestions,
} from './questionBank'
import { questionScore } from './format'

function question(id: string, stem: string, score: number, extra: Partial<Question> = {}): Question {
  return {
    id,
    type: 'single',
    stem,
    score,
    options: ['A', 'B', 'C', 'D'],
    answer: 'A',
    answerLines: 0,
    ...extra,
  }
}

function entry(id: string, value: Question): QuestionBankEntry {
  return {
    id,
    question: value,
    createdAt: 1,
    updatedAt: 1,
    usageCount: 0,
  }
}

describe('local question bank helpers', () => {
  it('normalizes metadata without rejecting old or malformed JSON', () => {
    expect(normalizeQuestionMetadata({
      knowledgePoints: ['函数', '函数', 1],
      tags: ['高一', ' 高一 ', ''],
      difficulty: 'invalid',
      source: ' 校本卷 ',
      year: 2026.5,
    })).toEqual({
      knowledgePoints: ['函数'],
      tags: ['高一'],
      difficulty: 'unknown',
      source: '校本卷',
    })
  })

  it('creates independent question copies while preserving the bank association', () => {
    const original = question('parent', '阅读材料。', 0, {
      type: 'material',
      options: [],
      bankEntryId: 'bank-1',
      metadata: { knowledgePoints: ['阅读'], tags: ['材料'], difficulty: 'medium', source: '校本', year: 2025 },
      children: [question('child', '回答问题。', 4)],
    })

    const copy = cloneQuestion(original)
    copy.children?.[0].options.splice(0, 1)

    expect(copy.id).not.toBe(original.id)
    expect(copy.children?.[0].id).not.toBe(original.children?.[0].id)
    expect(copy.bankEntryId).toBe('bank-1')
    expect(copy.metadata).toEqual(original.metadata)
    expect(original.children?.[0].options).toHaveLength(4)
  })

  it('filters metadata and makes a score-targeted local random assembly', () => {
    const magnetic = entry('magnetic', question('q1', '电磁感应现象。', 2, {
      metadata: { knowledgePoints: ['电磁感应'], tags: ['高二'], difficulty: 'medium', source: '校本卷', year: 2026 },
    }))
    const functionEntry = entry('function', question('q2', '函数单调性。', 3, {
      metadata: { knowledgePoints: ['函数'], tags: ['高一'], difficulty: 'easy', source: '练习册' },
    }))
    const geometry = entry('geometry', question('q3', '平面向量。', 5, {
      metadata: { knowledgePoints: ['向量'], tags: ['高二'], difficulty: 'hard', source: '' },
    }))
    const entries = [magnetic, functionEntry, geometry]

    expect(filterQuestionBank(entries, { query: '电磁', difficulty: 'medium' })).toEqual([magnetic])
    expect(filterQuestionBank(entries, { tag: '高二', type: 'single' })).toHaveLength(2)
    const selected = pickRandomQuestions(entries, { count: 2, targetScore: 5, type: 'all' })
    expect(selected.reduce((sum, item) => sum + questionScore(item.question), 0)).toBe(5)
  })

  it('saves a local entry with a fresh immutable snapshot', () => {
    const source = question('source', '本地题库快照。', 4, { bankEntryId: 'existing' })
    const saved = makeQuestionBankEntry(source)

    expect(saved.id).toBe('existing')
    expect(saved.question.id).not.toBe(source.id)
    expect(saved.question.bankEntryId).toBe('existing')
  })
})
