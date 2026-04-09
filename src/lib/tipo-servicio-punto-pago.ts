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
      "Set up referencial; comisiones según marca/servicio (% o centavos por pago); reparto con el comercio según acuerdo (detalle con comercial).",
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
      "Mismo modelo que Hub de pagos (% o centavos por transacción; reparto con el comercio); detalle con comercial.",
  },
];

/** Set up fee referencial Hub de pagos / Agentes (USD) */
export const SETUP_FEE_HUB_REF_USD = 5000;

/**
 * Modelo de comisiones Hub / Agentes: marcas/empresas de servicio liquidan a Punto Pago;
 * Punto Pago comparte con el comercio. Esquema mixto (% vs centavos por pago); promedio orientativo.
 */
export const TEXTO_MODELO_COMISION_HUB_AGENTES =
  "Punto Pago conecta al comercio con marcas y empresas de servicio a las que el cliente paga facturas o recargas (por ejemplo energía, agua o telefonía: ENSA, Naturgy, entre otras; en documentación interna a veces se les dice \"operadores\"). Esas empresas liquidan comisiones a Punto Pago y Punto Pago comparte una parte con el comercio según el acuerdo y el listado vigente. No aplica una sola regla para todos: parte de las transacciones se comisiona por porcentaje sobre el monto y otra parte por centavos de dólar por transacción. Como referencia de orden de magnitud, en promedio el comercio recibe del orden de USD 0,30 por cada pago procesado; los montos pueden variar porque, por ejemplo, en tiempo aire algunas recargas (prepago más móvil y Tigo) se manejan en torno a un 2% y otros servicios pagan centavos fijos por factura. Los valores finales se confirman con el equipo comercial.";

/** Cargo referencial al comercio en Cash out (% sobre volumen mensual indicado) */
export const CASH_OUT_CARGO_CLIENTE_PCT = 3;

export function esTipoServicioKioscos(
  tipo: TipoServicioPuntoPago,
): tipo is "kioscos" {
  return tipo === "kioscos";
}
