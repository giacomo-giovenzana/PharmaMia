export type ExpiryStatus = 'ok' | 'warning' | 'danger'

function todayStr(): string {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

export function validateExpiryDate(value: string | undefined | null): { ok: boolean; error?: string } {
  if (!value) return { ok: false, error: 'La data di scadenza è obbligatoria.' }
  if (value < todayStr()) return { ok: false, error: 'La data di scadenza non può essere nel passato.' }
  return { ok: true }
}

export function getExpiryStatus(expiresAt: string): ExpiryStatus {
  const today = todayStr()
  if (expiresAt <= today) return 'danger'
  const threshold = new Date()
  threshold.setDate(threshold.getDate() + 30)
  const t = threshold
  const thresholdStr = [t.getFullYear(), String(t.getMonth() + 1).padStart(2, '0'), String(t.getDate()).padStart(2, '0')].join('-')
  if (expiresAt <= thresholdStr) return 'warning'
  return 'ok'
}

export function daysUntilExpiry(expiresAt: string): number {
  const today = todayStr()
  const msPerDay = 86400000
  return Math.round((new Date(expiresAt).getTime() - new Date(today).getTime()) / msPerDay)
}
