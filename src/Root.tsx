import { useEffect, useState } from 'react'
import App from './App'
import AdminApp from './admin/AdminApp'

export default function Root() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const sync = () => setPath(window.location.pathname)
    window.addEventListener('popstate', sync)
    window.addEventListener('portfolio:navigate', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('portfolio:navigate', sync)
    }
  }, [])

  return path.startsWith('/admin') ? <AdminApp /> : <App />
}
