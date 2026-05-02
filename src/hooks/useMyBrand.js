import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export function useMyBrand(clientId) {
  const [brand,   setBrand]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientId) { setLoading(false); return }
    const unsub = onSnapshot(
      doc(db, 'clients', clientId, 'brandAssets', 'current'),
      snap => { setBrand(snap.exists() ? snap.data() : null); setLoading(false) }
    )
    return unsub
  }, [clientId])

  return { brand, loading }
}
