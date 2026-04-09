/* eslint-disable @next/next/no-img-element -- rasterizado fiel en PDF (html2canvas) */
import type { ReactNode } from "react";
import {
  textoExplicativoComision,
  tituloModeloRecomendado,
} from "@/lib/cotizacion-texto";
import { METODOS_PAGO_INTEGRACION, type CotizacionForm } from "@/lib/cotizacion-types";
import { formatPct, formatUsd, type ResultadoComision } from "@/lib/comision";
import { AlcanceKioscosTextoBloque } from "@/components/alcance-kioscos-texto-bloque";
import {
  notaTarifaComercialKioscosDoc,
  resolverComisionMensualKioscosPdf,
  resolverCostoTxnKioscosPdf,
  resolverMontoImplementacionKioscosPdf,
  resolverResultadoComisionEfectivoKioscos,
  resolverSetupFeeKioscosPdf,
} from "@/lib/cotizacion-kioscos-montos";
import {
  resolverCashOutCargoMensualPdf,
  resolverSetupTarifaStandardPdf,
} from "@/lib/cotizacion-tarifa-standard-montos";
import {
  fechaMasDias,
  formatFechaHoraEmision,
  formatSoloFechaLarga,
} from "@/lib/fecha-cotizacion";
import type { ResultadoPrecioIntegracion } from "@/lib/integracion";
import {
  IMAGEN_ALCANCE_API,
  IMAGEN_ALCANCE_APP,
  IMAGEN_ALCANCE_KIOSCOS,
} from "@/lib/alcance-servicio-kioscos";
import {
  CASH_OUT_CARGO_CLIENTE_PCT,
  HUB_PAGOS_PILARES_PDF,
  PDF_AGENTES_BADGE_COOPERATIVAS,
  PDF_AGENTES_SUBTITULO,
  PDF_HUB_TAGLINE,
  SETUP_FEE_HUB_REF_USD,
} from "@/lib/tipo-servicio-punto-pago";

function IconoPdfAgente({
  children,
  label,
  caption,
}: {
  children: ReactNode;
  label: string;
  caption: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="flex h-14 w-full max-w-[7.5rem] items-center justify-center rounded-xl border border-slate-200/90 bg-white shadow-sm"
        aria-hidden
      >
        {children}
      </div>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </p>
      <p className="mt-0.5 text-[11px] leading-snug text-slate-600">{caption}</p>
    </div>
  );
}

const DIAS_VALIDEZ_COTIZACION = 15;

type SvgHubPilarIconName =
  | "central"
  | "liquidez"
  | "proveedores"
  | "mensajes"
  | "portafolio";

/** Un icono por cada fila de HUB_PAGOS_PILARES_PDF (3). */
const hubPilarIconIds: readonly SvgHubPilarIconName[] = [
  "mensajes",
  "portafolio",
  "central",
];

function SvgHubPilarIcon({
  id,
  className = "h-9 w-9",
}: {
  id: SvgHubPilarIconName;
  className?: string;
}) {
  const stroke = "currentColor";
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true as const,
  };
  switch (id) {
    case "central":
      return (
        <svg {...common}>
          <path
            stroke={stroke}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 7h16M4 12h16M4 17h10"
          />
          <rect
            x="3"
            y="4"
            width="18"
            height="16"
            rx="2"
            stroke={stroke}
            strokeWidth="1.5"
          />
        </svg>
      );
    case "liquidez":
      return (
        <svg {...common}>
          <path
            stroke={stroke}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v18M8 10c0-2 1.5-3 4-3s4 1 4 3-1.5 3-4 3-4 1-4 3 1.5 3 4 3 4-1 4-3"
          />
        </svg>
      );
    case "proveedores":
      return (
        <svg {...common}>
          <path
            stroke={stroke}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 12h4l2-3 4 6 2-3h8"
          />
          <rect
            x="2"
            y="6"
            width="6"
            height="12"
            rx="1"
            stroke={stroke}
            strokeWidth="1.5"
          />
        </svg>
      );
    case "mensajes":
      return (
        <svg {...common}>
          <path
            stroke={stroke}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 8h12a2 2 0 012 2v6a2 2 0 01-2 2h-4l-4 3v-3H6a2 2 0 01-2-2v-6a2 2 0 012-2z"
          />
        </svg>
      );
    case "portafolio":
      return (
        <svg {...common}>
          <rect
            x="4"
            y="4"
            width="7"
            height="7"
            rx="1"
            stroke={stroke}
            strokeWidth="1.5"
          />
          <rect
            x="13"
            y="4"
            width="7"
            height="7"
            rx="1"
            stroke={stroke}
            strokeWidth="1.5"
          />
          <rect
            x="4"
            y="13"
            width="7"
            height="7"
            rx="1"
            stroke={stroke}
            strokeWidth="1.5"
          />
          <rect
            x="13"
            y="13"
            width="7"
            height="7"
            rx="1"
            stroke={stroke}
            strokeWidth="1.5"
          />
        </svg>
      );
    default:
      return null;
  }
}

function PdfHubPilaresGrid() {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 print:grid-cols-3">
      {HUB_PAGOS_PILARES_PDF.map((p, i) => (
        <div
          key={p.titulo}
          className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 text-center shadow-sm ring-1 ring-slate-100"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200">
            <SvgHubPilarIcon id={hubPilarIconIds[i]} className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-bold leading-snug text-slate-900">{p.titulo}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-700">{p.resumen}</p>
        </div>
      ))}
    </div>
  );
}

function PdfHubFlujoOperativo() {
  const paso =
    "flex min-w-0 flex-1 flex-col items-center rounded-xl border border-slate-200 bg-white px-3 py-4 text-center shadow-sm ring-1 ring-slate-100";
  const flecha =
    "hidden shrink-0 self-center text-xl font-bold text-indigo-400 sm:block print:block";
  return (
    <div
      className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-2 print:flex-row"
      aria-label="Flujo del hub"
    >
      <div className={paso}>
        <span className="text-xs font-bold uppercase tracking-wide text-indigo-700">
          1
        </span>
        <p className="mt-2 text-sm font-bold text-slate-900">Tu canal (marca blanca)</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-700">
          App, web o banca del cliente
        </p>
      </div>
      <div className={flecha} aria-hidden>
        →
      </div>
      <div
        className={`${paso} border-indigo-200 bg-indigo-50/60 ring-indigo-100`}
      >
        <span className="text-xs font-bold uppercase tracking-wide text-indigo-700">
          2
        </span>
        <p className="mt-2 text-sm font-bold text-slate-900">Hub Punto Pago</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-700">
          Enlaza tu canal con la red de operadores
        </p>
      </div>
      <div className={flecha} aria-hidden>
        →
      </div>
      <div className={paso}>
        <span className="text-xs font-bold uppercase tracking-wide text-indigo-700">
          3
        </span>
        <p className="mt-2 text-sm font-bold text-slate-900">Operadores de cobro</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-700">
          Servicios que el usuario ya conoce (luz, móvil, etc.)
        </p>
      </div>
    </div>
  );
}

function PdfHubBloqueComisiones() {
  return (
    <>
      <p className="mt-3 text-sm leading-relaxed text-slate-800">
        El cliente paga desde <strong>tu canal</strong>. Por detrás se utilizan los{" "}
        <strong>mismos operadores y convenios</strong> del ecosistema Punto Pago: no hace
        falta que tu institución negocie con cada empresa de servicios por separado.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-slate-800">
        Los operadores liquidan a Punto Pago y <strong>Punto Pago te participa</strong>{" "}
        según acuerdo. La forma de comisión depende del servicio (% sobre el monto o
        centavos por pago).
      </p>
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">
          Referencia de magnitud: ~USD 0,30 por pago al comercio (varía por servicio).
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
          Las cifras finales las confirma el equipo comercial.
        </p>
      </div>
    </>
  );
}

function BloqueAlcanceServicio({
  tipoServicio,
}: {
  tipoServicio: CotizacionForm["tipoServicioPuntoPago"];
}) {
  if (!tipoServicio) return null;

  if (tipoServicio === "kioscos") {
    return (
      <section
        data-pdf-evitar-corte
        className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/90 p-3 shadow-sm ring-1 ring-slate-100 sm:p-4"
      >
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Alcance del servicio
        </h3>
        <p className="mt-1.5 text-xs font-medium leading-snug text-slate-800">
          Tres canales incluidos al integrarte (misma cotización)
        </p>
        <div className="mt-2.5 grid grid-cols-3 gap-2 border-y border-slate-100 py-2.5">
          <div
            className="flex flex-col items-center justify-center"
            aria-label="Red de kioscos"
          >
            <div className="overflow-hidden rounded-lg bg-neutral-950 shadow-sm ring-1 ring-slate-100">
              <img
                src={IMAGEN_ALCANCE_KIOSCOS}
                alt=""
                className="h-[4.5rem] w-full object-contain object-center sm:h-20"
              />
            </div>
          </div>
          <div
            className="flex flex-col items-center justify-center"
            aria-label="App Punto Pago"
          >
            <div className="overflow-hidden rounded-lg bg-blue-600 shadow-sm ring-1 ring-slate-100">
              <img
                src={IMAGEN_ALCANCE_APP}
                alt=""
                className="h-[4.5rem] w-full object-contain object-center sm:h-20"
              />
            </div>
          </div>
          <div
            className="flex flex-col items-center justify-center"
            aria-label="Bancos y billeteras / API"
          >
            <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
              <img
                src={IMAGEN_ALCANCE_API}
                alt=""
                className="h-[4.5rem] w-full object-contain object-center sm:h-20"
              />
            </div>
          </div>
        </div>
        <AlcanceKioscosTextoBloque compact className="!mt-2" />
      </section>
    );
  }

  if (tipoServicio === "hub_pagos") {
    return (
      <section
        data-pdf-evitar-corte
        className="mt-4 overflow-hidden rounded-2xl border border-slate-300 bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
      >
        <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-800">
          Alcance del servicio · Hub de pagos
        </h3>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-900">
          {PDF_HUB_TAGLINE}
        </p>
        <PdfHubPilaresGrid />
      </section>
    );
  }

  if (tipoServicio === "cash_out") {
    return (
      <section
        data-pdf-evitar-corte
        className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-100"
      >
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          Alcance del servicio
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          <strong>Cash out / desembolsos:</strong> referencia sobre volumen y cargo al
          comercio; el desglose por operación y condiciones operativas se confirman en el
          acuerdo comercial.
        </p>
      </section>
    );
  }

  if (tipoServicio === "agentes") {
    return (
      <>
        <section
          data-pdf-evitar-corte
          className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/90 p-5 shadow-sm ring-1 ring-slate-100 sm:p-6"
        >
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          Alcance del servicio
        </h3>
        <p className="mt-2 text-base font-semibold leading-snug text-slate-900">
          Agentes Punto Pago
        </p>
        <p className="mt-1 text-xs text-slate-500">{PDF_AGENTES_SUBTITULO}</p>
        <div className="mt-3">
          <span className="inline-flex items-center rounded-full border border-brand/30 bg-gradient-to-r from-brand/[0.12] to-brand/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand">
            {PDF_AGENTES_BADGE_COOPERATIVAS}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 print:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-4 text-center shadow-sm ring-1 ring-emerald-100/80">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-800/90">
              Activación y set up
            </p>
            <p className="mt-2 text-4xl font-bold tabular-nums leading-none tracking-tight text-emerald-950">
              USD 0
            </p>
            <p className="mt-2 text-[11px] leading-snug text-emerald-900/85">
              Punto Pago no cobra al agente por activar ni por set up.
            </p>
          </div>
          <div className="rounded-2xl border border-brand/25 bg-gradient-to-br from-brand/[0.12] to-white p-4 text-center shadow-sm ring-1 ring-brand/15">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
              Tu comisión (referencia)
            </p>
            <p className="mt-2 text-4xl font-bold tabular-nums leading-none tracking-tight text-slate-900">
              ~0,30
            </p>
            <p className="mt-1 text-xs font-medium text-slate-600">USD por pago</p>
            <p className="mt-2 text-[11px] leading-snug text-slate-600">
              Promedio orientativo; varía por marca y tipo de servicio.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 text-center shadow-sm ring-1 ring-slate-100">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Ej. tiempo aire
            </p>
            <p className="mt-2 text-4xl font-bold tabular-nums leading-none tracking-tight text-slate-900">
              ~2%
            </p>
            <p className="mt-1 text-xs font-medium text-slate-600">recargas</p>
            <p className="mt-2 text-[11px] leading-snug text-slate-600">
              P. ej. prepago +móvil y Tigo (referencia).
            </p>
          </div>
        </div>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500">
          Cifras orientativas para Panamá. Tasas y listado final con el equipo comercial.
        </p>
        <p className="mt-4 rounded-xl border border-slate-100 bg-slate-50/90 px-4 py-3 text-center text-[12px] leading-snug text-slate-700">
          <span className="font-semibold text-slate-900">
            ¿Llevas servicios a comunidades sin kiosco?
          </span>{" "}
          Con Agentes amplías tu alcance y cobras con el respaldo de Punto Pago.
        </p>
        </section>

        <section
          data-pdf-evitar-corte
          className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/90 p-5 shadow-sm ring-1 ring-slate-100 sm:p-6"
        >
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Cómo funciona (resumen)
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3 print:grid-cols-3">
            <IconoPdfAgente
              label="Saldo"
              caption="Recargas; cada pago se descuenta del balance."
            >
              <svg
                className="h-8 w-8 text-slate-700"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 12v6.75A2.25 2.25 0 0 0 6.75 21h12c.621 0 1.125-.504 1.125-1.125V12Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12V6.75A2.25 2.25 0 0 1 5.25 4.5h3.879a2.25 2.25 0 0 1 1.59.659l1.78 1.78a2.25 2.25 0 0 0 1.59.659H18.75A2.25 2.25 0 0 1 21 9v3"
                />
              </svg>
            </IconoPdfAgente>
            <IconoPdfAgente
              label="Portal web"
              caption="Credenciales para ver saldo y movimientos."
            >
              <svg
                className="h-8 w-8 text-slate-700"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a9.004 9.004 0 0 1 8.716-6.747M12 3a9.004 9.004 0 0 0-8.716 6.747"
                />
              </svg>
            </IconoPdfAgente>
            <IconoPdfAgente
              label="Comisiones"
              caption="Punto Pago liquida al agente al activar el servicio."
            >
              <svg
                className="h-8 w-8 text-slate-700"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18.75a60.07 60.07 0 0 0 15.5 0m-15.5 0v-3.75a60.07 60.07 0 0 1 15.5 0m-15.5 0h15.5m-15.5 0H3.375A2.25 2.25 0 0 1 1.125 16.5v-9c0-.621.504-1.125 1.125-1.125h15.75c.621 0 1.125.504 1.125 1.125v9c0 .621-.504 1.125-1.125 1.125h-1.5Z"
                />
              </svg>
            </IconoPdfAgente>
          </div>

        <ul className="mt-5 space-y-2.5 text-sm leading-relaxed text-slate-700">
          <li className="flex gap-2">
            <span className="font-semibold text-slate-900">Servicios.</span>
            <span>
              Pagos a marcas y comercios de servicio (luz, agua, telefonía, facturas y
              recargas; p. ej. ENSA, Naturgy). Pensado para zonas sin kioscos Punto Pago; muy
              usado por cooperativas en Panamá.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-slate-900">Reglas.</span>
            <span>
              La liquidación y pago de comisiones al agente depende del comercio o servicio al
              que el usuario paga: puede ser por comisión % sobre el monto o por pagos fijos en
              centavos por transacción. Los montos son una idea orientativa; pueden variar según
              listado y acuerdo.
            </span>
          </li>
        </ul>
        </section>
      </>
    );
  }

  return null;
}

export type CotizacionPdfClienteDocumentProps = {
  refCotizacion: string | null;
  fechaExportacion: Date | null;
  form: CotizacionForm;
  industriaLabel: string;
  servicioLabel: string;
  ventasMensualesParseado: number | null;
  ticketPromedioDerivado: number | null;
  resultadoIntegracion: ResultadoPrecioIntegracion | null;
  resultadoComision: ResultadoComision | null;
  cashOutCargoMensualEstimado: number | null;
  volumenCashOutUsd: number;
};

function BloqueVigencia({ fechaExportacion }: { fechaExportacion: Date | null }) {
  if (!fechaExportacion) {
    return (
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
        <p className="font-semibold">Vigencia de la cotización</p>
        <p className="mt-1 text-amber-900/90">
          La validez de <strong>{DIAS_VALIDEZ_COTIZACION} días</strong> desde el momento
          de exportar el PDF se mostrará aquí al generar el documento.
        </p>
      </div>
    );
  }
  const hasta = fechaMasDias(fechaExportacion, DIAS_VALIDEZ_COTIZACION);
  return (
    <div className="rounded-xl border border-brand/25 bg-gradient-to-br from-brand/[0.08] to-white px-3 py-2.5 text-sm text-slate-800 shadow-sm ring-1 ring-brand/10 sm:px-4 sm:py-3">
      <p className="font-semibold text-slate-900">Vigencia de la cotización</p>
      <p className="mt-1 leading-snug text-slate-700 sm:mt-1.5 sm:leading-relaxed">
        Esta propuesta tiene validez de{" "}
        <strong className="text-brand">{DIAS_VALIDEZ_COTIZACION} días naturales</strong>{" "}
        contados desde su emisión (
        <time dateTime={fechaExportacion.toISOString()}>
          {formatFechaHoraEmision(fechaExportacion)}
        </time>
        ). Vence el{" "}
        <strong>{formatSoloFechaLarga(hasta)}</strong>, salvo renovación por escrito con
        Punto Pago.
      </p>
    </div>
  );
}

function textoNotaDescuentoTarifaComision(pct: number | null): string | null {
  if (pct === null) return null;
  return `Descuento comercial de ${formatPct(pct)} sobre el costo por transacción y la comisión mensual estimada (tras la tarifa indicada; referencial).`;
}

function TablaComparacionComision({
  r,
  compact = false,
  comisionMensualResumenUsd,
  costoTxnResumenUsd,
  descuentoTarifaPct,
}: {
  r: ResultadoComision;
  compact?: boolean;
  comisionMensualResumenUsd: number;
  costoTxnResumenUsd: number;
  descuentoTarifaPct: number | null;
}) {
  const mt = compact ? "mt-2" : "mt-4";
  const cell = compact ? "px-3 py-2" : "px-4 py-3";
  const ddNum = compact ? "text-base" : "text-lg";
  const finalBox = compact ? "px-3 py-3" : "px-4 py-4";
  const finalAmt = compact ? "text-xl" : "text-2xl";
  const notaDescuentoComision = textoNotaDescuentoTarifaComision(descuentoTarifaPct);

  if (r.comisionSoloPorcentaje) {
    return (
      <div className={`${mt} overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm`}>
        <div className={`border-b border-slate-100 bg-gradient-to-r from-brand/10 to-brand/5 ${compact ? "px-3 py-2" : "px-4 py-3"}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">
            Política de comisión para este segmento
          </p>
          <p className="mt-0.5 text-sm font-medium text-slate-800">
            {formatPct(r.pct)} sobre cada venta (cash-in / botón en kioscos)
          </p>
        </div>
        <dl className="grid gap-0 sm:grid-cols-2">
          <div className={`border-b border-slate-100 sm:border-r ${cell}`}>
            <dt className="text-[11px] text-slate-500">Ticket promedio</dt>
            <dd className={`mt-0.5 font-semibold tabular-nums text-slate-900 ${ddNum}`}>
              {formatUsd(r.ticketUsd)}
            </dd>
          </div>
          <div className={`border-b border-slate-100 ${cell}`}>
            <dt className="text-[11px] text-slate-500">Transacciones / mes</dt>
            <dd className={`mt-0.5 font-semibold tabular-nums text-slate-900 ${ddNum}`}>
              {r.transaccionesMes.toLocaleString("en-US")}
            </dd>
          </div>
          <div className={`border-b border-slate-100 sm:border-r sm:border-b-0 ${cell}`}>
            <dt className="text-[11px] text-slate-500">Volumen mensual estimado</dt>
            <dd className={`mt-0.5 font-semibold tabular-nums text-slate-900 ${ddNum}`}>
              {formatUsd(r.volumenMensualUsd)}
            </dd>
          </div>
          <div className={cell}>
            <dt className="text-[11px] text-slate-500">Costo por transacción</dt>
            <dd className={`mt-0.5 font-semibold tabular-nums text-brand ${ddNum}`}>
              {formatUsd(costoTxnResumenUsd)}
            </dd>
          </div>
        </dl>
        <div className={`border-t border-brand/20 bg-brand/[0.06] ${finalBox}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">
            Comisión mensual estimada
          </p>
          <p className={`mt-0.5 font-bold tabular-nums text-brand ${finalAmt}`}>
            {formatUsd(comisionMensualResumenUsd)}
          </p>
          {notaDescuentoComision && (
            <p className="mt-1 text-[10px] font-medium text-amber-800/90">
              {notaDescuentoComision}
            </p>
          )}
        </div>
      </div>
    );
  }

  const ringPct = r.recomendacion === "pct";
  const ringFijo = r.recomendacion === "fijo";

  return (
    <div className={`${compact ? "mt-2 space-y-2" : "mt-4 space-y-4"}`}>
      <p className={`leading-relaxed text-slate-600 ${compact ? "text-xs" : "text-sm"}`}>
        Referencia: se comparan{" "}
        <strong>{formatPct(r.pct)} sobre cada venta</strong> frente a{" "}
        <strong>{formatUsd(r.fijoUsd)} por transacción</strong>, con el ticket y volumen
        indicados en la cotización.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <div
          className={`relative overflow-hidden rounded-xl border bg-white shadow-sm ${
            compact ? "p-3" : "p-4"
          } ${
            ringPct
              ? "border-brand ring-2 ring-brand/30"
              : r.recomendacion === "empate"
                ? "border-slate-300 ring-1 ring-slate-200"
                : "border-slate-200"
          }`}
        >
          {ringPct && (
            <span className="absolute right-3 top-3 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Recomendado
            </span>
          )}
          {r.recomendacion === "empate" && (
            <span className="absolute right-3 top-3 rounded-full bg-slate-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Equivalente
            </span>
          )}
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Modelo porcentaje
          </p>
          <p className="mt-1 text-sm font-medium text-slate-800">
            {formatPct(r.pct)} del ticket
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-2 border-t border-slate-100 pt-2">
              <dt className="text-slate-500">Costo / transacción</dt>
              <dd className="font-semibold tabular-nums text-slate-900">
                {formatUsd(r.costoPorTxnPct)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Comisión mensual</dt>
              <dd className="font-semibold tabular-nums text-slate-900">
                {formatUsd(r.comisionMensualPct)}
              </dd>
            </div>
          </dl>
        </div>

        <div
          className={`relative overflow-hidden rounded-xl border bg-white shadow-sm ${
            compact ? "p-3" : "p-4"
          } ${
            ringFijo
              ? "border-brand ring-2 ring-brand/30"
              : r.recomendacion === "empate"
                ? "border-slate-300 ring-1 ring-slate-200"
                : "border-slate-200"
          }`}
        >
          {ringFijo && (
            <span className="absolute right-3 top-3 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Recomendado
            </span>
          )}
          {r.recomendacion === "empate" && (
            <span className="absolute right-3 top-3 rounded-full bg-slate-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Equivalente
            </span>
          )}
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Modelo monto fijo
          </p>
          <p className="mt-1 text-sm font-medium text-slate-800">
            {formatUsd(r.fijoUsd)} por operación
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-2 border-t border-slate-100 pt-2">
              <dt className="text-slate-500">Costo / transacción</dt>
              <dd className="font-semibold tabular-nums text-slate-900">
                {formatUsd(r.costoPorTxnFijo)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Comisión mensual</dt>
              <dd className="font-semibold tabular-nums text-slate-900">
                {formatUsd(r.comisionMensualFijo)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div
        className={`rounded-xl border border-brand/20 bg-gradient-to-br from-white to-brand/[0.04] ring-1 ring-brand/10 ${
          compact ? "p-3" : "p-4"
        }`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">
          Resultado aplicable (referencial)
        </p>
        <p className="mt-0.5 text-xs font-medium text-slate-800">
          {tituloModeloRecomendado(r)}
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-2 border-t border-brand/10 pt-2">
          <div>
            <p className="text-[11px] text-slate-500">Costo por transacción</p>
            <p className={`font-bold tabular-nums text-slate-900 ${compact ? "text-lg" : "text-xl"}`}>
              {formatUsd(costoTxnResumenUsd)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-500">Comisión mensual estimada</p>
            <p className={`font-bold tabular-nums text-brand ${compact ? "text-xl" : "text-2xl"}`}>
              {formatUsd(comisionMensualResumenUsd)}
            </p>
          </div>
        </div>
        {notaDescuentoComision && (
          <p className="mt-2 text-[10px] font-medium text-amber-800/90">
            {notaDescuentoComision}
          </p>
        )}
      </div>

      <p className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] leading-relaxed text-slate-600">
        {textoExplicativoComision(r)}
      </p>
    </div>
  );
}

export function CotizacionPdfClienteDocument({
  refCotizacion,
  fechaExportacion,
  form,
  industriaLabel,
  servicioLabel,
  ventasMensualesParseado,
  ticketPromedioDerivado,
  resultadoIntegracion,
  resultadoComision,
  cashOutCargoMensualEstimado,
  volumenCashOutUsd,
}: CotizacionPdfClienteDocumentProps) {
  const etiquetaAcuerdoPagoSetup =
    form.metodoPagoIntegracion.trim() === ""
      ? null
      : (METODOS_PAGO_INTEGRACION.find((m) => m.id === form.metodoPagoIntegracion)
          ?.label ?? null);

  const resultadoComisionPdf =
    form.tipoServicioPuntoPago === "kioscos" && resultadoComision
      ? (resolverResultadoComisionEfectivoKioscos(form, resultadoComision) ??
        resultadoComision)
      : resultadoComision;

  const notaTarifaKioscosPdf = notaTarifaComercialKioscosDoc(form);

  const kioscosMontosPdf =
    form.tipoServicioPuntoPago === "kioscos" && resultadoIntegracion && resultadoComision
      ? {
          impl: resolverMontoImplementacionKioscosPdf(form, resultadoIntegracion),
          com: resolverComisionMensualKioscosPdf(form, resultadoComision),
          setup: resolverSetupFeeKioscosPdf(form, resultadoIntegracion),
          costoTxn: resolverCostoTxnKioscosPdf(form, resultadoComision),
        }
      : null;

  const setupTarifaStandardResueltoPdf =
    form.tipoServicioPuntoPago === "hub_pagos" ||
    form.tipoServicioPuntoPago === "cash_out"
      ? resolverSetupTarifaStandardPdf(form)
      : null;

  const cashOutCargoResueltoPdf =
    form.tipoServicioPuntoPago === "cash_out" &&
    cashOutCargoMensualEstimado !== null
      ? resolverCashOutCargoMensualPdf(
          form,
          volumenCashOutUsd,
          CASH_OUT_CARGO_CLIENTE_PCT,
        )
      : null;

  return (
    <article
      id="cotizacion-cliente-document"
      className="fixed -left-[9999px] top-0 z-0 w-[794px] overflow-visible bg-[#eef0f8] shadow-sm print:static print:left-auto print:top-auto print:z-auto print:w-full print:max-w-none print:rounded-none print:shadow-none"
    >
      <header className="relative overflow-visible px-8 pb-9 pt-7 text-white sm:px-10 sm:pb-10 sm:pt-8 print:px-6 print:pb-8 print:pt-6">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#12132a] via-[#2a2d72] to-[#4749b6]"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, white 0, transparent 45%),
              radial-gradient(circle at 80% 0%, rgba(255,255,255,0.5) 0, transparent 35%),
              radial-gradient(circle at 100% 80%, rgba(120,140,255,0.4) 0, transparent 40%)`,
          }}
          aria-hidden
        />
        <div className="relative z-10 flex flex-col gap-3 overflow-visible sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1 overflow-visible pr-0 sm:pr-4">
            <div className="inline-block max-w-full">
              <img
                src="/brand/punto-pago-logo-cotizacion-pdf.png"
                alt="Punto Pago"
                width={240}
                height={120}
                className="block h-9 w-auto max-w-full object-contain object-left sm:h-10"
              />
            </div>
            <h1 className="mt-3 text-xl font-semibold tracking-tight sm:mt-4 sm:text-[1.5rem]">
              Tu propuesta Punto Pago
            </h1>
            <p className="mt-1.5 max-w-xl text-[13px] leading-snug text-white/90 sm:text-sm sm:leading-relaxed">
              <span className="font-medium text-white">
                Pagos y cobros en Panamá con respaldo y tecnología.
              </span>{" "}
              Resumen en USD referencial; te acompañamos a cerrar el acuerdo adecuado a tu
              operación.
            </p>
          </div>
          <div className="shrink-0 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs backdrop-blur-sm sm:px-4 sm:py-2.5 sm:text-sm">
            <p>
              <span className="font-medium text-white/80">Ref.</span>{" "}
              <span className="font-semibold tabular-nums text-white">
                {refCotizacion ?? "—"}
              </span>
            </p>
            {fechaExportacion && (
              <p className="mt-1.5">
                <span className="font-medium text-white/80">Emitida</span>
                <br />
                <time
                  className="text-white/95"
                  dateTime={fechaExportacion.toISOString()}
                >
                  {formatFechaHoraEmision(fechaExportacion)}
                </time>
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="relative z-20 -mt-7 px-6 pb-8 sm:-mt-8 sm:px-8 sm:pb-10 print:-mt-7 print:px-5 print:pb-7">
        <div
          data-pdf-evitar-corte
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl shadow-slate-900/[0.06] ring-1 ring-slate-200/60 sm:p-5 print:p-4 print:shadow-none"
        >
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Datos del cliente
          </h2>
          <dl className="mt-3 grid gap-2.5 text-sm sm:grid-cols-2 sm:gap-3">
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Cliente</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">
                {form.empresa.trim() || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Servicio cotizado</dt>
              <dd className="mt-0.5 font-medium text-slate-900">{servicioLabel}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Industria / segmento</dt>
              <dd className="mt-0.5 font-medium text-slate-900">
                {industriaLabel || "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-4 rounded-xl border border-brand/20 bg-gradient-to-br from-brand/[0.1] via-white to-slate-50/80 p-3 shadow-sm ring-1 ring-brand/10 sm:mt-5 sm:rounded-2xl sm:p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
              Te atiende
            </p>
            <p className="mt-1 text-base font-semibold tracking-tight text-slate-900 sm:mt-1.5 sm:text-lg">
              {form.nombreVendedor.trim() || "—"}
            </p>
            <p className="mt-0.5 text-[10px] leading-snug text-slate-600 sm:mt-1 sm:text-[11px]">
              Asesor comercial Punto Pago · Cotización preparada para tu revisión
            </p>
          </div>

          <div className="mt-4 sm:mt-5">
            <BloqueVigencia fechaExportacion={fechaExportacion} />
          </div>
        </div>

        <BloqueAlcanceServicio tipoServicio={form.tipoServicioPuntoPago} />

        {form.tipoServicioPuntoPago === "kioscos" &&
          resultadoIntegracion &&
          resultadoComision &&
          kioscosMontosPdf && (
            <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
              <section
                data-pdf-evitar-corte
                data-pdf-bloque-setup
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-100"
              >
                <div className="border-b border-slate-100 p-3.5 sm:p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Set up e integración
                  </h3>
                  <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-slate-900 sm:mt-2 sm:text-3xl">
                    {formatUsd(
                      kioscosMontosPdf?.impl.monto ?? resultadoIntegracion.totalUsd,
                    )}
                  </p>
                  {kioscosMontosPdf?.impl.descuentoPct !== null && (
                    <p className="mt-2 text-xs font-medium text-amber-800/90">
                      Incluye descuento comercial de{" "}
                      {formatPct(kioscosMontosPdf.impl.descuentoPct)} sobre la tarifa
                      referencial de integración (
                      {formatUsd(kioscosMontosPdf.impl.baseUsd)}).
                    </p>
                  )}
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    Incluye el costo de integración según la modalidad y opciones
                    indicadas en la cotización (referencial).
                  </p>
                  <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/90 p-2.5 sm:mt-4 sm:rounded-xl sm:p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-[11px]">
                      Acuerdo de pago del set up (referencial)
                    </p>
                    <p className="mt-1.5 text-xs font-medium leading-snug text-slate-900 sm:mt-2 sm:text-sm sm:leading-relaxed">
                      {etiquetaAcuerdoPagoSetup ?? (
                        <span className="font-normal text-slate-500">
                          Indicar en el cotizador la forma de pago del set up (sección
                          7).
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div
                  id="pdf-bloque-comision"
                  className="pdf-bloque-comision p-3.5 sm:p-4"
                >
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Comisión de servicio (referencial)
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-600 sm:mt-1.5 sm:text-xs">
                    Estimación con base en el volumen y el ticket indicados en el
                    cotizador.
                  </p>
                  {notaTarifaKioscosPdf ? (
                    <p className="mt-1.5 text-[10px] font-medium text-amber-900/90 sm:text-[11px]">
                      {notaTarifaKioscosPdf}
                    </p>
                  ) : null}
                  <TablaComparacionComision
                    r={resultadoComisionPdf!}
                    compact
                    comisionMensualResumenUsd={kioscosMontosPdf.com.monto}
                    costoTxnResumenUsd={kioscosMontosPdf.costoTxn.monto}
                    descuentoTarifaPct={kioscosMontosPdf.com.descuentoPct}
                  />
                </div>
              </section>

              <section
                data-pdf-evitar-corte
                className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 text-sm leading-relaxed text-slate-800"
              >
                <p className="font-semibold text-slate-900">Ejemplo ilustrativo</p>
                <p className="mt-2">
                  Si las ventas mensuales fueran de{" "}
                  <span className="font-semibold tabular-nums text-slate-900">
                    {ventasMensualesParseado !== null
                      ? formatUsd(ventasMensualesParseado)
                      : "—"}
                  </span>
                  {ticketPromedioDerivado !== null && (
                    <>
                      {" "}
                      (ticket promedio{" "}
                      <span className="font-medium tabular-nums">
                        {formatUsd(ticketPromedioDerivado)}
                      </span>
                      )
                    </>
                  )}
                  , la comisión mensual estimada bajo el modelo indicado arriba sería de{" "}
                  <span className="font-semibold text-brand">
                    {formatUsd(kioscosMontosPdf.com.monto)}
                  </span>
                  .
                </p>
              </section>
            </div>
          )}

        {form.tipoServicioPuntoPago === "hub_pagos" && (
          <div className="mt-6 space-y-4">
            <section
              data-pdf-evitar-corte
              className="overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-600 via-indigo-700 to-[#312e81] p-5 text-white shadow-md ring-1 ring-indigo-500/30 sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:flex-row">
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-200">
                    Set up fee (referencial)
                  </h3>
                  <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
                    {formatUsd(
                      setupTarifaStandardResueltoPdf?.monto ?? SETUP_FEE_HUB_REF_USD,
                    )}
                  </p>
                  {setupTarifaStandardResueltoPdf !== null &&
                    setupTarifaStandardResueltoPdf.descuentoPct !== null && (
                    <p className="mt-2 max-w-sm text-[11px] font-medium leading-snug text-amber-100">
                      Incluye descuento comercial de{" "}
                      {formatPct(setupTarifaStandardResueltoPdf.descuentoPct)} sobre el set
                      up referencial ({formatUsd(setupTarifaStandardResueltoPdf.baseUsd)}).
                    </p>
                  )}
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/95">
                    Activación e integración del hub según alcance acordado con comercial.
                  </p>
                </div>
                <div className="rounded-xl border border-white/25 bg-white/15 px-4 py-3 text-center backdrop-blur-sm sm:min-w-[12rem]">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-white/90">
                    Enfoque
                  </p>
                  <p className="mt-1.5 text-sm font-semibold leading-snug text-white">
                    Marca blanca · Servicios en tu canal
                  </p>
                </div>
              </div>
            </section>

            <section
              data-pdf-evitar-corte
              className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
            >
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-800">
                Cómo opera el hub
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Tres pasos: tu marca, la conexión técnica y los operadores de cobro.
              </p>
              <PdfHubFlujoOperativo />
            </section>

            <section
              data-pdf-evitar-corte
              className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
            >
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-800">
                Comisiones (orientativas)
              </h3>
              <p className="mt-1 text-xs font-medium text-slate-600">
                Cómo se reparte el ingreso cuando el usuario paga en tu canal.
              </p>
              <PdfHubBloqueComisiones />
            </section>
          </div>
        )}

        {form.tipoServicioPuntoPago === "cash_out" &&
          cashOutCargoMensualEstimado !== null &&
          setupTarifaStandardResueltoPdf &&
          cashOutCargoResueltoPdf && (
            <div className="mt-6 space-y-4">
              <section
                data-pdf-evitar-corte
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-800 to-slate-900 p-5 text-white shadow-sm sm:p-6"
              >
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                  Set up fee (referencial)
                </h3>
                <p className="mt-2 text-2xl font-bold tabular-nums sm:text-3xl">
                  {formatUsd(setupTarifaStandardResueltoPdf.monto)}
                </p>
                {setupTarifaStandardResueltoPdf.descuentoPct !== null ? (
                  <p className="mt-2 text-[11px] font-medium text-amber-100/95">
                    Descuento {formatPct(setupTarifaStandardResueltoPdf.descuentoPct)} sobre
                    tarifa referencial ({formatUsd(setupTarifaStandardResueltoPdf.baseUsd)}).
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-slate-300">
                    Misma referencia de activación que otras líneas Punto Pago; confirma
                    comercial.
                  </p>
                )}
              </section>
              <div className="grid gap-4 sm:grid-cols-2">
                <section
                  data-pdf-evitar-corte
                  className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
                >
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Volumen mensual (desembolsos)
                  </h3>
                  <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">
                    {formatUsd(volumenCashOutUsd)}
                  </p>
                </section>
                <section
                  data-pdf-evitar-corte
                  className="rounded-2xl border border-brand/25 bg-gradient-to-br from-white to-brand/[0.06] p-6 shadow-sm ring-1 ring-brand/15"
                >
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">
                    {cashOutCargoResueltoPdf.descuentoPct !== null &&
                    cashOutCargoResueltoPdf.cashOutTasaEfectivaPct !== undefined ? (
                      <>
                        Cargo estimado (tasa efectiva{" "}
                        {formatPct(cashOutCargoResueltoPdf.cashOutTasaEfectivaPct)} sobre
                        volumen)
                      </>
                    ) : (
                      <>Cargo referencial al cliente ({CASH_OUT_CARGO_CLIENTE_PCT}%)</>
                    )}
                  </h3>
                  <p className="mt-3 text-2xl font-bold tabular-nums text-brand">
                    {formatUsd(cashOutCargoResueltoPdf.monto)}
                  </p>
                  {cashOutCargoResueltoPdf.descuentoPct !== null ? (
                    <p className="mt-2 text-[11px] font-medium text-amber-800/95">
                      Descuento comercial de{" "}
                      {formatPct(cashOutCargoResueltoPdf.descuentoPct)} sobre la tasa
                      referencial ({formatPct(CASH_OUT_CARGO_CLIENTE_PCT)}): tasa efectiva{" "}
                      {formatPct(cashOutCargoResueltoPdf.cashOutTasaEfectivaPct!)}. Con la
                      tasa {formatPct(CASH_OUT_CARGO_CLIENTE_PCT)} sin descuento, el cargo
                      mensual sería {formatUsd(cashOutCargoResueltoPdf.baseUsd)}.
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm text-slate-600">
                    Punto Pago cobra por cada desembolso según acuerdo comercial.
                  </p>
                </section>
              </div>
            </div>
          )}

        <footer
          data-pdf-evitar-corte
          className="mt-8 border-t border-slate-200 pt-6 text-xs leading-relaxed text-slate-500"
        >
          <p className="text-sm font-semibold text-slate-800">¿Siguiente paso?</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">
            Hable con un asesor comercial de Punto Pago para cerrar condiciones, activar su
            operación y resolver dudas. Estamos para acompañarle.
          </p>
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
            Cifras referenciales. Vigencia, riesgo, impuestos y condiciones finales se
            confirman con el equipo comercial de Punto Pago.
          </p>
        </footer>
      </div>
    </article>
  );
}
