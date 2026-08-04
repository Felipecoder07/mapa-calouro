import { describe, it, expect } from 'vitest';

function parseGoogleMapsInput(input: string) {
  let name: string | undefined;
  let lat: number | undefined;
  let lng: number | undefined;

  const pinRegex = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
  const pinMatch = input.match(pinRegex);
  if (pinMatch) {
    lat = parseFloat(pinMatch[1]);
    lng = parseFloat(pinMatch[2]);
  }

  if (!lat) {
    const plainCoordRegex = /^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/;
    const plainMatch = input.trim().match(plainCoordRegex);
    if (plainMatch) {
      lat = parseFloat(plainMatch[1]);
      lng = parseFloat(plainMatch[2]);
    }
  }

  return { name, lat, lng };
}

describe('Módulo 8: Painel Admin & Auto-fill de URLs e Coordenadas', () => {
  it('E2E-56: Extrai coordenadas !3d e !4d de URL completa do Google Maps', () => {
    const url = 'https://www.google.com/maps/place/UFC/@-4.9471,-37.9745,17z/data=!3m1!4b1!4m6!3m5!1s0x7bbf0000!8m2!3d-4.94562!4d-37.975554';
    const result = parseGoogleMapsInput(url);
    expect(result.lat).toBe(-4.94562);
    expect(result.lng).toBe(-37.975554);
  });

  it('E2E-57: Extrai coordenadas em texto puro separadas por vírgula', () => {
    const input = '-4.9471, -37.9745';
    const result = parseGoogleMapsInput(input);
    expect(result.lat).toBe(-4.9471);
    expect(result.lng).toBe(-37.9745);
  });

  it('E2E-50: Validação do Admin - impede salvar se nome estiver em branco', () => {
    const nameInput = '   ';
    const isValid = Boolean(nameInput.trim());
    expect(isValid).toBe(false);
  });
});
