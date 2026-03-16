export function formatCurrency(value: number, locale = "pt-BR", currency = "BRL") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(value);
}

export function formatDate(dateString: string, locale = "pt-BR") {
  const date = new Date(dateString);
  // Add timezone offset to prevent day shifting when parsing yyyy-mm-dd strings
  const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return new Intl.DateTimeFormat(locale).format(utcDate);
}
