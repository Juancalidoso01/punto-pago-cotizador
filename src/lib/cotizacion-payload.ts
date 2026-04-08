import type { CotizacionForm } from "@/lib/cotizacion-types";
import {
  comisionMensualRecomendada,
  costoTxnRecomendado,
  formatUsd,
  parseEnteroPositivo,
  parseMontoUsd,
  type ResultadoComision,
} from "@/lib/comision";
import type { ResultadoPrecioIntegracion } from "@/lib/integracion";
import { tituloModeloRecomendado } from "@/lib/cotizacion-texto";
import {
  CASH_OUT_CARGO_CLIENTE_PCT,
  SETUP_FEE_HUB_REF_USD,
} from "@/lib/tipo-servicio-punto-pago";

/** Payload plano para Google Sheets o logs (una fila = una cotización) */
export function buildCotizacionPayload(
  form: CotizacionForm,
  ref: string | null,
  fecha: string,
  resultadoIntegracion: ResultadoPrecioIntegracion | null,
  resultadoComision: ResultadoComision | null,
): Record<string, string | number | boolean> {
  const base: Record<string, string | number | boolean> = {
    fecha,
    ref: ref ?? "",
    empresa: form.empresa,
    email: form.email,
    contacto: form.contactoNombre,
    vendedor: form.nombreVendedor,
    tipoServicioPuntoPago: form.tipoServicioPuntoPago,
    volumenCashOutMensualUsd: form.volumenCashOutMensualUsd,
    productoInteres: form.productoInteres,
    observaciones: form.observaciones,
    condicionesComerciales: form.condicionesComerciales,
  };

  if (form.tipoServicioPuntoPago === "kioscos" && resultadoIntegracion && resultadoComision) {
    return {
      ...base,
      industria: resultadoIntegracion.industriaLabel,
      modalidad: resultadoIntegracion.resumenModalidad,
      reporteFtpEmailSinBd: form.reporteFtpEmailSinBd,
      tecnologia: form.tecnologiaStack,
      tecnologiaDetalle: form.tecnologiaDetalle,
      recaudoKioscos: form.incluyeRecaudoKioscos,
      setupFeeUsd: resultadoIntegracion.precioBaseUsd,
      totalIntegracionUsd: resultadoIntegracion.totalUsd,
      ventasMensualesUsd: parseMontoUsd(form.ventasMensualesTotalUsd) ?? 0,
      cantidadVentasMes: parseEnteroPositivo(form.cantidadVentasMensuales) ?? 0,
      canal: form.canal,
      noBancarizados: form.estimadoNoBancarizados,
      modeloComisionRecomendado: tituloModeloRecomendado(
        resultadoComision.recomendacion,
      ),
      costoTxnRecomendadoUsd: costoTxnRecomendado(resultadoComision),
      comisionMensualEstUsd: comisionMensualRecomendada(resultadoComision),
      volumenMensualUsd: resultadoComision.volumenMensualUsd,
      costoTxnRecomendadoFmt: formatUsd(costoTxnRecomendado(resultadoComision)),
      comisionMensualEstFmt: formatUsd(
        comisionMensualRecomendada(resultadoComision),
      ),
      volumenMensualFmt: formatUsd(resultadoComision.volumenMensualUsd),
    };
  }

  if (form.tipoServicioPuntoPago === "hub_pagos") {
    return {
      ...base,
      setupFeeHubRefUsd: SETUP_FEE_HUB_REF_USD,
      notaComisiones:
        "Comisiones que Punto Pago paga al cliente por pagos procesados (estimación; cotizador en línea próximo).",
    };
  }

  if (form.tipoServicioPuntoPago === "agentes") {
    return {
      ...base,
      setupFeeHubRefUsd: SETUP_FEE_HUB_REF_USD,
      nota:
        "Agentes: mismo esquema referencial que Hub; cotizador detallado pendiente.",
    };
  }

  if (form.tipoServicioPuntoPago === "cash_out") {
    const vol = parseMontoUsd(form.volumenCashOutMensualUsd) ?? 0;
    const cargoEst = vol * (CASH_OUT_CARGO_CLIENTE_PCT / 100);
    return {
      ...base,
      setupFeeHubRefUsd: SETUP_FEE_HUB_REF_USD,
      volumenCashOutMensualUsdNum: vol,
      cargoClienteCashOutPct: CASH_OUT_CARGO_CLIENTE_PCT,
      cargoMensualEstimadoUsd: cargoEst,
      cargoMensualEstimadoFmt: formatUsd(cargoEst),
      nota:
        "Cargo referencial 3% al cliente sobre volumen mensual indicado; Punto Pago cobra por desembolso según acuerdo.",
    };
  }

  return base;
}
