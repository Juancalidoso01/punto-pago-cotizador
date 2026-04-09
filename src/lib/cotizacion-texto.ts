import {
  formatPct,
  formatUsd,
  type ResultadoComision,
} from "@/lib/comision";
export function tituloModeloRecomendado(r: ResultadoComision): string {
  if (r.comisionSoloPorcentaje) {
    const suf =
      r.pct === 5
        ? " — política Punto Pago para este segmento"
        : "";
    return `Porcentaje sobre cada venta (${formatPct(r.pct)}${suf})`;
  }
  if (r.recomendacion === "pct") {
    return `Porcentaje sobre cada venta (${formatPct(r.pct)})`;
  }
  if (r.recomendacion === "fijo") {
    return `Monto fijo por transacción (${formatUsd(r.fijoUsd)})`;
  }
  return `Equivalente: ${formatPct(r.pct)} o ${formatUsd(r.fijoUsd)} por txn`;
}

export function textoExplicativoComision(r: ResultadoComision): string {
  if (r.comisionSoloPorcentaje) {
    return `Para la propuesta se muestra un porcentaje de ${formatPct(r.pct)} sobre cada venta (cash-in / botón en kioscos). Montos sujetos a validación comercial.`;
  }
  if (r.recomendacion === "pct") {
    return `Con el ticket y volumen indicados, conviene el modelo por porcentaje (${formatPct(r.pct)} sobre cada venta): menor costo por operación frente al cargo fijo de referencia (${formatUsd(r.fijoUsd)} por txn).`;
  }
  if (r.recomendacion === "fijo") {
    return `Con el ticket y volumen indicados, conviene el monto fijo por transacción (${formatUsd(r.fijoUsd)}): menor costo por operación; el cargo fijo pesa menos sobre el recaudo cuando el ticket es alto.`;
  }
  return `Con los datos indicados, ambos modelos (${formatPct(r.pct)} sobre cada venta y ${formatUsd(r.fijoUsd)} por transacción) arrojan el mismo costo por operación; el comercio puede elegir según preferencia de facturación.`;
}
