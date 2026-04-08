"use client";

/* eslint-disable @next/next/no-img-element -- logos SVG y hero: evitar 500 del optimizador (SVG / sharp) en algunos entornos */
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { flushSync } from "react-dom";
import {
  calcularComisionesConPolitica,
  comisionMensualRecomendada,
  costoTxnRecomendado,
  formatPct,
  formatUsd,
  formatearEnteroParaCampo,
  formatearMontoUsdEnVivo,
  formatearMontoUsdParaCampo,
  parseEnteroPositivo,
  parseMontoUsd,
} from "@/lib/comision";
import {
  buscarIndustria,
  calcularPrecioIntegracion,
  etiquetaPorId,
  industriasEnGrupos,
  OPCIONES_BATCH_CANAL,
  OPCIONES_WS_FORMATO,
  OPCIONES_WS_PROTOCOLO,
  SETUP_FEE_BATCH_USD,
  SETUP_FEE_WEBSERVICES_BANCO_USD,
  SETUP_FEE_WEBSERVICES_USD,
} from "@/lib/integracion";
import {
  createEmptyForm,
  DEFAULT_COMISION_FIJA_USD,
  DEFAULT_COMISION_PORCENTAJE,
  METODOS_PAGO_INTEGRACION,
  type CotizacionForm,
} from "@/lib/cotizacion-types";
import {
  IMAGEN_ALCANCE_API,
  IMAGEN_ALCANCE_APP,
  IMAGEN_ALCANCE_KIOSCOS,
} from "@/lib/alcance-servicio-kioscos";
import { buildCotizacionPayload } from "@/lib/cotizacion-payload";
import { esCotizacionCompleta } from "@/lib/cotizacion-validacion";
import {
  textoExplicativoComision,
  tituloModeloRecomendado,
} from "@/lib/cotizacion-texto";
import { CotizacionPdfClienteDocument } from "@/components/cotizacion-pdf-cliente";
import {
  fechaMasDias,
  formatFechaHoraEmision,
  formatSoloFechaLarga,
} from "@/lib/fecha-cotizacion";
import { exportarCotizacionPdf } from "@/lib/exportar-pdf-cotizacion";
import { esEmailFormatoValido } from "@/lib/email";
import {
  CASH_OUT_CARGO_CLIENTE_PCT,
  SETUP_FEE_HUB_REF_USD,
  TIPOS_SERVICIO_PUNTO_PAGO,
} from "@/lib/tipo-servicio-punto-pago";

function formatFechaHoy(): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
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
  /** Fecha/hora de la última exportación PDF (vigencia 15 días desde aquí) */
  const [fechaExportacionPdf, setFechaExportacionPdf] = useState<Date | null>(
    null,
  );
  /** Tras salir del campo correo, mostrar error de formato si aplica */
  const [correoValidacionVisible, setCorreoValidacionVisible] = useState(false);

  useEffect(() => {
    setRef(generarRefCotizacion());
  }, []);

  function setField<K extends keyof CotizacionForm>(
    key: K,
    value: CotizacionForm[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const onBlurFormatearMontoUsd = useCallback(
    (campo: "ventasMensualesTotalUsd" | "volumenCashOutMensualUsd") => {
      setForm((prev) => {
        const raw = prev[campo].trim();
        if (raw === "") return prev;
        const n = parseMontoUsd(raw);
        if (n === null) return prev;
        const formatted = `$ ${formatearMontoUsdParaCampo(n)}`;
        if (prev[campo] === formatted) return prev;
        return { ...prev, [campo]: formatted };
      });
    },
    [],
  );

  const onChangeCantidadVentas = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, "");
      if (digits === "") {
        setField("cantidadVentasMensuales", "");
        return;
      }
      const n = parseInt(digits, 10);
      if (!Number.isFinite(n)) return;
      setField("cantidadVentasMensuales", formatearEnteroParaCampo(n));
    },
    [],
  );

  const onChangeVentasMensualesUsd = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setField("ventasMensualesTotalUsd", formatearMontoUsdEnVivo(e.target.value));
    },
    [],
  );

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
    if (!cotizacionCompleta) return;
    setRegistrando(true);
    setSheetNotice("idle");
    setSheetError(null);
    try {
      const payload = buildCotizacionPayload(
        form,
        ref,
        formatFechaHoy(),
        form.tipoServicioPuntoPago === "kioscos"
          ? resultadoIntegracion
          : null,
        form.tipoServicioPuntoPago === "kioscos" ? resultadoComision : null,
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
      flushSync(() => {
        setFechaExportacionPdf(new Date());
      });
      await exportarCotizacionPdf(ref, {
        elementId: "cotizacion-cliente-document",
        nombreArchivo: "PP-ResumenCliente",
      });
    } finally {
      setPdfExportando(false);
    }
  }

  const validoMinimo =
    form.empresa.trim().length > 0 && esEmailFormatoValido(form.email);

  const correoFormatoInvalido =
    form.email.trim() !== "" && !esEmailFormatoValido(form.email);
  const mostrarErrorCorreo = correoValidacionVisible && correoFormatoInvalido;

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
      form.tipoServicioPuntoPago === "kioscos" && form.industriaId
        ? calcularPrecioIntegracion({
            industriaId: form.industriaId,
            incluyeRecaudoKioscos: false,
            modalidadTecnica: form.modalidadTecnica,
          })
        : null,
    [form.tipoServicioPuntoPago, form.industriaId, form.modalidadTecnica],
  );

  const industriaLabel = useMemo(
    () => buscarIndustria(form.industriaId)?.label ?? "",
    [form.industriaId],
  );

  const resultadoComision = useMemo(() => {
    if (form.tipoServicioPuntoPago !== "kioscos") return null;
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
    const ticket = ventas / cantidad;
    const ind = buscarIndustria(form.industriaId);
    const politica = ind?.comisionCashIn ?? "comparar_3_vs_125";
    return calcularComisionesConPolitica({
      ticketUsd: ticket,
      transaccionesMes: cantidad,
      politica,
    });
  }, [
    form.tipoServicioPuntoPago,
    form.industriaId,
    form.ventasMensualesTotalUsd,
    form.cantidadVentasMensuales,
  ]);

  const cashOutCargoMensualEstimado = useMemo(() => {
    if (form.tipoServicioPuntoPago !== "cash_out") return null;
    const v = parseMontoUsd(form.volumenCashOutMensualUsd);
    if (v === null || v <= 0) return null;
    return v * (CASH_OUT_CARGO_CLIENTE_PCT / 100);
  }, [form.tipoServicioPuntoPago, form.volumenCashOutMensualUsd]);

  const cotizacionCompleta = useMemo(
    () => esCotizacionCompleta(form, resultadoIntegracion, resultadoComision),
    [form, resultadoIntegracion, resultadoComision],
  );

  const servicioLabel =
    TIPOS_SERVICIO_PUNTO_PAGO.find((t) => t.id === form.tipoServicioPuntoPago)
      ?.label ?? "—";

  const volumenCashOutUsd =
    parseMontoUsd(form.volumenCashOutMensualUsd) ?? 0;

  const textoResumenIntegracionKioscos = useMemo(() => {
    if (form.modalidadTecnica === "webservices") {
      const prot =
        form.integracionWsProtocolo === "otro"
          ? form.integracionWsProtocoloOtro.trim()
          : etiquetaPorId(OPCIONES_WS_PROTOCOLO, form.integracionWsProtocolo);
      const fmt =
        form.integracionWsFormato === "otro"
          ? form.integracionWsFormatoOtro.trim()
          : etiquetaPorId(OPCIONES_WS_FORMATO, form.integracionWsFormato);
      return `Web services · Conexión: ${prot || "—"} · Formato / datos: ${fmt || "—"}`;
    }
    if (form.modalidadTecnica === "batch") {
      const canal =
        form.integracionBatchCanal === "otro_unidireccional"
          ? form.integracionBatchCanalOtro.trim()
          : etiquetaPorId(OPCIONES_BATCH_CANAL, form.integracionBatchCanal);
      return `Batch · Canal unidireccional: ${canal || "—"}`;
    }
    return "";
  }, [
    form.modalidadTecnica,
    form.integracionWsProtocolo,
    form.integracionWsProtocoloOtro,
    form.integracionWsFormato,
    form.integracionWsFormatoOtro,
    form.integracionBatchCanal,
    form.integracionBatchCanalOtro,
  ]);

  const etiquetaMetodoPagoIntegracion = useMemo(
    () =>
      form.metodoPagoIntegracion
        ? METODOS_PAGO_INTEGRACION.find((m) => m.id === form.metodoPagoIntegracion)
            ?.label ?? form.metodoPagoIntegracion
        : "",
    [form.metodoPagoIntegracion],
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
                Selecciona tipo de servicio y completa los campos requeridos (según el
                tipo) para habilitar PDF y Sheets.
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
              aerolíneas, retail, etc.). Clasifica al prospecto en todas las líneas
              de servicio. En <strong>botón en kioscos</strong>, el set up fee se
              define más abajo según la modalidad técnica.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Incluye segmentos como{" "}
              <span className="font-medium text-slate-600">
                financiera tradicional / financiera para no bancarizados
              </span>
              , <span className="font-medium text-slate-600">remesas internacionales</span>{" "}
              y{" "}
              <span className="font-medium text-slate-600">
                casa de apuestas (rubro deportivo)
              </span>{" "}
              (agrupados en el menú por rubro).
            </p>
            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                ¿A qué industria corresponde el cliente?{" "}
                <span className="text-red-600">*</span>
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
                  className={`${inputClass} ${
                    mostrarErrorCorreo
                      ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                      : ""
                  }`}
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  onBlur={() => setCorreoValidacionVisible(true)}
                  placeholder="contacto@empresa.com"
                  autoComplete="email"
                  aria-invalid={mostrarErrorCorreo}
                  aria-describedby={
                    mostrarErrorCorreo ? "correo-contacto-error" : undefined
                  }
                />
                {mostrarErrorCorreo && (
                  <span
                    id="correo-contacto-error"
                    className="mt-1 block text-xs text-red-600"
                    role="alert"
                  >
                    Usa un correo con @ y dominio con punto (ej.{" "}
                    <span className="whitespace-nowrap">nombre@empresa.com</span>
                    ).
                  </span>
                )}
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
            <h2 className="text-lg font-semibold text-slate-900">
              3. Tipo de servicio o programa Punto Pago
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Define qué producto se cotiza: botón en kioscos (flujo completo) u otras
              líneas con montos y reglas distintas.
            </p>
            <div className="mt-4 grid gap-3">
              {TIPOS_SERVICIO_PUNTO_PAGO.map((t) => (
                <label
                  key={t.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                    form.tipoServicioPuntoPago === t.id
                      ? "border-brand bg-brand/5 ring-1 ring-brand/25"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="tipoServicioPuntoPago"
                    className="mt-1 h-4 w-4 border-slate-300 text-brand focus:ring-brand"
                    checked={form.tipoServicioPuntoPago === t.id}
                    onChange={() => setField("tipoServicioPuntoPago", t.id)}
                  />
                  <span>
                    <span className="font-medium text-slate-900">{t.label}</span>
                    <span className="mt-1 block text-sm text-slate-600">
                      {t.descripcion}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {form.tipoServicioPuntoPago === "hub_pagos" && (
            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-base font-semibold text-slate-900">
                Hub de pagos — referencia
              </h3>
              <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700">
                <p>
                  <span className="font-semibold text-slate-900">
                    Set up fee referencial:{" "}
                  </span>
                  {formatUsd(SETUP_FEE_HUB_REF_USD)} (USD).
                </p>
                <p>
                  Las <strong>comisiones que Punto Pago paga al cliente</strong>{" "}
                  dependen del volumen y del acuerdo por cada pago procesado con este
                  servicio. Es una estimación orientativa; más adelante habrá un{" "}
                  <strong>cotizador en línea</strong> para afinar el monto.
                </p>
              </div>
            </div>
          )}

          {form.tipoServicioPuntoPago === "cash_out" && (
            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-base font-semibold text-slate-900">
                Cash out / desembolsos
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Cargo referencial al comercio:{" "}
                <strong>{CASH_OUT_CARGO_CLIENTE_PCT}%</strong> sobre el volumen
                mensual indicado. Punto Pago cobra por cada desembolso según acuerdo.
              </p>
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Volumen mensual estimado de desembolsos (USD)
                  </span>
                  <input
                    className={`${inputClass} text-right tabular-nums`}
                    inputMode="decimal"
                    autoComplete="off"
                    value={form.volumenCashOutMensualUsd}
                    onChange={(e) =>
                      setField("volumenCashOutMensualUsd", e.target.value)
                    }
                    onBlur={() =>
                      onBlurFormatearMontoUsd("volumenCashOutMensualUsd")
                    }
                    placeholder="Ej. 80,000"
                  />
                </label>
                {cashOutCargoMensualEstimado !== null && (
                  <p className="rounded-xl border border-brand/25 bg-brand/5 p-3 text-sm">
                    <span className="font-medium text-slate-900">
                      Cargo mensual estimado al cliente ({CASH_OUT_CARGO_CLIENTE_PCT}
                      %):{" "}
                    </span>
                    {formatUsd(cashOutCargoMensualEstimado)}
                  </p>
                )}
              </div>
            </div>
          )}

          {form.tipoServicioPuntoPago === "agentes" && (
            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-base font-semibold text-slate-900">Agentes</h3>
              <p className="mt-2 text-sm text-slate-600">
                Mismo esquema referencial que Hub de pagos (set up{" "}
                {formatUsd(SETUP_FEE_HUB_REF_USD)}). El cotizador detallado para el
                cliente queda <strong>pendiente</strong>; pronto incorporaremos los
                datos para cotizar en línea.
              </p>
            </div>
          )}

          {form.tipoServicioPuntoPago === "kioscos" && (
            <>
          <div className="border-t border-slate-100 pt-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  4. Transaccionalidad (USD)
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Monto y volumen de ventas al mes (referencial). Moneda: USD.
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
                  className={`${inputClass} text-right tabular-nums`}
                  inputMode="decimal"
                  autoComplete="off"
                  value={form.ventasMensualesTotalUsd}
                  onChange={onChangeVentasMensualesUsd}
                  onBlur={() => onBlurFormatearMontoUsd("ventasMensualesTotalUsd")}
                  placeholder="Ej. $ 1,250,000"
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
                  className={`${inputClass} text-right tabular-nums`}
                  inputMode="numeric"
                  autoComplete="off"
                  value={form.cantidadVentasMensuales}
                  onChange={onChangeCantidadVentas}
                  placeholder="Ej. 2,500"
                />
                <span className="mt-1 block text-xs text-slate-500">
                  Número de operaciones o tickets en el mes. Con el monto total se
                  calcula el ticket promedio para las comisiones.
                </span>
              </label>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-base font-semibold text-slate-900">
              5. Comisión recomendada (referencial)
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {buscarIndustria(form.industriaId)?.comisionCashIn === "solo_5" ? (
                <>
                  Para este <strong>segmento</strong> aplica la política referencial
                  de <strong>5%</strong> sobre cada venta (cash-in / botón en
                  kioscos), sin comparar con el modelo fijo por transacción. Punto
                  Pago factura al comercio según lo acordado.
                </>
              ) : (
                <>
                  Se comparan las tarifas de referencia:{" "}
                  <strong>{DEFAULT_COMISION_PORCENTAJE}%</strong> sobre cada venta y{" "}
                  <strong>{DEFAULT_COMISION_FIJA_USD} USD</strong> por transacción,
                  usando el ticket y volumen de la sección 4. Se muestra el modelo
                  que conviene según esos datos. Punto Pago factura al comercio el
                  total del período según lo acordado.
                </>
              )}
            </p>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              {!resultadoComision ? (
                <p className="text-sm text-slate-600">
                  Completa el monto total mensual de ventas y la cantidad de ventas
                  al mes (sección 4) para obtener la comisión recomendada.
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
                      {tituloModeloRecomendado(resultadoComision)}
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
                    {textoExplicativoComision(resultadoComision)}
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
              6. Integración e implementación (USD)
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Solo hay dos modalidades: <strong>Web services</strong> (conexión en
              línea entre sistemas; protocolo y formato de datos) o{" "}
              <strong>Batch</strong> (FTP, SFTP, correo u otra vía unidireccional entre
              empresas con poca tecnología). Montos referenciales de set up:{" "}
              <strong>{formatUsd(SETUP_FEE_WEBSERVICES_USD)}</strong> en web services
              ( <strong>{formatUsd(SETUP_FEE_WEBSERVICES_BANCO_USD)}</strong> si el
              segmento es banco comercial) y{" "}
              <strong>{formatUsd(SETUP_FEE_BATCH_USD)}</strong> en batch. El pago del
              set up puede acordarse en cuotas (opciones abajo).
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Modalidad de integración (set up fee){" "}
                  <span className="text-red-600">*</span>
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${
                      form.modalidadTecnica === "webservices"
                        ? "border-brand bg-brand/5 ring-1 ring-brand/25"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="modalidadTecnica"
                      className="h-4 w-4 border-slate-300 text-brand focus:ring-brand"
                      checked={form.modalidadTecnica === "webservices"}
                      onChange={() => {
                        setField("modalidadTecnica", "webservices");
                        setField("integracionBatchCanal", "");
                        setField("integracionBatchCanalOtro", "");
                      }}
                    />
                    <span>
                      <span className="font-medium text-slate-900">
                        Web services
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-600">
                        {formatUsd(SETUP_FEE_WEBSERVICES_USD)} (
                        {formatUsd(SETUP_FEE_WEBSERVICES_BANCO_USD)} banco comercial).
                        Protocolo entre sistemas y formato de datos (JSON, XML, etc.).
                      </span>
                    </span>
                  </label>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${
                      form.modalidadTecnica === "batch"
                        ? "border-brand bg-brand/5 ring-1 ring-brand/25"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="modalidadTecnica"
                      className="h-4 w-4 border-slate-300 text-brand focus:ring-brand"
                      checked={form.modalidadTecnica === "batch"}
                      onChange={() => {
                        setField("modalidadTecnica", "batch");
                        setField("integracionWsProtocolo", "");
                        setField("integracionWsProtocoloOtro", "");
                        setField("integracionWsFormato", "");
                        setField("integracionWsFormatoOtro", "");
                      }}
                    />
                    <span>
                      <span className="font-medium text-slate-900">Batch</span>
                      <span className="mt-0.5 block text-xs text-slate-600">
                        {formatUsd(SETUP_FEE_BATCH_USD)}. FTP, SFTP, reportería por
                        correo u otra comunicación unidireccional.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {form.modalidadTecnica === "webservices" && (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
                  <p className="text-sm font-medium text-slate-800">
                    Conexión y formato (para detalle en kick-off con comercial)
                  </p>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      Protocolo o canal de conexión entre sistemas{" "}
                      <span className="text-red-600">*</span>
                    </span>
                    <select
                      className={`${inputClass} bg-white`}
                      value={form.integracionWsProtocolo}
                      onChange={(e) =>
                        setField("integracionWsProtocolo", e.target.value)
                      }
                    >
                      <option value="">Seleccionar…</option>
                      {OPCIONES_WS_PROTOCOLO.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    {form.integracionWsProtocolo === "otro" && (
                      <input
                        className={`${inputClass} mt-2`}
                        value={form.integracionWsProtocoloOtro}
                        onChange={(e) =>
                          setField("integracionWsProtocoloOtro", e.target.value)
                        }
                        placeholder="Describe el protocolo o canal"
                      />
                    )}
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      Formato o estándar de intercambio de datos{" "}
                      <span className="text-red-600">*</span>
                    </span>
                    <select
                      className={`${inputClass} bg-white`}
                      value={form.integracionWsFormato}
                      onChange={(e) =>
                        setField("integracionWsFormato", e.target.value)
                      }
                    >
                      <option value="">Seleccionar…</option>
                      {OPCIONES_WS_FORMATO.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    {form.integracionWsFormato === "otro" && (
                      <input
                        className={`${inputClass} mt-2`}
                        value={form.integracionWsFormatoOtro}
                        onChange={(e) =>
                          setField("integracionWsFormatoOtro", e.target.value)
                        }
                        placeholder="Ej. esquema XML, versión API, etc."
                      />
                    )}
                  </label>
                </div>
              )}

              {form.modalidadTecnica === "batch" && (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
                  <p className="text-sm font-medium text-slate-800">
                    Canal unidireccional (batch)
                  </p>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      Cómo se entrega o recibe la información{" "}
                      <span className="text-red-600">*</span>
                    </span>
                    <select
                      className={`${inputClass} bg-white`}
                      value={form.integracionBatchCanal}
                      onChange={(e) =>
                        setField("integracionBatchCanal", e.target.value)
                      }
                    >
                      <option value="">Seleccionar…</option>
                      {OPCIONES_BATCH_CANAL.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    {form.integracionBatchCanal === "otro_unidireccional" && (
                      <input
                        className={`${inputClass} mt-2`}
                        value={form.integracionBatchCanalOtro}
                        onChange={(e) =>
                          setField("integracionBatchCanalOtro", e.target.value)
                        }
                        placeholder="Describe la vía (ej. buzón, SFTP particular, etc.)"
                      />
                    )}
                  </label>
                </div>
              )}

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Forma de pago del set up (referencial){" "}
                  <span className="text-red-600">*</span>
                </span>
                <select
                  className={`${inputClass} bg-white`}
                  value={form.metodoPagoIntegracion}
                  onChange={(e) =>
                    setField(
                      "metodoPagoIntegracion",
                      e.target.value as CotizacionForm["metodoPagoIntegracion"],
                    )
                  }
                >
                  <option value="">Seleccionar…</option>
                  {METODOS_PAGO_INTEGRACION.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs text-slate-500">
                  Referencia para negociación; el acuerdo final lo confirma comercial.
                </span>
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Notas adicionales de integración (opcional)
                </span>
                <input
                  className={inputClass}
                  value={form.tecnologiaDetalle}
                  onChange={(e) => setField("tecnologiaDetalle", e.target.value)}
                  placeholder="Detalle técnico, URLs, versión de ERP, etc."
                />
              </label>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              {!resultadoIntegracion ? (
                <p className="text-sm text-slate-600">
                  Elige <strong>industria</strong>, <strong>web services</strong> o{" "}
                  <strong>batch</strong>, completa protocolo/formato o canal batch, y la{" "}
                  <strong>forma de pago</strong> del set up para ver el monto referencial.
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
            </>
          )}

          <div
            className="no-print rounded-2xl border-2 border-brand/50 bg-gradient-to-br from-brand/[0.07] to-white p-6 shadow-sm"
            aria-label="Exportar cotización para el cliente"
          >
            <h3 className="text-lg font-semibold text-slate-900">
              PDF para el cliente
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Genera el resumen en PDF según el tipo de servicio seleccionado para
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
                Selecciona tipo de servicio y completa los campos requeridos para
                habilitar el PDF.
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

        <CotizacionPdfClienteDocument
          refCotizacion={ref}
          fechaExportacion={fechaExportacionPdf}
          form={form}
          industriaLabel={industriaLabel}
          servicioLabel={servicioLabel}
          ventasMensualesParseado={ventasMensualesParseado}
          ticketPromedioDerivado={ticketPromedioDerivado}
          resultadoIntegracion={resultadoIntegracion}
          resultadoComision={resultadoComision}
          cashOutCargoMensualEstimado={cashOutCargoMensualEstimado}
          volumenCashOutUsd={volumenCashOutUsd}
        />

        <article
          id="cotizacion-document"
          className="fixed -left-[9999px] top-0 z-0 w-[794px] rounded-3xl border border-slate-200 bg-white p-8 shadow-sm print:static print:left-auto print:top-auto print:z-auto print:w-full print:max-w-none print:rounded-none print:border-0 print:shadow-none"
        >
            <div className="flex flex-col gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-900 p-2 text-white">
                    <img
                      src="/brand/punto-pago-logo-white.svg"
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

            {form.tipoServicioPuntoPago === "kioscos" && (
              <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50/90 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Alcance del servicio
                </h3>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  Tres alcances incluidos al integrarse con Punto Pago (misma cotización)
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  La <strong>integración técnica</strong> es la que se cotiza en este documento.
                  Punto Pago cobra el <strong>fee de implementación (set up)</strong> y el{" "}
                  <strong>fee mensual</strong> (comisión sobre operaciones); al contratar la
                  integración y pagar el set up, los tres alcances siguientes se habilitan{" "}
                  <strong>sin cargo adicional</strong> por canal.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="overflow-hidden rounded-xl bg-neutral-950 shadow-sm ring-1 ring-slate-200">
                    <img
                      src={IMAGEN_ALCANCE_KIOSCOS}
                      alt=""
                      className="h-24 w-full object-contain object-center sm:h-28"
                    />
                  </div>
                  <div className="overflow-hidden rounded-xl bg-blue-600 shadow-sm ring-1 ring-slate-200">
                    <img
                      src={IMAGEN_ALCANCE_APP}
                      alt=""
                      className="h-24 w-full object-contain object-center sm:h-28"
                    />
                  </div>
                  <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                    <img
                      src={IMAGEN_ALCANCE_API}
                      alt=""
                      className="h-24 w-full object-contain object-center sm:h-28"
                    />
                  </div>
                </div>
                <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-relaxed text-slate-700">
                  <li>
                    <strong>App Punto Pago</strong> y <strong>red de kioscos</strong>: tu comercio
                    aparecerá dentro de nuestra app, que tiene más de{" "}
                    <strong>150 mil usuarios activos al mes</strong>, y también en nuestra red de
                    kioscos. Esto significa que más personas podrán encontrarte y pagarte
                    fácilmente. En la app, los clientes pueden hacer recargas y pagos usando
                    tarjetas bancarias, incluyendo <strong>Clave</strong>, además de opciones como{" "}
                    <strong>Yappy</strong> y <strong>transferencias ACH</strong>. Todo esto sin
                    costos adicionales por estar visible en estos canales.
                  </li>
                  <li>
                    <strong>Bancos y billeteras digitales:</strong> Punto Pago ya tiene acuerdos
                    con bancos y billeteras digitales que permiten a los usuarios pagar servicios
                    directamente desde sus apps o banca en línea. Al integrarte con nosotros, tu
                    comercio se conecta automáticamente a estos canales, sin necesidad de hacer
                    integraciones por separado con cada banco. Esto facilita que más clientes te
                    paguen desde donde ya manejan su dinero, aumentando la cantidad de pagos que
                    puedes recibir.
                  </li>
                </ul>
              </section>
            )}

            <section className="mt-8">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Contexto del negocio (USD)
              </h3>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-slate-500">Industria / segmento</dt>
                  <dd className="font-medium text-slate-900">
                    {industriaLabel || "—"}
                  </dd>
                </div>
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
                    <dt className="text-slate-500">Integración (resumen)</dt>
                    <dd className="font-medium text-slate-900">
                      {textoResumenIntegracionKioscos || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Pago del set up (referencial)</dt>
                    <dd className="font-medium text-slate-900">
                      {etiquetaMetodoPagoIntegracion || "—"}
                    </dd>
                  </div>
                  {form.tecnologiaDetalle.trim() ? (
                    <div>
                      <dt className="text-slate-500">Notas adicionales</dt>
                      <dd className="font-medium text-slate-900">
                        {form.tecnologiaDetalle.trim()}
                      </dd>
                    </div>
                  ) : null}
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
                  {resultadoComision.comisionSoloPorcentaje ? (
                    <>
                      Política referencial de {formatPct(resultadoComision.pct)} sobre
                      cada venta para este segmento (sin comparar con el modelo fijo
                      por transacción). Punto Pago factura al comercio según lo
                      acordado.
                    </>
                  ) : (
                    <>
                      Entre {formatPct(resultadoComision.pct)} sobre cada venta y{" "}
                      {formatUsd(resultadoComision.fijoUsd)} por transacción, conviene
                      el modelo indicado abajo. Punto Pago factura al comercio el
                      total del período según el modelo acordado.
                    </>
                  )}
                </p>
                <dl className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm">
                  <div>
                    <dt className="text-slate-500">Modelo recomendado</dt>
                    <dd className="font-semibold text-slate-900">
                      {tituloModeloRecomendado(resultadoComision)}
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
                  {textoExplicativoComision(resultadoComision)}
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
          {(() => {
            const lineaVigencia =
              fechaExportacionPdf !== null
                ? `Vigencia: 15 días naturales desde la exportación (${formatFechaHoraEmision(fechaExportacionPdf)}). Vence el ${formatSoloFechaLarga(fechaMasDias(fechaExportacionPdf, 15))}.`
                : "Vigencia: 15 días naturales desde la exportación del PDF (fecha al generar el documento).";
            const bloqueAlcance =
              form.tipoServicioPuntoPago === "kioscos"
                ? `\nAlcance del servicio (integración cotizada en este documento):\n- Cobro Punto Pago: fee de implementación (set up) y fee mensual (comisión). Los tres alcances se incluyen sin cargo adicional por canal al pagar el set up.\n- App y red de kioscos: visibilidad en app (150k+ usuarios activos/mes) y red de kioscos; pagos con tarjetas, Clave, Yappy, ACH; sin costo extra por visibilidad.\n- Bancos y billeteras: acuerdos existentes; al integrarte, conexión a esos canales sin integrar con cada banco por separado.\n`
                : form.tipoServicioPuntoPago === "hub_pagos"
                  ? `\nAlcance del servicio: Hub de pagos — concentración y procesamiento de pagos; detalle operativo con el equipo comercial.\n`
                  : form.tipoServicioPuntoPago === "cash_out"
                    ? `\nAlcance del servicio: Cash out / desembolsos; condiciones operativas en el acuerdo comercial.\n`
                    : form.tipoServicioPuntoPago === "agentes"
                      ? `\nAlcance del servicio: Agentes — esquema referencial; detalle con Punto Pago.\n`
                      : "";
            const notasIntegracion = form.tecnologiaDetalle.trim()
              ? `\n- Notas integración: ${form.tecnologiaDetalle.trim()}`
              : "";
            const cabeza = `COTIZACIÓN PUNTO PAGO — Ref. ${ref ?? "—"}\nFecha: ${formatFechaHoy()}\nMoneda: USD\n\nCliente: ${form.empresa}\nContacto: ${form.contactoNombre}\nCorreo: ${form.email}\nIndustria / segmento: ${industriaLabel || "—"}\n${lineaVigencia}${bloqueAlcance}\n\nTransaccionalidad (USD):\n- Monto total mensual de ventas: ${ventasMensualesParseado !== null ? formatUsd(ventasMensualesParseado) : form.ventasMensualesTotalUsd.trim() || "—"}\n- Cantidad de ventas al mes: ${form.cantidadVentasMensuales.trim() || "—"}\n- Ticket promedio (calculado): ${ticketPromedioDerivado !== null ? formatUsd(ticketPromedioDerivado) : "—"}\n- Volumen mensual estimado: ${resultadoComision ? formatUsd(resultadoComision.volumenMensualUsd) : "—"}\n- Interés: ${form.productoInteres || "—"}\n\nIntegración (referencial):\n- Industria: ${industriaLabel || "—"}\n- Modalidad: ${resultadoIntegracion ? resultadoIntegracion.resumenModalidad : "—"}\n- Resumen técnico: ${textoResumenIntegracionKioscos || "—"}\n- Forma de pago del set up: ${etiquetaMetodoPagoIntegracion || "—"}${notasIntegracion}\n- Total integración est.: ${resultadoIntegracion ? formatUsd(resultadoIntegracion.totalUsd) : "—"}`;
            const bloqueComision = resultadoComision
              ? resultadoComision.comisionSoloPorcentaje
                ? `\n\nComisión (referencial — política 5% segmento):\n- Modelo: ${tituloModeloRecomendado(resultadoComision)}\n- Costo por transacción: ${formatUsd(costoTxnRecomendado(resultadoComision))}\n- Comisión mensual estimada: ${formatUsd(comisionMensualRecomendada(resultadoComision))}\n- ${textoExplicativoComision(resultadoComision)}`
                : `\n\nComisión recomendada (referencial; ${DEFAULT_COMISION_PORCENTAJE}% vs ${DEFAULT_COMISION_FIJA_USD} USD por txn):\n- Modelo: ${tituloModeloRecomendado(resultadoComision)}\n- Costo por transacción: ${formatUsd(costoTxnRecomendado(resultadoComision))}\n- Comisión mensual estimada: ${formatUsd(comisionMensualRecomendada(resultadoComision))}\n- Facturación: Punto Pago factura al comercio el total del período según el modelo acordado.\n- ${textoExplicativoComision(resultadoComision)}`
              : "\n\nComisión: complete monto y cantidad de ventas (sección 4).\n";
            const cola = `\n${form.observaciones ? `Notas:\n${form.observaciones}\n\n` : ""}Condiciones:\n${form.condicionesComerciales}\n\n${form.nombreVendedor ? form.nombreVendedor + " · " : ""}Equipo comercial Punto Pago`;
            return cabeza + bloqueComision + cola;
          })()}
        </div>
      </div>
    </div>
  );
}
