import { useEffect, useMemo, useRef, useState } from 'react'
import { Archive, Dices, Download, FilePlus2, Search, Trash2, Upload, X } from 'lucide-react'
import { deleteQuestionBankEntry, getQuestionBankEntries, putQuestionBankEntry } from '../db'
import { usePaperStore } from '../store/paperStore'
import type { Question, QuestionBankEntry, QuestionDifficulty, QuestionType } from '../types'
import { QUESTION_TYPE_LABELS, questionScore } from '../utils/format'
import {
  filterQuestionBank,
  makeQuestionBankEntry,
  normalizeQuestionMetadata,
  pickRandomQuestions,
  questionSummary,
} from '../utils/questionBank'

const difficultyLabel: Record<QuestionDifficulty, string> = {
  unknown: '未标注',
  easy: '基础',
  medium: '中等',
  hard: '较难',
}

const typeOptions: Array<QuestionType | 'all'> = ['all', 'single', 'multiple', 'sevenChoice', 'cloze', 'fill', 'segmentation', 'calculation', 'shortAnswer', 'solution', 'composition', 'material']

function parseNumber(value: string): number {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0
}

export function QuestionBankDialog({ onClose }: { onClose: () => void }) {
  const paper = usePaperStore((state) => state.paper)
  const addQuestionsFromBank = usePaperStore((state) => state.addQuestionsFromBank)
  const saveAllQuestionsToBank = usePaperStore((state) => state.saveAllQuestionsToBank)
  const [entries, setEntries] = useState<QuestionBankEntry[]>([])
  const [query, setQuery] = useState('')
  const [type, setType] = useState<QuestionType | 'all'>('all')
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | 'all'>('all')
  const [tag, setTag] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [count, setCount] = useState('5')
  const [targetScore, setTargetScore] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  const refresh = async () => {
    const next = await getQuestionBankEntries()
    setEntries(next)
    setSelectedIds((current) => new Set([...current].filter((id) => next.some((entry) => entry.id === id))))
  }

  useEffect(() => {
    void refresh()
  }, [])

  const filtered = useMemo(
    () => filterQuestionBank(entries, { query, type, difficulty, tag }),
    [difficulty, entries, query, tag, type],
  )
  const selected = useMemo(() => entries.filter((entry) => selectedIds.has(entry.id)), [entries, selectedIds])
  const selectedScore = useMemo(() => selected.reduce((sum, entry) => sum + questionScore(entry.question), 0), [selected])

  const toggle = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const addSelected = () => {
    if (selected.length === 0) return
    addQuestionsFromBank(selected)
    setMessage(`已将 ${selected.length} 道题追加到当前大题。`)
  }

  const randomAdd = () => {
    const picked = pickRandomQuestions(entries, {
      query,
      type,
      difficulty,
      tag,
      count: parseNumber(count),
      targetScore: parseNumber(targetScore),
    })
    if (picked.length === 0) {
      setMessage('没有符合筛选条件的题目。')
      return
    }
    addQuestionsFromBank(picked)
    const total = picked.reduce((sum, entry) => sum + questionScore(entry.question), 0)
    setMessage(`已随机加入 ${picked.length} 道题，合计 ${total} 分。`)
  }

  const saveAll = async () => {
    setBusy(true)
    try {
      const saved = await saveAllQuestionsToBank()
      await refresh()
      setMessage(saved > 0 ? `已保存 ${saved} 个顶层题目到本地题库。` : '当前试卷没有可保存的题目。')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (entry: QuestionBankEntry) => {
    if (!window.confirm(`删除题库题目“${questionSummary(entry.question, 32)}”？`)) return
    await deleteQuestionBankEntry(entry.id)
    await refresh()
  }

  const exportBank = () => {
    const blob = new Blob([JSON.stringify({ schemaVersion: 1, entries }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'QuiXam-题库备份.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const importBank = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      const raw = JSON.parse(await file.text()) as unknown
      const candidates = Array.isArray(raw)
        ? raw
        : raw && typeof raw === 'object' && Array.isArray((raw as { entries?: unknown }).entries)
          ? (raw as { entries: unknown[] }).entries
          : []
      let imported = 0
      for (const candidate of candidates) {
        if (!candidate || typeof candidate !== 'object') continue
        const item = candidate as { question?: unknown }
        if (!item.question || typeof item.question !== 'object') continue
        // 导入题库视为不可信输入：仅接受拥有基本题目形状的数据，再由入库函数生成新 id。
        const question = item.question as Question
        if (typeof question.type !== 'string' || !Array.isArray(question.options)) continue
        const entry = makeQuestionBankEntry({
          ...question,
          metadata: normalizeQuestionMetadata(question.metadata),
        })
        await putQuestionBankEntry(entry)
        imported += 1
      }
      await refresh()
      setMessage(imported > 0 ? `已导入 ${imported} 道题。` : '没有识别到可导入的题库题目。')
    } catch {
      setMessage('题库备份不是有效的 JSON 文件。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <section className="dialog dialog--question-bank" role="dialog" aria-modal="true" aria-labelledby="question-bank-title" onClick={(event) => event.stopPropagation()}>
        <div className="dialog__header">
          <div className="dialog__title">
            <Archive size={18} />
            <div>
              <h2 id="question-bank-title">本地题库</h2>
              <span>检索、批量加入和随机组卷；数据只保存在当前浏览器。</span>
            </div>
          </div>
          <button type="button" className="icon-button" title="关闭" aria-label="关闭" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="question-bank-toolbar">
          <label className="question-bank-search">
            <Search size={15} />
            <input value={query} placeholder="搜索题干、标签、知识点或来源" onChange={(event) => setQuery(event.target.value)} />
          </label>
          <select value={type} aria-label="题型筛选" onChange={(event) => setType(event.target.value as QuestionType | 'all')}>
            {typeOptions.map((item) => <option key={item} value={item}>{item === 'all' ? '全部题型' : QUESTION_TYPE_LABELS[item]}</option>)}
          </select>
          <select value={difficulty} aria-label="难度筛选" onChange={(event) => setDifficulty(event.target.value as QuestionDifficulty | 'all')}>
            <option value="all">全部难度</option>
            {(Object.keys(difficultyLabel) as QuestionDifficulty[]).map((item) => <option key={item} value={item}>{difficultyLabel[item]}</option>)}
          </select>
          <input value={tag} placeholder="标签" aria-label="标签筛选" onChange={(event) => setTag(event.target.value)} />
        </div>

        <div className="question-bank-actions">
          <button type="button" className="mini-button" disabled={busy || !paper} onClick={() => void saveAll()}>
            <FilePlus2 size={13} />
            当前卷全部入库
          </button>
          <button type="button" className="icon-button" title="导出题库备份" aria-label="导出题库备份" onClick={exportBank}>
            <Download size={15} />
          </button>
          <button type="button" className="icon-button" title="导入题库备份" aria-label="导入题库备份" disabled={busy} onClick={() => importRef.current?.click()}>
            <Upload size={15} />
          </button>
          <input ref={importRef} type="file" accept=".json,application/json" hidden onChange={(event) => { void importBank(event.target.files?.[0]); event.target.value = '' }} />
        </div>

        <div className="question-bank-list" aria-label="题库列表">
          {filtered.length > 0 ? filtered.map((entry) => {
            const metadata = normalizeQuestionMetadata(entry.question.metadata)
            return (
              <article key={entry.id} className={`question-bank-item${selectedIds.has(entry.id) ? ' is-selected' : ''}`}>
                <label>
                  <input type="checkbox" checked={selectedIds.has(entry.id)} onChange={() => toggle(entry.id)} />
                  <span className="question-bank-item__body">
                    <strong>{questionSummary(entry.question)}</strong>
                    <small>{QUESTION_TYPE_LABELS[entry.question.type]} · {questionScore(entry.question)} 分 · {difficultyLabel[metadata.difficulty]}</small>
                    {metadata.tags.length > 0 || metadata.knowledgePoints.length > 0 || metadata.source ? (
                      <em>{[...metadata.tags, ...metadata.knowledgePoints, metadata.source].filter(Boolean).join(' · ')}</em>
                    ) : null}
                  </span>
                </label>
                <button type="button" className="icon-button is-danger" title="从题库删除" aria-label="从题库删除" onClick={() => void remove(entry)}>
                  <Trash2 size={14} />
                </button>
              </article>
            )
          }) : <p className="panel-hint">没有符合条件的题目。可在题目属性中单题入库，或把当前卷批量存入题库。</p>}
        </div>

        <div className="question-bank-assemble">
          <div>
            <strong>随机组卷</strong>
            <small>沿用上方筛选条件；目标分无法精确凑齐时取最接近组合。</small>
          </div>
          <label>题数<input inputMode="numeric" value={count} onChange={(event) => setCount(event.target.value)} /></label>
          <label>目标分<input inputMode="numeric" placeholder="不限" value={targetScore} onChange={(event) => setTargetScore(event.target.value)} /></label>
          <button type="button" className="mini-button" onClick={randomAdd}><Dices size={13} />随机加入</button>
        </div>

        {message ? <p className="question-bank-message" role="status">{message}</p> : null}
        <div className="dialog__footer dialog__footer--split">
          <span className="panel-hint">已选 {selected.length} 题 · {selectedScore} 分</span>
          <div>
            <button type="button" className="ghost-button" onClick={onClose}>关闭</button>
            <button type="button" className="primary-button" disabled={selected.length === 0} onClick={addSelected}>加入当前大题</button>
          </div>
        </div>
      </section>
    </div>
  )
}
