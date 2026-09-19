const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
export const fmtMoney = (n: number) => money.format(n)
export const uid = () => crypto.randomUUID()
