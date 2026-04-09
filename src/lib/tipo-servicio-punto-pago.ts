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
      "Preferido por cooperativas; zonas sin kioscos; saldo, portal y comisiones (detalle con comercial).",
  },
];

/** Set up fee referencial Hub de pagos (USD); Agentes no aplican set up */
export const SETUP_FEE_HUB_REF_USD = 5000;

/**
 * Hub en PDF: mensaje corto (marca blanca + reutilización de operadores Punto Pago).
 */
export const PDF_HUB_TAGLINE =
  "Solución marca blanca para tu fintech, financiera o banco: tus clientes pagan servicios en tu propio canal digital, reutilizando los operadores y convenios que ya están conectados con Punto Pago.";

/**
 * Tres ideas clave para el PDF (texto legible al rasterizar; sin microcopy).
 */
export const HUB_PAGOS_PILARES_PDF: readonly { titulo: string; resumen: string }[] = [
  {
    titulo: "Tu marca, tu canal",
    resumen: "La experiencia es tuya: app, web o banca en línea.",
  },
  {
    titulo: "Operadores Punto Pago",
    resumen: "Recargas, facturas y servicios sin integrar uno a uno con cada empresa.",
  },
  {
    titulo: "Un hub detrás",
    resumen: "Punto Pago conecta, procesa y liquida contigo según acuerdo.",
  },
] as const;

/**
 * Modelo de comisiones Hub / Agentes: marcas/empresas de servicio liquidan a Punto Pago;
 * Punto Pago comparte con el comercio. Esquema mixto (% vs centavos por pago); promedio orientativo.
 */
export const TEXTO_MODELO_COMISION_HUB_AGENTES =
  "Punto Pago conecta al comercio con marcas y empresas de servicio a las que el cliente paga facturas o recargas (por ejemplo energía, agua o telefonía: ENSA, Naturgy, entre otras; en documentación interna a veces se les dice \"operadores\"). Esas empresas liquidan comisiones a Punto Pago y Punto Pago comparte una parte con el comercio según el acuerdo y el listado vigente. No aplica una sola regla para todos: parte de las transacciones se comisiona por porcentaje sobre el monto y otra parte por centavos de dólar por transacción. Como referencia de orden de magnitud, en promedio el comercio recibe del orden de USD 0,30 por cada pago procesado; los montos pueden variar porque, por ejemplo, en tiempo aire algunas recargas (prepago más móvil y Tigo) se manejan en torno a un 2% y otros servicios pagan centavos fijos por factura. Los valores finales se confirman con el equipo comercial.";

/**
 * Comisiones Agentes (payload/Sheets): liquidación según comercio/servicio; % o centavos; orientativo.
 */
export const TEXTO_COMISIONES_PROCESAMIENTO_AGENTES =
  "Es el esquema que muchas cooperativas en Panamá prefieren para atender zonas sin kioscos. La liquidación y pago de las comisiones al agente depende de cada comercio o servicio al que el usuario paga: puede ser por comisión porcentual sobre el monto y/o por pagos fijos en centavos de dólar por transacción, según acuerdo y listado vigente. Los montos de comisión pueden variar; las cifras orientativas de esta cotización (p. ej. promedio ~USD 0,30 por pago o ~2% en ciertas recargas) son solo una idea de referencia. Condiciones finales con el equipo comercial.";

/** Agentes: sin cargo por activación; saldo recargable, portal con credenciales, descuentos por pago; comisiones que liquida Punto Pago. */
export const TEXTO_ACCESO_AGENTES_CREDENCIALES =
  "Punto Pago no cobra al agente por la activación ni por set up. Una vez activo el servicio, Punto Pago paga al agente las comisiones de procesamiento según lo acordado. El agente debe recargar y mantener un saldo o balance: con las credenciales accede a un portal web donde ve el saldo depositado, y cada pago que procesa se descuenta de ese saldo. Plazos y condiciones operativas se confirman con el equipo comercial.";

/** Subtítulo bajo el título Agentes en el PDF */
export const PDF_AGENTES_SUBTITULO =
  "Servicio preferido por cooperativas en Panamá. Llega donde aún no hay kioscos Punto Pago; territorio y operación con comercial.";

/** Insignia comercial (PDF Agentes) */
export const PDF_AGENTES_BADGE_COOPERATIVAS = "Preferido por cooperativas en Panamá";

/** Texto corto en el cotizador web para el vendedor (sin el detalle del PDF). */
export const COTIZADOR_AGENTES_VENDEDOR =
  "Este servicio aplica donde no hay kioscos Punto Pago disponibles; es el preferido por las cooperativas en Panamá. El cliente paga servicios a través del agente; condiciones y comisiones con comercial.";

/** Cargo referencial al comercio en Cash out (% sobre volumen mensual indicado) */
export const CASH_OUT_CARGO_CLIENTE_PCT = 3;

export function esTipoServicioKioscos(
  tipo: TipoServicioPuntoPago,
): tipo is "kioscos" {
  return tipo === "kioscos";
}
