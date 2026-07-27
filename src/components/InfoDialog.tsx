import { ExternalLink, Info, X } from 'lucide-react'

const PROJECT_URL = 'https://github.com/Minsecrus/QuiXam'
const LICENSE_URL = `${PROJECT_URL}/blob/main/LICENSE`

export function InfoDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <section
        className="dialog dialog--info"
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog__header">
          <div className="dialog__title">
            <Info size={18} />
            <div>
              <h2 id="info-dialog-title">
                关于 Qui<span className="brand-name__accent">Xam</span>
              </h2>
              <span>试卷编排工作台</span>
            </div>
          </div>
          <button type="button" className="icon-button" title="关闭" aria-label="关闭" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <p className="info-description">
          面向中学教师的低门槛试卷编排平台，当前聚焦高中，并按中国试卷惯例处理题型结构、分页与打印排版。
        </p>

        <dl className="info-meta">
          <div>
            <dt>项目地址</dt>
            <dd>
              <a className="info-link" href={PROJECT_URL} target="_blank" rel="noreferrer">
                github.com/Minsecrus/QuiXam
                <ExternalLink size={13} />
              </a>
            </dd>
          </div>
          <div>
            <dt>版权</dt>
            <dd>© 2026 Minsecrus</dd>
          </div>
          <div>
            <dt>许可证</dt>
            <dd>
              <a className="info-link" href={LICENSE_URL} target="_blank" rel="noreferrer">
                MIT License
                <ExternalLink size={13} />
              </a>
            </dd>
          </div>
        </dl>

        <p className="info-license-note">
          本项目允许使用、复制、修改与分发，但须保留原版权及许可声明；软件按现状提供，不附带任何担保。
        </p>
      </section>
    </div>
  )
}
