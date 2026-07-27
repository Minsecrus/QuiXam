import { useEffect, useState, type CSSProperties } from 'react'
import { getAsset } from '../db'

/** assetId → objectURL 缓存（会话级；objectURL 不主动回收，量小可接受） */
const urlCache = new Map<string, string>()

/** 空串表示资源缺失（区别于 null 的"仍在加载"）；缺失态不写缓存，以便重新挂载时重试 */
function useAssetUrl(assetId: string): string | null {
  const [loaded, setLoaded] = useState<{ id: string; url: string } | null>(null)
  const staticPath = assetId.startsWith('static:')
    ? assetId.slice('static:'.length).replace(/^\/+/, '')
    : null
  // Vite 部署在子路径（如 GitHub Pages 的 /QuiXam/）时，内置图也必须跟随 BASE_URL。
  const staticUrl = staticPath ? `${import.meta.env.BASE_URL}${staticPath}` : null
  const cached = staticUrl ?? urlCache.get(assetId) ?? null

  useEffect(() => {
    // 内置试卷插图随应用发布，不进入 IndexedDB，也不需要 objectURL。
    if (staticUrl) return
    if (urlCache.has(assetId)) return
    let alive = true
    void getAsset(assetId)
      .then((blob) => {
        if (!alive) return
        if (!blob) {
          setLoaded({ id: assetId, url: '' })
          return
        }
        const objectUrl = URL.createObjectURL(blob)
        urlCache.set(assetId, objectUrl)
        setLoaded({ id: assetId, url: objectUrl })
      })
      .catch(() => {
        if (alive) setLoaded({ id: assetId, url: '' })
      })
    return () => {
      alive = false
    }
  }, [assetId, staticUrl])

  return cached ?? (loaded?.id === assetId ? loaded.url : null)
}

export function AssetImage({
  assetId,
  className,
  style,
}: {
  assetId: string
  className?: string
  style?: CSSProperties
}) {
  const url = useAssetUrl(assetId)
  if (url === null) return <span className="asset-loading no-print">图片加载中…</span>
  // 缺图必须打印出来：占位符若带 no-print，打印稿会安静地少一张图且版面照样连贯
  if (url === '') return <span className="asset-missing">［图片缺失］</span>
  return <img src={url} className={className} style={style} alt="" />
}
