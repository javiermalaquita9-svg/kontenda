import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export function useScripts() {
  const [scripts, setScripts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'scripts'),
      snap => {
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(s => !s.archived)
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
        setScripts(data)
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [])

  return { scripts, loading }
}
