import { useEffect, useState } from 'react'
import { api } from './api'

export function useApi<T = any>(path: string | null): { data: T | null; error: string | null; loading: boolean } {
  const [s, setS] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: !!path })
  useEffect(() => {
    if (!path) return
    let live = true; setS((x) => ({ ...x, loading: true, error: null }))
    api<T>(path).then((data) => live && setS({ data, error: null, loading: false })).catch((e: Error) => live && setS({ data: null, error: e.message, loading: false }))
    return () => { live = false }
  }, [path])
  return s
}
