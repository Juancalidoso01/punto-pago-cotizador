import type { TipoServicioPuntoPago } from "@/lib/tipo-servicio-punto-pago";

export type CotizacionForm = {
  empresa: string;
  email: string;
  contactoNombre: string;
  /** Línea de negocio Punto Pago (define qué secciones y montos aplican) */
  tipoServicioPuntoPago: TipoServicioPuntoPago;
  /** Volumen mensual estimado de cash out / desembolsos (USD, texto) */
  volumenCashOutMensualUsd: string;
  /** Monto total mensual de ventas en USD (texto libre del input) */
  ventasMensualesTotalUsd: string;
  /** Cantidad total de ventas u operaciones al mes */
  cantidadVentasMensuales: string;
  /** Canal o modelo de cobro predominante (Panamá) */
  canal: string;
  /**
   * Estimación de clientes no bancarizados aplicables a pago en efectivo en red
   * (relevante para Punto Pago).
   */
  estimadoNoBancarizados: string;
  /** Segmento para tabla de precio de integración (ej. banco vs PYME) */
  industriaId: string;
  /** Stack o plataforma del cliente para integrar */
  tecnologiaStack: string;
  /** Detalle si eligió "Otro" o notas técnicas */
  tecnologiaDetalle: string;
  /** Activar recaudo / recarga en red de kioscos Punto Pago (suma recargo USD) */
  incluyeRecaudoKioscos: boolean;
  /** Web services vs batch (set up fee según política; ver integracion.ts) */
  modalidadTecnica: "webservices" | "batch" | "";
  /** Sin BD en cliente: reportes por FTP o correo → set up fijo referencial */
  reporteFtpEmailSinBd: boolean;
  productoInteres: string;
  observaciones: string;
  condicionesComerciales: string;
  nombreVendedor: string;
};

export const defaultCondiciones =
  "Validez de la presente cotización: 15 días corridos. Condiciones comerciales y tarifas finales sujetas a validación de riesgo y documentación del comercio. Costos de integración y alcance técnico se confirman en kick-off. Montos en dólares estadounidenses (USD).";

/** Tarifas referenciales Punto Pago (comisión sobre cada operación vs. fijo por transacción) */
export const DEFAULT_COMISION_PORCENTAJE = "3";
export const DEFAULT_COMISION_FIJA_USD = "1.25";

export function createEmptyForm(): CotizacionForm {
  return {
    empresa: "",
    email: "",
    contactoNombre: "",
    tipoServicioPuntoPago: "",
    volumenCashOutMensualUsd: "",
    ventasMensualesTotalUsd: "",
    cantidadVentasMensuales: "",
    canal: "",
    estimadoNoBancarizados: "",
    industriaId: "",
    tecnologiaStack: "",
    tecnologiaDetalle: "",
    incluyeRecaudoKioscos: false,
    modalidadTecnica: "",
    reporteFtpEmailSinBd: false,
    productoInteres: "",
    observaciones: "",
    condicionesComerciales: defaultCondiciones,
    nombreVendedor: "",
  };
}
