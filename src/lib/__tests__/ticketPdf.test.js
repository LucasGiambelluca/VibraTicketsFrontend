import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildTicketPdfModel, downloadTicketPdf } from '../ticketPdf';

const base = {
  id: 7,
  ticketNumber: 'TICKET-12-5945-123',
  order_id: 12,
  event_name: 'Rs Fest',
  venue_name: 'Teatro Gran Rex',
  show_date: '2026-06-20T03:00:00.000Z',
  sector: 'Vip',
  row_label: 'A',
  seat_number: 'A3',
  qr_payload: '{"orderId":12,"ticketNumber":"TICKET-12-5945-123"}',
};

describe('buildTicketPdfModel', () => {
  it('asiento numerado con QR (<48h): payload JSON → base64', () => {
    const m = buildTicketPdfModel(base);
    expect(m.title).toBe('Rs Fest');
    expect(m.lines).toContain('Sector Vip - Fila A - Asiento A3');
    expect(m.lines).toContain('Orden: #12');
    expect(m.qrNote).toBeNull();
    // base64 decodificable al payload original
    expect(atob(m.qrData)).toBe(base.qr_payload);
    expect(m.fileName).toBe('entrada-TICKET-12-5945-123.pdf');
  });

  it('pseudo-asiento GA sin fila: omite "Fila"', () => {
    const m = buildTicketPdfModel({ ...base, row_label: null, sector: 'campo', seat_number: 'GA2' });
    expect(m.lines).toContain('Sector campo - GA2');
    expect(m.lines.join(' ')).not.toContain('Fila');
  });

  it('>48h: sin QR, con leyenda', () => {
    const m = buildTicketPdfModel({ ...base, qr_payload: null });
    expect(m.qrData).toBeNull();
    expect(m.qrNote).toMatch(/48 horas/);
  });

  it('qr_payload ya en base64: lo usa tal cual', () => {
    const b64 = btoa('{"a":1}');
    const m = buildTicketPdfModel({ ...base, qr_payload: b64 });
    expect(m.qrData).toBe(b64);
  });

  // Campos agregados para el rediseño del PDF (tarjeta de detalles + hero
  // con foto del evento). buildTicketPdfModel sigue siendo puro/testeable.
  it('arma "details" en orden FECHA/LUGAR/UBICACIÓN/ORDEN, omitiendo filas vacías', () => {
    const m = buildTicketPdfModel(base);
    expect(m.details.map((d) => d.label)).toEqual(['FECHA', 'LUGAR', 'UBICACIÓN', 'ORDEN']);
    expect(m.details.find((d) => d.label === 'UBICACIÓN').value).toBe('Sector Vip - Fila A - Asiento A3');
    expect(m.details.find((d) => d.label === 'ORDEN').value).toBe('#12');
  });

  it('sin venue_name ni order_id: "details" solo trae las filas presentes', () => {
    const m = buildTicketPdfModel({ ...base, venue_name: null, order_id: null });
    expect(m.details.map((d) => d.label)).toEqual(['FECHA', 'UBICACIÓN']);
  });

  it('fechaCorta: formato corto con fecha y hora', () => {
    const m = buildTicketPdfModel(base);
    expect(m.fechaCorta).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('sin show_date: fecha/fechaCorta vacías y sin fila FECHA en "details"', () => {
    const m = buildTicketPdfModel({ ...base, show_date: null });
    expect(m.fecha).toBe('');
    expect(m.fechaCorta).toBe('');
    expect(m.details.map((d) => d.label)).not.toContain('FECHA');
  });

  it('resuelve eventImageUrl desde event_image (agregado por getMyTickets)', () => {
    const m = buildTicketPdfModel({ ...base, event_image: '/uploads/events/foo.jpg' });
    expect(m.eventImageUrl).toContain('/uploads/events/foo.jpg');
  });

  it('sin imagen: eventImageUrl es null (nunca el placeholder SVG, jsPDF no puede dibujarlo)', () => {
    const m = buildTicketPdfModel(base);
    expect(m.eventImageUrl).toBeNull();
  });

  it('resuelve eventImageUrl desde el objeto event embebido (cover_horizontal_url)', () => {
    const m = buildTicketPdfModel({ ...base, event: { cover_horizontal_url: '/uploads/events/bar.jpg' } });
    expect(m.eventImageUrl).toContain('/uploads/events/bar.jpg');
  });
});

// ---------------------------------------------------------------------------
// downloadTicketPdf: no se testea el dibujo de jsPDF en sí (no tiene sentido
// asertar coordenadas pixel a pixel), pero sí que el flujo completo corre sin
// romper y llama a las piezas esperadas (logo, foto, QR, texto, save). jsdom
// no implementa canvas, así que el helper de imágenes (../pdfImage) y jsPDF
// se mockean; jsPDF se mockea con instancias reales devueltas por `new` para
// poder inspeccionar qué se dibujó.
vi.mock('../pdfImage', () => ({
  loadImageAsDataUrl: vi.fn(),
}));

vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn() },
}));

vi.mock('jspdf', () => {
  const instances = [];
  function jsPDF() {
    const instance = {
      setFillColor: vi.fn(),
      setDrawColor: vi.fn(),
      setLineWidth: vi.fn(),
      setLineDashPattern: vi.fn(),
      rect: vi.fn(),
      roundedRect: vi.fn(),
      circle: vi.fn(),
      line: vi.fn(),
      setFont: vi.fn(),
      setFontSize: vi.fn(),
      setTextColor: vi.fn(),
      splitTextToSize: vi.fn((text) => [text]),
      getImageProperties: vi.fn(() => ({ width: 200, height: 80 })),
      addImage: vi.fn(),
      text: vi.fn(),
      save: vi.fn(),
    };
    instances.push(instance);
    return instance;
  }
  return { jsPDF, __instances: instances };
});

import { loadImageAsDataUrl } from '../pdfImage';
import QRCode from 'qrcode';
import { __instances } from 'jspdf';

describe('downloadTicketPdf (smoke, jsPDF/QRCode/imágenes mockeados)', () => {
  beforeEach(() => {
    __instances.length = 0;
    loadImageAsDataUrl.mockReset().mockResolvedValue('data:image/png;base64,AAAA');
    QRCode.toDataURL.mockReset().mockResolvedValue('data:image/png;base64,QRQR');
  });

  const lastDoc = () => __instances[__instances.length - 1];

  it('con QR habilitado y foto de evento: dibuja logo + foto + QR y guarda el PDF', async () => {
    await downloadTicketPdf({ ...base, event_image: '/uploads/events/foo.jpg' });

    const doc = lastDoc();
    expect(doc).toBeTruthy();
    // 3 imágenes incrustadas: logo, foto del evento, QR
    expect(doc.addImage.mock.calls.length).toBe(3);

    const allText = doc.text.mock.calls.map((args) => args[0]).flat();
    expect(allText).toContain('ENTRADA DIGITAL');
    expect(allText.join(' ')).toContain('Rs Fest');
    expect(allText).toContain('Presentá este código en el acceso');
    expect(allText.some((s) => typeof s === 'string' && s.includes('TICKET-12-5945-123'))).toBe(true);

    expect(doc.save).toHaveBeenCalledWith('entrada-TICKET-12-5945-123.pdf');
  });

  it('sin foto de evento: dibuja el degradado (rects) en vez de addImage para el hero', async () => {
    await downloadTicketPdf({ ...base });

    const doc = lastDoc();
    // Solo logo + QR (no hay eventImageUrl -> no se llama loadImageAsDataUrl para el hero)
    expect(doc.addImage.mock.calls.length).toBe(2);
    // El degradado violeta->azul se simula con 20 franjas rectangulares
    expect(doc.rect.mock.calls.length).toBeGreaterThanOrEqual(20);
  });

  it('>48h (sin QR): dibuja la leyenda de bloqueo en vez de addImage para el QR', async () => {
    await downloadTicketPdf({ ...base, qr_payload: null });

    const doc = lastDoc();
    // Solo el logo usa addImage (sin foto de evento en `base`, sin QR)
    expect(doc.addImage.mock.calls.length).toBe(1);
    const allText = doc.text.mock.calls.map((args) => args[0]).flat();
    expect(allText.join(' ')).toMatch(/48 horas/);
  });

  it('si falla la carga de imágenes (logo y foto): sigue generando el PDF igual', async () => {
    loadImageAsDataUrl.mockResolvedValue(null);

    await expect(
      downloadTicketPdf({ ...base, event_image: '/uploads/events/foo.jpg' })
    ).resolves.toBeUndefined();

    const doc = lastDoc();
    // Ni logo ni hero (ambos null) -> solo el QR usa addImage
    expect(doc.addImage.mock.calls.length).toBe(1);
    expect(doc.save).toHaveBeenCalled();
  });
});
