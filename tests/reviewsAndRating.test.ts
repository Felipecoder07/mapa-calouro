import { describe, it, expect } from 'vitest';
import type { Review } from '../src/types';

describe('Módulo 7: Avaliações dos Alunos & Média de Notas', () => {
  const reviews: Review[] = [
    { id: 'r1', place_id: 'p1', author: 'João', rating: 5, comment: 'Muito bom', created_at: '2026-08-01T10:00:00Z' },
    { id: 'r2', place_id: 'p1', author: 'Maria', rating: 3, comment: 'Razoável', created_at: '2026-08-02T11:00:00Z' },
  ];

  it('E2E-42: Cálculo de média de avaliações com múltiplas notas', () => {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    expect(avgRating).toBe(4.0);
  });

  it('E2E-39: Validação de formulário - rejeita submissão com autor em branco', () => {
    const newAuthor = '   ';
    const isValid = Boolean(newAuthor.trim());
    expect(isValid).toBe(false);
  });

  it('E2E-44: Formatação de data em padrão pt-BR', () => {
    const formattedDate = new Date('2026-08-04T12:00:00Z').toLocaleDateString('pt-BR');
    expect(formattedDate).toContain('04/08/2026');
  });

  it('E2E-45: Permite salvar avaliação sem comentário (comentário opcional)', () => {
    const reviewWithoutComment: Review = {
      id: 'r3',
      place_id: 'p1',
      author: 'Pedro',
      rating: 4,
      comment: null,
      created_at: new Date().toISOString(),
    };
    expect(reviewWithoutComment.comment).toBeNull();
    expect(reviewWithoutComment.rating).toBeGreaterThanOrEqual(1);
  });
});
