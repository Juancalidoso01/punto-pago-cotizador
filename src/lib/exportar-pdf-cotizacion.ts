/**
 * Genera un PDF a partir del nodo #cotizacion-document (solo en el navegador).
 */
export async function exportarCotizacionPdf(ref: string | null): Promise<void> {
  const el = document.getElementById("cotizacion-document");
  if (!el) {
    throw new Error("No se encontró el documento de cotización");
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
  pdf.save(`PP-Cotizacion-${safeRef}.pdf`);
}
