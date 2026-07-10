// src/lib/pdfImage.js
// Helper de carga de imágenes a dataURL para incrustarlas en el PDF de la
// entrada (logo + foto del evento). Vive en su propio módulo (en vez de
// dentro de ticketPdf.js) para poder mockearlo entero en tests: jsdom no
// implementa canvas, así que este código nunca corre bajo Vitest, solo en
// el navegador real.
//
// Usa <img> + <canvas> en lugar de pasarle una URL directamente a
// jsPDF.addImage porque esa API solo acepta dataURL/HTMLImageElement/
// HTMLCanvasElement de forma confiable entre versiones.

function loadHtmlImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${url}`));
    img.src = url;
  });
}

// Recorte "cover" (como background-size:cover): centra y recorta el sobrante
// para llenar exactamente el box target sin deformar la imagen.
function drawCover(img, targetW, targetH) {
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');

  const imgRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = targetW / targetH;
  let sx, sy, sw, sh;
  if (imgRatio > targetRatio) {
    // Imagen más "ancha" que el target: recortar los costados
    sh = img.naturalHeight;
    sw = sh * targetRatio;
    sy = 0;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    // Imagen más "alta" que el target: recortar arriba/abajo
    sw = img.naturalWidth;
    sh = sw / targetRatio;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
  return canvas;
}

/**
 * Carga una imagen (misma-origen) y la devuelve como dataURL.
 * - Sin `width`/`height`: devuelve la imagen a su tamaño natural (útil para
 *   el logo, que no debe recortarse, solo escalarse manteniendo aspecto).
 * - Con `width`/`height`: recorta "cover" al box indicado (para la foto
 *   del evento). Solo importa la relación width/height, no la unidad.
 * Nunca lanza: ante cualquier error de red o decodificación devuelve
 * `null` para que el llamador pueda usar un fallback (degradado, etc.).
 *
 * @param {string} url
 * @param {{width?:number, height?:number, format?:string, quality?:number}} [opts]
 * @returns {Promise<string|null>}
 */
export async function loadImageAsDataUrl(url, { width, height, format = 'image/jpeg', quality = 0.85 } = {}) {
  if (!url) return null;
  try {
    const img = await loadHtmlImage(url);
    let canvas;
    if (width && height) {
      canvas = drawCover(img, width, height);
    } else {
      canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 1;
      canvas.height = img.naturalHeight || 1;
      canvas.getContext('2d').drawImage(img, 0, 0);
    }
    return canvas.toDataURL(format, quality);
  } catch {
    return null;
  }
}
