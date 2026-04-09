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
  /** Notas técnicas u operativas adicionales (opcional) */
  tecnologiaDetalle: string;
  /** Web services vs batch (set up fee según política; ver integracion.ts) */
  modalidadTecnica: "webservices" | "batch" | "";
  /** Web services: protocolo / canal entre sistemas (id de OPCIONES_WS_PROTOCOLO) */
  integracionWsProtocolo: string;
  integracionWsProtocoloOtro: string;
  /** Web services: formato o estándar de datos */
  integracionWsFormato: string;
  integracionWsFormatoOtro: string;
  /** Batch: canal unidireccional (id de OPCIONES_BATCH_CANAL) */
  integracionBatchCanal: string;
  integracionBatchCanalOtro: string;
  /** Forma de pago del set up referencial (opciones comerciales) */
  metodoPagoIntegracion:
    | ""
    | "50_50"
    | "mensual_5"
    | "anticipado_total"
    | "comercial";
  productoInteres: string;
  observaciones: string;
  condicionesComerciales: string;
  /** Obligatorio para generar PDF / registrar; se muestra en la cotización al cliente */
  nombreVendedor: string;
};

/** Opciones de pago del set up (referencial; se acuerda con comercial) */
export const METODOS_PAGO_INTEGRACION: {
  id: NonNullable<CotizacionForm["metodoPagoIntegracion"]>;
  label: string;
}[] = [
  {
    id: "50_50",
    label: "50% anticipo y 50% al culminar la integración",
  },
  {
    id: "mensual_5",
    label: "Facturación mensual de la integración (referencial, ej. 5 meses)",
  },
  {
    id: "anticipado_total",
    label: "100% anticipado antes de arrancar el proyecto de integración",
  },
  {
    id: "comercial",
    label: "A coordinar con el equipo comercial",
  },
];

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
    tecnologiaDetalle: "",
    modalidadTecnica: "",
    integracionWsProtocolo: "",
    integracionWsProtocoloOtro: "",
    integracionWsFormato: "",
    integracionWsFormatoOtro: "",
    integracionBatchCanal: "",
    integracionBatchCanalOtro: "",
    metodoPagoIntegracion: "",
    productoInteres: "",
    observaciones: "",
    condicionesComerciales: defaultCondiciones,
    nombreVendedor: "",
  };
}
