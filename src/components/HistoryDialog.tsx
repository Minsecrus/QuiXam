import { useCallback, useEffect, useState } from 'react'
import { History, RotateCcw, Save, Trash2, X } from 'lucide-react'
import { deletePaperSnapshot, getPaperSnapshots } from '../db'
import { usePaperStore } from '../store/paperStore'
import type { Paper, PaperSnapshot } from '../types'

function formatSnapshotTime(value: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value)
}

export function HistoryDialog({ paper, onClose }: { paper: Paper; onClose: () => void }) {
  const createSnapshot = usePaperStore((state) => state.createSnapshot)
  const restoreSnapshot = usePaperStore((state) => state.restoreSnapshot)
  const [snapshots, setSnapshots] = useState<PaperSnapshot[]>([])
  const [label, setLabel] = useState('手动保存点')
  const [busy, setBusy] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setSnapshots(await getPaperSnapshots(paper.id))
  }, [paper.id])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const saveCurrent = async () => {
    setBusy('save')
    try {
      await createSnapshot(label)
      await refresh()
    } finally {
      setBusy(null)
    }
  }

  const restore = async (snapshot: PaperSnapshot) => {
    if (!window.confirm(`恢复到 ${formatSnapshotTime(snapshot.createdAt)} 的“${snapshot.label}”？当前版本会先自动保留。`)) return
    setBusy(snapshot.id)
    try {
      await restoreSnapshot(snapshot)
      onClose()
    } finally {
      setBusy(null)
    }
  }

  const remove = async (snapshot: PaperSnapshot) => {
    if (!window.confirm(`删除“${snapshot.label}”？此历史版本无法恢复。`)) return
    setBusy(snapshot.id)
    try {
      await deletePaperSnapshot(snapshot.id)
      await refresh()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <section className="dialog dialog--history" role="dialog" aria-modal="true" aria-labelledby="history-dialog-title" onClick={(event) => event.stopPropagation()}>
        <div className="dialog__header">
          <div className="dialog__title">
            <History size={18} />
            <div>
              <h2 id="history-dialog-title">本地版本历史</h2>
              <span>仅保存在当前浏览器，可随时恢复；不会同步到云端。</span>
            </div>
          </div>
          <button type="button" className="icon-button" title="关闭" aria-label="关闭" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="history-save-row">
          <input value={label} aria-label="版本名称" onChange={(event) => setLabel(event.target.value)} placeholder="版本名称" />
          <button type="button" className="mini-button" disabled={busy !== null} onClick={() => void saveCurrent()}>
            <Save size={13} />
            保存当前版本
          </button>
        </div>

        {snapshots.length > 0 ? (
          <ul className="history-list">
            {snapshots.map((snapshot) => (
              <li key={snapshot.id}>
                <span>
                  <strong>{snapshot.label}</strong>
                  <small>{formatSnapshotTime(snapshot.createdAt)}</small>
                </span>
                <div>
                  <button type="button" className="icon-button" title="恢复此版本" aria-label="恢复此版本" disabled={busy !== null} onClick={() => void restore(snapshot)}>
                    <RotateCcw size={14} />
                  </button>
                  <button type="button" className="icon-button is-danger" title="删除版本" aria-label="删除版本" disabled={busy !== null} onClick={() => void remove(snapshot)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="panel-hint history-empty">还没有版本记录。开始编辑后，系统会每隔一段时间自动保留一个本地保存点。</p>
        )}

        <div className="dialog__footer">
          <button type="button" className="primary-button" onClick={onClose}>完成</button>
        </div>
      </section>
    </div>
  )
}
