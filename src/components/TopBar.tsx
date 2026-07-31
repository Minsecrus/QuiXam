import { useEffect, useRef, useState } from 'react'
import {
  Archive,
  ChevronDown,
  ClipboardPaste,
  Download,
  Files,
  History,
  Plus,
  Printer,
  Redo2,
  ScanText,
  Undo2,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { usePaperStore } from '../store/paperStore'
import { paperTemplates } from '../data/templates'
import { deleteCustomTemplate, getCustomTemplates } from '../db'
import { formatTime, paperScore } from '../utils/format'
import { exportPaperJson } from '../utils/transfer'
import { InfoDialog } from './InfoDialog'
import { PaperPicker } from './PaperPicker'
import { SmartImportDialog } from './SmartImportDialog'
import { ScanImportDialog } from './ScanImportDialog'
import { PrintPreflightDialog } from './PrintPreflightDialog'
import { HistoryDialog } from './HistoryDialog'
import { QuestionBankDialog } from './QuestionBankDialog'
import type { CustomPaperTemplate } from '../types'

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
  const showAnswerSheet = usePaperStore((s) => s.showAnswerSheet)
  const toggleAnswerSheet = usePaperStore((s) => s.toggleAnswerSheet)
  const duplicatePaper = usePaperStore((s) => s.duplicatePaper)
  const createPaperFromCustomTemplate = usePaperStore((s) => s.createPaperFromCustomTemplate)
  const saveCurrentAsTemplate = usePaperStore((s) => s.saveCurrentAsTemplate)

  const totalScore = paper ? paperScore(paper) : 0
  const scoreMismatch = paper ? Math.abs(totalScore - paper.info.fullScore) > 1e-9 : false
  const recentFirst = [...paperList].sort((a, b) => b.updatedAt - a.updatedAt)

  const [menuOpen, setMenuOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const [preflightOpen, setPreflightOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [bankOpen, setBankOpen] = useState(false)
  const [customTemplates, setCustomTemplates] = useState<CustomPaperTemplate[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const refreshCustomTemplates = async () => {
    setCustomTemplates(await getCustomTemplates())
  }

  useEffect(() => {
    let alive = true
    void getCustomTemplates().then((templates) => {
      if (alive) setCustomTemplates(templates)
    })
    return () => {
      alive = false
    }
  }, [])

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

  const handleSaveAsTemplate = async () => {
    const fallback = paper?.name || '我的模板'
    const name = window.prompt('模板名称', fallback)
    if (!name?.trim()) return
    const saved = await saveCurrentAsTemplate(name)
    if (saved) await refreshCustomTemplates()
  }

  const handleDeleteTemplate = async (template: CustomPaperTemplate) => {
    if (!window.confirm(`删除本地模板“${template.name}”？不会影响已创建的试卷。`)) return
    await deleteCustomTemplate(template.id)
    await refreshCustomTemplates()
  }

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <div className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" focusable="false">
            <ellipse className="brand-mark__q" cx="12.8" cy="13.1" rx="5.8" ry="7.2" />
            <path className="brand-mark__q-tail" d="m16.8 18.6 8.7 7.2" />
            <path
              className="brand-mark__x-stroke"
              d="M27.2 14.3c-2.3 1.8-4.2 3.4-5.5 5.4-1.4 2.1-1.3 3.8-2.2 5.5-.7 1.4-1.1 3.1-1.3 5"
            />
          </svg>
        </div>
        <button
          type="button"
          className="brand-name"
          title="关于 QuiXam"
          aria-haspopup="dialog"
          onClick={() => setInfoOpen(true)}
        >
          Qui<span className="brand-name__accent">Xam</span>
        </button>
      </div>

      <div className="topbar__center">
        <button type="button" className="icon-button" title="撤销 (Ctrl+Z)" disabled={!canUndo} onClick={undo}>
          <Undo2 size={16} />
        </button>
        <button type="button" className="icon-button" title="重做 (Ctrl+Y)" disabled={!canRedo} onClick={redo}>
          <Redo2 size={16} />
        </button>

        <PaperPicker papers={recentFirst} value={paper?.id ?? null} onChange={openPaper} onDelete={deletePaper} />
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
          <span className="score-indicator" title="实际分数 / 满分">
            <span className={scoreMismatch ? 'score-warn' : undefined}>{totalScore}</span>
            {' / '}
            {paper.info.fullScore} 分
          </span>
        ) : null}

        <label className="switch-label" title="打印时附参考答案">
          <input type="checkbox" checked={showAnswers} onChange={toggleAnswers} />
          <span>答案</span>
        </label>
        <label className="switch-label" title="打印时附独立答题卡">
          <input type="checkbox" checked={showAnswerSheet} onChange={toggleAnswerSheet} />
          <span>答题卡</span>
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
                <button
                  type="button"
                  className="menu-item menu-item--action"
                  onClick={() => {
                    setMenuOpen(false)
                    void handleSaveAsTemplate()
                  }}
                >
                  <span>保存当前卷为本地模板</span>
                  <small>可在此菜单中复用，不会上传</small>
                </button>
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
                {customTemplates.length > 0 ? (
                  <div className="menu-template-group">
                    <small>我的本地模板</small>
                    {customTemplates.map((template) => (
                      <div className="menu-template-row" key={template.id}>
                        <button
                          type="button"
                          className="menu-item"
                          onClick={() => {
                            setMenuOpen(false)
                            void createPaperFromCustomTemplate(template)
                          }}
                        >
                          <span>{template.name}</span>
                          <small>从当前浏览器保存的试卷结构创建</small>
                        </button>
                        <button
                          type="button"
                          className="icon-button is-danger"
                          title={`删除模板“${template.name}”`}
                          aria-label={`删除模板“${template.name}”`}
                          onClick={() => void handleDeleteTemplate(template)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </div>

        <button type="button" className="icon-button" title="复制当前试卷" aria-label="复制当前试卷" onClick={() => void duplicatePaper()}>
          <Files size={16} />
        </button>

        <button type="button" className="icon-button" title="本地版本历史" aria-label="本地版本历史" onClick={() => setHistoryOpen(true)}>
          <History size={16} />
        </button>

        <button type="button" className="icon-button" title="本地题库" aria-label="本地题库" onClick={() => setBankOpen(true)}>
          <Archive size={16} />
        </button>

        <button type="button" className="icon-button" title="粘贴导入（Word 文本）" onClick={() => setPasteOpen(true)}>
          <ClipboardPaste size={16} />
        </button>

        <button type="button" className="icon-button" title="扫描识别（BYOK）" onClick={() => setScanOpen(true)}>
          <ScanText size={16} />
        </button>

        <button type="button" className="icon-button" title="导入 JSON" onClick={() => fileInputRef.current?.click()}>
          <Upload size={16} />
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
          <Download size={16} />
        </button>

        <button type="button" className="primary-button" onClick={() => setPreflightOpen(true)}>
          <Printer size={15} />
          打印
        </button>
      </div>

      {pasteOpen ? <SmartImportDialog onClose={() => setPasteOpen(false)} /> : null}
      {scanOpen ? <ScanImportDialog onClose={() => setScanOpen(false)} /> : null}
      {infoOpen ? <InfoDialog onClose={() => setInfoOpen(false)} /> : null}
      {preflightOpen && paper ? <PrintPreflightDialog paper={paper} includeAnswers={showAnswers} onClose={() => setPreflightOpen(false)} /> : null}
      {historyOpen && paper ? <HistoryDialog paper={paper} onClose={() => setHistoryOpen(false)} /> : null}
      {bankOpen ? <QuestionBankDialog onClose={() => setBankOpen(false)} /> : null}
    </header>
  )
}
