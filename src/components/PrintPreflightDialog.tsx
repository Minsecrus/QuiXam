import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, FileWarning, Printer, X } from 'lucide-react'
import { flushSave, usePaperStore } from '../store/paperStore'
import { inspectPaper, inspectPaperAssets, type PaperIssue } from '../utils/paperCheck'
import type { Paper } from '../types'

export function PrintPreflightDialog({
  paper,
  includeAnswers,
  onClose,
}: {
  paper: Paper
  includeAnswers: boolean
  onClose: () => void
}) {
  const [assetIssues, setAssetIssues] = useState<PaperIssue[]>([])
  const [checkingAssets, setCheckingAssets] = useState(true)
  const setSelection = usePaperStore((state) => state.setSelection)
  const baseIssues = useMemo(() => inspectPaper(paper, { includeAnswers }), [paper, includeAnswers])
  const issues = useMemo(
    () => [...baseIssues, ...assetIssues].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'error' ? -1 : 1)),
    [assetIssues, baseIssues],
  )
  const errors = issues.filter((item) => item.severity === 'error').length

  useEffect(() => {
    let alive = true
    void inspectPaperAssets(paper)
      .then((result) => {
        if (alive) setAssetIssues(result)
      })
      .catch(() => {
        if (alive) setAssetIssues([])
      })
      .finally(() => {
        if (alive) setCheckingAssets(false)
      })
    return () => {
      alive = false
    }
  }, [paper])

  const jumpToIssue = (item: PaperIssue) => {
    if (item.target.kind === 'paper') setSelection({ kind: 'paper' })
    else if (item.target.id) setSelection({ kind: item.target.kind, id: item.target.id })
    onClose()
  }

  const print = () => {
    onClose()
    window.setTimeout(() => {
      void flushSave().finally(() => window.print())
    }, 0)
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <section
        className="dialog dialog--preflight"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preflight-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog__header">
          <div className="dialog__title">
            <FileWarning size={18} />
            <div>
              <h2 id="preflight-dialog-title">打印检查</h2>
              <span>本地检查内容、分值与题图引用，不会上传试卷。</span>
            </div>
          </div>
          <button type="button" className="icon-button" title="关闭" aria-label="关闭" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className={`preflight-summary${errors > 0 ? ' has-errors' : ''}`}>
          {issues.length === 0 && !checkingAssets ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <div>
            <strong>
              {checkingAssets
                ? '正在检查本地题图…'
                : issues.length === 0
                  ? '可以打印'
                  : `${errors > 0 ? `${errors} 个错误` : ''}${errors > 0 && issues.length > errors ? '，' : ''}${issues.length - errors > 0 ? `${issues.length - errors} 个提醒` : ''}`}
            </strong>
            <span>{issues.length === 0 && !checkingAssets ? '未发现会影响交付的常见问题。' : '点击任一项可定位到对应位置。'}</span>
          </div>
        </div>

        {issues.length > 0 ? (
          <ul className="preflight-list">
            {issues.map((item) => (
              <li key={item.id} className={`preflight-item is-${item.severity}`}>
                <button type="button" onClick={() => jumpToIssue(item)}>
                  {item.severity === 'error' ? <AlertTriangle size={15} /> : <FileWarning size={15} />}
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="dialog__footer">
          <button type="button" className="ghost-button" onClick={onClose}>返回编辑</button>
          <button type="button" className="primary-button" onClick={print}>
            <Printer size={15} />
            {errors > 0 ? '仍然打印' : '打印'}
          </button>
        </div>
      </section>
    </div>
  )
}
