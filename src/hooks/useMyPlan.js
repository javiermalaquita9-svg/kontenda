import { useState, useEffect } from 'react'
import { doc, collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export function useMyPlan(clientId) {
  const [plan,       setPlan]       = useState(null)
  const [deliveries, setDeliveries] = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    if (!clientId) { setLoading(false); return }
    let loaded = { plan: false, del: false }
    const done = () => { if (loaded.plan && loaded.del) setLoading(false) }
    const subs = []

    subs.push(onSnapshot(
      doc(db, 'clients', clientId, 'plan', 'current'),
      snap => {
        console.log('useMyPlan snap — exists:', snap.exists(), '| path:', snap.ref.path, '| data:', snap.data())
        setPlan(snap.exists() ? snap.data() : null); loaded.plan = true; done()
      }
    ))

    subs.push(onSnapshot(
      query(collection(db, 'clients', clientId, 'deliveries'), orderBy('deliveryNumber')),
      snap => { setDeliveries(snap.docs.map(d => ({ id: d.id, ...d.data() }))); loaded.del = true; done() }
    ))

    return () => subs.forEach(u => u())
  }, [clientId])

  return { plan, deliveries, loading }
}
