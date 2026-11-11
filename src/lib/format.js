// Shared display + dashboard-math helpers (single source of truth for all views).

export const peso = (n) => '₱' + Number(n || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })

// 1520 -> "1.5K" (only abbreviates from `from` upwards)
export const compact = (n, from = 1000) => (n >= from ? `${+(n / 1000).toFixed(1)}K` : Number(Math.round(n)).toLocaleString())

export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '')

// "% from last month" label used by every dashboard
export function change(cur, prev) {
  if (!prev) return cur ? { text: 'New this month', up: true } : { text: 'No data yet', up: null }
  const pct = Math.round(((cur - prev) / prev) * 100)
  return { text: `${Math.abs(pct)}% from last month`, up: pct >= 0 }
}

// Rounds a chart maximum up to a "nice" axis value
export function niceMax(max) {
  if (!max) return 100
  const pow = 10 ** Math.floor(Math.log10(max))
  return Math.ceil(max / pow) * pow
}

export const monthIndex = (d) => new Date(d).getFullYear() * 12 + new Date(d).getMonth()

