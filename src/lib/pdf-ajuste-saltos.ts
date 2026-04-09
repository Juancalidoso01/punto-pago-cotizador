/**
 * jsPDF divide el lienzo en franjas de altura A4; si un bloque cruza el corte, bordes y
 * líneas horizontales se ven “partidos”. Antes de html2canvas, empujamos cada bloque
 * marcado hasta que no cruce ningún corte (si cabe en una página).
 */
const ALTURA_A4_PT = 841.89;
const ANCHO_A4_PT = 595.28;

const SELECTOR_BLOQUES = "[data-pdf-evitar-corte], [data-pdf-bloque-setup]";

/** Separación mínima entre el borde superior del bloque y el corte de página (px en el root). */
const MARGEN_SEGURO_PX = 24;

function parseMarginTopPx(el: HTMLElement): number {
  const s = el.style.marginTop;
  if (!s || s === "auto") return 0;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function bloquesOrdenadosPorY(root: HTMLElement): HTMLElement[] {
  const vistos = new Set<HTMLElement>();
  root.querySelectorAll<HTMLElement>(SELECTOR_BLOQUES).forEach((el) => {
    vistos.add(el);
  });
  return Array.from(vistos).sort(
    (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top,
  );
}

function cruzaSaltoDePagina(
  root: HTMLElement,
  bloque: HTMLElement,
  pasoPaginaPx: number,
): number | null {
  void bloque.offsetHeight;
  const rootRect = root.getBoundingClientRect();
  const topRel = bloque.getBoundingClientRect().top - rootRect.top;
  const bottomRel = topRel + bloque.offsetHeight;

  for (let corte = pasoPaginaPx; corte < bottomRel; corte += pasoPaginaPx) {
    if (topRel < corte - 1 && bottomRel > corte + 1) {
      return corte;
    }
  }
  return null;
}

/** Retorna función para restaurar estilos (llamar en finally). */
export function empujarBloquesPdfSiCruzanSaltoDePagina(root: HTMLElement): () => void {
  const bloques = bloquesOrdenadosPorY(root);
  if (bloques.length === 0) {
    return () => {};
  }

  const marginPrev = bloques.map((b) => b.style.marginTop);
  const pasoPaginaPx = (root.offsetWidth * ALTURA_A4_PT) / ANCHO_A4_PT;
  /** Si el bloque es más alto que una página, no se puede evitar el corte. */
  const altoMaxEvitable = pasoPaginaPx * 0.92;

  for (let iter = 0; iter < 64; iter++) {
    let movio = false;
    const ordenados = bloquesOrdenadosPorY(root);

    for (const bloque of ordenados) {
      if (bloque.offsetHeight > altoMaxEvitable) {
        continue;
      }

      const corte = cruzaSaltoDePagina(root, bloque, pasoPaginaPx);
      if (corte === null) continue;

      const rootRect = root.getBoundingClientRect();
      const topRel = bloque.getBoundingClientRect().top - rootRect.top;
      const delta = Math.ceil(corte - topRel + MARGEN_SEGURO_PX);
      if (delta <= 0) continue;

      bloque.style.marginTop = `${parseMarginTopPx(bloque) + delta}px`;
      movio = true;
    }

    if (!movio) break;
  }

  return () => {
    bloques.forEach((b, i) => {
      b.style.marginTop = marginPrev[i];
    });
  };
}

/** @deprecated Usar empujarBloquesPdfSiCruzanSaltoDePagina */
export function empujarBloquePdfSiCruzaSaltoDePagina(root: HTMLElement): () => void {
  return empujarBloquesPdfSiCruzanSaltoDePagina(root);
}
