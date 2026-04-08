/**
 * Tabla referencial de costo de integración (USD).
 * Industrias pensadas para volumen masivo en Panamá y la región.
 * Ajusta montos según política comercial de Punto Pago.
 */
export const RECARGO_RECAUDO_KIOSCOS_USD = 2000;

/** Set up fijo cuando el cliente no tiene BD y Punto Pago entrega reportes por FTP o correo */
export const SETUP_FEE_FTP_EMAIL_USD = 1000;

/** Comisión cash-in / botón kioscos: comparar 3% vs 1.25 USD, o solo 5% (segmentos) */
export type PoliticaComisionCashIn =
  | "comparar_3_vs_125"
  | "solo_5";

export type IndustriaOpcion = {
  id: string;
  label: string;
  precioIntegracionBaseUsd: number;
  /** Para agrupar en el selector */
  grupo: string;
  /**
   * Política de comisión mensual referencial (cash-in).
   * Por defecto: comparar 3% vs 1.25 USD por txn.
   */
  comisionCashIn?: PoliticaComisionCashIn;
};

/** Orden de aparición de los grupos en el <select> */
export const ORDEN_GRUPOS_INDUSTRY: string[] = [
  "Banca y servicios financieros",
  "Telecomunicaciones y medios",
  "Pagos, remesas y procesamiento",
  "Juegos y apuestas",
  "Transporte y movilidad",
  "Retail, consumo y servicios",
  "Infraestructura y sector público",
  "Comercio y otros",
];

export const INDUSTRIAS: IndustriaOpcion[] = [
  // Banca y servicios financieros
  {
    id: "banco",
    label: "Banco comercial / universal",
    precioIntegracionBaseUsd: 7000,
    grupo: "Banca y servicios financieros",
  },
  {
    id: "financiera_tradicional",
    label: "Financiera tradicional (crédito, arrendamiento, consumo)",
    precioIntegracionBaseUsd: 6000,
    grupo: "Banca y servicios financieros",
  },
  {
    id: "financiera_no_bancarizados",
    label:
      "Financiera para no bancarizados (ej. Krediya, Japy, Adelantos — mayor margen)",
    precioIntegracionBaseUsd: 7000,
    grupo: "Banca y servicios financieros",
    comisionCashIn: "solo_5",
  },
  {
    id: "cooperativa",
    label: "Cooperativa de ahorro y crédito",
    precioIntegracionBaseUsd: 5500,
    grupo: "Banca y servicios financieros",
  },
  {
    id: "seguros",
    label: "Aseguradora / sector seguros",
    precioIntegracionBaseUsd: 5500,
    grupo: "Banca y servicios financieros",
  },
  // Telecomunicaciones y medios
  {
    id: "telecom",
    label: "Telecomunicaciones / telefonía móvil e internet",
    precioIntegracionBaseUsd: 7000,
    grupo: "Telecomunicaciones y medios",
  },
  {
    id: "medios",
    label: "Medios / cable / entretenimiento",
    precioIntegracionBaseUsd: 5500,
    grupo: "Telecomunicaciones y medios",
  },
  // Pagos, remesas y procesamiento
  {
    id: "procesador_pagos",
    label: "Procesador de pagos / adquirente",
    precioIntegracionBaseUsd: 7000,
    grupo: "Pagos, remesas y procesamiento",
  },
  {
    id: "remesas",
    label: "Empresa de remesas / money transfer",
    precioIntegracionBaseUsd: 6500,
    grupo: "Pagos, remesas y procesamiento",
  },
  {
    id: "remesas_internacionales",
    label: "Remesas internacionales",
    precioIntegracionBaseUsd: 7000,
    grupo: "Pagos, remesas y procesamiento",
  },
  {
    id: "fintech",
    label: "Fintech / billetera / neobank",
    precioIntegracionBaseUsd: 6500,
    grupo: "Pagos, remesas y procesamiento",
  },
  // Juegos y apuestas
  {
    id: "apuestas_deportivas",
    label: "Casa de apuestas — rubro deportivo",
    precioIntegracionBaseUsd: 7000,
    grupo: "Juegos y apuestas",
    comisionCashIn: "solo_5",
  },
  // Transporte y movilidad
  {
    id: "transporte",
    label: "Transporte terrestre masivo (bus, flota, logística de pasajeros)",
    precioIntegracionBaseUsd: 6000,
    grupo: "Transporte y movilidad",
  },
  {
    id: "aerolinea",
    label: "Aerolínea / aviación civil / aeropuerto",
    precioIntegracionBaseUsd: 6500,
    grupo: "Transporte y movilidad",
  },
  {
    id: "logistica",
    label: "Logística / courier / última milla",
    precioIntegracionBaseUsd: 5500,
    grupo: "Transporte y movilidad",
  },
  // Retail, consumo y servicios
  {
    id: "retail_masivo",
    label: "Retail / cadenas / supermercados / grandes superficies",
    precioIntegracionBaseUsd: 5000,
    grupo: "Retail, consumo y servicios",
  },
  {
    id: "farmaceutico",
    label: "Farmacéutico / droguerías / salud privada",
    precioIntegracionBaseUsd: 5000,
    grupo: "Retail, consumo y servicios",
  },
  {
    id: "hospitalidad",
    label: "Hotelería / restaurantes / turismo",
    precioIntegracionBaseUsd: 5500,
    grupo: "Retail, consumo y servicios",
  },
  {
    id: "marketplace",
    label: "Marketplace / plataforma digital multicomercio",
    precioIntegracionBaseUsd: 5500,
    grupo: "Retail, consumo y servicios",
  },
  {
    id: "educacion",
    label: "Educación / universidades / colegios",
    precioIntegracionBaseUsd: 5000,
    grupo: "Retail, consumo y servicios",
  },
  // Infraestructura y sector público
  {
    id: "utilities",
    label: "Utilities (electricidad, agua, telecom fija)",
    precioIntegracionBaseUsd: 6000,
    grupo: "Infraestructura y sector público",
  },
  {
    id: "energia",
    label: "Energía / combustibles / estaciones de servicio",
    precioIntegracionBaseUsd: 6000,
    grupo: "Infraestructura y sector público",
  },
  {
    id: "gobierno",
    label: "Gobierno / institución pública / municipio",
    precioIntegracionBaseUsd: 6500,
    grupo: "Infraestructura y sector público",
  },
  // Comercio y otros
  {
    id: "corporativo",
    label: "Corporativo / mediana empresa (multisede)",
    precioIntegracionBaseUsd: 6000,
    grupo: "Comercio y otros",
  },
  {
    id: "pyme",
    label: "PYME / comercio minorista local",
    precioIntegracionBaseUsd: 4000,
    grupo: "Comercio y otros",
  },
  {
    id: "otro",
    label: "Otro sector (detallar en notas)",
    precioIntegracionBaseUsd: 4000,
    grupo: "Comercio y otros",
  },
];

export const TECNOLOGIAS_STACK = [
  "API REST / webhooks",
  "ERP / SAP u otro ERP",
  "Shopify",
  "WooCommerce / WordPress",
  "Magento / e-commerce custom",
  "Aplicación móvil propia (iOS / Android)",
  "Sin sistema definido (análisis en kick-off)",
  "Otro (especificar abajo)",
] as const;

export type ModalidadIntegracion = "webservices" | "batch" | "ftp_email";

export type ResultadoPrecioIntegracion = {
  industriaLabel: string;
  precioBaseUsd: number;
  incluyeRecaudoKioscos: boolean;
  recargoKioscosUsd: number;
  totalUsd: number;
  /** webservices, batch o integración por FTP/correo */
  modalidad: ModalidadIntegracion;
  /** Texto corto para la cotización */
  resumenModalidad: string;
};

export function buscarIndustria(id: string): IndustriaOpcion | undefined {
  return INDUSTRIAS.find((i) => i.id === id);
}

export function industriasEnGrupos(): { grupo: string; items: IndustriaOpcion[] }[] {
  return ORDEN_GRUPOS_INDUSTRY.map((grupo) => ({
    grupo,
    items: INDUSTRIAS.filter((i) => i.grupo === grupo),
  })).filter((g) => g.items.length > 0);
}

export function calcularPrecioIntegracion(input: {
  industriaId: string;
  incluyeRecaudoKioscos: boolean;
  /** Sin BD del cliente: reportes por FTP o correo → set up fijo */
  reporteFtpEmailSinBd: boolean;
  /** Obligatorio si no es FTP/correo: define cómo se cotiza el set up */
  modalidadTecnica: "webservices" | "batch" | "";
}): ResultadoPrecioIntegracion | null {
  const ind = buscarIndustria(input.industriaId);
  if (!ind) return null;

  const recargo = input.incluyeRecaudoKioscos ? RECARGO_RECAUDO_KIOSCOS_USD : 0;

  if (input.reporteFtpEmailSinBd) {
    return {
      industriaLabel: ind.label,
      precioBaseUsd: SETUP_FEE_FTP_EMAIL_USD,
      incluyeRecaudoKioscos: input.incluyeRecaudoKioscos,
      recargoKioscosUsd: recargo,
      totalUsd: SETUP_FEE_FTP_EMAIL_USD + recargo,
      modalidad: "ftp_email",
      resumenModalidad:
        "Integración por reporte (FTP o correo; sin base de datos en el cliente) — set up fee referencial",
    };
  }

  if (input.modalidadTecnica !== "webservices" && input.modalidadTecnica !== "batch") {
    return null;
  }

  const base = ind.precioIntegracionBaseUsd;
  const esWs = input.modalidadTecnica === "webservices";

  return {
    industriaLabel: ind.label,
    precioBaseUsd: base,
    incluyeRecaudoKioscos: input.incluyeRecaudoKioscos,
    recargoKioscosUsd: recargo,
    totalUsd: base + recargo,
    modalidad: esWs ? "webservices" : "batch",
    resumenModalidad: esWs
      ? "Web services (API / integración en línea) — set up fee por industria"
      : "Batch (archivos / procesos por lotes) — set up fee por industria",
  };
}
