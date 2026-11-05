# 🚀 PROMPT PARA O BOLT.NEW — GAMIFICAÇÃO DE CONQUISTA DE TERRITÓRIOS (TURF WARS)

> **Instruções de uso:** Copie todo o conteúdo abaixo e cole diretamente no chat do **Bolt.new** para gerar a aplicação completa.

---

```markdown
Crie uma aplicação web completa, moderna e gamificada de **Conquista de Territórios por Corrida/Caminhada** (estilo *Turf Wars / Run An Empire / Fog of World*) integrada a um mapa geográfico universitário para a **UFC (Universidade Federal do Ceará - Campus Russas)**.

A aplicação deve ser construída em **React 18 + TypeScript + Tailwind CSS + Leaflet / React-Leaflet + Lucide Icons** com design dark theme ultra premium, micro-animações, feedback visual com luzes neon e total responsividade (Desktop em tela cheia com sidebar dashboard e Mobile nativo com bottom navigation).

---

### 🎯 1. CONCEITO E DINÂMICA DO JOGO (GAMEPLAY LOOP)

1. **Escolha de Curso / Facção:**
   - O usuário escolhe o curso dele na UFC:
     - 🟣 **Ciência da Computação** (`#a855f7` - Roxo Neon)
     - 🟢 **Engenharia de Software & Civil** (`#06b6d4` - Ciano Neon)
     - 🟠 **Direito & Humanas** (`#f97316` - Laranja Neon)
     - 🌸 **Medicina & Saúde** (`#ec4899` - Rosa Neon)
     - 🔵 **Administração** (`#3b82f6` - Azul Neon)
     - 🌿 **Agronomia** (`#10b981` - Esmeralda)
     - 🟡 **Letras** (`#eab308` - Amarelo Neon)

2. **Gravação da Trilha & Fechamento de Quarteirão:**
   - O usuário clica em **`▶ INICIAR CONQUISTA`**.
   - Conforme ele caminha/corre com o GPS (ou simulador), o sistema traça uma polilinha com rastro verde neon no mapa escuro.
   - Quando o usuário contorna um quarteirão e **retorna a menos de 35 metros do ponto inicial** (tendo percorrido pelo menos 50 metros no total), o sistema detecta que o circuito foi **FECHADO**.

3. **Cálculo da Área Conquistada:**
   - O sistema calcula a área interna exata do polígono em metros quadrados ($m^2$) usando a **Fórmula de Shoelace Geodésica** com projeção esférica.
   - Cria um novo polígono colorido semi-transparente no mapa com o nome e crachá do conquistador.

4. **Celebração e Vitória:**
   - Dispara uma modal de comemoração com chuva de confetes no Canvas, renderiza a silhueta geométrica do polígono gerada em SVG com glow neon, exibe as estatísticas (Área $m^2$, Tempo, Distância) e atualiza o placar geral.

5. **Ranking e Dominação de Campus:**
   - Pódio 3D dos Campeões (#1 com coroa dourada, #2, #3) e tabela de classificação geral com alternância entre **"Por Curso"** e **"Por Usuário"**.

---

### 🗺️ 2. REQUISITOS DO MAPA (LEAFLET + TILES ESCUROS)

- Coordenadas centrais da UFC Russas: `lat: -4.9471, lng: -37.9745`.
- Tile Layer Dark Mode: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`.
- **Camada de Territórios:** Renderizar múltiplos `<Polygon />` semi-transparentes (`fillOpacity: 0.35, weight: 2.5`) com as cores dos cursos correspondentes.
- **Crachás de Território:** Marcadores no centroide de cada polígono com ícone de coroa 👑 (líder) ou bandeira 🚩 + Nome do Curso + Área dominada.
- **Trilha em Gravação:** Linha tracejada neon (`#10b981`) com efeito de sombra/glow + círculo pulsante (radar) na posição atual do GPS.
- **Projeção de Fechamento:** Linha pontilhada conectando a posição atual de volta ao ponto de partida quando $\ge 3$ pontos forem gravados.
- **Zona de Fechamento:** Círculo verde translúcido com raio de 35m em volta do ponto de partida.

---

### 🧪 3. MODO SIMULADOR EMBUTIDO (PARA TESTAR NO PC/MOBILE)

Para permitir testes instantâneos sem precisar sair caminhando na rua:
- Inclua um botão **`⚡ Auto-Walk`** que percorre automaticamente waypoints pré-definidos ao redor de um quarteirão da UFC Russas a cada ~1 segundo.
- Inclua um botão **`👣 Próximo Passo`** para avançar um ponto manualmente.
- Inclua o botão alternativo **`Usar GPS Real`** que utiliza a `navigator.geolocation.watchPosition` com alta precisão e Screen Wake Lock.

---

### 📐 4. CÁLCULO MATEMÁTICO DE ÁREA GEODÉSICA (SHOELACE FORMULA)

Implemente as seguintes fórmulas puras em TypeScript:

```typescript
const EARTH_RADIUS = 6371000; // metros

export function calculateGeodesicArea(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  const centerLat = coords.reduce((acc, p) => acc + p[0], 0) / coords.length;
  const centerLng = coords.reduce((acc, p) => acc + p[1], 0) / coords.length;
  const latRad = (centerLat * Math.PI) / 180;

  const xy = coords.map(([lat, lng]) => ({
    x: ((lng - centerLng) * Math.PI * EARTH_RADIUS * Math.cos(latRad)) / 180,
    y: ((lat - centerLat) * Math.PI * EARTH_RADIUS) / 180,
  }));

  let area = 0;
  for (let i = 0; i < xy.length; i++) {
    const j = (i + 1) % xy.length;
    area += xy[i].x * xy[j].y - xy[j].x * xy[i].y;
  }
  return Math.abs(area) / 2;
}

export function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

---

### 💻 5. DESIGN RESPONSIVO COMPLETO (DESKTOP & MOBILE)

#### No Desktop (Telas $\ge 768$px):
- **Painel Lateral Esquerdo (Sidebar 380px):**
  - Título da aplicação com badge `Turf Wars BETA`.
  - Seletor dos 7 cursos da UFC em grid com cores neon.
  - Placar de dominação com abas *Por Curso* e *Por Usuário*.
  - Dicas e instruções de como jogar.
- **Área Central Fullscreen:**
  - Mapa escuro completo interativo ocupando todo o espaço restante.
  - Floating HUD inferior de telemetria (Distância, Área $m^2$, Velocidade, Cronômetro).
  - Botão principal `▶ INICIAR CONQUISTA DE TERRITÓRIO`.

#### No Mobile (Telas $< 768$px):
- **Top Bar Compacta:** Título, badge de gravação e seletor rápido de curso.
- **Área do Mapa:** Ocupa 100% da tela do celular com gestos de pinça e toque.
- **Bottom Navigation Bar:** Abas táteis `Territórios` (mapa), `Ranking` (pódio 3D) e `Cursos/Testes`.
- **Card Fixo de Telemetria:** Painel inferior flutuante durante a corrida com alerta de fechamento de circuito e botão de conquista.

---

### 🏆 6. TELAS E ESTADOS PRINCIPAIS

1. **Tela 1 - Mapa Tático:** Exibe os territórios iniciais já dominados por Ciência da Computação, Engenharia, Direito e Medicina ao redor da UFC.
2. **Tela 2 - Gravação Ativa:** Banner vermelho pulsante no topo, linha neon verde sendo traçada, telemetria em tempo real e alerta quando o circuito fecha.
3. **Tela 3 - Modal de Vitória:** Confetes animados, contorno SVG da área conquistada com brilho roxo/neon, badges comemorativos e botão de compartilhar.
4. **Tela 4 - Ranking:** Pódio 3D com alturas proporcionais (#1 mais alto com coroa de ouro, #2 ciano, #3 laranja), lista de posições e card inferior de progresso individual.

Gere todo o código com tipagem completa em TypeScript, estado persistido em `localStorage`, componentes bem modularizados e design visual impecável.
```
