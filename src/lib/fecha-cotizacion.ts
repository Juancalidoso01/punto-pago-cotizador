/** Fecha + hora de emisión (exportación) para el documento de cotización */
export function formatFechaHoraEmision(d: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Solo fecha (sin hora), texto largo en español */
export function formatSoloFechaLarga(d: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function fechaMasDias(desde: Date, dias: number): Date {
  const v = new Date(desde.getTime());
  v.setDate(v.getDate() + dias);
  return v;
}
