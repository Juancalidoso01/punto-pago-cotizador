import type { CotizacionForm } from "@/lib/cotizacion-types";
import { parsePorcentajeDescuento } from "@/lib/cotizacion-kioscos-montos";
import {
  CASH_OUT_CARGO_CLIENTE_PCT,
  SETUP_FEE_HUB_REF_USD,
} from "@/lib/tipo-servicio-punto-pago";

export type MontoTarifaStdResuelto = {
  monto: number;
  baseUsd: number;
  descuentoPct: number | null;
  /** Cash out: tasa % sobre volumen antes y después del descuento sobre la tasa */
  cashOutTasaReferenciaPct?: number;
  cashOutTasaEfectivaPct?: number;
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

/**
 * Cash out: el descuento % se aplica sobre la **tasa referencial** (p. ej. 3 %),
 * no sobre el USD mensual. Ej.: 10 % de descuento sobre 3 % → tasa efectiva 2,7 %;
 * cargo = volumen × (tasa efectiva / 100).
 */
export function resolverCashOutCargoMensualPdf(
  form: CotizacionForm,
  volumenUsd: number,
  referenciaPct: number = CASH_OUT_CARGO_CLIENTE_PCT,
): MontoTarifaStdResuelto {
  const baseUsd =
    volumenUsd > 0
      ? Math.round(volumenUsd * (referenciaPct / 100) * 100) / 100
      : 0;

  const descSobreTasa = parsePorcentajeDescuento(
    form.descuentoPctCashOutCargoMensual,
  );

  if (descSobreTasa === null || volumenUsd <= 0) {
    return {
      monto: baseUsd,
      baseUsd,
      descuentoPct: null,
      cashOutTasaReferenciaPct: referenciaPct,
      cashOutTasaEfectivaPct: referenciaPct,
    };
  }

  const tasaEfectiva =
    Math.round(referenciaPct * (1 - descSobreTasa / 100) * 100) / 100;
  const monto =
    Math.round(volumenUsd * (tasaEfectiva / 100) * 100) / 100;

  return {
    monto,
    baseUsd,
    descuentoPct: descSobreTasa,
    cashOutTasaReferenciaPct: referenciaPct,
    cashOutTasaEfectivaPct: tasaEfectiva,
  };
}
