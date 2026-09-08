export interface CurrencyConfig {
  code: string
  symbol: string
  name: string
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: "USD", symbol: "$", name: "USD - US Dollar ($)" },
  { code: "EUR", symbol: "€", name: "EUR - Euro (€)" },
  { code: "GBP", symbol: "£", name: "GBP - British Pound (£)" },
  { code: "LKR", symbol: "Rs", name: "LKR - Sri Lankan Rupee (Rs)" },
  { code: "AUD", symbol: "A$", name: "AUD - Australian Dollar (A$)" },
  { code: "CAD", symbol: "C$", name: "CAD - Canadian Dollar (C$)" },
  { code: "JPY", symbol: "¥", name: "JPY - Japanese Yen (¥)" },
  { code: "INR", symbol: "₹", name: "INR - Indian Rupee (₹)" },
  { code: "SGD", symbol: "S$", name: "SGD - Singapore Dollar (S$)" },
  { code: "CHF", symbol: "CHF", name: "CHF - Swiss Franc (CHF)" },
  { code: "AED", symbol: "AED", name: "AED - UAE Dirham (AED)" },
  { code: "THB", symbol: "฿", name: "THB - Thai Baht (฿)" },
  { code: "NZD", symbol: "NZ$", name: "NZD - New Zealand Dollar (NZ$)" },
  { code: "CNY", symbol: "¥", name: "CNY - Chinese Yuan (¥)" },
]

export function getCurrencySymbol(code?: string | null): string {
  if (!code) return "$"
  const found = SUPPORTED_CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase())
  return found ? found.symbol : "$"
}

export function formatCurrencyAmount(amount: number | string | null | undefined, currencyCode?: string | null): string {
  const num = typeof amount === "number" ? amount : parseFloat(String(amount || 0)) || 0
  const symbol = getCurrencySymbol(currencyCode)
  return `${symbol}${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
