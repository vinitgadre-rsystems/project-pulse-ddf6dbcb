import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

/**
 * Renders a DOM element into a multi-page A4 landscape PDF.
 */
export async function exportElementToPdf(element: HTMLElement, fileName: string) {
  const canvas = await html2canvas(element, {
    scale: Math.min(2, window.devicePixelRatio || 1.5),
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    windowWidth: element.scrollWidth,
  });

  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  // Height (in canvas px) that fits on one PDF page at our scale factor.
  const ratio = usableWidth / canvas.width;
  const pageCanvasHeight = Math.floor(usableHeight / ratio);

  let rendered = 0;
  let page = 0;
  while (rendered < canvas.height) {
    const sliceHeight = Math.min(pageCanvasHeight, canvas.height - rendered);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceHeight;
    const ctx = slice.getContext("2d");
    if (!ctx) break;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, rendered, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

    if (page > 0) pdf.addPage();
    pdf.addImage(
      slice.toDataURL("image/jpeg", 0.92),
      "JPEG",
      margin,
      margin,
      usableWidth,
      sliceHeight * ratio,
    );

    rendered += sliceHeight;
    page += 1;
  }

  pdf.save(fileName);
}
