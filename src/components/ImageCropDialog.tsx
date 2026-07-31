import { useEffect, useState } from 'react'
import { Crop, LoaderCircle, RotateCw, X } from 'lucide-react'
import { getAsset } from '../db'

type Rotation = 0 | 90 | 180 | 270

async function readImageBlob(assetId: string): Promise<Blob> {
  if (assetId.startsWith('static:')) {
    const path = assetId.slice('static:'.length).replace(/^\/+/, '')
    const response = await fetch(`${import.meta.env.BASE_URL}${path}`)
    if (!response.ok) throw new Error('无法读取内置图片')
    return response.blob()
  }
  const blob = await getAsset(assetId)
  if (!blob) throw new Error('图片文件不存在')
  return blob
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('无法生成裁剪后的图片'))
    }, 'image/png')
  })
}

async function cropImage(
  blob: Blob,
  crop: { left: number; top: number; right: number; bottom: number },
  rotation: Rotation,
): Promise<Blob> {
  const bitmap = await createImageBitmap(blob)
  try {
    const sourceX = Math.round(bitmap.width * crop.left / 100)
    const sourceY = Math.round(bitmap.height * crop.top / 100)
    const sourceWidth = Math.max(1, Math.round(bitmap.width * (100 - crop.left - crop.right) / 100))
    const sourceHeight = Math.max(1, Math.round(bitmap.height * (100 - crop.top - crop.bottom) / 100))
    const canvas = document.createElement('canvas')
    const sideways = rotation === 90 || rotation === 270
    canvas.width = sideways ? sourceHeight : sourceWidth
    canvas.height = sideways ? sourceWidth : sourceHeight
    const context = canvas.getContext('2d')
    if (!context) throw new Error('浏览器不支持图片裁剪')
    if (rotation === 90) {
      context.translate(canvas.width, 0)
      context.rotate(Math.PI / 2)
    } else if (rotation === 180) {
      context.translate(canvas.width, canvas.height)
      context.rotate(Math.PI)
    } else if (rotation === 270) {
      context.translate(0, canvas.height)
      context.rotate(-Math.PI / 2)
    }
    context.drawImage(bitmap, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight)
    return canvasBlob(canvas)
  } finally {
    bitmap.close()
  }
}

function clampPercent(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(98, Math.max(0, Math.round(parsed))) : 0
}

export function ImageCropDialog({
  assetId,
  onApply,
  onClose,
}: {
  assetId: string
  onApply: (blob: Blob) => Promise<void> | void
  onClose: () => void
}) {
  const [source, setSource] = useState<Blob | null>(null)
  const [sourceUrl, setSourceUrl] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [rotation, setRotation] = useState<Rotation>(0)
  const [crop, setCrop] = useState({ left: 0, top: 0, right: 0, bottom: 0 })
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    let alive = true
    let url = ''
    void readImageBlob(assetId)
      .then((blob) => {
        url = URL.createObjectURL(blob)
        if (!alive) {
          URL.revokeObjectURL(url)
          return
        }
        setSource(blob)
        setSourceUrl(url)
      })
      .catch((reason) => {
        if (alive) setError(reason instanceof Error ? reason.message : '无法读取图片')
      })
    return () => {
      alive = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [assetId])

  const updateCrop = (key: keyof typeof crop, value: string) => {
    setCrop((current) => ({ ...current, [key]: clampPercent(value) }))
  }

  const apply = async () => {
    if (!source) return
    if (crop.left + crop.right >= 99 || crop.top + crop.bottom >= 99) {
      setError('左右或上下裁剪比例不能达到 100%。')
      return
    }
    setBusy(true)
    setError('')
    try {
      await onApply(await cropImage(source, crop, rotation))
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '裁剪失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <section className="dialog dialog--crop" role="dialog" aria-modal="true" aria-labelledby="crop-dialog-title" onClick={(event) => event.stopPropagation()}>
        <div className="dialog__header">
          <div className="dialog__title">
            <Crop size={18} />
            <div>
              <h2 id="crop-dialog-title">裁剪题图</h2>
              <span>生成一份新的本地图片，不会影响其他题目。</span>
            </div>
          </div>
          <button type="button" className="icon-button" title="关闭" aria-label="关闭" onClick={onClose}><X size={16} /></button>
        </div>

        {sourceUrl ? (
          <div className="crop-preview">
            <img src={sourceUrl} alt="待裁剪题图" onLoad={(event) => setSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} />
          </div>
        ) : !error ? <div className="scan-progress"><LoaderCircle className="is-spinning" size={18} /><span>正在读取题图…</span></div> : null}

        <div className="crop-controls">
          <label>左侧裁掉 %<input type="number" min={0} max={98} value={crop.left} onChange={(event) => updateCrop('left', event.target.value)} /></label>
          <label>上方裁掉 %<input type="number" min={0} max={98} value={crop.top} onChange={(event) => updateCrop('top', event.target.value)} /></label>
          <label>右侧裁掉 %<input type="number" min={0} max={98} value={crop.right} onChange={(event) => updateCrop('right', event.target.value)} /></label>
          <label>下方裁掉 %<input type="number" min={0} max={98} value={crop.bottom} onChange={(event) => updateCrop('bottom', event.target.value)} /></label>
          <label className="crop-rotate"><RotateCw size={13} />旋转
            <select value={rotation} onChange={(event) => setRotation(Number(event.target.value) as Rotation)}>
              <option value={0}>不旋转</option>
              <option value={90}>顺时针 90°</option>
              <option value={180}>180°</option>
              <option value={270}>逆时针 90°</option>
            </select>
          </label>
        </div>
        {size ? <p className="panel-hint">原始尺寸：{size.width} × {size.height}px；输出为 PNG。</p> : null}
        {error ? <p className="scan-error">{error}</p> : null}

        <div className="dialog__footer">
          <button type="button" className="ghost-button" disabled={busy} onClick={onClose}>取消</button>
          <button type="button" className="primary-button" disabled={!source || busy} onClick={() => void apply()}>
            <Crop size={15} />应用裁剪
          </button>
        </div>
      </section>
    </div>
  )
}
