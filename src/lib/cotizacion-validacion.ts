import type { CotizacionForm } from "@/lib/cotizacion-types";
import { parseEnteroPositivo, parseMontoUsd, type ResultadoComision } from "@/lib/comision";
import { esEmailFormatoValido } from "@/lib/email";
import type { ResultadoPrecioIntegracion } from "@/lib/integracion";
function esCotizacionCompletaKioscos(
  form: CotizacionForm,
  resultadoIntegracion: ResultadoPrecioIntegracion | null,
  resultadoComision: ResultadoComision | null,
): boolean {
  if (form.modalidadTecnica !== "webservices" && form.modalidadTecnica !== "batch") {
    return false;
  }
  if (form.modalidadTecnica === "webservices") {
    if (!form.integracionWsProtocolo.trim()) return false;
    if (
      form.integracionWsProtocolo === "otro" &&
      !form.integracionWsProtocoloOtro.trim()
    ) {
      return false;
    }
    if (!form.integracionWsFormato.trim()) return false;
    if (
      form.integracionWsFormato === "otro" &&
      !form.integracionWsFormatoOtro.trim()
    ) {
      return false;
    }
  }
  if (form.modalidadTecnica === "batch") {
    if (!form.integracionBatchCanal.trim()) return false;
    if (
      form.integracionBatchCanal === "otro_unidireccional" &&
      !form.integracionBatchCanalOtro.trim()
    ) {
      return false;
    }
  }
  if (!form.metodoPagoIntegracion) return false;
  const ventas = parseMontoUsd(form.ventasMensualesTotalUsd);
  const cantidad = parseEnteroPositivo(form.cantidadVentasMensuales);
  if (
    ventas === null ||
    cantidad === null ||
    ventas <= 0 ||
    cantidad <= 0
  ) {
    return false;
  }
  if (!resultadoIntegracion || !resultadoComision) return false;
  return true;
}

export function esCotizacionCompleta(
  form: CotizacionForm,
  resultadoIntegracion: ResultadoPrecioIntegracion | null,
  resultadoComision: ResultadoComision | null,
): boolean {
  if (!form.empresa.trim() || !esEmailFormatoValido(form.email)) return false;
  if (!form.nombreVendedor.trim()) return false;
  if (!form.tipoServicioPuntoPago) return false;
  if (!form.industriaId.trim()) return false;

  switch (form.tipoServicioPuntoPago) {
    case "kioscos":
      return esCotizacionCompletaKioscos(
        form,
        resultadoIntegracion,
        resultadoComision,
      );
    case "hub_pagos":
    case "agentes":
      return true;
    case "cash_out": {
      const v = parseMontoUsd(form.volumenCashOutMensualUsd);
      return v !== null && v > 0;
    }
    default:
      return false;
  }
}
