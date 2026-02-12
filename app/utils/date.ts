export function formatDateTime(date?: string | Date) {
  if (!date) return ''

  return new Date(date).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// Date only
export function formatDate(date?: string | Date) {
  if (!date) return ''

  return new Date(date).toLocaleDateString('en-GB')
}

// Time only
export function formatTime(date?: string | Date) {
  if (!date) return ''

  return new Date(date).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}
