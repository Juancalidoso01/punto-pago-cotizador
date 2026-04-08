import type { PoliticaComisionCashIn } from "@/lib/integracion";

/** Parsea entradas tipo "1,250.50", "$25", "0.15" */
export function parseMontoUsd(raw: string): number | null {
  const t = raw.trim().replace(/[$\s]/g, "").replace(/,/g, "");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Enteros para transacciones/mes (solo dígitos y separadores de miles) */
export function parseEnteroPositivo(raw: string): number | null {
  const t = raw.trim().replace(/[$,\s]/g, "");
  if (t === "") return null;
  const n = parseInt(t, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export type ResultadoComision = {
  ticketUsd: number;
  transaccionesMes: number;
  pct: number;
  fijoUsd: number;
  costoPorTxnPct: number;
  costoPorTxnFijo: number;
  comisionMensualPct: number;
  comisionMensualFijo: number;
  volumenMensualUsd: number;
  recomendacion: "pct" | "fijo" | "empate";
  /**
   * true: comisión referencial solo con el % del segmento (sin comparar con 1.25 USD).
   */
  comisionSoloPorcentaje?: boolean;
};

export function calcularComisiones(input: {
  ticketUsd: number;
  transaccionesMes: number;
  comisionPct: number;
  comisionFijaUsd: number;
}): ResultadoComision | null {
  const { ticketUsd, transaccionesMes, comisionPct, comisionFijaUsd } = input;
  if (
    ticketUsd <= 0 ||
    transaccionesMes <= 0 ||
    comisionPct < 0 ||
    comisionFijaUsd < 0
  ) {
    return null;
  }

  const costoPorTxnPct = ticketUsd * (comisionPct / 100);
  const costoPorTxnFijo = comisionFijaUsd;
  const comisionMensualPct = costoPorTxnPct * transaccionesMes;
  const comisionMensualFijo = costoPorTxnFijo * transaccionesMes;
  const volumenMensualUsd = ticketUsd * transaccionesMes;

  let recomendacion: ResultadoComision["recomendacion"];
  if (costoPorTxnPct < costoPorTxnFijo) recomendacion = "pct";
  else if (costoPorTxnPct > costoPorTxnFijo) recomendacion = "fijo";
  else recomendacion = "empate";

  return {
    ticketUsd,
    transaccionesMes,
    pct: comisionPct,
    fijoUsd: comisionFijaUsd,
    costoPorTxnPct,
    costoPorTxnFijo,
    comisionMensualPct,
    comisionMensualFijo,
    volumenMensualUsd,
    recomendacion,
    comisionSoloPorcentaje: false,
  };
}

const COMISION_FIJA_REF_USD = 1.25;

/** Cash-in / botón kioscos: 3% vs 1.25 USD o solo 5% según segmento */
export function calcularComisionesConPolitica(input: {
  ticketUsd: number;
  transaccionesMes: number;
  politica: PoliticaComisionCashIn;
}): ResultadoComision | null {
  if (input.politica === "solo_5") {
    const r = calcularComisiones({
      ticketUsd: input.ticketUsd,
      transaccionesMes: input.transaccionesMes,
      comisionPct: 5,
      comisionFijaUsd: COMISION_FIJA_REF_USD,
    });
    if (!r) return null;
    return {
      ...r,
      recomendacion: "pct",
      comisionSoloPorcentaje: true,
    };
  }
  const r = calcularComisiones({
    ticketUsd: input.ticketUsd,
    transaccionesMes: input.transaccionesMes,
    comisionPct: 3,
    comisionFijaUsd: COMISION_FIJA_REF_USD,
  });
  if (!r) return null;
  return { ...r, comisionSoloPorcentaje: false };
}

export function formatUsd(
  value: number,
  opts: { maximumFractionDigits?: number } = {},
): string {
  const max = opts.maximumFractionDigits ?? 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: max,
  }).format(value);
}

export function formatPct(value: number): string {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 3 })}%`;
}

/** Miles con coma, sin símbolo $ (inputs de montos USD; estilo en-US). */
export function formatearMontoUsdParaCampo(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Miles con coma para cantidades enteras (transacciones/mes). */
export function formatearEnteroParaCampo(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

/** Costo por transacción del modelo que conviene según la comparación */
export function costoTxnRecomendado(r: ResultadoComision): number {
  if (r.comisionSoloPorcentaje) return r.costoPorTxnPct;
  if (r.recomendacion === "pct") return r.costoPorTxnPct;
  if (r.recomendacion === "fijo") return r.costoPorTxnFijo;
  return r.costoPorTxnPct;
}

/** Comisión mensual estimada del modelo recomendado */
export function comisionMensualRecomendada(r: ResultadoComision): number {
  if (r.comisionSoloPorcentaje) return r.comisionMensualPct;
  if (r.recomendacion === "pct") return r.comisionMensualPct;
  if (r.recomendacion === "fijo") return r.comisionMensualFijo;
  return r.comisionMensualPct;
}
