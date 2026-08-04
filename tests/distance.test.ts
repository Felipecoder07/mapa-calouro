import { describe, it, expect } from 'vitest';
import {
  haversineDistance,
  formatDistance,
  formatDuration,
  estimateWalkingTime,
  estimateDrivingTime,
} from '../src/lib/distance';
import { UNIVERSITY } from '../src/lib/constants';

describe('Módulo 1: Utilitários de Distância e Tempo (distance.ts)', () => {
  it('UT-01: haversineDistance - calcula distância entre UFC Russas e ponto próximo (~1km ao norte)', () => {
    // UFC Russas: -4.9471, -37.9745
    // Ponto 1km ao norte aprox (lat + 0.009)
    const dist = haversineDistance(UNIVERSITY.lat, UNIVERSITY.lng, UNIVERSITY.lat + 0.009, UNIVERSITY.lng);
    expect(dist).toBeGreaterThan(0.95);
    expect(dist).toBeLessThan(1.05);
  });

  it('UT-02: haversineDistance - distância do mesmo ponto deve ser exatamente 0', () => {
    const dist = haversineDistance(-4.9471, -37.9745, -4.9471, -37.9745);
    expect(dist).toBe(0);
  });

  it('UT-03: haversineDistance - simetria A -> B é igual a B -> A', () => {
    const distAB = haversineDistance(-4.9471, -37.9745, -4.9400, -37.9700);
    const distBA = haversineDistance(-4.9400, -37.9700, -4.9471, -37.9745);
    expect(distAB).toBeCloseTo(distBA, 5);
  });

  it('UT-04: haversineDistance - retorna NaN se coordenadas forem NaN sem estourar exceção', () => {
    const dist = haversineDistance(NaN, -37.9745, -4.9471, -37.9745);
    expect(dist).toBeNaN();
  });

  it('UT-05: formatDistance - formato em metros para valores menores que 1 km', () => {
    expect(formatDistance(0.4)).toBe('400 m');
    expect(formatDistance(0.05)).toBe('50 m');
  });

  it('UT-06: formatDistance - formato em km com 1 casa decimal para valores >= 1 km', () => {
    expect(formatDistance(2.456)).toBe('2.5 km');
    expect(formatDistance(10.12)).toBe('10.1 km');
  });

  it('UT-07: formatDistance - valor exatamente 1 km exibe 1.0 km', () => {
    expect(formatDistance(1.0)).toBe('1.0 km');
  });

  it('UT-08: formatDuration - exibe minutos para valores < 60 min', () => {
    expect(formatDuration(45.7)).toBe('46 min');
    expect(formatDuration(5)).toBe('5 min');
  });

  it('UT-09: formatDuration - exibe apenas horas para múltiplos exatos de 60 min', () => {
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(120)).toBe('2h');
  });

  it('UT-10: formatDuration - exibe formato composto h min para > 60 min', () => {
    expect(formatDuration(90.5)).toBe('1h 31min');
    expect(formatDuration(150)).toBe('2h 30min');
  });

  it('UT-11: estimateWalkingTime - estimativa a 5 km/h', () => {
    // 1 km a 5 km/h = 12 min
    expect(estimateWalkingTime(1.0)).toBe(12);
    expect(estimateWalkingTime(2.5)).toBe(30);
  });

  it('UT-12: estimateDrivingTime - estimativa a 40 km/h', () => {
    // 2 km a 40 km/h = 3 min
    expect(estimateDrivingTime(2.0)).toBe(3);
    expect(estimateDrivingTime(40.0)).toBe(60);
  });
});
