import type { ResultadoComision } from "@/lib/comision";
import {
  DEFAULT_COMISION_FIJA_USD,
  DEFAULT_COMISION_PORCENTAJE,
} from "@/lib/cotizacion-types";

export function tituloModeloRecomendado(r: ResultadoComision): string {
  if (r.comisionSoloPorcentaje && r.pct === 5) {
    return "Porcentaje sobre cada venta (5% — política Punto Pago para este segmento)";
  }
  if (r.recomendacion === "pct") {
    return `Porcentaje sobre cada venta (${DEFAULT_COMISION_PORCENTAJE}%)`;
  }
  if (r.recomendacion === "fijo") {
    return `Monto fijo por transacción (${DEFAULT_COMISION_FIJA_USD} USD)`;
  }
  return `Equivalente: ${DEFAULT_COMISION_PORCENTAJE}% o ${DEFAULT_COMISION_FIJA_USD} USD por txn`;
}

export function textoExplicativoComision(r: ResultadoComision): string {
  if (r.comisionSoloPorcentaje && r.pct === 5) {
    return "Para este segmento aplica la política referencial de 5% sobre cada venta (cash-in / botón en kioscos). Montos sujetos a validación comercial.";
  }
  if (r.recomendacion === "pct") {
    return "Con el ticket y volumen indicados, conviene el modelo por porcentaje (3% sobre cada venta): menor costo por operación frente al cargo fijo de referencia.";
  }
  if (r.recomendacion === "fijo") {
    return "Con el ticket y volumen indicados, conviene el monto fijo por transacción (1,25 USD): menor costo por operación; el cargo fijo pesa menos sobre el recaudo cuando el ticket es alto.";
  }
  return "Con los datos indicados, ambos modelos (3% sobre cada venta y 1,25 USD por transacción) arrojan el mismo costo por operación; el comercio puede elegir según preferencia de facturación.";
}
