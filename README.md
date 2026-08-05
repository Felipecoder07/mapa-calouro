# 🗺️ Mapa do Calouro - UFC Campus Russas

Um guia geográfico, universitário e comunitário interativo desenvolvido para estudantes, professores, calouros e visitantes do campus da **Universidade Federal do Ceará (UFC - Campus Russas)**. O sistema permite navegar por um mapa interativo com visão vetorial e de satélite HD, encontrar locais por categoria, calcular rotas inteligentes em tempo real (pedestre e veículo), consultar/enviar avaliações da comunidade e gerenciar pontos através de um completo **Painel Administrativo com Assistente de Auto-Preenchimento e Emojis Personalizados**.

---

## 📌 Sumário
- [✨ Recursos Principais](#-recursos-principais)
- [📱 Bottom Sheets Tátil e Fluido no Mobile (60fps)](#-bottom-sheets-tátil-e-fluido-no-mobile-60fps)
- [🔄 Sincronização em Tempo Real (10s Polling Silencioso)](#-sincronização-em-tempo-real-10s-polling-silencioso)
- [⚡ Assistente de Auto-Preenchimento Rápido](#-assistente-de-auto-preenchimento-rápido)
- [🏷️ Categorias & Emojis Personalizados](#️-categorias--emojis-personalizados)
- [🏗️ Como Funciona a Arquitetura (Produção R$ 0,00)](#️-como-funciona-a-arquitetura-produção-r-000)
- [📋 Requisitos do Sistema](#-requisitos-do-sistema)
- [🚀 Passo a Passo de Instalação e Uso](#-passo-a-passo-de-instalação-e-uso)
- [🧪 Suíte de Testes Automatizados](#-suíte-de-testes-automatizados)
- [📁 Estrutura de Pastas e Arquivos](#-estrutura-de-pastas-e-arquivos)
- [📝 Licença](#-licença)

---

## ✨ Recursos Principais

- 🗺️ **Mapa Interativo Dual (Vetor & Satélite HD):**
  - **Mapa Vetorial Padrão (OpenStreetMap):** Renderização leve de vias e quadras urbanas com limite dinâmico de zoom.
  - **Visão por Satélite HD (Esri ArcGIS World Imagery):** Imagens de satélite em alta resolução para visualização detalhada do campus.
- 📱 **Interface Mobile Redesenhada (Estilo App Nativo):**
  - **Top Bar Flutuante em Vidro (*Glassmorphic Floating Header*):** Design limpo e moderno com indicador de status em pulso.
  - **Cards de Locais com Thumbnails de Foto:** Fotos em destaque, badges coloridas por categoria, estrelas de avaliação e cálculo de distância a pé.
  - **Pílulas de Categoria Deslizantes (Chips Carousel):** Filtro rápido de categorias com 1 toque.
- 🚗 / 🚶 **Rotas Inteligentes com OSRM API:**
  - **Modo Pedestre (A pé):** Utiliza o perfil `foot` da OSRM para calcular rotas por travessias, passeios e atalhos de pedestres.
  - **Modo Automóvel (Carro/Moto):** Utiliza o perfil `car` respeitando mão única e trânsito urbano.
- 📍 **Origens de Rota Dinâmicas:**
  - **Da UFC Russas:** Rota inicia na **Portaria Oficial de Saída do Campus** (`-4.945620, -37.975554`) evitando saídas em contramão.
  - **De você (GPS):** Rota inicia a partir da localização física real do seu dispositivo com mecanismo de dupla tentativa (*Fallback*).
- 📊 **Comparador de Tempos & Distâncias:** Cálculo em tempo real usando a fórmula de Haversine para distâncias em linha reta e OSRM para percurso urbano em vias.
- ⭐ **Avaliações Comunitárias da Turma:** Sistema de notas de 1 a 5 estrelas e comentários para cada local, com cálculo instantâneo da média comunitária.
- ❤️ **Favoritos Persistentes:** Salve seus locais mais frequentados no `localStorage` com filtro rápido na barra lateral.
- ⚙️ **Painel Administrativo com Autenticação (Senha `admin123`):** Interface completa para cadastrar, editar e remover locais ou criar novas categorias customizadas com seletor de emojis e dropdown flutuante com z-index de sobreposição.
- 💾 **Banco de Dados SQLite Relacional:** Persistência em arquivo relacional leve (`data/database.sqlite`), sincronizando instantaneamente frontend e backend.

---

## 📱 Bottom Sheets Tátil e Fluido no Mobile (60fps)

No mobile (< 768px), tanto o painel de **Explorar Locais** quanto os **Detalhes do Local** abrem como **Bottom Sheets interativos de alto desempenho**:

- 👆 **Gestos por Toque Nativo (60fps por GPU):** Manipulação direta do DOM via `useRef`, eliminando re-renders por pixel e garantindo deslize suave sem lag.
- ⬆️ **Arrastar para Cima (Expandir):** Arraste o puxador tátil (`drag handle`) para expandir o painel para **90% da altura da tela (`90dvh`)**.
- ⬇️ **Arrastar para Baixo (Fechar):** Arraste o painel para baixo para fechar suavemente.
- 🔒 **Proteção contra Pull-to-Refresh:** Uso de `{ passive: false }`, `e.preventDefault()` e `overscroll-behavior-y: none` no CSS para impedir que o navegador mobile recarregue a página involuntariamente durante o arrasto.
- 🚫 **Exclusividade de Modais (1 Modal por vez):** Ao selecionar um local na lista, o painel de busca fecha antes do card de detalhes subir, evitando modais empilhados na tela.

---

## 🔄 Sincronização em Tempo Real (10s Polling Silencioso)

O aplicativo conta com sincronização automática em segundo plano:
- A cada **10 segundos**, a lista de locais e categorias é atualizada silenciosamente.
- Se o Administrador cadastrar ou editar um local, ele **aparece automaticamente no mapa de todos os celulares conectados** sem exibir spinners e sem interromper a navegação do aluno.

---

## ⚡ Assistente de Auto-Preenchimento Rápido

Disponível tanto no **cadastro de novos locais** quanto na **edição de locais existentes**:

- 🔗 **Suporte Multi-Link do Google Maps:** Aceita URLs normais, links curtos (`maps.app.goo.gl` / `goo.gl/maps`), coordenadas de viewport (`@lat,lng`), parâmetros de pinos (`!3d!4d`, `2d3d`), parâmetros de busca (`?q=`, `?ll=`, `loc:`) e coordenadas brutas (ex: `-4.9471, -37.9745`).
- 🤖 **Extração Inteligente de Dados:** Lê o link ou texto e preenche automaticamente o **Nome do Local**, **Categoria ideal**, **Latitude**, **Longitude**, **Endereço Formatado** (via geocodificação reversa OpenStreetMap Nominatim) e **Fotos de Preview**!
- 📍 **Preservação de Posição:** Se um link ou termo não contiver coordenadas válidas, o sistema preserva o pino no local atual e alerta o usuário para posicionar no mapa interativo com um clique.

---

## 🏷️ Categorias & Emojis Personalizados

- 🎨 **Emojis 100% Consistentes:** Todos os ícones de categoria (Alimentação 🍽️, Bibliotecas 📚, Salas 🏢, Convivência ☕, Academias 💪, Esportes ⚽, Mercados 🛒, Saúde 💊, Moradias 🏠, Serviços 🖨️, Transporte 🚌, Igrejas ⛪, etc.) aparecem idênticos em todas as telas: no mapa, na sidebar, na lista administrativa e nos detalhes.
- ➕ **Criador de Categorias com Emoji Customizado:** Ao criar uma nova categoria no Painel Admin, você pode:
  1. Digitar ou colar **qualquer emoji personalizado** do seu teclado (ex: 🎯, 🚀, 🎭, 🍿, 🍔, 🎓).
  2. Escolher um emoji em um **Grid Seletor Rápido de 22 Emojis**.
  3. Escolher uma cor hexadecimal ou selecionar da paleta rápida.

---

## 🏗️ Como Funciona a Arquitetura (Produção R$ 0,00)

O projeto foi projetado para rodar em produção com **custo R$ 0,00/mês**:

1. **Frontend (Vercel Free Tier - React 18 + TS + Vite + Tailwind):** Hospedagem gratuita com SSL/HTTPS automático, CDN global ultra-rápida e 100 GB/mês de tráfego.
2. **Backend & Banco de Dados (Supabase Free Tier - PostgreSQL + Realtime):** Banco relacional com 500 MB de armazenamento (suporta mais de 100.000 locais) e 200 conexões simultâneas via WebSockets Realtime.
3. **Mapas & Roteamento (Leaflet + OpenStreetMap + OSRM):** Sem custos ou limites de chave de API por clique.

---

## 📋 Requisitos do Sistema

- **Node.js:** Versão 18.x ou superior.
- **npm:** Versão 9.x ou superior.
- **Git:** Para clonar e gerenciar o repositório.

---

## 🚀 Passo a Passo de Instalação e Uso

### 1. Clonar o Repositório
```bash
git clone https://github.com/Felipecoder07/mapa-calouro.git
cd mapa-calouro
```

### 2. Instalar as Dependências
```bash
npm install
```

### 3. Executando o Projeto

**Terminal 1: Iniciar o Servidor Backend (Porta 3001)**
```bash
npm run server
```
> *Mensagem esperada:* `Server Express + SQLite rodando na porta 3001`

**Terminal 2: Iniciar o Frontend com Suporte à Rede Local (Porta 5173)**
```bash
npm run dev
```
> *Acesso Local (PC):* `http://localhost:5173`  
> *Acesso na Rede Wi-Fi (Celular):* `http://<SEU_IP_LOCAL>:5173` (ex: `http://192.168.18.219:5173`)

---

## 🧪 Suíte de Testes Automatizados

O projeto possui **47 testes automatizados** divididos em módulos (Vitest para unidade/integração e Playwright para E2E):

```bash
# Rodar todos os testes unitários e de integração (Vitest)
npm test

# Rodar verificação estática de tipos TypeScript
npm run typecheck

# Rodar testes E2E com Playwright
npm run test:e2e
```

**Módulos Testados:**
- `distance.test.ts`: Cálculo Haversine, formatação de distâncias e estimativa de tempo.
- `mapUtils.test.ts`: Integração com OSRM, perfis `foot` e `car`, conversão GeoJSON.
- `favorites.test.ts`: Persistência de favoritos no `localStorage`.
- `server.test.ts`: Endpoints da API REST e banco SQLite.
- `security.test.ts`: Prevenção de SQL Injection e Sanitização XSS.
- `sidebarAndFilters.test.ts`: Busca por nome/endereço e filtros de categoria.
- `reviewsAndRating.test.ts`: Média de estrelas, formatação de data e submissão.
- `adminCrud.test.ts`: Extração de coordenadas Google Maps, auto-fill e validações.
- `mobileAndResponsiveness.test.ts`: Alvos de toque acessíveis e breakpoints mobile.

---

## 📁 Estrutura de Pastas e Arquivos

```text
mapa-calouro/
├── data/
│   └── database.sqlite             # Banco de dados SQLite relacional
├── server/
│   └── index.js                    # Servidor Express, rotas REST e tabelas SQLite
├── src/
│   ├── components/
│   │   ├── Admin.tsx               # Painel admin, auto-fill e dropdown flutuante customizado
│   │   ├── MapView.tsx             # Mapa Leaflet, limitadores dinâmicos de zoom e camadas
│   │   ├── PlaceDetails.tsx        # Detalhes do local em Bottom Sheet tátil 60fps
│   │   └── Sidebar.tsx             # Lista de locais com pílulas de categoria e thumbnails
│   ├── lib/
│   │   ├── api.ts                  # Integração REST com o backend
│   │   ├── constants.ts            # Coordenadas oficiais da UFC Russas e portaria
│   │   ├── distance.ts             # Fórmula de Haversine e utilitários de tempo
│   │   ├── favorites.ts            # Gerenciamento de locais favoritados
│   │   ├── icons.ts                # Mapeamento e resolvedor universal de emojis/ícones
│   │   └── mapUtils.ts             # Integração OSRM e geradores de marcadores Leaflet
│   ├── types/                      # Tipagens TypeScript (Category, Place, Review)
│   ├── App.tsx                     # Componente principal, Bottom Sheet mobile e polling 10s
│   └── main.tsx                    # Ponto de entrada React
├── tests/                          # 10 arquivos de testes unitários/integração
├── e2e/                            # Testes end-to-end com Playwright
├── index.html                      # Viewport mobile com trava de escala
├── package.json                    # Scripts e dependências
├── vite.config.ts                  # Configuração do Vite (host: true para LAN)
└── README.md                       # Documentação oficial do projeto
```

---

## 📝 Licença
Este projeto foi desenvolvido para fins educacionais e comunitários para a **Universidade Federal do Ceará - Campus Russas**.
