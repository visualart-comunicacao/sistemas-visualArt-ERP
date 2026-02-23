export function formatCentsBRL(cents = 0) {
  const v = (Number(cents || 0) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
  return v
}

export function parseBRLToCents(input) {
  if (input == null) return 0
  const s = String(input).replace(/\s/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.')
  const n = Number(s)
  if (Number.isNaN(n)) return 0
  return Math.round(n * 100)
}
