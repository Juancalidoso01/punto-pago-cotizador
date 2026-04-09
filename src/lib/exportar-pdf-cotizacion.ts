import { empujarBloquesPdfSiCruzanSaltoDePagina } from "@/lib/pdf-ajuste-saltos";

export type OpcionesExportarPdf = {
  /** id del elemento HTML a rasterizar (por defecto resumen para cliente) */
  elementId?: string;
  /** prefijo del archivo descargado */
  nombreArchivo?: string;
};

function esperarReflow(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}

/**
 * Genera un PDF desde un nodo del DOM (solo en el navegador).
 */
export async function exportarCotizacionPdf(
  ref: string | null,
  opts: OpcionesExportarPdf = {},
): Promise<void> {
  const elementId = opts.elementId ?? "cotizacion-cliente-document";
  const el = document.getElementById(elementId);
  if (!el) {
    throw new Error(`No se encontró el elemento #${elementId}`);
  }
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const root = el as HTMLElement;
  const revertirMargenesPdf = empujarBloquesPdfSiCruzanSaltoDePagina(root);

  try {
    await esperarReflow();

    /** Tras ajustar márgenes, recalculamos alto para captura completa */
    const captureWidth = Math.ceil(Math.max(root.offsetWidth, root.scrollWidth));
    const captureHeight = Math.ceil(root.scrollHeight);

    const canvas = await html2canvas(root, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#eef0f8",
      width: captureWidth,
      height: captureHeight,
      windowWidth: captureWidth,
      windowHeight: captureHeight,
      scrollX: 0,
      scrollY: 0,
      onclone: (_doc, cloned) => {
        const node = cloned as HTMLElement;
        node.style.backgroundColor = "#eef0f8";
        node.style.overflow = "visible";
        node.style.minHeight = `${Math.ceil(node.scrollHeight)}px`;
      },
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    /** Mismo tono que el documento (#eef0f8) por si hay huecos por redondeo al paginar */
    const fillPageBg = () => {
      pdf.setFillColor(238, 240, 248);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
    };

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    fillPageBg();
    pdf.addImage(imgData, "PNG", 0, Math.round(position), imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      fillPageBg();
      /** Enteros para evitar líneas/huecos de subpixel entre páginas */
      pdf.addImage(imgData, "PNG", 0, Math.round(position), imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    const safeRef = (ref ?? "borrador").replace(/[^\w.-]+/g, "_");
    const prefijo = opts.nombreArchivo ?? "PP-ResumenCliente";
    pdf.save(`${prefijo}-${safeRef}.pdf`);
  } finally {
    revertirMargenesPdf();
  }
}
