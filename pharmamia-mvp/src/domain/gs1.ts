export interface Gs1Data {
  gtin?: string
  aic?: string
  expiresAt?: string
  lot?: string
  serial?: string
}

// AI code → fixed data length (not including AI prefix)
const FIXED_AI_LENGTHS: Record<string, number> = {
  '01': 14, // GTIN-14
  '17': 6,  // YYMMDD
}

// Variable-length AIs we handle
const VARIABLE_AIs = new Set(['10', '21', '710'])

function parseDateYYMMDD(s: string): string | null {
  if (s.length !== 6 || !/^\d{6}$/.test(s)) return null
  const yy = parseInt(s.slice(0, 2), 10)
  const mm = parseInt(s.slice(2, 4), 10)
  const dd = parseInt(s.slice(4, 6), 10)
  if (mm < 1 || mm > 12) return null
  const year = yy <= 49 ? 2000 + yy : 1900 + yy
  let day = dd
  if (day === 0) {
    // GS1: DD=00 means last day of the month
    day = new Date(year, mm, 0).getDate()
  }
  if (day < 1 || day > 31) return null
  // Validate against actual calendar (catches Feb 30, Apr 31, etc.)
  const probe = new Date(year, mm - 1, day)
  if (probe.getFullYear() !== year || probe.getMonth() !== mm - 1 || probe.getDate() !== day) {
    return null
  }
  return `${year}-${String(mm).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function parseGs1(raw: string): Gs1Data | null {
  // Strip optional leading FNC1
  const s = raw.startsWith('\x1d') ? raw.slice(1) : raw

  // Quick reject: a valid GS1 DataMatrix must start with a known AI
  const startsWithKnownAi =
    s.startsWith('01') ||
    s.startsWith('17') ||
    s.startsWith('10') ||
    s.startsWith('21') ||
    s.startsWith('710')
  if (!startsWithKnownAi) return null

  const result: Gs1Data = {}
  let pos = 0

  while (pos < s.length) {
    if (s[pos] === '\x1d') {
      pos++
      continue
    }

    // Try 3-char AIs before 2-char to avoid ambiguity (e.g. "710" vs "71")
    let ai: string | null = null
    let isVariable = false

    const threeChar = s.slice(pos, pos + 3)
    const twoChar = s.slice(pos, pos + 2)

    if (VARIABLE_AIs.has(threeChar)) {
      ai = threeChar
      isVariable = true
    } else if (FIXED_AI_LENGTHS[twoChar] !== undefined) {
      ai = twoChar
    } else if (VARIABLE_AIs.has(twoChar)) {
      ai = twoChar
      isVariable = true
    } else {
      // Unknown AI — stop parsing (conservative)
      break
    }

    pos += ai.length

    if (isVariable) {
      const sep = s.indexOf('\x1d', pos)
      const value = sep === -1 ? s.slice(pos) : s.slice(pos, sep)
      pos = sep === -1 ? s.length : sep
      if (ai === '710') result.aic = value
      else if (ai === '10') result.lot = value
      else if (ai === '21') result.serial = value
    } else {
      const len = FIXED_AI_LENGTHS[ai]!
      const value = s.slice(pos, pos + len)
      if (value.length < len) break // truncated — can't parse
      pos += len
      if (ai === '01') {
        if (!/^\d{14}$/.test(value)) break
        result.gtin = value
      } else if (ai === '17') {
        const date = parseDateYYMMDD(value)
        if (date) result.expiresAt = date
      }
    }
  }

  // Conservative: require at least a product identifier (GTIN or AIC) to avoid
  // false-positive detection of EAN-13 codes whose first two digits happen to be
  // a variable-length AI prefix (e.g. "10…", "21…").
  if (!result.gtin && !result.aic) {
    return null
  }

  return result
}

// Converts a GTIN-14 to EAN-13 by stripping the packaging indicator (first digit).
// Valid only when PI = 0 (single-unit retail pack), which is the case for all
// Italian pharmaceutical consumer packages.
export function normalizeGtinToEan13(gtin14: string): string | null {
  if (!/^\d{14}$/.test(gtin14)) return null
  if (gtin14[0] !== '0') return null // PI ≠ 0 — not a single-unit EAN-13 pack
  return gtin14.slice(1)
}
