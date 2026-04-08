export type OpcionesExportarPdf = {
  /** id del elemento HTML a rasterizar (por defecto resumen para cliente) */
  elementId?: string;
  /** prefijo del archivo descargado */
  nombreArchivo?: string;
};

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
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    logging: false,
  });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }
  const safeRef = (ref ?? "borrador").replace(/[^\w.-]+/g, "_");
  const prefijo = opts.nombreArchivo ?? "PP-ResumenCliente";
  pdf.save(`${prefijo}-${safeRef}.pdf`);
}
