// src/lib/ticketPdf.js
// Arma y descarga el PDF de una entrada de Mis Entradas.
// La regla 48h viene del backend: qr_payload llega null si faltan >48h.
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { loadImageAsDataUrl } from './pdfImage';
import { getImageUrl } from '../utils/imageUtils';
import logoUrl from '../assets/VibraTicketLogo2.png';

// Paleta de marca (coincide con el logo y los templates de email v2).
const COLORS = {
  violet: [124, 58, 237], // #7C3AED
  violetDark: [91, 33, 182], // #5B21B6
  blue: [59, 130, 246], // #3B82F6
  text: [31, 41, 55], // #1F2937
  muted: [107, 114, 128], // #6B7280
  soft: [245, 243, 255], // #F5F3FF
  white: [255, 255, 255],
};

const PAGE_W = 210; // A4 vertical, mm
const MARGIN_X = 14;
const CONTENT_W = PAGE_W - MARGIN_X * 2; // 182mm
const MAX_Y = 283; // límite de contenido antes del footer/margen inferior

/**
 * Modelo del PDF (puro, testeable): datos ya formateados + datos del QR.
 * No hace red/canvas: solo arma strings y resuelve la URL de la imagen del
 * evento (getImageUrl es puro, solo concatena, no hace fetch).
 * @param {object} t ticket de /tickets/my-tickets
 * @returns {object}
 */
export function buildTicketPdfModel(t) {
  const showDate = t.show_date ? new Date(t.show_date) : null;
  const fecha = showDate
    ? showDate.toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'short' })
    : '';
  const fechaCorta = showDate
    ? showDate.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  // Pseudo-asientos GA no tienen fila: omitir "Fila"
  const ubicacion = t.sector
    ? (t.row_label
        ? `Sector ${t.sector} - Fila ${t.row_label} - Asiento ${t.seat_number}`
        : `Sector ${t.sector} - ${t.seat_number}`)
    : null;

  const ticketNumberDisplay = String(t.ticketNumber || t.ticketId || t.id || '');
  const ordenText = t.order_id !== undefined && t.order_id !== null ? `#${t.order_id}` : null;

  const lines = [
    t.venue_name || null,
    fecha || null,
    ubicacion,
    `Ticket: ${ticketNumberDisplay}`,
    ordenText ? `Orden: ${ordenText}` : null,
  ].filter(Boolean);

  // Filas de la tarjeta de detalles del PDF (orden: fecha, lugar, ubicación, orden).
  const details = [
    fecha ? { label: 'FECHA', value: fecha } : null,
    t.venue_name ? { label: 'LUGAR', value: t.venue_name } : null,
    ubicacion ? { label: 'UBICACIÓN', value: ubicacion } : null,
    ordenText ? { label: 'ORDEN', value: ordenText } : null,
  ].filter(Boolean);

  // Mismo contenido que el ticket impreso de boletería: base64 del payload
  // (la validación de puerta acepta QR estático en ese formato)
  let qrData = null;
  if (t.qr_payload) {
    qrData = t.qr_payload.trim().startsWith('{')
      ? btoa(unescape(encodeURIComponent(t.qr_payload)))
      : t.qr_payload; // ya viene en base64
  }

  // Imagen del evento: getMyTickets agrega event_image; el objeto event
  // embebido (otros endpoints) trae las variantes cover_*. getImageUrl no
  // hace red, solo resuelve la URL absoluta (o null si no hay imagen: acá
  // NO queremos su placeholder SVG porque jsPDF no puede dibujarlo).
  const rawImage =
    t.event_image ||
    t.event_image_url ||
    t.eventImageUrl ||
    (t.event && typeof t.event === 'object'
      ? t.event.cover_horizontal_url || t.event.cover_square_url || t.event.image_url
      : null);
  const eventImageUrl = rawImage ? getImageUrl(rawImage) : null;

  return {
    title: t.event_name || 'Entrada',
    eventName: t.event_name || 'Entrada',
    venueName: t.venue_name || null,
    fecha,
    fechaCorta,
    ubicacion,
    ordenText,
    ticketNumberDisplay,
    details,
    lines,
    qrData,
    qrNote: qrData ? null : 'El código QR se habilita 48 horas antes del evento.\nVolvé a descargar este PDF entonces.',
    fileName: `entrada-${t.ticketNumber || t.id}.pdf`,
    eventImageUrl,
  };
}

// Reduce el tamaño de fuente del nombre del evento hasta que entre en 1-2
// líneas dentro del ancho disponible (usa splitTextToSize de jsPDF, que ya
// mide con la fuente/tamaño activos en el momento de llamarlo).
function fitEventNameLines(doc, name, maxWidth) {
  doc.setFont('helvetica', 'bold');
  const sizes = [20, 18, 16];
  let lines = [name];
  let chosenSize = sizes[sizes.length - 1];
  for (const size of sizes) {
    doc.setFontSize(size);
    const candidate = doc.splitTextToSize(name, maxWidth);
    chosenSize = size;
    lines = candidate;
    if (candidate.length <= 2) break;
  }
  return { lines: lines.slice(0, 2), size: chosenSize };
}

/**
 * Genera y dispara la descarga del PDF de la entrada.
 * Diseño: header con logo, foto del evento con banda de título, tarjeta de
 * detalles, QR grande centrado, línea de "perforado" y stub con el resumen.
 */
export async function downloadTicketPdf(ticket) {
  const model = buildTicketPdfModel(ticket);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ---------- 1. Header ----------
  doc.setFillColor(...COLORS.white);
  doc.rect(0, 0, PAGE_W, 22, 'F');

  const logoDataUrl = await loadImageAsDataUrl(logoUrl, { format: 'image/png' });
  if (logoDataUrl) {
    try {
      const props = doc.getImageProperties(logoDataUrl);
      const logoH = 10;
      const logoW = (props.width / props.height) * logoH;
      doc.addImage(logoDataUrl, 'PNG', MARGIN_X, 6, logoW, logoH);
    } catch {
      // dataURL corrupta: seguimos sin logo, no es crítico
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.violet);
  doc.text('ENTRADA DIGITAL', PAGE_W - MARGIN_X, 11, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text('vibratickets.com', PAGE_W - MARGIN_X, 16, { align: 'right' });

  doc.setDrawColor(...COLORS.violet);
  doc.setLineWidth(0.8);
  doc.line(0, 22, PAGE_W, 22);

  let y = 22 + 6;

  // ---------- 2. Hero del evento ----------
  const heroH = 50;
  const heroBandH = 14;
  const heroY = y;

  let heroDataUrl = null;
  if (model.eventImageUrl) {
    heroDataUrl = await loadImageAsDataUrl(model.eventImageUrl, {
      width: 1200,
      height: Math.round((1200 * heroH) / CONTENT_W),
      format: 'image/jpeg',
      quality: 0.85,
    });
  }

  let heroDrawn = false;
  if (heroDataUrl) {
    try {
      doc.addImage(heroDataUrl, 'JPEG', MARGIN_X, heroY, CONTENT_W, heroH);
      doc.setDrawColor(...COLORS.muted);
      doc.setLineWidth(0.2);
      doc.rect(MARGIN_X, heroY, CONTENT_W, heroH);
      heroDrawn = true;
    } catch {
      heroDrawn = false; // dataURL corrupta: cae al degradado de abajo
    }
  }

  if (!heroDrawn) {
    // Degradado violeta -> azul simulado con franjas verticales finas
    const slices = 20;
    const sliceW = CONTENT_W / slices;
    for (let i = 0; i < slices; i++) {
      const ratio = i / (slices - 1);
      const r = Math.round(COLORS.violet[0] + (COLORS.blue[0] - COLORS.violet[0]) * ratio);
      const g = Math.round(COLORS.violet[1] + (COLORS.blue[1] - COLORS.violet[1]) * ratio);
      const b = Math.round(COLORS.violet[2] + (COLORS.blue[2] - COLORS.violet[2]) * ratio);
      doc.setFillColor(r, g, b);
      // +0.6 de solape para que no queden líneas blancas entre franjas
      doc.rect(MARGIN_X + i * sliceW, heroY, sliceW + 0.6, heroH, 'F');
    }
  }

  // Banda inferior con el nombre del evento (violeta sólido, siempre legible
  // tenga o no foto de fondo)
  const bandY = heroY + heroH - heroBandH;
  doc.setFillColor(...COLORS.violet);
  doc.rect(MARGIN_X, bandY, CONTENT_W, heroBandH, 'F');

  const { lines: nameLines, size: nameSize } = fitEventNameLines(doc, model.eventName, CONTENT_W - 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(nameSize);
  doc.setTextColor(...COLORS.white);
  if (nameLines.length <= 1) {
    doc.text(nameLines[0] || model.eventName, PAGE_W / 2, bandY + heroBandH / 2 + 2, { align: 'center' });
  } else {
    doc.text(nameLines[0], PAGE_W / 2, bandY + heroBandH / 2 - 1, { align: 'center' });
    doc.text(nameLines[1], PAGE_W / 2, bandY + heroBandH / 2 + 5, { align: 'center' });
  }
  doc.setTextColor(...COLORS.text);

  y = heroY + heroH + 8;

  // ---------- 3. Tarjeta de detalles ----------
  if (model.details.length > 0) {
    const rowH = 9;
    const cardPadTop = 9;
    const cardPadBottom = 6;
    const cardH = model.details.length * rowH + cardPadTop - rowH + cardPadBottom;
    const cardY = y;

    doc.setFillColor(...COLORS.soft);
    doc.roundedRect(MARGIN_X, cardY, CONTENT_W, cardH, 3, 3, 'F');

    let rowY = cardY + cardPadTop;
    const labelX = MARGIN_X + 7;
    const valueX = MARGIN_X + 42;
    for (const row of model.details) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.muted);
      doc.text(row.label, labelX, rowY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(...COLORS.text);
      doc.text(row.value, valueX, rowY, { maxWidth: CONTENT_W - (valueX - MARGIN_X) - 7 });
      rowY += rowH;
    }
    doc.setTextColor(...COLORS.text);

    y = cardY + cardH + 10;
  } else {
    y += 4;
  }

  // ---------- 4. Bloque QR ----------
  const qrSize = 62;
  const qrPad = 6;
  const qrCaptionH = 16;
  const qrBoxW = qrSize + qrPad * 2;
  const qrBoxH = qrSize + qrPad * 2 + qrCaptionH;
  const qrBoxX = (PAGE_W - qrBoxW) / 2;
  const qrBoxY = y;

  doc.setDrawColor(...COLORS.violet);
  doc.setLineWidth(0.6);
  doc.setFillColor(...COLORS.white);
  doc.roundedRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 4, 4, 'FD');

  if (model.qrData) {
    const qrDataUrl = await QRCode.toDataURL(model.qrData, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 500,
    });
    doc.addImage(qrDataUrl, 'PNG', qrBoxX + qrPad, qrBoxY + qrPad, qrSize, qrSize);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.muted);
    doc.text('Presentá este código en el acceso', PAGE_W / 2, qrBoxY + qrPad + qrSize + 6, { align: 'center' });

    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.text);
    doc.text(model.ticketNumberDisplay, PAGE_W / 2, qrBoxY + qrPad + qrSize + 13, { align: 'center' });
  } else {
    doc.setFillColor(...COLORS.soft);
    doc.roundedRect(qrBoxX + 4, qrBoxY + 4, qrBoxW - 8, qrBoxH - 8, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.violetDark);
    const noteLines = (model.qrNote || '').split('\n');
    let noteY = qrBoxY + qrBoxH / 2 - ((noteLines.length - 1) * 6) / 2;
    for (const line of noteLines) {
      doc.text(line, PAGE_W / 2, noteY, { align: 'center' });
      noteY += 6;
    }
  }
  doc.setTextColor(...COLORS.text);

  y = qrBoxY + qrBoxH + 10;

  // ---------- 5. Divisor "perforado" ----------
  doc.setDrawColor(...COLORS.muted);
  doc.setLineWidth(0.4);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y);
  doc.setLineDashPattern([], 0);

  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.muted);
  doc.setLineWidth(0.3);
  doc.circle(MARGIN_X, y, 2, 'FD');
  doc.circle(PAGE_W - MARGIN_X, y, 2, 'FD');

  y += 10;

  // ---------- 6. Stub (footer) ----------
  const stubY = Math.min(y, MAX_Y - 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.text);
  doc.text(model.eventName, MARGIN_X, stubY, { maxWidth: CONTENT_W * 0.6 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.muted);
  doc.text(model.fechaCorta || '', MARGIN_X, stubY + 5);

  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  doc.text(model.ticketNumberDisplay, PAGE_W - MARGIN_X, stubY, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text(
    'Entrada válida por única vez. No compartas tu código QR. · VibraTickets',
    PAGE_W / 2,
    Math.min(stubY + 14, MAX_Y + 6),
    { align: 'center' }
  );
  doc.setTextColor(...COLORS.text);

  doc.save(model.fileName);
}
