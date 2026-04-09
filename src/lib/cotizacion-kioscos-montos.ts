import {
  comisionMensualRecomendada,
  parseMontoUsd,
  type ResultadoComision,
} from "@/lib/comision";
import type { CotizacionForm } from "@/lib/cotizacion-types";
import type { ResultadoPrecioIntegracion } from "@/lib/integracion";

export function resolverMontoImplementacionKioscosPdf(
  form: CotizacionForm,
  resultadoIntegracion: ResultadoPrecioIntegracion | null,
): { monto: number; esPersonalizado: boolean } {
  const o = parseMontoUsd(form.kioscosMontoImplementacionPersonalizadoUsd);
  if (o !== null && o > 0) {
    return { monto: o, esPersonalizado: true };
  }
  return {
    monto: resultadoIntegracion?.totalUsd ?? 0,
    esPersonalizado: false,
  };
}

export function resolverComisionMensualKioscosPdf(
  form: CotizacionForm,
  resultadoComision: ResultadoComision | null,
): { monto: number; esPersonalizado: boolean } {
  const o = parseMontoUsd(form.kioscosComisionMensualPersonalizadaUsd);
  if (o !== null && o > 0) {
    return { monto: o, esPersonalizado: true };
  }
  return {
    monto: resultadoComision ? comisionMensualRecomendada(resultadoComision) : 0,
    esPersonalizado: false,
  };
}
