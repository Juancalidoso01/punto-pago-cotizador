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

/** Payload plano para Google Sheets o logs (una fila = una cotización) */
export function buildCotizacionPayload(
  form: CotizacionForm,
  ref: string | null,
  fecha: string,
  resultadoIntegracion: ResultadoPrecioIntegracion,
  resultadoComision: ResultadoComision,
): Record<string, string | number | boolean> {
  return {
    fecha,
    ref: ref ?? "",
    empresa: form.empresa,
    email: form.email,
    contacto: form.contactoNombre,
    vendedor: form.nombreVendedor,
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
    productoInteres: form.productoInteres,
    observaciones: form.observaciones,
    condicionesComerciales: form.condicionesComerciales,
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
