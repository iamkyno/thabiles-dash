export const DEFAULT_TIMEZONE = "Africa/Johannesburg";

export function formatDate(date: Date | string, timeZone = DEFAULT_TIMEZONE) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone,
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string, timeZone = DEFAULT_TIMEZONE) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(date));
}

export function formatTime(date: Date | string, timeZone = DEFAULT_TIMEZONE) {
  return new Intl.DateTimeFormat("en-GB", {
    timeStyle: "short",
    timeZone,
  }).format(new Date(date));
}

export function toDatetimeLocalValue(date: Date | string) {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
