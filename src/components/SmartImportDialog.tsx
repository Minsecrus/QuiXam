import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { usePaperStore } from '../store/paperStore'
import { parseExamText } from '../utils/parseImport'
import { cnNumber } from '../utils/format'

export function SmartImportDialog({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('')
  const appendSections = usePaperStore((s) => s.appendSections)

  const result = useMemo(() => parseExamText(text), [text])

  const handleImport = () => {
    appendSections(result.sections)
    onClose()
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog__header">
          <h2>粘贴导入</h2>
          <button type="button" className="icon-button" title="关闭" aria-label="关闭" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <p className="panel-hint">
          <code>一、</code>大题 · <code>1.</code>题目 · <code>A.</code>选项 · <code>（12分）</code>分值 ·{' '}
          <code>____</code>填空
        </p>

        <textarea
          className="dialog__textarea"
          rows={14}
          autoFocus
          placeholder={'一、选择题：本题共8小题，每小题5分，共40分。\n1.（5分）已知集合……\nA. 选项一　B. 选项二\nC. 选项三　D. 选项四\n2. ……'}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="dialog__preview">
          {result.questionCount > 0 ? (
            <>
              <strong>
                识别到 {result.sections.length} 个大题、{result.questionCount} 道题：
              </strong>
              <ul>
                {result.sections.map((section, index) => (
                  <li key={section.id}>
                    {cnNumber(index + 1)}、{section.title} —— {section.questions.length} 题
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <span className="panel-hint">粘贴文本后此处显示解析预览。</span>
          )}
        </div>

        <div className="dialog__footer">
          <button type="button" className="ghost-button" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={result.questionCount === 0}
            onClick={handleImport}
          >
            追加到当前试卷
          </button>
        </div>
      </div>
    </div>
  )
}
