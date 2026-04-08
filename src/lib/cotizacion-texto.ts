import type { ResultadoComision } from "@/lib/comision";
import {
  DEFAULT_COMISION_FIJA_USD,
  DEFAULT_COMISION_PORCENTAJE,
} from "@/lib/cotizacion-types";

export function tituloModeloRecomendado(
  r: ResultadoComision["recomendacion"],
): string {
  if (r === "pct") {
    return `Porcentaje sobre cada venta (${DEFAULT_COMISION_PORCENTAJE}%)`;
  }
  if (r === "fijo") {
    return `Monto fijo por transacción (${DEFAULT_COMISION_FIJA_USD} USD)`;
  }
  return `Equivalente: ${DEFAULT_COMISION_PORCENTAJE}% o ${DEFAULT_COMISION_FIJA_USD} USD por txn`;
}
