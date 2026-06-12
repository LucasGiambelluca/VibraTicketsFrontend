import { describe, it, expect } from 'vitest';
import { buildTicketPdfModel } from '../ticketPdf';

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
});
