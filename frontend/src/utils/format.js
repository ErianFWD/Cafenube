export const money = (centimos) =>
  new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(centimos || 0) / 100);
export const dateTime = (iso) =>
  new Intl.DateTimeFormat('es-CR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Costa_Rica',
  }).format(new Date(iso));
export function moneyInput(centimos) {
  return (Number(centimos || 0) / 100).toFixed(2);
}
export function centsFromInput(value) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value))
    throw new Error('Escriba un precio válido con hasta dos decimales.');
  const [units, decimal = ''] = value.split('.');
  const cents = Number(units) * 100 + Number(decimal.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > 100000000)
    throw new Error('El precio debe estar entre ₡0 y ₡1 000 000.');
  return cents;
}
export function localDateInput(iso = new Date().toISOString()) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Costa_Rica',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .format(new Date(iso))
    .replace(' ', 'T');
}
export const isoFromLocalDate = (value) => new Date(`${value}-06:00`).toISOString();
export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
