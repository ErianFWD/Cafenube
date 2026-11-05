let version = 0;
export const sessionVersion = () => version;
export function newSession() {
  version += 1;
}
export function endSession(expected) {
  if (expected !== undefined && expected !== version) return;
  version += 1;
  window.dispatchEvent(new Event('cafe-nube:session-ended'));
}
// Retira únicamente el token de la versión anterior; la sesión actual usa HttpOnly.
try {
  sessionStorage.removeItem('cafe-nube:token');
} catch {
  /* Almacenamiento opcional. */
}
