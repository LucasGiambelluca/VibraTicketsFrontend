import { describe, it, expect } from 'vitest';
import { loadImageAsDataUrl } from '../pdfImage';

// jsdom no implementa canvas (no está instalado el paquete `canvas`), así
// que la parte real de este helper (Image + canvas.drawImage) solo se puede
// probar en un navegador real. Acá solo cubrimos el atajo sin red que sí es
// determinístico bajo Vitest; el resto se verifica vía el smoke test de
// downloadTicketPdf, que mockea este módulo entero.
describe('loadImageAsDataUrl', () => {
  it('sin url: devuelve null sin tocar Image/canvas', async () => {
    await expect(loadImageAsDataUrl(null)).resolves.toBeNull();
    await expect(loadImageAsDataUrl(undefined)).resolves.toBeNull();
    await expect(loadImageAsDataUrl('')).resolves.toBeNull();
  });
});
