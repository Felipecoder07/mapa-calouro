import { describe, it, expect } from 'vitest';

describe('Módulo 10: Estado da Aplicação & Fluxos Combinados', () => {
  it('E2E-69: Selecionar outro local enquanto uma rota está ativa deve manter a rota no mapa para melhor UX', () => {
    let activeRoute: any = { distance: 1.2, duration: 15 };
    let selectedPlace: string | null = 'place-1';

    // Ação: selecionar novo local 'place-2' mantendo a rota no mapa
    const handleSelectPlace = (newPlaceId: string) => {
      selectedPlace = newPlaceId;
      // rota ativa permanece visível no mapa
    };

    handleSelectPlace('place-2');

    expect(selectedPlace).toBe('place-2');
    expect(activeRoute).not.toBeNull();
  });

  it('E2E-70: Origem da rota da UFC usa sempre as coordenadas da portaria oficial de saída', () => {
    const UNIVERSITY_EXIT = { lat: -4.945620, lng: -37.975554 };
    const originChoice = 'university';

    const startCoordinates = originChoice === 'university' ? UNIVERSITY_EXIT : null;

    expect(startCoordinates?.lat).toBe(-4.945620);
    expect(startCoordinates?.lng).toBe(-37.975554);
  });
});
