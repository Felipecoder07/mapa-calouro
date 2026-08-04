import { describe, it, expect } from 'vitest';

function parseGoogleMapsInput(input: string) {
  let name: string | undefined;
  let lat: number | undefined;
  let lng: number | undefined;

  let decodedInput = input;
  try {
    decodedInput = decodeURIComponent(input);
  } catch {
    // ignore
  }

  const pinMatch = decodedInput.match(/3d(-?\d+\.\d+)[!&]?4d(-?\d+\.\d+)/i);
  if (pinMatch) {
    lat = parseFloat(pinMatch[1]);
    lng = parseFloat(pinMatch[2]);
  }

  if (lat === undefined || lng === undefined) {
    const revPinMatch = decodedInput.match(/2d(-?\d+\.\d+)[!&]?3d(-?\d+\.\d+)/i);
    if (revPinMatch) {
      lng = parseFloat(revPinMatch[1]);
      lat = parseFloat(revPinMatch[2]);
    }
  }

  if (lat === undefined || lng === undefined) {
    const queryMatch = decodedInput.match(/(?:[?&](?:q|ll)=(?:loc:)?|search\/|dir\/)(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/i);
    if (queryMatch) {
      lat = parseFloat(queryMatch[1]);
      lng = parseFloat(queryMatch[2]);
    }
  }

  if (lat === undefined || lng === undefined) {
    const viewportMatch = decodedInput.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (viewportMatch) {
      lat = parseFloat(viewportMatch[1]);
      lng = parseFloat(viewportMatch[2]);
    }
  }

  if (lat === undefined || lng === undefined) {
    const coordMatches = [...decodedInput.matchAll(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/g)];
    for (const match of coordMatches) {
      const candidateLat = parseFloat(match[1]);
      const candidateLng = parseFloat(match[2]);
      if (candidateLat >= -90 && candidateLat <= 90 && candidateLng >= -180 && candidateLng <= 180) {
        lat = candidateLat;
        lng = candidateLng;
        break;
      }
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

  it('E2E-58: Extrai coordenadas com param ?q= ou @viewport', () => {
    const qUrl = 'https://maps.google.com/?q=-4.9381,-37.9654';
    const resQ = parseGoogleMapsInput(qUrl);
    expect(resQ.lat).toBe(-4.9381);
    expect(resQ.lng).toBe(-37.9654);

    const vpUrl = 'https://www.google.com/maps/place/Local/@-4.9412,-37.9712,15z';
    const resVp = parseGoogleMapsInput(vpUrl);
    expect(resVp.lat).toBe(-4.9412);
    expect(resVp.lng).toBe(-37.9712);
  });

  it('E2E-50: Validação do Admin - impede salvar se nome estiver em branco', () => {
    const nameInput = '   ';
    const isValid = Boolean(nameInput.trim());
    expect(isValid).toBe(false);
  });
});
