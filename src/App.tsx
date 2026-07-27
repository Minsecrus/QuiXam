import { useEffect } from 'react'
import './App.css'
import { flushSave, usePaperStore } from './store/paperStore'
import { TopBar } from './components/TopBar'
import { OutlinePanel } from './components/OutlinePanel'
import { PaperCanvas } from './components/PaperCanvas'
import { Inspector } from './components/Inspector'

function App() {
  const ready = usePaperStore((s) => s.ready)

  useEffect(() => {
    void usePaperStore.getState().init()
  }, [])

  useEffect(() => {
    const flush = () => void flushSave()
    // 撤销/重做走应用级历史（输入框是受控组件，浏览器原生撤销在此无意义）
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      const key = e.key.toLowerCase()
      if (key === 'z') {
        e.preventDefault()
        const store = usePaperStore.getState()
        if (e.shiftKey) store.redo()
        else store.undo()
      } else if (key === 'y') {
        e.preventDefault()
        usePaperStore.getState().redo()
      }
    }
    window.addEventListener('beforeunload', flush)
    // 打印前确保落库，且落库不影响打印内容
    window.addEventListener('beforeprint', flush)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('beforeunload', flush)
      window.removeEventListener('beforeprint', flush)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  if (!ready) {
    return <div className="app-loading">正在打开工作台…</div>
  }

  return (
    <div className="editor-shell">
      <TopBar />
      <main className="workspace">
        <OutlinePanel />
        <PaperCanvas />
        <Inspector />
      </main>
    </div>
  )
}

export default App
