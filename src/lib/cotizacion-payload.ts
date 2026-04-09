import type { CotizacionForm } from "@/lib/cotizacion-types";
import {
  comisionMensualRecomendada,
  costoTxnRecomendado,
  formatUsd,
  parseEnteroPositivo,
  parseMontoUsd,
  type ResultadoComision,
} from "@/lib/comision";
import {
  buscarIndustria,
  type ResultadoPrecioIntegracion,
} from "@/lib/integracion";
import {
  resolverComisionMensualKioscosPdf,
  resolverCostoTxnKioscosPdf,
  resolverMontoImplementacionKioscosPdf,
  resolverResultadoComisionEfectivoKioscos,
  resolverSetupFeeKioscosPdf,
} from "@/lib/cotizacion-kioscos-montos";
import { tituloModeloRecomendado } from "@/lib/cotizacion-texto";
import {
  resolverCashOutCargoMensualPdf,
  resolverSetupTarifaStandardPdf,
} from "@/lib/cotizacion-tarifa-standard-montos";
import {
  CASH_OUT_CARGO_CLIENTE_PCT,
  SETUP_FEE_HUB_REF_USD,
  TEXTO_ACCESO_AGENTES_CREDENCIALES,
  TEXTO_COMISIONES_PROCESAMIENTO_AGENTES,
  TEXTO_MODELO_COMISION_HUB_AGENTES,
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
    industriaId: form.industriaId,
    industria: buscarIndustria(form.industriaId)?.label ?? "",
    tipoServicioPuntoPago: form.tipoServicioPuntoPago,
    volumenCashOutMensualUsd: form.volumenCashOutMensualUsd,
    productoInteres: form.productoInteres,
    observaciones: form.observaciones,
    condicionesComerciales: form.condicionesComerciales,
  };

  if (form.tipoServicioPuntoPago === "kioscos" && resultadoIntegracion && resultadoComision) {
    const rEf =
      resolverResultadoComisionEfectivoKioscos(form, resultadoComision) ??
      resultadoComision;
    const implPdf = resolverMontoImplementacionKioscosPdf(form, resultadoIntegracion);
    const comPdf = resolverComisionMensualKioscosPdf(form, resultadoComision);
    const setupPdf = resolverSetupFeeKioscosPdf(form, resultadoIntegracion);
    const costoTxnPdf = resolverCostoTxnKioscosPdf(form, resultadoComision);
    return {
      ...base,
      modalidad: resultadoIntegracion.resumenModalidad,
      modalidadTecnica: form.modalidadTecnica,
      integracionWsProtocolo: form.integracionWsProtocolo,
      integracionWsProtocoloOtro: form.integracionWsProtocoloOtro,
      integracionWsFormato: form.integracionWsFormato,
      integracionWsFormatoOtro: form.integracionWsFormatoOtro,
      integracionBatchCanal: form.integracionBatchCanal,
      integracionBatchCanalOtro: form.integracionBatchCanalOtro,
      metodoPagoIntegracion: form.metodoPagoIntegracion,
      tecnologiaDetalle: form.tecnologiaDetalle,
      recaudoKioscos: false,
      setupFeeUsd: resultadoIntegracion.precioBaseUsd,
      setupFeeBaseReferencialUsd: setupPdf.baseUsd,
      setupFeeMostradoPdfUsd: setupPdf.monto,
      setupFeeDescuentoPct: setupPdf.descuentoPct ?? 0,
      totalIntegracionUsd: resultadoIntegracion.totalUsd,
      totalIntegracionBaseReferencialUsd: implPdf.baseUsd,
      totalIntegracionMostradoPdfUsd: implPdf.monto,
      descuentoPctImplementacion: implPdf.descuentoPct ?? 0,
      ventasMensualesUsd: parseMontoUsd(form.ventasMensualesTotalUsd) ?? 0,
      cantidadVentasMes: parseEnteroPositivo(form.cantidadVentasMensuales) ?? 0,
      politicaComisionCashIn: resultadoComision.comisionSoloPorcentaje
        ? "solo_5"
        : "comparar_3_vs_125",
      modeloComisionRecomendado: tituloModeloRecomendado(rEf),
      tarifaComercialModo: form.kioscosTarifaComercialModo,
      tarifaComercialPct: form.kioscosTarifaComercialPct,
      tarifaComercialFijoTxnUsd: form.kioscosTarifaComercialFijoTxnUsd,
      costoTxnRecomendadoUsd: costoTxnRecomendado(rEf),
      costoTxnBaseReferencialUsd: costoTxnPdf.baseUsd,
      costoTxnMostradoPdfUsd: costoTxnPdf.monto,
      descuentoPctTarifaComision: comPdf.descuentoPct ?? 0,
      comisionMensualEstUsd: comisionMensualRecomendada(rEf),
      comisionMensualBaseReferencialUsd: comPdf.baseUsd,
      comisionMensualMostradaPdfUsd: comPdf.monto,
      volumenMensualUsd: resultadoComision.volumenMensualUsd,
      costoTxnRecomendadoFmt: formatUsd(costoTxnRecomendado(rEf)),
      comisionMensualEstFmt: formatUsd(comisionMensualRecomendada(rEf)),
      comisionMensualMostradaPdfFmt: formatUsd(comPdf.monto),
      volumenMensualFmt: formatUsd(resultadoComision.volumenMensualUsd),
    };
  }

  if (form.tipoServicioPuntoPago === "hub_pagos") {
    const setupR = resolverSetupTarifaStandardPdf(form);
    return {
      ...base,
      setupFeeHubRefUsd: SETUP_FEE_HUB_REF_USD,
      setupFeeHubBaseReferencialUsd: setupR.baseUsd,
      setupFeeHubMostradoPdfUsd: setupR.monto,
      descuentoPctSetupTarifaStandard: setupR.descuentoPct ?? 0,
      notaComisiones: TEXTO_MODELO_COMISION_HUB_AGENTES,
    };
  }

  if (form.tipoServicioPuntoPago === "agentes") {
    return {
      ...base,
      accesoAgentesCredenciales: TEXTO_ACCESO_AGENTES_CREDENCIALES,
      notaComisiones: TEXTO_COMISIONES_PROCESAMIENTO_AGENTES,
    };
  }

  if (form.tipoServicioPuntoPago === "cash_out") {
    const vol = parseMontoUsd(form.volumenCashOutMensualUsd) ?? 0;
    const setupR = resolverSetupTarifaStandardPdf(form);
    const cargoR = resolverCashOutCargoMensualPdf(form, vol);
    return {
      ...base,
      setupFeeHubRefUsd: SETUP_FEE_HUB_REF_USD,
      setupFeeHubBaseReferencialUsd: setupR.baseUsd,
      setupFeeHubMostradoPdfUsd: setupR.monto,
      descuentoPctSetupTarifaStandard: setupR.descuentoPct ?? 0,
      volumenCashOutMensualUsdNum: vol,
      cargoClienteCashOutPct: CASH_OUT_CARGO_CLIENTE_PCT,
      cargoClienteCashOutTasaEfectivaPct:
        cargoR.cashOutTasaEfectivaPct ?? CASH_OUT_CARGO_CLIENTE_PCT,
      cargoMensualBaseReferencialUsd: cargoR.baseUsd,
      cargoMensualEstimadoUsd: cargoR.baseUsd,
      cargoMensualMostradoPdfUsd: cargoR.monto,
      descuentoPctCashOutCargoMensual: cargoR.descuentoPct ?? 0,
      cargoMensualEstimadoFmt: formatUsd(cargoR.monto),
      nota:
        "Cargo referencial 3% al cliente sobre volumen mensual indicado; Punto Pago cobra por desembolso según acuerdo.",
    };
  }

  return base;
}
