# 🧪 Plano de Testes Exaustivo — Mapa do Calouro (UFC Russas)
> 110 casos de teste | Engenharia de Software Sênior

---

## Legenda de Tipos

| Código | Tipo | Ferramenta sugerida |
|:-------|:-----|:--------------------|
| `[UT]` | Unit Test | Vitest |
| `[IT]` | Integration Test | Supertest + SQLite `:memory:` |
| `[E2E]` | End-to-End (navegador real) | Playwright |
| `[SEC]` | Security | Playwright + OWASP ZAP |
| `[PERF]` | Performance | Lighthouse CI + DevTools |
| `[A11Y]` | Acessibilidade | axe-core + Playwright |
| `[MOB]` | Mobile / Responsivo | Playwright device emulation |
| `[OFF]` | Offline / Rede instável | Playwright `networkConditions` |

---

## 📐 BLOCO 1 — Utilitários de Distância (`distance.ts`)

### `[UT-01]` haversineDistance — precisão em distância conhecida
**Entrada:** UFC `(-4.9471, -37.9745)` → ponto ~1 km ao norte  
**Esperado:** resultado entre `0.99` e `1.01` km

### `[UT-02]` haversineDistance — mesmo ponto retorna exatamente 0
**Entrada:** coordenadas iguais nos dois lados  
**Esperado:** `0` (não NaN, não undefined, não negativo)

### `[UT-03]` haversineDistance — simetria A→B = B→A
**Esperado:** resultados idênticos independente da ordem dos parâmetros

### `[UT-04]` haversineDistance — coordenadas inválidas (NaN)
**Entrada:** `NaN, -37.97, -4.94, -37.97`  
**Esperado:** retorna `NaN` sem lançar exceção (comportamento previsível)

### `[UT-05]` formatDistance — abaixo de 1 km exibe em metros arredondados
**Entrada:** `0.4` km → **Esperado:** `"400 m"`

### `[UT-06]` formatDistance — acima de 1 km exibe com uma casa decimal
**Entrada:** `2.456` km → **Esperado:** `"2.5 km"`

### `[UT-07]` formatDistance — exatamente 1 km exibe `"1.0 km"` não `"1000 m"`

### `[UT-08]` formatDuration — abaixo de 60 min exibe em minutos arredondados
**Entrada:** `45.7` min → **Esperado:** `"46 min"`

### `[UT-09]` formatDuration — exatamente 60 min exibe `"1h"` sem os minutos
**Entrada:** `60` → **Esperado:** `"1h"` não `"1h 0min"`

### `[UT-10]` formatDuration — horas e minutos compostos
**Entrada:** `90.5` → **Esperado:** `"1h 31min"`

### `[UT-11]` estimateWalkingTime — baseado em 5 km/h
**Entrada:** `1.0` km → **Esperado:** `12` minutos

### `[UT-12]` estimateDrivingTime — baseado em 40 km/h
**Entrada:** `2.0` km → **Esperado:** `3` minutos

---

## 🗺️ BLOCO 2 — Utilitários de Rota (`mapUtils.ts`)

### `[UT-13]` fetchRoute com `'foot'` usa `/route/v1/foot/` na URL
**Stub:** interceptar fetch; verificar URL construída

### `[UT-14]` fetchRoute com `'driving'` usa `/route/v1/car/` na URL (não `driving`)

### `[UT-15]` fetchRoute — conversão GeoJSON `[lng,lat]` → Leaflet `[lat,lng]` está correta
**Entrada:** OSRM retorna `[[-37.9755, -4.9456], [-37.9741, -4.9437]]`  
**Esperado:** coordenadas retornadas: `[[-4.9456, -37.9755], [-4.9437, -37.9741]]`

### `[UT-16]` fetchRoute — retorna `null` em erro HTTP 500

### `[UT-17]` fetchRoute — retorna `null` quando OSRM retorna `{ code: "NoRoute" }`

### `[UT-18]` fetchRoute — retorna `null` quando resposta não é JSON válido

### `[UT-19]` fetchRoute — distância convertida de metros para km corretamente
**Entrada:** OSRM `distance: 1500` (metros) → **Esperado:** `1.5` km

### `[UT-20]` fetchRoute — duração convertida de segundos para minutos corretamente
**Entrada:** OSRM `duration: 300` (segundos) → **Esperado:** `5` minutos

---

## ⭐ BLOCO 3 — Favoritos (`favorites.ts`)

### `[UT-21]` toggleFavorite — adiciona ID novo ao localStorage

### `[UT-22]` toggleFavorite — remove ID já presente, retorna `false`

### `[UT-23]` toggleFavorite — opera corretamente quando há múltiplos favoritos

### `[UT-24]` isFavorite — retorna `false` para ID inexistente sem erro

### `[UT-25]` getFavorites — retorna `[]` quando localStorage está vazio

### `[UT-26]` getFavorites — retorna `[]` silenciosamente quando JSON está corrompido
**Cenário:** `localStorage.setItem(KEY, '{{invalido')`  
**Esperado:** nenhuma exceção; retorna `[]`

### `[UT-27]` toggleFavorite — idempotência: favoritar duas vezes o mesmo ID não duplica
**Ação:** `toggleFavorite('x')` → `toggleFavorite('x')` → `getFavorites()`  
**Esperado:** `[]` (adicionou e removeu)

---

## 🖥️ BLOCO 4 — Backend API REST (`server/index.js`)

### `[IT-01]` GET /api/categories — status 200, array ordenado por sort_order

### `[IT-02]` POST /api/places — criação com campos completos retorna 201 e ID único

### `[IT-03]` POST /api/places — ausência de `name` deve retornar 400
**Falha atual:** retorna 201 com name `undefined`

### `[IT-04]` POST /api/places — `lat` como string não-numérica retorna 400

### `[IT-05]` POST /api/places — `lat/lng` fora do range válido (-90 a 90 / -180 a 180) retorna 400

### `[IT-06]` POST /api/reviews — `rating` menor que 1 retorna 400

### `[IT-07]` POST /api/reviews — `rating` maior que 5 retorna 400

### `[IT-08]` POST /api/reviews — `rating` como string `"5abc"` retorna 400

### `[IT-09]` DELETE /api/places/:id — também remove reviews associadas em cascade

### `[IT-10]` PUT /api/places/:id — campos não enviados preservam valor original

### `[IT-11]` PUT /api/places/:id — ID inexistente retorna 404

### `[IT-12]` GET /api/reviews?place_id=X — filtra corretamente sem vazar dados de outro local

### `[IT-13]` POST /api/places duas vezes simultâneas — IDs não colidem (`Promise.all`)

### `[IT-14]` GET /api/places — JSON do campo `photos` é parsed corretamente (não retorna string)
**Esperado:** `photos` é `string[]`, não `"[\"url1\",\"url2\"]"`

### `[IT-15]` GET /api/places — local sem categoria válida usa categoria padrão (não retorna null)

### `[IT-16]` POST /api/categories — `slug` com espaços ou acentos é sanitizado

---

## 🔒 BLOCO 5 — Segurança (`[SEC]`)

### `[SEC-01]` Acesso a /admin sem autenticação exibe apenas tela de login
**Esperado:** nenhum dado de local ou categoria visível antes do login

### `[SEC-02]` Forjar autenticação via sessionStorage deve ser bloqueado após correção
**Ação:** `sessionStorage.setItem('mapa_calouros_admin_auth', 'true')` + reload  
**Falha atual:** acesso concedido

### `[SEC-03]` Admin visível no código-fonte: senha `admin123` em texto puro
**Verificar:** bundle JS minificado contém `admin123`  
**Falha atual confirmada**

### `[SEC-04]` Brute force — 10 tentativas de senha errada não bloqueia (rate limit ausente)
**Falha atual:** nenhum bloqueio; qualquer número de tentativas aceito

### `[SEC-05]` SQL Injection via nome do local — prepared statements protegem
**Entrada:** `name: "'; DROP TABLE places;--"`  
**Esperado:** inserção como texto literal; tabela intacta

### `[SEC-06]` XSS — tag `<script>` no nome do local não executa JS
**Entrada:** `"<script>alert(1)</script>"`  
**Esperado:** exibido como texto, alerta não disparado

### `[SEC-07]` XSS — tag `<img onerror>` no campo descrição não executa JS
**Entrada:** `"<img src=x onerror=alert(1)>"`  
**Esperado:** texto exibido literalmente, sem execução

### `[SEC-08]` Endpoint DELETE sem autenticação deleta dados livremente
**Ação:** `curl -X DELETE http://localhost:3001/api/places/qualquer-id`  
**Falha atual:** retorna 204 sem verificação de token

### `[SEC-09]` CORS — origin não autorizada bloqueada após correção
**Ação:** fetch de `http://outro-site.com` para a API  
**Falha atual:** qualquer origem aceita

### `[SEC-10]` Payload oversized — imagem base64 com 55MB retorna 413
**Esperado:** Express retorna `413 Payload Too Large` antes de processar

### `[SEC-11]` URL maliciosa no campo `photos` — `javascript:alert()` não executa
**Entrada:** `photos: ["javascript:alert('xss')"]`  
**Esperado:** imagem não renderizada / URL ignorada pelo browser

### `[SEC-12]` Path traversal no parâmetro de ID — `DELETE /api/places/../categories`
**Entrada:** ID com `../` no parâmetro  
**Esperado:** 404 ou erro, sem acessar recurso inesperado

### `[SEC-13]` Senha exibida na tela de login do Admin em produção
**Verificar:** linha `Senha de demonstração: admin123` está visível na UI pública  
**Falha atual:** exibida em [Admin.tsx:813](file:///c:/Users/Mateus/Downloads/mapa-calouro-main/src/components/Admin.tsx#L813)

---

## 🗺️ BLOCO 6 — Mapa e Interação (`[E2E]`)

### `[E2E-01]` Mapa carrega centrado na UFC Russas no estado inicial

### `[E2E-02]` Pinos de locais cadastrados aparecem no mapa com ícone da categoria correta

### `[E2E-03]` Clicar em pino do mapa abre PlaceDetails com dados do local

### `[E2E-04]` PlaceDetails abre no local correto ao clicar pino (não pino vizinho)
**Critério:** nome do card = nome do local clicado

### `[E2E-05]` Troca de camada de mapa (Satélite, Modo Escuro) funciona sem erro

### `[E2E-06]` Zoom e movimentação do mapa funcionam normalmente após selecionar local

### `[E2E-07]` Marcador da UFC exibe popup com nome correto ao clicar

### `[E2E-08]` Marcador do usuário (azul pulsante) aparece ao ativar GPS

### `[E2E-09]` Mapa centraliza no usuário ao ativar GPS (sem local selecionado)

### `[E2E-10]` Mapa NÃO centraliza no usuário quando há um local selecionado ativo

### `[E2E-11]` Rota desenhada no mapa vai do ponto de origem ao destino (polilinha visível)

### `[E2E-12]` Botão "Fechar rota" (X no banner) remove a polilinha do mapa

### `[E2E-13]` Selecionar novo local enquanto rota ativa limpa a polilinha anterior

---

## 📍 BLOCO 7 — Distâncias e Rotas (Lógica Completa)

### `[E2E-14]` Distâncias na Sidebar usam UFC como base quando GPS inativo
**Esperado:** distâncias a partir de `(-4.9471, -37.9745)`

### `[E2E-15]` Ativar GPS recalcula TODAS as distâncias da lista simultaneamente

### `[E2E-16]` Indicador visual na Sidebar mostra origem da distância (📍 De você vs 🏛️ Da UFC)
**Falha atual:** nenhum indicador de origem

### `[E2E-17]` Rota "Da universidade" parte da portaria, não do centro do campus
**Verificar:** primeiro ponto da polilinha ≈ `(-4.945620, -37.975554)`

### `[E2E-18]` Estimativa prévia no card usa mesma origem da portaria que a rota real
**Falha atual:** card usa centro `(-4.9471)`, rota usa portaria `(-4.945620)`

### `[E2E-19]` Modo a pé pode ter rota mais curta que automóvel (via atalhos de pedestre)
**Cenário:** destino acessível por travessa sem saída para carros

### `[E2E-20]` Modo automóvel respeita mão única em ruas de Russas
**Verificar:** rota de carro não usa rua ao contrário que pedestre usa

### `[E2E-21]` Alternância de modo no banner (A pé ↔ Automóvel) refaz chamada OSRM

### `[E2E-22]` Fallback de rota (OSRM indisponível) exibe aviso claro ao usuário
**Falha atual:** linha reta desenhada sem qualquer notificação

### `[E2E-23]` Fallback usa `estimateWalkingTime` para `foot` e `estimateDrivingTime` para `driving`
**Falha atual:** ambos usam `estimateDrivingTime`

### `[E2E-24]` Banner de rota exibe nome correto do local alvo (não nome do local anterior)

### `[E2E-25]` Card fechado ao traçar rota — banner permanece com dados corretos

### `[E2E-26]` Aba "Da UFC" no card sempre calcula distância da UFC, independente do GPS ativo

### `[E2E-27]` Aba "De você" no card só disponível quando GPS ativo; desabilitada caso contrário

---

## 🔍 BLOCO 8 — Busca e Filtros (`[E2E]`)

### `[E2E-28]` Busca por nome parcial retorna locais corretos

### `[E2E-29]` Busca case-insensitive (maiúsculas = minúsculas)
**Entrada:** `"MERCADO"` e `"mercado"` → mesmo resultado

### `[E2E-30]` Busca por endereço retorna local correto

### `[E2E-31]` Busca sem resultado exibe mensagem "Nenhum local encontrado"

### `[E2E-32]` Limpar busca restaura lista completa

### `[E2E-33]` Filtro de categoria filtra apenas locais da categoria selecionada

### `[E2E-34]` Múltiplas categorias selecionadas — mostra locais de qualquer uma (OR, não AND)

### `[E2E-35]` Filtro de favoritos exibe apenas locais marcados como favoritos

### `[E2E-36]` Combinação busca + categoria + favoritos filtra corretamente (interseção)

### `[E2E-37]` Botão "Limpar" dos filtros desmarca todas as categorias e favoritos

### `[E2E-38]` Contador de locais no rodapé da Sidebar reflete o filtro ativo

---

## 💬 BLOCO 9 — Avaliações (`[E2E]` + `[IT]`)

### `[E2E-39]` Formulário de avaliação bloqueado sem nome preenchido (botão desabilitado)

### `[E2E-40]` Avaliação salva aparece imediatamente na lista sem recarregar

### `[E2E-41]` Estrelas da avaliação clicáveis e refletem nota selecionada visualmente

### `[E2E-42]` Média de estrelas recalculada após nova avaliação

### `[E2E-43]` Avaliação salva via SQLite visível em outra aba/browser (persistência real)

### `[E2E-44]` Avaliações exibem data no formato `dd/mm/aaaa` em pt-BR

### `[E2E-45]` Avaliação sem comentário salva somente com nome e nota

---

## ⚙️ BLOCO 10 — Painel Admin (CRUD Completo)

### `[E2E-46]` Login com senha incorreta exibe mensagem de erro, não entra no painel

### `[E2E-47]` Login com Enter no campo senha funciona (não apenas clique no botão)

### `[E2E-48]` Logout limpa sessão e redireciona para tela de login

### `[E2E-49]` Cadastrar local mínimo (só nome + coordenadas) — salva sem erro

### `[E2E-50]` Cadastrar local sem nome — alerta exibido, formulário não fecha

### `[E2E-51]` Editar local — campos pré-preenchidos com dados atuais

### `[E2E-52]` Editar local — salvar altera dados na lista imediatamente

### `[E2E-53]` Deletar local — confirmação solicitada antes de deletar

### `[E2E-54]` Deletar local — pino removido do mapa após retornar ao mapa

### `[E2E-55]` Busca admin por nome filtra lista de locais corretamente

### `[E2E-56]` Auto-fill com link Google Maps `!3d` extrai coordenadas corretas

### `[E2E-57]` Auto-fill com coordenadas puras `"-4.947, -37.974"` preenche lat/lng

### `[E2E-58]` Auto-fill com nome de local busca via Nominatim e preenche endereço

### `[E2E-59]` GPS no Admin preenche lat/lng com posição atual do dispositivo

### `[E2E-60]` Busca por nome no mapa admin (`🔍 Buscar localização`) posiciona pino

### `[E2E-61]` Clicar no mapa do Admin move o pino para as novas coordenadas

### `[E2E-62]` Upload de imagem via botão preenche campo de foto (base64 ou URL)

### `[E2E-63]` Colar imagem da área de transferência (Ctrl+V) adiciona foto

### `[E2E-64]` Remover foto individual (botão X) remove apenas aquela foto

### `[E2E-65]` Criar nova categoria com nome, ícone e cor — aparece na lista

### `[E2E-66]` Excluir categoria — confirmação exibida antes de deletar

### `[E2E-67]` Categoria excluída — locais que a usavam mantêm dados (não quebra)

---

## 📱 BLOCO 11 — Mobile e Responsividade (`[MOB]`)

### `[MOB-01]` Em viewport 375×667 (iPhone SE) sidebar não visível, botão ☰ presente

### `[MOB-02]` Botão ☰ abre drawer lateral com lista de locais

### `[MOB-03]` Clicar fora do drawer fecha o menu

### `[MOB-04]` PlaceDetails ocupa 100% da tela em mobile (não cortado)

### `[MOB-05]` Banner de rota visível e legível em mobile (375px)

### `[MOB-06]` Botões "Da universidade" e "De onde estou" tocáveis em mobile (min 44×44px)

### `[MOB-07]` Formulário do Admin usável em tablet (768px) sem scroll horizontal

### `[MOB-08]` Mapa responsivo — ocupa área restante após header em mobile

---

## 🌐 BLOCO 12 — Offline e Rede Instável (`[OFF]`)

### `[OFF-01]` App carrega mapa base sem conexão após primeiro carregamento (tiles em cache)

### `[OFF-02]` Lista de locais exibe dados do localStorage quando API indisponível

### `[OFF-03]` Traçar rota sem internet — fallback de linha reta exibido (com aviso após correção)

### `[OFF-04]` Ativar GPS sem internet retorna coordenadas (GPS é local, não precisa de rede)

### `[OFF-05]` Enviar avaliação sem internet — exibe erro amigável, não trava a UI

### `[OFF-06]` Reconectar após queda — app não precisa de reload para funcionar

---

## ♿ BLOCO 13 — Acessibilidade (`[A11Y]`)

### `[A11Y-01]` Todos os botões e inputs têm `aria-label` ou texto visível
**Ferramenta:** `axe-core` via Playwright

### `[A11Y-02]` Pinos do mapa têm texto alternativo ou `aria-label` para leitores de tela

### `[A11Y-03]` Tela inteira acessível por teclado (Tab, Enter, Esc)
**Critério:** PlaceDetails abre via Enter no pino, fecha via Esc

### `[A11Y-04]` Contraste de cores suficiente nos textos da Sidebar e banners
**Critério:** mínimo 4.5:1 (WCAG AA)

### `[A11Y-05]` Formulários de avaliação e Admin com labels associados a inputs

---

## ⚡ BLOCO 14 — Performance (`[PERF]`)

### `[PERF-01]` LCP (Largest Contentful Paint) < 2.5s em conexão 4G simulada

### `[PERF-02]` 100 locais no banco — renderização da lista < 200ms

### `[PERF-03]` Busca com 100 locais — filtro em < 50ms após digitar (debounce não excessivo)

### `[PERF-04]` Troca de modo A pé ↔ Automóvel — nova rota renderizada em < 3s (4G)

### `[PERF-05]` Abertura do Admin com 100 locais — tabela renderizada em < 500ms

### `[PERF-06]` Bundle JS final — tamanho < 500KB após `npm run build` (sem imagens)

---

## 🔁 BLOCO 15 — Estado da Aplicação e Fluxos Combinados

### `[E2E-68]` Favoritar → filtrar favoritos → desfavoritar → filtro mostra lista vazia

### `[E2E-69]` Selecionar local → traçar rota → fechar card → clicar novo local → rota limpa

### `[E2E-70]` Ativar GPS → traçar rota "De você" → desativar GPS (reload) → rota ainda visível

### `[E2E-71]` Múltiplos locais abertos e fechados em sequência — sem vazamento de estado

### `[E2E-72]` Navegar para /admin → voltar ao mapa — lista de locais recarregada

### `[E2E-73]` Admin cria local → mapa atualiza automaticamente após voltar

### `[E2E-74]` URL hash `/admin` digitada diretamente no browser abre painel de login

---

## 📊 Resumo Final

| Bloco | Qtd | Tipo principal |
|:------|:----|:---------------|
| Utilitários de distância | 12 | UT |
| Utilitários de rota | 8 | UT |
| Favoritos | 7 | UT |
| Backend API REST | 16 | IT |
| Segurança | 13 | SEC |
| Mapa e interação | 13 | E2E |
| Distâncias e rotas (lógica) | 14 | E2E |
| Busca e filtros | 11 | E2E |
| Avaliações | 7 | E2E + IT |
| Painel Admin | 22 | E2E |
| Mobile / Responsividade | 8 | MOB |
| Offline / Rede instável | 6 | OFF |
| Acessibilidade | 5 | A11Y |
| Performance | 6 | PERF |
| Estado e fluxos combinados | 7 | E2E |
| **TOTAL** | **155** | |

---

## 🛠️ Stack de Teste Recomendada

```
vitest          → Testes unitários (UT)
@testing-library/react → Componentes React
supertest       → API Express (IT)
playwright      → E2E, Mobile, Offline, Segurança
axe-core        → Acessibilidade (A11Y)
lighthouse-ci   → Performance
```

> [!TIP]
> **Ordem de execução ideal:**
> `UT` (< 5s) → `IT` (< 30s) → `A11Y` (< 60s) → `SEC` (< 2min) → `E2E` (< 10min) → `MOB` (< 5min) → `OFF` (< 3min) → `PERF` (< 5min)
>
> Rode `UT` + `IT` em todo Pull Request. `E2E` e `PERF` em merge para main.
