// src/lib/ticketPdf.js
// Arma y descarga el PDF de una entrada de Mis Entradas.
// La regla 48h viene del backend: qr_payload llega null si faltan >48h.
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

/**
 * Modelo del PDF (puro, testeable): líneas de texto + datos del QR.
 * @param {object} t ticket de /tickets/my-tickets
 * @returns {{title:string, lines:string[], qrData:string|null, qrNote:string|null, fileName:string}}
 */
export function buildTicketPdfModel(t) {
  const fecha = t.show_date
    ? new Date(t.show_date).toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'short' })
    : '';

  // Pseudo-asientos GA no tienen fila: omitir "Fila"
  const ubicacion = t.sector
    ? (t.row_label
        ? `Sector ${t.sector} - Fila ${t.row_label} - Asiento ${t.seat_number}`
        : `Sector ${t.sector} - ${t.seat_number}`)
    : null;

  const lines = [
    t.venue_name || null,
    fecha || null,
    ubicacion,
    `Ticket: ${t.ticketNumber || t.ticketId || t.id}`,
    `Orden: #${t.order_id}`,
  ].filter(Boolean);

  // Mismo contenido que el ticket impreso de boletería: base64 del payload
  // (la validación de puerta acepta QR estático en ese formato)
  let qrData = null;
  if (t.qr_payload) {
    qrData = t.qr_payload.trim().startsWith('{')
      ? btoa(unescape(encodeURIComponent(t.qr_payload)))
      : t.qr_payload; // ya viene en base64
  }

  return {
    title: t.event_name || 'Entrada',
    lines,
    qrData,
    qrNote: qrData ? null : 'El código QR se habilita 48 horas antes del evento.\nVolvé a descargar este PDF entonces.',
    fileName: `entrada-${t.ticketNumber || t.id}.pdf`,
  };
}

/**
 * Genera y dispara la descarga del PDF de la entrada.
 */
export async function downloadTicketPdf(ticket) {
  const model = buildTicketPdfModel(ticket);
  const doc = new jsPDF(); // A4 vertical, unidades mm

  doc.setFontSize(22);
  doc.text(model.title, 105, 30, { align: 'center' });

  doc.setFontSize(12);
  let y = 45;
  for (const line of model.lines) {
    doc.text(line, 105, y, { align: 'center' });
    y += 8;
  }

  if (model.qrData) {
    const dataUrl = await QRCode.toDataURL(model.qrData, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 400,
    });
    doc.addImage(dataUrl, 'PNG', 65, y + 5, 80, 80);
    y += 90;
  } else {
    doc.setFontSize(11);
    doc.setTextColor(120);
    for (const line of model.qrNote.split('\n')) {
      y += 8;
      doc.text(line, 105, y + 5, { align: 'center' });
    }
    doc.setTextColor(0);
    y += 15;
  }

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    'Entrada válida por única vez. No compartas tu código QR.',
    105,
    Math.min(y + 20, 280),
    { align: 'center' }
  );
  doc.setTextColor(0);

  doc.save(model.fileName);
}
