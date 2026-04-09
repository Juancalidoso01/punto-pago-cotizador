import {
  calcularComisiones,
  comisionMensualRecomendada,
  costoTxnRecomendado,
  formatPct,
  formatUsd,
  parseMontoUsd,
  type ResultadoComision,
} from "@/lib/comision";
import type { CotizacionForm } from "@/lib/cotizacion-types";
import type { ResultadoPrecioIntegracion } from "@/lib/integracion";

const COMISION_FIJA_REF_USD = 1.25;

/** Resultado de aplicar (o no) una regla de descuento % sobre un monto base referencial */
export type MontoKioscosResuelto = {
  monto: number;
  baseUsd: number;
  /** Porcentaje de descuento aplicado (p. ej. 15 = 15 %); null si no hay descuento */
  descuentoPct: number | null;
};

export function parsePorcentajeDescuento(raw: string): number | null {
  const t = raw.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(100, n);
}

/** % de comisión sobre ticket (0–100); para tarifa manual del vendedor */
export function parsePorcentajeTarifa(raw: string): number | null {
  const t = raw.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0 || n > 100) return null;
  return n;
}

function aplicarDescuento(
  baseUsd: number,
  pct: number | null,
): { monto: number; descuentoPct: number | null } {
  if (pct === null || baseUsd <= 0) {
    return { monto: baseUsd, descuentoPct: null };
  }
  const monto = Math.round(baseUsd * (1 - pct / 100) * 100) / 100;
  return { monto, descuentoPct: pct };
}

/**
 * Comisión efectiva para PDF y vista: tarifa referencial del segmento o la que indique el vendedor.
 */
export function resolverResultadoComisionEfectivoKioscos(
  form: CotizacionForm,
  base: ResultadoComision | null,
): ResultadoComision | null {
  if (!base || form.tipoServicioPuntoPago !== "kioscos") return base;

  const modo = form.kioscosTarifaComercialModo;

  if (modo === "pct") {
    const p = parsePorcentajeTarifa(form.kioscosTarifaComercialPct);
    if (p === null) return base;

    if (base.comisionSoloPorcentaje) {
      const r = calcularComisiones({
        ticketUsd: base.ticketUsd,
        transaccionesMes: base.transaccionesMes,
        comisionPct: p,
        comisionFijaUsd: COMISION_FIJA_REF_USD,
      });
      if (!r) return base;
      return { ...r, recomendacion: "pct", comisionSoloPorcentaje: true };
    }

    const r = calcularComisiones({
      ticketUsd: base.ticketUsd,
      transaccionesMes: base.transaccionesMes,
      comisionPct: p,
      comisionFijaUsd: COMISION_FIJA_REF_USD,
    });
    if (!r) return base;
    return { ...r, recomendacion: "pct", comisionSoloPorcentaje: false };
  }

  if (modo === "fijo_txn") {
    const f = parseMontoUsd(form.kioscosTarifaComercialFijoTxnUsd);
    if (f === null) return base;

    if (base.comisionSoloPorcentaje) {
      const r = calcularComisiones({
        ticketUsd: base.ticketUsd,
        transaccionesMes: base.transaccionesMes,
        comisionPct: base.pct,
        comisionFijaUsd: f,
      });
      if (!r) return base;
      return { ...r, recomendacion: "fijo", comisionSoloPorcentaje: false };
    }

    const r = calcularComisiones({
      ticketUsd: base.ticketUsd,
      transaccionesMes: base.transaccionesMes,
      comisionPct: 3,
      comisionFijaUsd: f,
    });
    if (!r) return base;
    return { ...r, recomendacion: "fijo", comisionSoloPorcentaje: false };
  }

  return base;
}

export function hayTarifaComercialPersonalizadaActiva(form: CotizacionForm): boolean {
  if (form.tipoServicioPuntoPago !== "kioscos") return false;
  if (form.kioscosTarifaComercialModo === "pct") {
    return parsePorcentajeTarifa(form.kioscosTarifaComercialPct) !== null;
  }
  if (form.kioscosTarifaComercialModo === "fijo_txn") {
    const u = parseMontoUsd(form.kioscosTarifaComercialFijoTxnUsd);
    return u !== null;
  }
  return false;
}

export function notaTarifaComercialKioscosDoc(form: CotizacionForm): string | null {
  if (form.tipoServicioPuntoPago !== "kioscos") return null;
  if (form.kioscosTarifaComercialModo === "pct") {
    const p = parsePorcentajeTarifa(form.kioscosTarifaComercialPct);
    if (p === null) return null;
    return `Tarifa comercial indicada para esta propuesta: ${formatPct(p)} sobre cada venta (sustituye la referencia automática del cotizador).`;
  }
  if (form.kioscosTarifaComercialModo === "fijo_txn") {
    const u = parseMontoUsd(form.kioscosTarifaComercialFijoTxnUsd);
    if (u === null) return null;
    return `Tarifa comercial indicada para esta propuesta: ${formatUsd(u)} por transacción (sustituye la referencia automática del cotizador).`;
  }
  return null;
}

/** Descuento % sobre set up fee y total de integración (misma regla en ambas líneas) */
export function resolverMontoImplementacionKioscosPdf(
  form: CotizacionForm,
  resultadoIntegracion: ResultadoPrecioIntegracion | null,
): MontoKioscosResuelto {
  const base = resultadoIntegracion?.totalUsd ?? 0;
  const pct = parsePorcentajeDescuento(form.kioscosDescuentoPctImplementacion);
  const { monto, descuentoPct } = aplicarDescuento(base, pct);
  return { monto, baseUsd: base, descuentoPct };
}

export function resolverSetupFeeKioscosPdf(
  form: CotizacionForm,
  resultadoIntegracion: ResultadoPrecioIntegracion | null,
): MontoKioscosResuelto {
  const base = resultadoIntegracion?.precioBaseUsd ?? 0;
  const pct = parsePorcentajeDescuento(form.kioscosDescuentoPctImplementacion);
  const { monto, descuentoPct } = aplicarDescuento(base, pct);
  return { monto, baseUsd: base, descuentoPct };
}

export function resolverComisionMensualKioscosPdf(
  form: CotizacionForm,
  resultadoComision: ResultadoComision | null,
): MontoKioscosResuelto {
  const r = resolverResultadoComisionEfectivoKioscos(form, resultadoComision);
  const base = r ? comisionMensualRecomendada(r) : 0;
  const pct = parsePorcentajeDescuento(form.kioscosDescuentoPctTarifaComision);
  const { monto, descuentoPct } = aplicarDescuento(base, pct);
  return { monto, baseUsd: base, descuentoPct };
}

export function resolverCostoTxnKioscosPdf(
  form: CotizacionForm,
  resultadoComision: ResultadoComision | null,
): MontoKioscosResuelto {
  const r = resolverResultadoComisionEfectivoKioscos(form, resultadoComision);
  const base = r ? costoTxnRecomendado(r) : 0;
  const pct = parsePorcentajeDescuento(form.kioscosDescuentoPctTarifaComision);
  const { monto, descuentoPct } = aplicarDescuento(base, pct);
  return { monto, baseUsd: base, descuentoPct };
}
