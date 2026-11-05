const KEY = 'cafe-nube:token';
export function getToken() {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}
export function saveToken(token) {
  sessionStorage.setItem(KEY, token);
}
export function clearToken(expected) {
  if (expected && getToken() !== expected) return;
  sessionStorage.removeItem(KEY);
  window.dispatchEvent(new Event('cafe-nube:session-ended'));
}
