import { useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent } from 'react'
import { FileText, ImageUp, KeyRound, LoaderCircle, ScanText, Trash2, Upload, X } from 'lucide-react'
import { usePaperStore } from '../store/paperStore'
import { cnNumber, paperScore, questionCount, sectionLeafCount, sectionScore } from '../utils/format'
import { hydrateRecognizedPaper, recognizePaper } from '../utils/paperRecognition'
import type { Paper } from '../types'

const DEFAULT_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-5.6-luna'
const API_KEY_STORAGE_KEY = 'quixam.byok.apiKey'

function loadStoredApiKey(): string {
  try {
    return window.localStorage.getItem(API_KEY_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function persistApiKey(value: string) {
  try {
    if (value) window.localStorage.setItem(API_KEY_STORAGE_KEY, value)
    else window.localStorage.removeItem(API_KEY_STORAGE_KEY)
  } catch {
    // 隐私模式或浏览器策略可能禁用 localStorage；此时仍允许当前弹窗内使用。
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`
}

function containsFigureMarker(paper: Paper): boolean {
  return paper.sections.some((section) =>
    section.questions.some((question) => {
      if (question.stem.includes('[图表见原卷]') || question.material?.includes('[图表见原卷]')) {
        return true
      }
      return question.children?.some((child) => child.stem.includes('[图表见原卷]')) ?? false
    }),
  )
}

export function ScanImportDialog({ onClose }: { onClose: () => void }) {
  const [files, setFiles] = useState<File[]>([])
  const [apiKey, setApiKey] = useState(loadStoredApiKey)
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL)
  const [model, setModel] = useState(DEFAULT_MODEL)
  const [isDragging, setIsDragging] = useState(false)
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [error, setError] = useState('')
  const [recognizedPaper, setRecognizedPaper] = useState<Paper | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const controllerRef = useRef<AbortController | null>(null)

  const appendSections = usePaperStore((state) => state.appendSections)
  const addRecognizedPaper = usePaperStore((state) => state.addRecognizedPaper)

  useEffect(
    () => () => {
      controllerRef.current?.abort()
    },
    [],
  )

  const stats = useMemo(() => {
    if (!recognizedPaper) return null
    return {
      questions: questionCount(recognizedPaper),
      score: paperScore(recognizedPaper),
      hasFigureMarker: containsFigureMarker(recognizedPaper),
    }
  }, [recognizedPaper])

  const addFiles = (incoming: File[]) => {
    if (incoming.length === 0) return
    setFiles((current) => {
      const seen = new Set(current.map(fileKey))
      const additions = incoming.filter((file) => {
        const key = fileKey(file)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      return [...current, ...additions]
    })
    setRecognizedPaper(null)
    setError('')
  }

  const removeFile = (target: File) => {
    setFiles((current) => current.filter((file) => fileKey(file) !== fileKey(target)))
    setRecognizedPaper(null)
    setError('')
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    if (!isRecognizing) addFiles(Array.from(event.dataTransfer.files))
  }

  const handleDropzoneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isRecognizing) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      fileInputRef.current?.click()
    }
  }

  const handleClose = () => {
    controllerRef.current?.abort()
    onClose()
  }

  const handleRecognize = async () => {
    const controller = new AbortController()
    controllerRef.current?.abort()
    controllerRef.current = controller
    setIsRecognizing(true)
    setRecognizedPaper(null)
    setError('')
    try {
      const draft = await recognizePaper(
        files,
        {
          apiKey,
          baseUrl,
          model,
        },
        controller.signal,
      )
      setRecognizedPaper(hydrateRecognizedPaper(draft))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '识别失败，请稍后重试')
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null
        setIsRecognizing(false)
      }
    }
  }

  const handleAddNew = async () => {
    if (!recognizedPaper) return
    await addRecognizedPaper(recognizedPaper)
    onClose()
  }

  const handleAppend = () => {
    if (!recognizedPaper) return
    appendSections(recognizedPaper.sections)
    onClose()
  }

  const canRecognize =
    files.length > 0 && apiKey.trim().length > 0 && baseUrl.trim().length > 0 && model.trim().length > 0

  return (
    <div className="dialog-backdrop" onClick={handleClose}>
      <div className="dialog dialog--scan" onClick={(event) => event.stopPropagation()}>
        <div className="dialog__header">
          <div className="dialog__title">
            <ScanText size={18} />
            <div>
              <h2>扫描识别</h2>
              <span>图片 / PDF → AI → QuiXam 试卷</span>
            </div>
          </div>
          <button type="button" className="icon-button" title="关闭" aria-label="关闭" onClick={handleClose}>
            <X size={16} />
          </button>
        </div>

        {!recognizedPaper ? (
          <>
            <div
              className={`scan-dropzone ${isDragging ? 'is-dragging' : ''}`}
              role="button"
              tabIndex={0}
              aria-label="上传试卷图片或 PDF"
              onClick={() => !isRecognizing && fileInputRef.current?.click()}
              onKeyDown={handleDropzoneKeyDown}
              onDragEnter={(event) => {
                event.preventDefault()
                if (!isRecognizing) setIsDragging(true)
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <Upload size={20} />
              <strong>上传试卷图片或 PDF</strong>
              <span>可多选，按上传顺序合并识别；全部文件合计小于 50 MB</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf,image/png,image/jpeg,image/webp,image/gif"
                multiple
                hidden
                onChange={(event) => {
                  addFiles(Array.from(event.target.files ?? []))
                  event.target.value = ''
                }}
              />
            </div>

            {files.length > 0 ? (
              <ul className="scan-file-list" aria-label="待识别文件">
                {files.map((file) => (
                  <li key={fileKey(file)}>
                    {file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') ? (
                      <FileText size={16} />
                    ) : (
                      <ImageUp size={16} />
                    )}
                    <span className="scan-file-list__name" title={file.name}>
                      {file.name}
                    </span>
                    <small>{formatBytes(file.size)}</small>
                    <button
                      type="button"
                      className="icon-button"
                      title={`移除 ${file.name}`}
                      aria-label={`移除 ${file.name}`}
                      disabled={isRecognizing}
                      onClick={(event) => {
                        event.stopPropagation()
                        removeFile(file)
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="scan-config">
              <div className="scan-config__heading">
                <KeyRound size={15} />
                <strong>BYOK 接口</strong>
                <span>Key 保存在此浏览器，仅用于识别请求</span>
              </div>
              <div className="field-row">
                <label className="field">
                  <span>Responses API 地址</span>
                  <input
                    type="url"
                    spellCheck={false}
                    value={baseUrl}
                    disabled={isRecognizing}
                    onChange={(event) => setBaseUrl(event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>模型</span>
                  <input
                    type="text"
                    spellCheck={false}
                    value={model}
                    disabled={isRecognizing}
                    onChange={(event) => setModel(event.target.value)}
                  />
                </label>
              </div>
              <label className="field">
                <span>API Key</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  spellCheck={false}
                  placeholder="sk-…"
                  value={apiKey}
                  disabled={isRecognizing}
                  onChange={(event) => {
                    const value = event.target.value
                    setApiKey(value)
                    persistApiKey(value)
                  }}
                />
              </label>
              <p className="panel-hint">
                当前支持兼容 OpenAI Responses API、视觉输入和严格 JSON Schema 的接口。自定义地址会收到上方填写的
                API Key，请只使用你信任的服务。清空输入可删除浏览器中保存的 Key。
              </p>
            </div>

            {isRecognizing ? (
              <div className="scan-progress" role="status" aria-live="polite">
                <LoaderCircle className="is-spinning" size={18} />
                <div>
                  <strong>正在直接生成试卷结构…</strong>
                  <span>长卷可能需要一至三分钟，请保持页面打开。</span>
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="scan-error" role="alert">
                {error}
              </div>
            ) : null}
          </>
        ) : (
          <div className="scan-result">
            <div className="scan-result__summary">
              <span>识别完成</span>
              <strong>{recognizedPaper.info.title || recognizedPaper.name}</strong>
              <small>
                {recognizedPaper.sections.length} 个大题 · {stats?.questions ?? 0} 道题 ·{' '}
                {stats?.score ?? 0} 分
              </small>
            </div>

            <div className="dialog__preview">
              <ul className="scan-result__sections">
                {recognizedPaper.sections.map((section, index) => (
                  <li key={section.id}>
                    <span>
                      {cnNumber(index + 1)}、{section.title}
                    </span>
                    <small>
                      {sectionLeafCount(section)} 题 · {sectionScore(section)} 分
                    </small>
                  </li>
                ))}
              </ul>
            </div>

            {stats?.score !== recognizedPaper.info.fullScore ? (
              <p className="scan-warning">
                题目合计 {stats?.score ?? 0} 分，与卷头满分 {recognizedPaper.info.fullScore}{' '}
                分不一致。导入后请重点核对分值。
              </p>
            ) : null}
            {stats?.hasFigureMarker ? (
              <p className="scan-warning">
                原卷包含图表；首版会保留“[图表见原卷]”位置标记，尚不会自动裁切题图。
              </p>
            ) : null}
            <p className="panel-hint">AI 识别可能有误，导入后请对照原卷检查文字、公式、题型和分值。</p>
          </div>
        )}

        <div className="dialog__footer dialog__footer--split">
          {recognizedPaper ? (
            <>
              <button type="button" className="ghost-button" onClick={() => setRecognizedPaper(null)}>
                重新识别
              </button>
              <div>
                <button type="button" className="ghost-button" onClick={handleAppend}>
                  追加到当前试卷
                </button>
                <button type="button" className="primary-button" onClick={() => void handleAddNew()}>
                  新建为试卷
                </button>
              </div>
            </>
          ) : (
            <>
              <button type="button" className="ghost-button" onClick={handleClose}>
                取消
              </button>
              {isRecognizing ? (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => controllerRef.current?.abort()}
                >
                  停止识别
                </button>
              ) : (
                <button
                  type="button"
                  className="primary-button"
                  disabled={!canRecognize}
                  onClick={() => void handleRecognize()}
                >
                  <ScanText size={15} />
                  开始识别
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
