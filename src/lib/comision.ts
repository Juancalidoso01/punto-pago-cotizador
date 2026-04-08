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
  };
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

/** Costo por transacción del modelo que conviene según la comparación */
export function costoTxnRecomendado(r: ResultadoComision): number {
  if (r.recomendacion === "pct") return r.costoPorTxnPct;
  if (r.recomendacion === "fijo") return r.costoPorTxnFijo;
  return r.costoPorTxnPct;
}

/** Comisión mensual estimada del modelo recomendado */
export function comisionMensualRecomendada(r: ResultadoComision): number {
  if (r.recomendacion === "pct") return r.comisionMensualPct;
  if (r.recomendacion === "fijo") return r.comisionMensualFijo;
  return r.comisionMensualPct;
}
