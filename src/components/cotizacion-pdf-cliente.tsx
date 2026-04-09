/* eslint-disable @next/next/no-img-element -- rasterizado fiel en PDF (html2canvas) */
import {
  textoExplicativoComision,
  tituloModeloRecomendado,
} from "@/lib/cotizacion-texto";
import {
  DEFAULT_COMISION_FIJA_USD,
  DEFAULT_COMISION_PORCENTAJE,
  METODOS_PAGO_INTEGRACION,
  type CotizacionForm,
} from "@/lib/cotizacion-types";
import {
  comisionMensualRecomendada,
  costoTxnRecomendado,
  formatPct,
  formatUsd,
  type ResultadoComision,
} from "@/lib/comision";
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
  SETUP_FEE_HUB_REF_USD,
  TEXTO_MODELO_COMISION_HUB_AGENTES,
} from "@/lib/tipo-servicio-punto-pago";

const DIAS_VALIDEZ_COTIZACION = 15;

function BloqueAlcanceServicio({
  tipoServicio,
}: {
  tipoServicio: CotizacionForm["tipoServicioPuntoPago"];
}) {
  if (!tipoServicio) return null;

  if (tipoServicio === "kioscos") {
    return (
      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/90 p-5 shadow-sm ring-1 ring-slate-100">
        <div className="grid grid-cols-3 gap-3 border-y border-slate-100 py-4">
          <div
            className="flex flex-col items-center justify-center"
            aria-label="Red de kioscos"
          >
            <div className="overflow-hidden rounded-xl bg-neutral-950 shadow-sm ring-1 ring-slate-100">
              <img
                src={IMAGEN_ALCANCE_KIOSCOS}
                alt=""
                className="h-28 w-full object-contain object-center sm:h-32"
              />
            </div>
          </div>
          <div
            className="flex flex-col items-center justify-center"
            aria-label="App Punto Pago"
          >
            <div className="overflow-hidden rounded-xl bg-blue-600 shadow-sm ring-1 ring-slate-100">
              <img
                src={IMAGEN_ALCANCE_APP}
                alt=""
                className="h-28 w-full object-contain object-center sm:h-32"
              />
            </div>
          </div>
          <div
            className="flex flex-col items-center justify-center"
            aria-label="Bancos y billeteras / API"
          >
            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
              <img
                src={IMAGEN_ALCANCE_API}
                alt=""
                className="h-28 w-full object-contain object-center sm:h-32"
              />
            </div>
          </div>
        </div>
        <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-relaxed text-slate-700">
          <li>
            <strong>App Punto Pago</strong> y <strong>red de kioscos</strong>: tu comercio
            aparecerá dentro de nuestra app, que tiene más de <strong>150 mil usuarios activos al
            mes</strong>, y también en nuestra red de kioscos. Esto significa que más personas
            podrán encontrarte y pagarte fácilmente. En la app, los clientes pueden hacer
            recargas y pagos usando tarjetas bancarias, incluyendo <strong>Clave</strong>, además
            de opciones como <strong>Yappy</strong> y <strong>transferencias ACH</strong>. Todo
            esto sin costos adicionales por estar visible en estos canales.
          </li>
          <li>
            <strong>Bancos y billeteras digitales:</strong> Punto Pago ya tiene acuerdos con
            bancos y billeteras digitales que permiten a los usuarios pagar servicios
            directamente desde sus apps o banca en línea. Al integrarte con nosotros, tu comercio
            se conecta automáticamente a estos canales, sin necesidad de hacer integraciones por
            separado con cada banco. Esto facilita que más clientes te paguen desde donde ya
            manejan su dinero, aumentando la cantidad de pagos que puedes recibir.
          </li>
        </ul>
      </section>
    );
  }

  if (tipoServicio === "hub_pagos") {
    return (
      <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          Alcance del servicio
        </h3>
        <p className="mt-3 text-sm font-medium leading-relaxed text-slate-900">
          <strong>Hub de pagos:</strong> concentración y procesamiento de pagos del
          comercio según lo acordado.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          {TEXTO_MODELO_COMISION_HUB_AGENTES}
        </p>
      </section>
    );
  }

  if (tipoServicio === "cash_out") {
    return (
      <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-100">
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
      <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          Alcance del servicio
        </h3>
        <p className="mt-3 text-sm font-medium leading-relaxed text-slate-900">
          <strong>Agentes:</strong> mismo modelo de comisiones que Hub de pagos; alcance
          territorial y operación se definen con Punto Pago.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          {TEXTO_MODELO_COMISION_HUB_AGENTES}
        </p>
      </section>
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
    <div className="rounded-xl border border-brand/25 bg-gradient-to-br from-brand/[0.08] to-white px-4 py-3 text-sm text-slate-800 shadow-sm ring-1 ring-brand/10">
      <p className="font-semibold text-slate-900">Vigencia de la cotización</p>
      <p className="mt-1.5 leading-relaxed text-slate-700">
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

function TablaComparacionComision({
  r,
  compact = false,
}: {
  r: ResultadoComision;
  compact?: boolean;
}) {
  const mt = compact ? "mt-2" : "mt-4";
  const cell = compact ? "px-3 py-2" : "px-4 py-3";
  const ddNum = compact ? "text-base" : "text-lg";
  const finalBox = compact ? "px-3 py-3" : "px-4 py-4";
  const finalAmt = compact ? "text-xl" : "text-2xl";

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
              {formatUsd(r.costoPorTxnPct)}
            </dd>
          </div>
        </dl>
        <div className={`border-t border-brand/20 bg-brand/[0.06] ${finalBox}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">
            Comisión mensual estimada
          </p>
          <p className={`mt-0.5 font-bold tabular-nums text-brand ${finalAmt}`}>
            {formatUsd(comisionMensualRecomendada(r))}
          </p>
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
        <strong>
          {formatPct(Number(DEFAULT_COMISION_PORCENTAJE))} sobre cada venta
        </strong>{" "}
        frente a{" "}
        <strong>
          {formatUsd(Number(DEFAULT_COMISION_FIJA_USD))} por transacción
        </strong>
        , con el
        ticket y volumen indicados en la cotización.
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
            {formatPct(Number(DEFAULT_COMISION_PORCENTAJE))} del ticket
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
            {formatUsd(Number(DEFAULT_COMISION_FIJA_USD))} por operación
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
              {formatUsd(costoTxnRecomendado(r))}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-500">Comisión mensual estimada</p>
            <p className={`font-bold tabular-nums text-brand ${compact ? "text-xl" : "text-2xl"}`}>
              {formatUsd(comisionMensualRecomendada(r))}
            </p>
          </div>
        </div>
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

  return (
    <article
      id="cotizacion-cliente-document"
      className="fixed -left-[9999px] top-0 z-0 w-[794px] overflow-visible bg-[#eef0f8] shadow-sm print:static print:left-auto print:top-auto print:z-auto print:w-full print:max-w-none print:rounded-none print:shadow-none"
    >
      <header className="relative overflow-visible px-10 pb-16 pt-10 text-white print:px-8 print:pb-14 print:pt-8">
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
        <div className="relative z-10 flex flex-col gap-6 overflow-visible sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 overflow-visible pr-2 sm:pr-6">
            <div className="inline-block max-w-full pr-3 sm:pr-5">
              <img
                src="/brand/punto-pago-logo-cotizacion-pdf.png"
                alt="Punto Pago"
                width={240}
                height={120}
                className="block h-11 w-auto max-w-full object-contain object-left"
              />
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-[1.65rem]">
              Cotización comercial
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/85">
              Resumen referencial en USD para el cliente. Montos orientativos; la
              propuesta definitiva se formaliza con el equipo comercial.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm backdrop-blur-sm">
            <p>
              <span className="font-medium text-white/80">Ref.</span>{" "}
              <span className="font-semibold tabular-nums text-white">
                {refCotizacion ?? "—"}
              </span>
            </p>
            {fechaExportacion && (
              <p className="mt-2">
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

      <div className="relative z-20 -mt-10 px-8 pb-10 print:px-6 print:pb-8">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/[0.06] ring-1 ring-slate-200/60 print:shadow-none">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Datos del cliente
          </h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
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

          <div className="mt-6">
            <BloqueVigencia fechaExportacion={fechaExportacion} />
          </div>
        </div>

        <BloqueAlcanceServicio tipoServicio={form.tipoServicioPuntoPago} />

        {form.tipoServicioPuntoPago === "kioscos" &&
          resultadoIntegracion &&
          resultadoComision && (
            <div className="mt-5 space-y-4">
              <section
                data-pdf-bloque-setup
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-100"
              >
                <div className="border-b border-slate-100 p-4 sm:p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Set up e integración
                  </h3>
                  <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-slate-900">
                    {formatUsd(resultadoIntegracion.totalUsd)}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    Incluye el costo de integración según la modalidad y opciones
                    indicadas en la cotización (referencial).
                  </p>
                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/90 p-3 sm:p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Acuerdo de pago del set up (referencial)
                    </p>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-slate-900">
                      {etiquetaAcuerdoPagoSetup ?? (
                        <span className="font-normal text-slate-500">
                          Indicar en el cotizador la forma de pago del set up (sección
                          integración).
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div
                  id="pdf-bloque-comision"
                  className="pdf-bloque-comision p-4 sm:p-5"
                >
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Comisión de servicio (referencial)
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600">
                    Estimación con base en el volumen y el ticket indicados en el
                    cotizador.
                  </p>
                  <TablaComparacionComision r={resultadoComision} compact />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 text-sm leading-relaxed text-slate-800">
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
                    {formatUsd(comisionMensualRecomendada(resultadoComision))}
                  </span>
                  .
                </p>
              </section>
            </div>
          )}

        {form.tipoServicioPuntoPago === "hub_pagos" && (
          <div className="mt-6 space-y-4">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Set up fee (referencial)
              </h3>
              <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">
                {formatUsd(SETUP_FEE_HUB_REF_USD)}
              </p>
            </section>
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Comisiones (empresas de servicio y comercio)
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {TEXTO_MODELO_COMISION_HUB_AGENTES}
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Promedios y ejemplos orientativos; cotizador en línea próximo para mayor
                precisión.
              </p>
            </section>
          </div>
        )}

        {form.tipoServicioPuntoPago === "cash_out" &&
          cashOutCargoMensualEstimado !== null && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Volumen mensual (desembolsos)
                </h3>
                <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">
                  {formatUsd(volumenCashOutUsd)}
                </p>
              </section>
              <section className="rounded-2xl border border-brand/25 bg-gradient-to-br from-white to-brand/[0.06] p-6 shadow-sm ring-1 ring-brand/15">
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">
                  Cargo referencial al cliente ({CASH_OUT_CARGO_CLIENTE_PCT}%)
                </h3>
                <p className="mt-3 text-2xl font-bold tabular-nums text-brand">
                  {formatUsd(cashOutCargoMensualEstimado)}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Punto Pago cobra por cada desembolso según acuerdo comercial.
                </p>
              </section>
            </div>
          )}

        {form.tipoServicioPuntoPago === "agentes" && (
          <div className="mt-6 space-y-4">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Set up referencial
              </h3>
              <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">
                {formatUsd(SETUP_FEE_HUB_REF_USD)}
              </p>
            </section>
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Comisiones (empresas de servicio y comercio)
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {TEXTO_MODELO_COMISION_HUB_AGENTES}
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Mismo esquema que Hub de pagos; detalle territorial y operativo con el
                equipo comercial.
              </p>
            </section>
          </div>
        )}

        <footer className="mt-8 border-t border-slate-200 pt-6 text-xs leading-relaxed text-slate-500">
          <p>
            Cifras referenciales. Vigencia, riesgo, impuestos y condiciones finales se
            confirman con el equipo comercial de Punto Pago.
          </p>
        </footer>
      </div>
    </article>
  );
}
