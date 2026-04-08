/** Programa o línea de servicio Punto Pago (afecta cotización y documentos) */
export type TipoServicioPuntoPago =
  | ""
  | "kioscos"
  | "hub_pagos"
  | "cash_out"
  | "agentes";

export const TIPOS_SERVICIO_PUNTO_PAGO: {
  id: Exclude<TipoServicioPuntoPago, "">;
  label: string;
  descripcion: string;
}[] = [
  {
    id: "kioscos",
    label: "Botón en kioscos",
    descripcion:
      "Integración y comisiones según industria, modalidad y transaccionalidad (flujo actual).",
  },
  {
    id: "hub_pagos",
    label: "Hub de pagos",
    descripcion:
      "Set up referencial fijo; comisiones que Punto Pago paga al cliente por pagos procesados (afinar con cotizador en línea).",
  },
  {
    id: "cash_out",
    label: "Cash out / desembolsos",
    descripcion:
      "Cargo referencial al cliente (3%); volumen mensual de desembolsos para cotizar.",
  },
  {
    id: "agentes",
    label: "Agentes",
    descripcion:
      "Mismo esquema de referencia que Hub; cotizador detallado próximamente.",
  },
];

/** Set up fee referencial Hub de pagos / Agentes (USD) */
export const SETUP_FEE_HUB_REF_USD = 5000;

/** Cargo referencial al comercio en Cash out (% sobre volumen mensual indicado) */
export const CASH_OUT_CARGO_CLIENTE_PCT = 3;

export function esTipoServicioKioscos(
  tipo: TipoServicioPuntoPago,
): tipo is "kioscos" {
  return tipo === "kioscos";
}
