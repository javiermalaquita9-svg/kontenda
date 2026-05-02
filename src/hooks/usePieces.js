import { useState, useEffect } from 'react'
import { collection, collectionGroup, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'

export function usePieces(clientId = null) {
  const [pieces, setPieces] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const q = clientId
      ? query(collection(db, 'clients', clientId, 'pieces'), orderBy('publishDate', 'desc'))
      : collectionGroup(db, 'pieces')

    const unsub = onSnapshot(
      q,
      snap => {
        let data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        if (!clientId) {
          data.sort((a, b) => {
            const tA = a.publishDate?.toMillis?.() ?? 0
            const tB = b.publishDate?.toMillis?.() ?? 0
            return tB - tA
          })
        }
        setPieces(data)
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [clientId])

  return { pieces, loading }
}
