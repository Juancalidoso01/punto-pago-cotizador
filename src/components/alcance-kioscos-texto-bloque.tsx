/**
 * Texto de alcance «botón en kioscos»: justificado, barras laterales (sin list-disc).
 * `animated`: solo en vista web (no en PDF/html2canvas) para evitar capturas en blanco.
 */
export function AlcanceKioscosTextoBloque({
  className = "",
  compact = false,
  animated = false,
}: {
  className?: string;
  compact?: boolean;
  animated?: boolean;
}) {
  const textSize = compact ? "text-sm" : "text-sm";
  const gap = compact ? "space-y-3" : "space-y-4";
  const itemAnim = animated
    ? "alcance-kioscos-item opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:animate-none animate-alcance-enter"
    : "";

  return (
    <div className={`mt-4 ${gap} ${className}`}>
      <div
        className={`flex gap-3 sm:gap-4 ${itemAnim}`}
        style={{ animationDelay: animated ? "0ms" : undefined }}
      >
        <div
          className="mt-0.5 w-1 shrink-0 rounded-full bg-gradient-to-b from-brand to-brand/50"
          aria-hidden
        />
        <div
          className={`min-w-0 flex-1 ${textSize} leading-relaxed text-slate-700 [text-align:justify] [hyphens:auto]`}
          lang="es"
        >
          <span className="font-semibold text-slate-900">
            App Punto Pago y red de kioscos:{" "}
          </span>
          tu comercio aparecerá dentro de nuestra app, que tiene más de{" "}
          <strong>150 mil usuarios activos al mes</strong>, y también en nuestra red de
          kioscos. Esto significa que más personas podrán encontrarte y pagarte fácilmente.
          En la app, los clientes pueden hacer recargas y pagos usando tarjetas bancarias,
          incluyendo <strong>Clave</strong>, además de opciones como <strong>Yappy</strong>{" "}
          y <strong>transferencias ACH</strong>. Todo esto sin costos adicionales por estar
          visible en estos canales.
        </div>
      </div>

      <div
        className={`flex gap-3 sm:gap-4 ${itemAnim}`}
        style={{ animationDelay: animated ? "120ms" : undefined }}
      >
        <div
          className="mt-0.5 w-1 shrink-0 rounded-full bg-gradient-to-b from-brand/70 to-brand/30"
          aria-hidden
        />
        <div
          className={`min-w-0 flex-1 ${textSize} leading-relaxed text-slate-700 [text-align:justify] [hyphens:auto]`}
          lang="es"
        >
          <span className="font-semibold text-slate-900">
            Bancos y billeteras digitales:{" "}
          </span>
          Punto Pago ya tiene acuerdos con bancos y billeteras digitales que permiten a los
          usuarios pagar servicios directamente desde sus apps o banca en línea. Al
          integrarte con nosotros, tu comercio se conecta automáticamente a estos canales,
          sin necesidad de hacer integraciones por separado con cada banco. Esto facilita
          que más clientes te paguen desde donde ya manejan su dinero, aumentando la
          cantidad de pagos que puedes recibir.
        </div>
      </div>
    </div>
  );
}
