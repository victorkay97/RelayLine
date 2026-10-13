export const byId = id => document.getElementById(id);
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}
export function short(value, start = 9, end = 7) {
  const string = String(value ?? '');
  return string.length > start + end ? string.slice(0, start) + '…' + string.slice(-end) : string;
}
export function status(element, text, kind = 'neutral') {
  if (!element) return;
  element.textContent = text;
  element.dataset.kind = kind;
}
export const q = (input) => encodeURIComponent(String(input));
