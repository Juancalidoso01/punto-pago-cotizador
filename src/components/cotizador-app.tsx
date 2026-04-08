"use client";

/* eslint-disable @next/next/no-img-element -- logos SVG y hero: evitar 500 del optimizador (SVG / sharp) en algunos entornos */
import { useEffect, useMemo, useState } from "react";
import {
  calcularComisiones,
  comisionMensualRecomendada,
  costoTxnRecomendado,
  formatPct,
  formatUsd,
  parseEnteroPositivo,
  parseMontoUsd,
  type ResultadoComision,
} from "@/lib/comision";
import {
  calcularPrecioIntegracion,
  industriasEnGrupos,
  RECARGO_RECAUDO_KIOSCOS_USD,
  SETUP_FEE_FTP_EMAIL_USD,
  TECNOLOGIAS_STACK,
} from "@/lib/integracion";
import {
  createEmptyForm,
  defaultCondiciones,
  DEFAULT_COMISION_FIJA_USD,
  DEFAULT_COMISION_PORCENTAJE,
  type CotizacionForm,
} from "@/lib/cotizacion-types";
import { buildCotizacionPayload } from "@/lib/cotizacion-payload";
import { esCotizacionCompleta } from "@/lib/cotizacion-validacion";
import { tituloModeloRecomendado } from "@/lib/cotizacion-texto";
import { exportarCotizacionPdf } from "@/lib/exportar-pdf-cotizacion";

/** Canales habituales en Panamá para el modelo de cobro del comercio */
const MODELOS_PAGO_PANAMA = [
  "Yappy",
  "ACH",
  "Procesamiento bancario de tarjetas",
  "Efectivo en punto / red de cobro",
  "Mixto (varios canales)",
  "Otro (detallar en notas)",
] as const;

function formatFechaHoy(): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function textoRecomendacion(r: ResultadoComision["recomendacion"]): string {
  if (r === "pct") {
    return "Con el ticket y volumen indicados, conviene el modelo por porcentaje (3% sobre cada venta): menor costo por operación frente al cargo fijo de referencia.";
  }
  if (r === "fijo") {
    return "Con el ticket y volumen indicados, conviene el monto fijo por transacción (1,25 USD): menor costo por operación; el cargo fijo pesa menos sobre el recaudo cuando el ticket es alto.";
  }
  return "Con los datos indicados, ambos modelos (3% sobre cada venta y 1,25 USD por transacción) arrojan el mismo costo por operación; el comercio puede elegir según preferencia de facturación.";
}

function generarRefCotizacion(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const r = Math.floor(Math.random() * 900 + 100);
  return `PP-${y}${m}${day}-${r}`;
}

export function CotizadorApp() {
  const [form, setForm] = useState<CotizacionForm>(() => createEmptyForm());
  const [copiado, setCopiado] = useState(false);
  /** Solo en cliente: evita hydration mismatch (servidor ≠ Math.random en cliente) */
  const [ref, setRef] = useState<string | null>(null);
  const [registrando, setRegistrando] = useState(false);
  const [sheetNotice, setSheetNotice] = useState<"idle" | "ok" | "error">(
    "idle",
  );
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [pdfExportando, setPdfExportando] = useState(false);

  useEffect(() => {
    setRef(generarRefCotizacion());
  }, []);

  function setField<K extends keyof CotizacionForm>(
    key: K,
    value: CotizacionForm[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function imprimir() {
    window.print();
  }

  function copiarTextoPlano() {
    const bloque = document.getElementById("cotizacion-texto-plano");
    if (!bloque) return;
    void navigator.clipboard.writeText(bloque.innerText).then(() => {
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2500);
    });
  }

  async function registrarEnSheet() {
    if (!resultadoIntegracion || !resultadoComision) return;
    setRegistrando(true);
    setSheetNotice("idle");
    setSheetError(null);
    try {
      const payload = buildCotizacionPayload(
        form,
        ref,
        formatFechaHoy(),
        resultadoIntegracion,
        resultadoComision,
      );
      const res = await fetch("/api/cotizacion/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "No se pudo registrar",
        );
      }
      setSheetNotice("ok");
    } catch (e) {
      setSheetNotice("error");
      setSheetError(
        e instanceof Error ? e.message : "Error al registrar la cotización",
      );
    } finally {
      setRegistrando(false);
    }
  }

  async function procesarCotizacion() {
    setPdfExportando(true);
    try {
      await exportarCotizacionPdf(ref, {
        elementId: "cotizacion-cliente-document",
        nombreArchivo: "PP-ResumenCliente",
      });
    } finally {
      setPdfExportando(false);
    }
  }

  const validoMinimo =
    form.empresa.trim().length > 0 && form.email.trim().includes("@");

  const ventasMensualesParseado = useMemo(
    () => parseMontoUsd(form.ventasMensualesTotalUsd),
    [form.ventasMensualesTotalUsd],
  );

  /** Ticket promedio = ventas totales ÷ cantidad de ventas (para comisiones) */
  const ticketPromedioDerivado = useMemo(() => {
    const ventas = parseMontoUsd(form.ventasMensualesTotalUsd);
    const cantidad = parseEnteroPositivo(form.cantidadVentasMensuales);
    if (
      ventas === null ||
      cantidad === null ||
      ventas <= 0 ||
      cantidad <= 0
    ) {
      return null;
    }
    return ventas / cantidad;
  }, [form.ventasMensualesTotalUsd, form.cantidadVentasMensuales]);

  const resultadoIntegracion = useMemo(
    () =>
      form.industriaId
        ? calcularPrecioIntegracion({
            industriaId: form.industriaId,
            incluyeRecaudoKioscos: form.incluyeRecaudoKioscos,
            reporteFtpEmailSinBd: form.reporteFtpEmailSinBd,
            modalidadTecnica: form.modalidadTecnica,
          })
        : null,
    [
      form.industriaId,
      form.incluyeRecaudoKioscos,
      form.reporteFtpEmailSinBd,
      form.modalidadTecnica,
    ],
  );

  const resultadoComision = useMemo(() => {
    const ventas = parseMontoUsd(form.ventasMensualesTotalUsd);
    const cantidad = parseEnteroPositivo(form.cantidadVentasMensuales);
    const pct = parseMontoUsd(DEFAULT_COMISION_PORCENTAJE);
    const fijo = parseMontoUsd(DEFAULT_COMISION_FIJA_USD);
    if (
      ventas === null ||
      cantidad === null ||
      ventas <= 0 ||
      cantidad <= 0 ||
      pct === null ||
      fijo === null
    ) {
      return null;
    }
    const ticket = ventas / cantidad;
    return calcularComisiones({
      ticketUsd: ticket,
      transaccionesMes: cantidad,
      comisionPct: pct,
      comisionFijaUsd: fijo,
    });
  }, [form.ventasMensualesTotalUsd, form.cantidadVentasMensuales]);

  const cotizacionCompleta = useMemo(
    () =>
      resultadoIntegracion && resultadoComision
        ? esCotizacionCompleta(form, resultadoIntegracion, resultadoComision)
        : false,
    [form, resultadoIntegracion, resultadoComision],
  );

  const inputClass =
    "w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm outline-none ring-brand/20 focus:border-brand focus:ring-2";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="no-print mb-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative">
          <div className="absolute inset-0">
            <img
              src="/brand/headcap.jpg"
              alt=""
              className="h-full w-full object-cover object-center"
              decoding="async"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/20" />
          </div>

          <div className="relative px-6 py-7 sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur">
                  {/* <img> evita el pipeline de optimización de Next con SVG (suele causar 500 en algunos entornos) */}
                  <img
                    src="/brand/punto-pago-logo.svg"
                    alt="Punto Pago"
                    width={110}
                    height={60}
                    className="h-7 w-auto text-white"
                  />
                </div>
                <div className="text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                    Ventas · Cotizaciones
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                    Cotizador para prospectos
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={procesarCotizacion}
                  disabled={!cotizacionCompleta || pdfExportando}
                  className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-white/10 hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-500 disabled:text-white disabled:ring-slate-400 disabled:hover:bg-slate-500"
                >
                  {pdfExportando ? "Generando PDF…" : "Procesar cotización"}
                </button>
                <button
                  type="button"
                  onClick={registrarEnSheet}
                  disabled={!cotizacionCompleta || registrando}
                  className="inline-flex items-center justify-center rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {registrando ? "Registrando…" : "Registrar en Google Sheets"}
                </button>
                <button
                  type="button"
                  onClick={copiarTextoPlano}
                  disabled={!validoMinimo}
                  className="inline-flex items-center justify-center rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copiado ? "Copiado" : "Copiar texto"}
                </button>
                <button
                  type="button"
                  onClick={imprimir}
                  disabled={!cotizacionCompleta}
                  className="inline-flex items-center justify-center rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Imprimir
                </button>
              </div>
            </div>

            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/80">
              Completa todos los campos obligatorios. Usa{" "}
              <strong>Procesar cotización</strong> para generar el PDF resumido
              (set up y comisión mensual estimada) para el cliente. Opcional:{" "}
              <strong>Registrar en Google Sheets</strong>.
            </p>

            {!validoMinimo && (
              <p className="mt-3 text-sm text-amber-200">
                Indica al menos empresa y un correo válido para copiar el texto.
              </p>
            )}
            {!cotizacionCompleta && validoMinimo && (
              <p className="mt-3 text-sm text-amber-200">
                Completa industria, modalidad técnica, transaccionalidad, integración,
                vendedor y demás campos requeridos para habilitar PDF y registro en
                Sheets.
              </p>
            )}
          </div>
        </div>
      </header>

      {sheetNotice === "ok" && (
        <p className="no-print mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Cotización registrada en Google Sheets.
        </p>
      )}
      {sheetNotice === "error" && sheetError && (
        <p className="no-print mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {sheetError}
        </p>
      )}

      <div className="space-y-10">
        <section
          className="no-print space-y-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          aria-label="Datos de la cotización"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              1. Industria del prospecto
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Sectores frecuentes en Panamá con volumen masivo de clientes (banca,
              telecomunicaciones, procesadores de pagos, remesas, transporte,
              aerolíneas, retail, etc.). El set up fee se define más abajo según
              modalidad técnica.
            </p>
            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                ¿A qué industria corresponde el cliente?
              </span>
              <select
                className={`${inputClass} bg-white`}
                value={form.industriaId}
                onChange={(e) => setField("industriaId", e.target.value)}
              >
                <option value="">Seleccionar industria…</option>
                {industriasEnGrupos().map(({ grupo, items }) => (
                  <optgroup key={grupo} label={grupo}>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-lg font-semibold text-slate-900">
              2. Datos del prospecto
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Información de contacto del cliente.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Nombre de la empresa <span className="text-red-600">*</span>
                </span>
                <input
                  className={inputClass}
                  value={form.empresa}
                  onChange={(e) => setField("empresa", e.target.value)}
                  placeholder="Ej. Comercio Demo S.A."
                  autoComplete="organization"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Correo de contacto <span className="text-red-600">*</span>
                </span>
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="contacto@empresa.com"
                  autoComplete="email"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Nombre del contacto
                </span>
                <input
                  className={inputClass}
                  value={form.contactoNombre}
                  onChange={(e) => setField("contactoNombre", e.target.value)}
                  placeholder="Ej. María González"
                  autoComplete="name"
                />
              </label>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  3. Transaccionalidad (USD)
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Monto y volumen de ventas al mes; canales típicos en Panamá. Los
                  montos en dólares estadounidenses (USD).
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                USD
              </span>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Monto total mensual de ventas
                </span>
                <input
                  className={inputClass}
                  inputMode="decimal"
                  value={form.ventasMensualesTotalUsd}
                  onChange={(e) =>
                    setField("ventasMensualesTotalUsd", e.target.value)
                  }
                  placeholder="Ej. 125,000"
                />
                <span className="mt-1 block text-xs text-slate-500">
                  Suma de todas las ventas del mes (referencial).
                </span>
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Cantidad total de ventas al mes
                </span>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  value={form.cantidadVentasMensuales}
                  onChange={(e) =>
                    setField("cantidadVentasMensuales", e.target.value)
                  }
                  placeholder="Ej. 2,500"
                />
                <span className="mt-1 block text-xs text-slate-500">
                  Número de operaciones o tickets en el mes. Con el monto total se
                  calcula el ticket promedio para las comisiones.
                </span>
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Canal o modelo de cobro predominante
                </span>
                <select
                  className={`${inputClass} bg-white`}
                  value={form.canal}
                  onChange={(e) => setField("canal", e.target.value)}
                >
                  <option value="">Seleccionar…</option>
                  {MODELOS_PAGO_PANAMA.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Clientes no bancarizados (efectivo en red)
                </span>
                <textarea
                  rows={3}
                  className={inputClass}
                  value={form.estimadoNoBancarizados}
                  onChange={(e) =>
                    setField("estimadoNoBancarizados", e.target.value)
                  }
                  placeholder="Ej. ~25% del público; o perfiles que solo usan efectivo y pueden acudir a un punto de pago…"
                />
                <span className="mt-1 block text-xs text-slate-500">
                  A Punto Pago le interesa dimensionar cuántas personas podrían pagar
                  en efectivo en la red (no bancarizadas o que eligen efectivo).
                </span>
              </label>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-base font-semibold text-slate-900">
              4. Comisión recomendada (referencial)
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Se comparan automáticamente las tarifas de referencia:{" "}
              <strong>{DEFAULT_COMISION_PORCENTAJE}%</strong> sobre cada venta y{" "}
              <strong>{DEFAULT_COMISION_FIJA_USD} USD</strong> por transacción, usando
              el ticket y volumen de la sección 3. Se muestra solo el modelo que
              conviene según esos datos. Punto Pago factura al comercio el total del
              período según el modelo acordado.
            </p>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              {!resultadoComision ? (
                <p className="text-sm text-slate-600">
                  Completa el monto total mensual de ventas y la cantidad de ventas
                  al mes (sección 3) para obtener la comisión recomendada.
                </p>
              ) : (
                <div className="space-y-3 text-sm">
                  <p className="font-medium text-slate-900">
                    Resultado (no incluye impuestos ni otros cargos)
                  </p>
                  <div className="rounded-xl border border-brand/25 bg-white p-4 ring-1 ring-brand/15">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                      Modelo recomendado
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-900">
                      {tituloModeloRecomendado(resultadoComision.recomendacion)}
                    </p>
                    <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs text-slate-500">Costo por transacción</dt>
                        <dd className="font-semibold text-slate-900">
                          {formatUsd(costoTxnRecomendado(resultadoComision))}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-500">
                          Comisión mensual estimada
                        </dt>
                        <dd className="font-semibold text-slate-900">
                          {formatUsd(comisionMensualRecomendada(resultadoComision))}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <p className="rounded-lg bg-slate-100/90 p-3 text-slate-700">
                    {textoRecomendacion(resultadoComision.recomendacion)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Volumen mensual estimado (monto total de ventas):{" "}
                    <span className="font-medium text-slate-700">
                      {formatUsd(resultadoComision.volumenMensualUsd)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-base font-semibold text-slate-900">
              5. Integración e implementación (USD)
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              El <strong>set up fee</strong> depende de la <strong>modalidad
              técnica</strong>: integración por <strong>web services</strong> o por{" "}
              <strong>batch</strong>. Si el cliente <strong>no tiene base de datos</strong>{" "}
              y los pagos se reportan por <strong>FTP o correo</strong>, aplica un
              set up referencial de {formatUsd(SETUP_FEE_FTP_EMAIL_USD)}. Luego indica
              la plataforma del cliente y si aplica recaudo en kioscos.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Modalidad de integración (set up fee)
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${
                      form.reporteFtpEmailSinBd
                        ? "border-slate-200 bg-slate-50 opacity-60"
                        : form.modalidadTecnica === "webservices"
                          ? "border-brand bg-brand/5 ring-1 ring-brand/25"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="modalidadTecnica"
                      className="h-4 w-4 border-slate-300 text-brand focus:ring-brand"
                      checked={form.modalidadTecnica === "webservices"}
                      disabled={form.reporteFtpEmailSinBd}
                      onChange={() => setField("modalidadTecnica", "webservices")}
                    />
                    <span>
                      <span className="font-medium text-slate-900">
                        Web services
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-600">
                        API, webhooks, integración en línea con sistemas del cliente.
                      </span>
                    </span>
                  </label>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${
                      form.reporteFtpEmailSinBd
                        ? "border-slate-200 bg-slate-50 opacity-60"
                        : form.modalidadTecnica === "batch"
                          ? "border-brand bg-brand/5 ring-1 ring-brand/25"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="modalidadTecnica"
                      className="h-4 w-4 border-slate-300 text-brand focus:ring-brand"
                      checked={form.modalidadTecnica === "batch"}
                      disabled={form.reporteFtpEmailSinBd}
                      onChange={() => setField("modalidadTecnica", "batch")}
                    />
                    <span>
                      <span className="font-medium text-slate-900">Batch</span>
                      <span className="mt-0.5 block text-xs text-slate-600">
                        Archivos por lotes, procesos programados (no tiempo real).
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                  checked={form.reporteFtpEmailSinBd}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setField("reporteFtpEmailSinBd", v);
                    if (v) setField("modalidadTecnica", "");
                  }}
                />
                <span>
                  <span className="font-medium text-slate-900">
                    Sin base de datos en el cliente: reporte por FTP o correo
                  </span>
                  <span className="mt-1 block text-sm text-slate-600">
                    Punto Pago entrega reportes de pagos al área que aplica cobros.
                    Set up fee referencial: {formatUsd(SETUP_FEE_FTP_EMAIL_USD)} (anula
                    la opción web services / batch para el monto).
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Tecnología o plataforma del cliente
                </span>
                <select
                  className={`${inputClass} bg-white`}
                  value={form.tecnologiaStack}
                  onChange={(e) => setField("tecnologiaStack", e.target.value)}
                >
                  <option value="">Seleccionar…</option>
                  {TECNOLOGIAS_STACK.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input
                  className={`${inputClass} mt-2`}
                  value={form.tecnologiaDetalle}
                  onChange={(e) => setField("tecnologiaDetalle", e.target.value)}
                  placeholder="Detalle técnico, URLs, versión de ERP, etc."
                />
              </label>

              <div className="sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Tipo de servicio
                </span>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 ring-brand/20 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                    checked={form.incluyeRecaudoKioscos}
                    onChange={(e) =>
                      setField("incluyeRecaudoKioscos", e.target.checked)
                    }
                  />
                  <span>
                    <span className="font-medium text-slate-900">
                      Recaudo en red de kioscos Punto Pago
                    </span>
                    <span className="mt-1 block text-sm text-slate-600">
                      Incluye activación para recaudo / recarga en la red de
                      kioscos. Recargo referencial:{" "}
                      {formatUsd(RECARGO_RECAUDO_KIOSCOS_USD)} (se suma al set up
                      fee).
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              {!resultadoIntegracion ? (
                <p className="text-sm text-slate-600">
                  Elige <strong>industria</strong> y, si no aplica FTP/correo,{" "}
                  <strong>web services</strong> o <strong>batch</strong>, para ver el
                  set up fee referencial.
                </p>
              ) : (
                <dl className="space-y-2 text-sm">
                  <p className="text-xs text-slate-600">
                    {resultadoIntegracion.resumenModalidad}
                  </p>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-600">Set up fee</dt>
                    <dd className="font-semibold text-slate-900">
                      {formatUsd(resultadoIntegracion.precioBaseUsd)}
                    </dd>
                  </div>
                  {resultadoIntegracion.incluyeRecaudoKioscos && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-600">
                        Recaudo red de kioscos
                      </dt>
                      <dd className="font-semibold text-slate-900">
                        {formatUsd(resultadoIntegracion.recargoKioscosUsd)}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4 border-t border-slate-200 pt-2">
                    <dt className="font-medium text-slate-800">
                      Total estimado integración
                    </dt>
                    <dd className="text-lg font-bold text-brand">
                      {formatUsd(resultadoIntegracion.totalUsd)}
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-base font-semibold text-slate-900">
              6. Producto y notas
            </h3>
            <div className="mt-4 grid gap-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Producto o solución de interés
                </span>
                <input
                  className={inputClass}
                  value={form.productoInteres}
                  onChange={(e) => setField("productoInteres", e.target.value)}
                  placeholder="Ej. Terminal, link de pago, API…"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Observaciones para el cliente
                </span>
                <textarea
                  rows={3}
                  className={inputClass}
                  value={form.observaciones}
                  onChange={(e) => setField("observaciones", e.target.value)}
                  placeholder="Plazos, condiciones especiales, acuerdos adicionales…"
                />
              </label>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-base font-semibold text-slate-900">
              7. Vendedor y condiciones
            </h3>
            <div className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Nombre del vendedor
            </span>
            <input
              className={inputClass}
              value={form.nombreVendedor}
              onChange={(e) => setField("nombreVendedor", e.target.value)}
              placeholder="Tu nombre"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Condiciones comerciales (aparecen en la cotización)
            </span>
            <textarea
              rows={4}
              className={`${inputClass} text-sm`}
              value={form.condicionesComerciales}
              onChange={(e) => setField("condicionesComerciales", e.target.value)}
            />
            <button
              type="button"
              className="mt-2 text-sm text-brand hover:underline"
              onClick={() => setField("condicionesComerciales", defaultCondiciones)}
            >
              Restaurar texto estándar
            </button>
          </label>
            </div>
          </div>

          <div
            className="no-print rounded-2xl border-2 border-brand/50 bg-gradient-to-br from-brand/[0.07] to-white p-6 shadow-sm"
            aria-label="Exportar cotización para el cliente"
          >
            <h3 className="text-lg font-semibold text-slate-900">
              PDF para el cliente
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Genera el resumen en PDF (set up y comisión mensual estimada) para
              que el vendedor lo envíe al correo del cliente.
            </p>
            <button
              type="button"
              onClick={procesarCotizacion}
              disabled={!cotizacionCompleta || pdfExportando}
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-brand px-6 py-3.5 text-base font-semibold text-white shadow-md ring-1 ring-brand/20 transition hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:bg-slate-400 disabled:ring-slate-300 disabled:hover:bg-slate-400"
            >
              {pdfExportando ? "Generando PDF…" : "Procesar cotización"}
            </button>
            {!cotizacionCompleta && (
              <p className="mt-3 text-sm font-medium text-amber-800">
                Completa industria, modalidad, transaccionalidad, integración y
                vendedor para habilitar el PDF.
              </p>
            )}
          </div>

          <p className="text-sm text-slate-500">
            Tip: también puedes usar <span className="font-medium">Procesar</span>{" "}
            en el encabezado, <span className="font-medium">Sheets</span> e{" "}
            <span className="font-medium">imprimir</span> cuando la cotización esté
            completa.
          </p>
        </section>

        <article
          id="cotizacion-cliente-document"
          className="fixed -left-[9999px] top-0 z-0 w-[794px] rounded-3xl border border-slate-200 bg-white p-8 shadow-sm print:static print:left-auto print:top-auto print:z-auto print:w-full print:max-w-none print:rounded-none print:border-0 print:shadow-none"
        >
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-900 p-2 text-white">
                <img
                  src="/brand/punto-pago-logo.svg"
                  alt="Punto Pago"
                  width={88}
                  height={42}
                  className="h-6 w-auto"
                />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">
                  Resumen para el cliente
                </p>
                <p className="text-xs text-slate-500">
                  Montos referenciales en USD
                </p>
              </div>
            </div>
            <div className="text-right text-sm text-slate-600">
              <p>
                <span className="font-medium text-slate-800">Ref.</span>{" "}
                {ref ?? "—"}
              </p>
              <p>
                <span className="font-medium text-slate-800">Fecha</span>{" "}
                {formatFechaHoy()}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">Cliente:</span>{" "}
              {form.empresa.trim() || "—"}
            </p>
          </div>

          {resultadoIntegracion && resultadoComision && (
            <>
              <section className="mt-8">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Set up e integración (referencial)
                </h3>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatUsd(resultadoIntegracion.totalUsd)}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Incluye el costo de integración según la modalidad y opciones
                  indicadas en la cotización (referencial).
                </p>
              </section>

              <section className="mt-8">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Comisión de servicio (mensual estimada)
                </h3>
                <p className="mt-2 text-2xl font-bold text-brand">
                  {formatUsd(comisionMensualRecomendada(resultadoComision))}
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Modelo de referencia:{" "}
                  <span className="font-medium">
                    {tituloModeloRecomendado(resultadoComision.recomendacion)}
                  </span>
                  . Punto Pago factura al comercio el total del período según lo
                  acordado.
                </p>
              </section>

              <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
                <p className="font-semibold text-slate-900">Ejemplo</p>
                <p className="mt-2">
                  Si tus ventas mensuales fueron de{" "}
                  <span className="font-medium">
                    {ventasMensualesParseado !== null
                      ? formatUsd(ventasMensualesParseado)
                      : "—"}
                  </span>
                  , la comisión mensual estimada de Punto Pago sería de{" "}
                  <span className="font-medium">
                    {formatUsd(comisionMensualRecomendada(resultadoComision))}
                  </span>
                  , con base en el volumen y el modelo visto en esta cotización.
                </p>
              </section>

              <p className="mt-8 text-xs leading-relaxed text-slate-500">
                Cifras referenciales. Vigencia, riesgo y condiciones finales se
                confirman con el equipo comercial de Punto Pago.
              </p>
            </>
          )}
        </article>

        <article
          id="cotizacion-document"
          className="fixed -left-[9999px] top-0 z-0 w-[794px] rounded-3xl border border-slate-200 bg-white p-8 shadow-sm print:static print:left-auto print:top-auto print:z-auto print:w-full print:max-w-none print:rounded-none print:border-0 print:shadow-none"
        >
            <div className="flex flex-col gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-900 p-2 text-white">
                    <img
                      src="/brand/punto-pago-logo.svg"
                      alt="Punto Pago"
                      width={92}
                      height={44}
                      className="h-6 w-auto"
                    />
                  </div>
                  <p className="text-base font-semibold tracking-tight text-slate-900">
                    Propuesta comercial
                  </p>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Propuesta comercial · Soluciones de cobro
                </p>
              </div>
              <div className="text-right text-sm text-slate-600">
                <p>
                  <span className="font-medium text-slate-800">Ref.</span>{" "}
                  {ref ?? "—"}
                </p>
                <p>
                  <span className="font-medium text-slate-800">Fecha</span>{" "}
                  {formatFechaHoy()}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">
                Cotización para {form.empresa || "—"}
              </h2>
              <p className="text-slate-600">
                Atención: {form.contactoNombre || "Contacto"} · {form.email || "—"}
              </p>
            </div>

            <section className="mt-8">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Contexto del negocio (USD)
              </h3>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-slate-500">Monto total mensual de ventas</dt>
                  <dd className="font-medium text-slate-900">
                    {ventasMensualesParseado !== null
                      ? formatUsd(ventasMensualesParseado)
                      : form.ventasMensualesTotalUsd.trim() || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Cantidad de ventas al mes</dt>
                  <dd className="font-medium text-slate-900">
                    {form.cantidadVentasMensuales.trim() || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Ticket promedio (calculado)</dt>
                  <dd className="font-medium text-slate-900">
                    {ticketPromedioDerivado !== null
                      ? formatUsd(ticketPromedioDerivado)
                      : "—"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-500">Volumen mensual estimado</dt>
                  <dd className="font-medium text-slate-900">
                    {resultadoComision
                      ? formatUsd(resultadoComision.volumenMensualUsd)
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Canal o modelo de cobro</dt>
                  <dd className="font-medium text-slate-900">{form.canal || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-500">
                    Clientes no bancarizados (efectivo en red)
                  </dt>
                  <dd className="font-medium text-slate-900 whitespace-pre-wrap">
                    {form.estimadoNoBancarizados.trim() || "—"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-500">Producto o solución de interés</dt>
                  <dd className="font-medium text-slate-900">
                    {form.productoInteres || "—"}
                  </dd>
                </div>
              </dl>
            </section>

            {resultadoIntegracion && (
              <section className="mt-8">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Integración e implementación (referencial)
                </h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div>
                    <dt className="text-slate-500">Industria / segmento</dt>
                    <dd className="font-medium text-slate-900">
                      {resultadoIntegracion.industriaLabel}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Modalidad técnica</dt>
                    <dd className="font-medium text-slate-900">
                      {resultadoIntegracion.resumenModalidad}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Tecnología del cliente</dt>
                    <dd className="font-medium text-slate-900">
                      {form.tecnologiaStack || "—"}
                      {form.tecnologiaDetalle.trim()
                        ? ` · ${form.tecnologiaDetalle.trim()}`
                        : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Recaudo en red de kioscos</dt>
                    <dd className="font-medium text-slate-900">
                      {resultadoIntegracion.incluyeRecaudoKioscos
                        ? `Sí (+ ${formatUsd(RECARGO_RECAUDO_KIOSCOS_USD)})`
                        : "No"}
                    </dd>
                  </div>
                </dl>
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 text-sm">
                  <table className="w-full border-collapse text-left">
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="px-3 py-2 text-slate-700">
                          Set up fee
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-900">
                          {formatUsd(resultadoIntegracion.precioBaseUsd)}
                        </td>
                      </tr>
                      {resultadoIntegracion.incluyeRecaudoKioscos && (
                        <tr className="border-b border-slate-100">
                          <td className="px-3 py-2 text-slate-700">
                            Recaudo red de kioscos
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-slate-900">
                            {formatUsd(resultadoIntegracion.recargoKioscosUsd)}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-slate-50">
                        <td className="px-3 py-2 font-semibold text-slate-900">
                          Total integración (est.)
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-brand">
                          {formatUsd(resultadoIntegracion.totalUsd)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {resultadoComision && (
              <section className="mt-8">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Comisión recomendada (referencial)
                </h3>
                <p className="mt-2 text-xs text-slate-500">
                  Entre {formatPct(resultadoComision.pct)} sobre cada venta y{" "}
                  {formatUsd(resultadoComision.fijoUsd)} por transacción, conviene el
                  modelo indicado abajo. Punto Pago factura al comercio el total del
                  período según el modelo acordado.
                </p>
                <dl className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm">
                  <div>
                    <dt className="text-slate-500">Modelo recomendado</dt>
                    <dd className="font-semibold text-slate-900">
                      {tituloModeloRecomendado(resultadoComision.recomendacion)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Costo por transacción</dt>
                    <dd className="font-medium text-slate-900">
                      {formatUsd(costoTxnRecomendado(resultadoComision))}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Comisión mensual estimada</dt>
                    <dd className="font-medium text-slate-900">
                      {formatUsd(comisionMensualRecomendada(resultadoComision))}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-sm text-slate-700">
                  {textoRecomendacion(resultadoComision.recomendacion)}
                </p>
              </section>
            )}

            {form.observaciones.trim() && (
              <section className="mt-8">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Propuesta y condiciones comerciales
                </h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                  {form.observaciones}
                </p>
              </section>
            )}

            <section className="mt-8 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Términos generales
              </h3>
              <p className="mt-2 whitespace-pre-wrap leading-relaxed">
                {form.condicionesComerciales}
              </p>
            </section>

            <footer className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-600">
              <p>
                {form.nombreVendedor
                  ? `${form.nombreVendedor} · Equipo comercial Punto Pago`
                  : "Equipo comercial Punto Pago"}
              </p>
              <p className="mt-1">
                Este documento resume la información compartida en la exploración
                comercial y no constituye contrato hasta su formalización por los
                canales oficiales de Punto Pago.
              </p>
            </footer>
        </article>

        <div id="cotizacion-texto-plano" className="sr-only" aria-hidden="true">
          {`COTIZACIÓN PUNTO PAGO — Ref. ${ref ?? "—"}\nFecha: ${formatFechaHoy()}\nMoneda: USD\n\nCliente: ${form.empresa}\nContacto: ${form.contactoNombre}\nCorreo: ${form.email}\n\nTransaccionalidad (USD):\n- Monto total mensual de ventas: ${ventasMensualesParseado !== null ? formatUsd(ventasMensualesParseado) : form.ventasMensualesTotalUsd.trim() || "—"}\n- Cantidad de ventas al mes: ${form.cantidadVentasMensuales.trim() || "—"}\n- Ticket promedio (calculado): ${ticketPromedioDerivado !== null ? formatUsd(ticketPromedioDerivado) : "—"}\n- Volumen mensual estimado: ${resultadoComision ? formatUsd(resultadoComision.volumenMensualUsd) : "—"}\n- Canal o modelo de cobro: ${form.canal || "—"}\n- Clientes no bancarizados (efectivo en red): ${form.estimadoNoBancarizados.trim() || "—"}\n- Interés: ${form.productoInteres || "—"}\n\nIntegración (referencial):\n- Industria: ${resultadoIntegracion ? resultadoIntegracion.industriaLabel : form.industriaId || "—"}\n- Modalidad: ${resultadoIntegracion ? resultadoIntegracion.resumenModalidad : "—"}\n- Reporte FTP/correo sin BD: ${form.reporteFtpEmailSinBd ? "Sí" : "No"}\n- Tecnología: ${form.tecnologiaStack || "—"}${form.tecnologiaDetalle.trim() ? ` (${form.tecnologiaDetalle.trim()})` : ""}\n- Recaudo red kioscos: ${form.incluyeRecaudoKioscos ? `Sí (+${formatUsd(RECARGO_RECAUDO_KIOSCOS_USD)})` : "No"}\n- Total integración est.: ${resultadoIntegracion ? formatUsd(resultadoIntegracion.totalUsd) : "—"}\n\nComisión recomendada (referencial; ${DEFAULT_COMISION_PORCENTAJE}% vs ${DEFAULT_COMISION_FIJA_USD} USD por txn):\n${resultadoComision ? `- Modelo: ${tituloModeloRecomendado(resultadoComision.recomendacion)}\n- Costo por transacción: ${formatUsd(costoTxnRecomendado(resultadoComision))}\n- Comisión mensual estimada: ${formatUsd(comisionMensualRecomendada(resultadoComision))}\n- Facturación: Punto Pago factura al comercio el total del período según el modelo acordado.\n- ${textoRecomendacion(resultadoComision.recomendacion)}` : "- Complete monto y cantidad de ventas (sección 3).\n"}\n${form.observaciones ? `Notas:\n${form.observaciones}\n\n` : ""}Condiciones:\n${form.condicionesComerciales}\n\n${form.nombreVendedor ? form.nombreVendedor + " · " : ""}Equipo comercial Punto Pago`}
        </div>
      </div>
    </div>
  );
}
