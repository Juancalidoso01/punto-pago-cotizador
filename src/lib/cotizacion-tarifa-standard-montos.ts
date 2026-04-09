import type { CotizacionForm } from "@/lib/cotizacion-types";
import { parsePorcentajeDescuento } from "@/lib/cotizacion-kioscos-montos";
import { SETUP_FEE_HUB_REF_USD } from "@/lib/tipo-servicio-punto-pago";

export type MontoTarifaStdResuelto = {
  monto: number;
  baseUsd: number;
  descuentoPct: number | null;
};

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

/** Set up referencial común (Hub y Cash out): USD 5.000 con descuento % opcional */
export function resolverSetupTarifaStandardPdf(
  form: CotizacionForm,
): MontoTarifaStdResuelto {
  const base = SETUP_FEE_HUB_REF_USD;
  const pct = parsePorcentajeDescuento(form.descuentoPctSetupTarifaStandard);
  const { monto, descuentoPct } = aplicarDescuento(base, pct);
  return { monto, baseUsd: base, descuentoPct };
}

/** Cargo mensual cash out (base ya calculada) con descuento % opcional */
export function resolverCashOutCargoMensualPdf(
  form: CotizacionForm,
  cargoBaseUsd: number,
): MontoTarifaStdResuelto {
  const pct = parsePorcentajeDescuento(form.descuentoPctCashOutCargoMensual);
  const { monto, descuentoPct } = aplicarDescuento(cargoBaseUsd, pct);
  return { monto, baseUsd: cargoBaseUsd, descuentoPct };
}
