/**
 * Valida formato básico de correo: un solo @, parte local no vacía y dominio con
 * al menos un punto (p. ej. .com) y etiquetas sin puntos consecutivos.
 */
export function esEmailFormatoValido(raw: string): boolean {
  const s = raw.trim();
  if (s.length === 0 || s.length > 254) return false;

  const at = s.indexOf("@");
  if (at <= 0) return false;
  if (s.lastIndexOf("@") !== at) return false;

  const local = s.slice(0, at);
  const domain = s.slice(at + 1);
  if (!local || !domain) return false;
  if (local.includes("..") || domain.includes("..")) return false;
  if (!domain.includes(".")) return false;

  const labels = domain.split(".");
  if (labels.some((l) => l.length === 0)) return false;

  const tld = labels[labels.length - 1];
  if (!tld || tld.length < 2) return false;

  return true;
}
