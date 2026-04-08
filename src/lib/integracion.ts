/**
 * Tabla referencial de costo de integración (USD).
 * Industrias pensadas para volumen masivo en Panamá y la región.
 * Ajusta montos según política comercial de Punto Pago.
 */
export const RECARGO_RECAUDO_KIOSCOS_USD = 2000;

/** Batch (FTP, SFTP, correo, vía unidireccional): set up referencial */
export const SETUP_FEE_BATCH_USD = 1000;

/** Web services: set up referencial (no banco) */
export const SETUP_FEE_WEBSERVICES_USD = 5000;

/** Web services: set up referencial para segmento banco comercial */
export const SETUP_FEE_WEBSERVICES_BANCO_USD = 7000;

/** @deprecated Usar SETUP_FEE_BATCH_USD */
export const SETUP_FEE_FTP_EMAIL_USD = SETUP_FEE_BATCH_USD;

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

export type ModalidadIntegracion = "webservices" | "batch";

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

const ID_BANCO_COMERCIAL = "banco";

/** Protocolo / canal de conexión entre sistemas (web services) */
export const OPCIONES_WS_PROTOCOLO: { id: string; label: string }[] = [
  { id: "vpn_sitio_sitio", label: "VPN sitio a sitio (IPSec / túnel)" },
  { id: "ip_whitelist", label: "IP fija / lista blanca en firewall" },
  { id: "vpn_ssl", label: "VPN SSL / acceso remoto seguro" },
  { id: "mtls", label: "mTLS / certificados mutuos" },
  { id: "api_publica", label: "API expuesta (internet) con OAuth / API keys" },
  { id: "peering", label: "Peering / interconexión (VPC, Azure, GCP)" },
  { id: "linea_dedicada", label: "Línea dedicada / MPLS" },
  { id: "otro", label: "Otro (especificar en notas)" },
];

/** Formato o estándar de intercambio de datos */
export const OPCIONES_WS_FORMATO: { id: string; label: string }[] = [
  { id: "rest_json", label: "REST + JSON" },
  { id: "soap_xml", label: "SOAP + XML" },
  { id: "graphql", label: "GraphQL" },
  { id: "archivo_plano", label: "Archivos planos (CSV, TXT)" },
  { id: "mensajeria", label: "Mensajería / colas (ej. AS2, MQ)" },
  { id: "a_definir", label: "A definir en kick-off" },
  { id: "otro", label: "Otro (especificar en notas)" },
];

/** Canal batch unidireccional */
export const OPCIONES_BATCH_CANAL: { id: string; label: string }[] = [
  { id: "ftp", label: "FTP" },
  { id: "sftp", label: "SFTP" },
  { id: "correo", label: "Reportería por correo (adjuntos)" },
  { id: "otro_unidireccional", label: "Otra vía unidireccional (especificar)" },
];

export function etiquetaPorId(
  lista: { id: string; label: string }[],
  id: string,
): string {
  return lista.find((x) => x.id === id)?.label ?? id;
}

export function calcularPrecioIntegracion(input: {
  industriaId: string;
  incluyeRecaudoKioscos: boolean;
  modalidadTecnica: "webservices" | "batch" | "";
}): ResultadoPrecioIntegracion | null {
  const ind = buscarIndustria(input.industriaId);
  if (!ind) return null;

  if (input.modalidadTecnica !== "webservices" && input.modalidadTecnica !== "batch") {
    return null;
  }

  const recargo = input.incluyeRecaudoKioscos ? RECARGO_RECAUDO_KIOSCOS_USD : 0;
  const esWs = input.modalidadTecnica === "webservices";
  const esBanco = input.industriaId === ID_BANCO_COMERCIAL;

  let precioBaseUsd: number;
  let resumenModalidad: string;

  if (esWs) {
    precioBaseUsd = esBanco
      ? SETUP_FEE_WEBSERVICES_BANCO_USD
      : SETUP_FEE_WEBSERVICES_USD;
    resumenModalidad = esBanco
      ? `Web services — set up fee referencial ${SETUP_FEE_WEBSERVICES_BANCO_USD.toLocaleString("en-US")} USD (banco comercial / universal)`
      : `Web services — set up fee referencial ${SETUP_FEE_WEBSERVICES_USD.toLocaleString("en-US")} USD`;
  } else {
    precioBaseUsd = SETUP_FEE_BATCH_USD;
    resumenModalidad = `Batch (FTP, SFTP, correo u otra vía unidireccional) — set up fee referencial ${SETUP_FEE_BATCH_USD.toLocaleString("en-US")} USD`;
  }

  return {
    industriaLabel: ind.label,
    precioBaseUsd,
    incluyeRecaudoKioscos: input.incluyeRecaudoKioscos,
    recargoKioscosUsd: recargo,
    totalUsd: precioBaseUsd + recargo,
    modalidad: esWs ? "webservices" : "batch",
    resumenModalidad,
  };
}
