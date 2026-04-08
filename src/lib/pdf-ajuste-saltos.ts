/**
 * jsPDF parte el lienzo en franjas de altura A4; si un bloque cruza el corte, se ve partido.
 * Antes de html2canvas, suma margin-top al bloque marcado hasta que no cruce ningún corte
 * (o hasta un máximo de iteraciones).
 */
const ALTURA_A4_PT = 841.89;
const ANCHO_A4_PT = 595.28;

/** Retorna función para restaurar el estilo (llamar en finally). */
export function empujarBloquePdfSiCruzaSaltoDePagina(
  root: HTMLElement,
  selector: string = "[data-pdf-bloque-setup]",
): () => void {
  const bloque = root.querySelector<HTMLElement>(selector);
  if (!bloque) {
    return () => {};
  }

  const marginPrev = bloque.style.marginTop;
  const pasoPaginaPx = (root.offsetWidth * ALTURA_A4_PT) / ANCHO_A4_PT;

  let margenExtraPx = 0;

  for (let iter = 0; iter < 16; iter++) {
    bloque.style.marginTop =
      margenExtraPx > 0 ? `${margenExtraPx}px` : marginPrev || "";
    void bloque.offsetHeight;

    const rootRect = root.getBoundingClientRect();
    const topRel = bloque.getBoundingClientRect().top - rootRect.top;
    const bottomRel = topRel + bloque.offsetHeight;

    let corteCruzado: number | null = null;
    for (let corte = pasoPaginaPx; corte < bottomRel; corte += pasoPaginaPx) {
      if (topRel < corte - 1 && bottomRel > corte + 1) {
        corteCruzado = corte;
        break;
      }
    }

    if (corteCruzado === null) {
      break;
    }

    margenExtraPx += Math.ceil(corteCruzado - topRel + 28);
  }

  if (margenExtraPx > 0) {
    bloque.style.marginTop = `${margenExtraPx}px`;
  }

  return () => {
    bloque.style.marginTop = marginPrev;
  };
}
