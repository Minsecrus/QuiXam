import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown, Trash2 } from 'lucide-react'
import type { PaperMeta } from '../types'

interface PaperPickerProps {
  papers: PaperMeta[]
  value: string | null
  onChange: (id: string) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
}

export function PaperPicker({ papers, value, onChange, onDelete }: PaperPickerProps) {
  const [open, setOpen] = useState(false)
  const listId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const current = papers.find((paper) => paper.id === value)
  const selectedIndex = Math.max(
    0,
    papers.findIndex((paper) => paper.id === value),
  )

  const focusItem = (index: number) => {
    window.requestAnimationFrame(() => itemRefs.current[index]?.focus())
  }

  const openAt = (index: number) => {
    setOpen(true)
    focusItem(index)
  }

  const close = (restoreFocus = false) => {
    setOpen(false)
    if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus())
  }

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      openAt(selectedIndex)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      openAt(papers.length - 1)
    }
  }

  const handleListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const activeIndex = itemRefs.current.findIndex((item) => item === document.activeElement)

    if (event.key === 'Escape') {
      event.preventDefault()
      close(true)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusItem((activeIndex + 1) % papers.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusItem((activeIndex - 1 + papers.length) % papers.length)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusItem(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusItem(papers.length - 1)
    }
  }

  return (
    <div className="paper-picker">
      <button
        ref={triggerRef}
        type="button"
        className="paper-picker__trigger"
        title={current?.name ?? '切换试卷'}
        aria-label="切换试卷"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        disabled={papers.length === 0}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="paper-picker__label">{current?.name ?? '选择试卷'}</span>
        <ChevronDown className={open ? 'is-open' : undefined} size={15} aria-hidden="true" />
      </button>

      {open ? (
        <>
          <div className="menu-backdrop" onClick={() => close()} />
          <div
            id={listId}
            className="paper-picker__menu"
            role="menu"
            aria-label="试卷列表"
            onKeyDown={handleListKeyDown}
          >
            {papers.map((paper, index) => {
              const selected = paper.id === value
              return (
                <div key={paper.id} className="paper-picker__row" role="none">
                  <button
                    ref={(element) => {
                      itemRefs.current[index] = element
                    }}
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    className={`paper-picker__option${selected ? ' is-selected' : ''}`}
                    title={paper.name}
                    onClick={() => {
                      close(true)
                      if (!selected) void onChange(paper.id)
                    }}
                  >
                    <span>{paper.name}</span>
                    <span className="paper-picker__check" aria-hidden="true">
                      {selected ? <Check size={14} /> : null}
                    </span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="paper-picker__delete"
                    title={`删除“${paper.name}”`}
                    aria-label={`删除试卷“${paper.name}”`}
                    onClick={() => {
                      if (!window.confirm(`删除试卷「${paper.name}」？此操作不可恢复。`)) return
                      close(true)
                      void onDelete(paper.id)
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </>
      ) : null}
    </div>
  )
}
