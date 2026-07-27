import { useRef, useState } from 'react'
import {
  ChevronDown,
  ClipboardPaste,
  FileDown,
  FileUp,
  Plus,
  Printer,
  Redo2,
  ScanText,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { usePaperStore } from '../store/paperStore'
import { paperTemplates } from '../data/templates'
import { formatTime, paperScore } from '../utils/format'
import { exportPaperJson } from '../utils/transfer'
import { SmartImportDialog } from './SmartImportDialog'
import { ScanImportDialog } from './ScanImportDialog'

export function TopBar() {
  const paper = usePaperStore((s) => s.paper)
  const paperList = usePaperStore((s) => s.paperList)
  const saveState = usePaperStore((s) => s.saveState)
  const lastSavedAt = usePaperStore((s) => s.lastSavedAt)
  const canUndo = usePaperStore((s) => s.past.length > 0)
  const canRedo = usePaperStore((s) => s.future.length > 0)
  const undo = usePaperStore((s) => s.undo)
  const redo = usePaperStore((s) => s.redo)
  const createPaper = usePaperStore((s) => s.createPaper)
  const openPaper = usePaperStore((s) => s.openPaper)
  const deletePaper = usePaperStore((s) => s.deletePaper)
  const importPaper = usePaperStore((s) => s.importPaper)
  const zoom = usePaperStore((s) => s.zoom)
  const setZoom = usePaperStore((s) => s.setZoom)
  const showAnswers = usePaperStore((s) => s.showAnswers)
  const toggleAnswers = usePaperStore((s) => s.toggleAnswers)

  const totalScore = paper ? paperScore(paper) : 0
  // 只在超分时报警：卷子编到一半分数当然不足，那不是错误
  const scoreOver = paper ? totalScore > paper.info.fullScore : false
  const recentFirst = [...paperList].sort((a, b) => b.updatedAt - a.updatedAt)

  const [menuOpen, setMenuOpen] = useState(false)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExportJson = async () => {
    if (!paper) return
    const json = await exportPaperJson(paper)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${paper.name || '试卷'}.qxp.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return
    const text = await file.text()
    const error = await importPaper(text)
    if (error) {
      window.alert(`导入失败：${error}`)
    }
  }

  const handleDeleteCurrent = () => {
    if (!paper) return
    if (window.confirm(`删除试卷「${paper.name}」？此操作不可恢复。`)) {
      void deletePaper(paper.id)
    }
  }

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <div className="brand-mark">QX</div>
        <span className="brand-name">QuiXam</span>
      </div>

      <div className="topbar__center">
        <button type="button" className="icon-button" title="撤销 (Ctrl+Z)" disabled={!canUndo} onClick={undo}>
          <Undo2 size={16} />
        </button>
        <button type="button" className="icon-button" title="重做 (Ctrl+Y)" disabled={!canRedo} onClick={redo}>
          <Redo2 size={16} />
        </button>

        <select
          className="paper-select"
          value={paper?.id ?? ''}
          onChange={(e) => void openPaper(e.target.value)}
          title="切换试卷"
        >
          {recentFirst.map((meta) => (
            <option key={meta.id} value={meta.id}>
              {meta.name}
            </option>
          ))}
        </select>
        <button type="button" className="icon-button" title="删除当前试卷" onClick={handleDeleteCurrent}>
          <Trash2 size={16} />
        </button>
        <span className="save-indicator" role="status">
          {saveState === 'saving' ? '保存中…' : lastSavedAt ? `已保存 ${formatTime(lastSavedAt)}` : ''}
        </span>

        <span className="topbar__divider" />

        <button
          type="button"
          className="icon-button"
          title="缩小"
          aria-label="缩小"
          disabled={zoom <= 50}
          onClick={() => setZoom(zoom - 10)}
        >
          <ZoomOut size={15} />
        </button>
        <button type="button" className="zoom-value" title="重置缩放" onClick={() => setZoom(100)}>
          {zoom}%
        </button>
        <button
          type="button"
          className="icon-button"
          title="放大"
          aria-label="放大"
          disabled={zoom >= 150}
          onClick={() => setZoom(zoom + 10)}
        >
          <ZoomIn size={15} />
        </button>

        <span className="topbar__divider" />

        {paper ? (
          <span className={`score-indicator ${scoreOver ? 'score-warn' : ''}`} title="卷面分 / 满分">
            {totalScore} / {paper.info.fullScore} 分
          </span>
        ) : null}

        <label className="switch-label" title="打印时附参考答案">
          <input type="checkbox" checked={showAnswers} onChange={toggleAnswers} />
          <span>答案</span>
        </label>
      </div>

      <div className="topbar__actions">
        <div className="menu-anchor">
          <button type="button" className="ghost-button" onClick={() => setMenuOpen((v) => !v)}>
            <Plus size={15} />
            新建
            <ChevronDown size={13} />
          </button>
          {menuOpen ? (
            <>
              <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
              <div className="menu-panel">
                {paperTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className="menu-item"
                    onClick={() => {
                      setMenuOpen(false)
                      void createPaper(template.id)
                    }}
                  >
                    <span>{template.name}</span>
                    <small>{template.description}</small>
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <button type="button" className="icon-button" title="粘贴导入（Word 文本）" onClick={() => setPasteOpen(true)}>
          <ClipboardPaste size={16} />
        </button>

        <button type="button" className="icon-button" title="扫描识别（BYOK）" onClick={() => setScanOpen(true)}>
          <ScanText size={16} />
        </button>

        <button type="button" className="icon-button" title="导入 JSON" onClick={() => fileInputRef.current?.click()}>
          <FileUp size={16} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            void handleImportFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />

        <button type="button" className="icon-button" title="导出 JSON" onClick={() => void handleExportJson()}>
          <FileDown size={16} />
        </button>

        <button type="button" className="primary-button" onClick={() => window.print()}>
          <Printer size={15} />
          打印
        </button>
      </div>

      {pasteOpen ? <SmartImportDialog onClose={() => setPasteOpen(false)} /> : null}
      {scanOpen ? <ScanImportDialog onClose={() => setScanOpen(false)} /> : null}
    </header>
  )
}
