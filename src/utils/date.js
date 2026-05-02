import { Timestamp } from 'firebase/firestore'

export function formatDate(ts) {
  if (!ts) return '—'
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function tsToInput(ts) {
  if (!ts || !ts.toDate) return ''
  return ts.toDate().toISOString().split('T')[0]
}

export function inputToTs(str) {
  if (!str) return null
  return Timestamp.fromDate(new Date(str + 'T12:00:00'))
}

export function getMonthLabel(date) {
  const label = date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}
