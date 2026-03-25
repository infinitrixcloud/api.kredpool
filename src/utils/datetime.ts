export function toLocalDateTime(date = new Date()) {
  const pad = (n: string | number, z = 2) => String(n).padStart(z, "0");

  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());

  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  const ms = pad(date.getMilliseconds(), 3);

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}.${ms}`;
}
