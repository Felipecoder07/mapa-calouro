import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchRoute } from '../src/lib/mapUtils';

describe('Módulo 2: Utilitários de Mapeamento e Rota (mapUtils.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('UT-13: fetchRoute - constrói a URL com o perfil foot para modo pedestre', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        routes: [
          {
            distance: 1000,
            duration: 600,
            geometry: {
              coordinates: [
                [-37.975554, -4.945620],
                [-37.974100, -4.945000],
              ],
            },
          },
        ],
      }),
    } as Response);

    const route = await fetchRoute(-4.945620, -37.975554, -4.945000, -37.974100, 'foot');
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/route/v1/foot/')
    );
    expect(route).not.toBeNull();
  });

  it('UT-14: fetchRoute - constrói a URL com o perfil car para modo driving', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        routes: [
          {
            distance: 1200,
            duration: 180,
            geometry: { coordinates: [[-37.975554, -4.945620], [-37.9741, -4.945]] },
          },
        ],
      }),
    } as Response);

    await fetchRoute(-4.945620, -37.975554, -4.945000, -37.974100, 'driving');
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/route/v1/car/')
    );
  });

  it('UT-15: fetchRoute - converte as coordenadas GeoJSON [lng, lat] para [lat, lng]', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        routes: [
          {
            distance: 500,
            duration: 300,
            geometry: {
              coordinates: [
                [-37.9755, -4.9456],
                [-37.9741, -4.9437],
              ],
            },
          },
        ],
      }),
    } as Response);

    const route = await fetchRoute(-4.9456, -37.9755, -4.9437, -37.9741, 'foot');
    expect(route?.coordinates).toEqual([
      [-4.9456, -37.9755],
      [-4.9437, -37.9741],
    ]);
  });

  it('UT-16: fetchRoute - retorna null quando a API responde com erro HTTP', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const route = await fetchRoute(-4.9456, -37.9755, -4.9437, -37.9741, 'foot');
    expect(route).toBeNull();
  });

  it('UT-17: fetchRoute - retorna null se a resposta OSRM não contiver rotas válidas', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'NoRoute', routes: [] }),
    } as Response);

    const route = await fetchRoute(-4.9456, -37.9755, -4.9437, -37.9741, 'foot');
    expect(route).toBeNull();
  });

  it('UT-19/20: fetchRoute - converte metros para km e segundos para minutos', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        routes: [
          {
            distance: 2500, // 2.5 km
            duration: 300,  // 5 min
            geometry: { coordinates: [] },
          },
        ],
      }),
    } as Response);

    const route = await fetchRoute(-4.9456, -37.9755, -4.9437, -37.9741, 'foot');
    expect(route?.distance).toBe(2.5);
    expect(route?.duration).toBe(5);
  });
});
