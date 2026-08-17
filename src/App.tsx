import { useState } from 'react'
import Header from './components/Header'
import MethodNav, { type Method } from './components/MethodNav'
import Footer from './components/Footer'
import DhvajankaPage from './pages/DhvajankaPage'
import BaseMethodPage from './pages/BaseMethodPage'

export default function App() {
  const [method, setMethod] = useState<Method>('dhvajanka')

  return (
    <div className="app-shell">
      <MethodNav method={method} onSelect={setMethod} />

      <main className="content">
        <div className="content-inner">
          <Header />
          {method === 'dhvajanka' ? <DhvajankaPage /> : <BaseMethodPage />}
          <Footer />
        </div>
      </main>
    </div>
  )
}
