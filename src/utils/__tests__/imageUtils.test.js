import { describe, it, expect } from 'vitest';
import { getImageUrl, getLocalImagePlaceholder } from '../imageUtils';

describe('getLocalImagePlaceholder', () => {
  it('returns a local data URI (no external host)', () => {
    const url = getLocalImagePlaceholder('Mi Evento');
    expect(url.startsWith('data:image/svg+xml')).toBe(true);
    expect(url).not.toContain('via.placeholder.com');
  });

  it('escapes literal parentheses so it is safe inside an unquoted CSS url(...)', () => {
    // El SVG interno usa fill="url(#g)" para el gradiente: encodeURIComponent
    // no escapa "(" ")" por defecto, así que hay que verificar que no queden
    // paréntesis crudos en el data URI final (rompería el url() del caller).
    const url = getLocalImagePlaceholder('Evento (Test)');
    expect(url).not.toMatch(/[()]/);
  });
});

describe('getImageUrl', () => {
  it('falls back to the local placeholder (not via.placeholder.com) when there is no image', () => {
    const url = getImageUrl(null, 'Evento');
    expect(url.startsWith('data:image/svg+xml')).toBe(true);
  });

  it('returns absolute URLs unchanged', () => {
    expect(getImageUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
  });

  it('prefixes relative paths with the API base URL', () => {
    const url = getImageUrl('/uploads/foo.png');
    expect(url.endsWith('/uploads/foo.png')).toBe(true);
    expect(url).not.toContain('via.placeholder.com');
  });
});
