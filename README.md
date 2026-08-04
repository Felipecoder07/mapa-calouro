# 🗺️ Mapa do Calouro - UFC Campus Russas

Um guia geográfico, universitário e comunitário interativo desenvolvido para estudantes, professores, calouros e visitantes do campus da **Universidade Federal do Ceará (UFC - Campus Russas)**. O sistema permite navegar por um mapa interativo com visão vetorial e de satélite HD, encontrar locais por categoria, calcular rotas inteligentes em tempo real (pedestre e veículo), consultar/enviar avaliações da comunidade e gerenciar pontos através de um completo **Painel Administrativo com Assistente de Auto-Preenchimento e Emojis Personalizados**.

---

## 📌 Sumário
- [✨ Recursos Principais](#-recursos-principais)
- [⚡ Assistente de Auto-Preenchimento Rápido](#-assistente-de-auto-preenchimento-rápido)
- [🏷️ Categorias & Emojis Personalizados](#️-categorias--emojis-personalizados)
- [🏗️ Como Funciona a Arquitetura](#️-como-funciona-a-arquitetura)
- [📋 Requisitos do Sistema](#-requisitos-do-sistema)
- [🚀 Passo a Passo de Instalação e Uso](#-passo-a-passo-de-instalação-e-uso)
- [🧪 Suíte de Testes Automatizados](#-suíte-de-testes-automatizados)
- [🌐 Expondo o Projeto para a Internet (Cloudflare Tunnel)](#-expondo-o-projeto-para-a-internet-cloudflare-tunnel)
- [📁 Estrutura de Pastas e Arquivos](#-estrutura-de-pastas-e-arquivos)
- [📝 Licença](#-licença)

---

## ✨ Recursos Principais

- 🗺️ **Mapa Interativo Dual (Vetor & Satélite HD):**
  - **Mapa Vetorial Padrão (OpenStreetMap):** Renderização leve de vias e quadras urbanas.
  - **Visão por Satélite HD (Esri ArcGIS World Imagery):** Imagens de satélite em alta resolução para visualização detalhada do campus e arredores.
- 🚗 / 🚶 **Rotas Inteligentes com OSRM API:**
  - **Modo Pedestre (A pé):** Utiliza o perfil `foot` da OSRM para calcular rotas por travessias, passeios e atalhos de pedestres.
  - **Modo Automóvel (Carro/Moto):** Utiliza o perfil `car` respeitando mão única e trânsito urbano.
- 📍 **Origens de Rota Dinâmicas:**
  - **Da UFC Russas:** Rota inicia na **Portaria Oficial de Saída do Campus** (`-4.945620, -37.975554`) evitando saídas em contramão.
  - **De você (GPS):** Rota inicia a partir da localização física real do seu dispositivo.
- 📊 **Comparador de Tempos & Distâncias:** Cálculo em tempo real usando a fórmula de Haversine para distâncias em linha reta e OSRM para percurso urbano em vias.
- ⭐ **Avaliações Comunitárias da Turma:** Sistema de notas de 1 a 5 estrelas e comentários para cada local, com cálculo instantâneo da média comunitária.
- ❤️ **Favoritos Persistentes:** Salve seus locais mais frequentados no `localStorage` com filtro rápido na barra lateral.
- ⚙️ **Painel Administrativo com Autenticação (Senha `admin123`):** Interface completa para cadastrar, editar e remover locais ou criar novas categorias customizadas.
- 💾 **Banco de Dados SQLite Relacional:** Persistência em arquivo relacional leve (`data/database.sqlite`), sincronizando instantaneamente frontend e backend.

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

## 🏗️ Como Funciona a Arquitetura

O sistema é construído em uma arquitetura desacoplada e moderna:

1. **Frontend (React 18 + TypeScript + Vite + Tailwind CSS):** Roda na porta `5173`. Responsável por toda a interface rica, mapas Leaflet e interações.
2. **Backend (Node.js + Express + SQLite `better-sqlite3`):** Roda na porta `3001`. Gerencia a persistência no banco `data/database.sqlite` e expõe a API REST em `/api/...`.
3. **API de Roteamento (OSRM):** Serviço público que calcula as rotas e retorna as polilinhas GeoJSON.
4. **Geocodificação Reversa (OpenStreetMap Nominatim):** Converte coordenadas em endereços urbanos legíveis de Russas/CE.

---

## 📋 Requisitos do Sistema

- **Node.js:** Versão 18.x ou superior.
- **npm:** Versão 9.x ou superior.
- **Git:** Para clonar o repositório.
- **(Opcional) Cloudflared:** Para gerar links públicos temporários.

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

**Terminal 2: Iniciar o Frontend (Porta 5173)**
```bash
npm run dev
```
> *Acesse no navegador:* `http://localhost:5173`

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

## 🌐 Expondo o Projeto para a Internet (Cloudflare Tunnel)

Para gerar um link público temporário e compartilhar o site com colegas em qualquer lugar (celular, tablet ou PC externo):

1. Com o `npm run server` e `npm run dev` rodando, abra outro terminal e execute:
   ```bash
   cloudflared tunnel --url http://localhost:5173
   ```
2. O Cloudflare exibirá um link público seguro (ex: `https://xxxx.trycloudflare.com`). Qualquer pessoa pode acessar por esse link!

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
│   │   ├── Admin.tsx               # Painel admin, formulários, auto-fill e seletor de emojis
│   │   ├── MapView.tsx             # Mapa Leaflet, alternador de vetor/satélite e rotas
│   │   ├── PlaceDetails.tsx        # Detalhes do local, carrossel de fotos e avaliações
│   │   └── Sidebar.tsx             # Lista de locais, busca, favoritos e filtros
│   ├── lib/
│   │   ├── api.ts                  # Integração REST com o backend
│   │   ├── constants.ts            # Coordenadas oficiais da UFC Russas e portaria
│   │   ├── distance.ts             # Fórmula de Haversine e utilitários de tempo
│   │   ├── favorites.ts            # Gerenciamento de locais favoritados
│   │   ├── icons.ts                # Mapeamento e resolvedor universal de emojis/ícones
│   │   └── mapUtils.ts             # Integração OSRM e geradores de marcadores Leaflet
│   ├── types/                      # Tipagens TypeScript (Category, Place, Review)
│   ├── App.tsx                     # Componente principal e orquestrador de estado
│   └── main.tsx                    # Ponto de entrada React
├── tests/                          # 10 arquivos de testes unitários/integração
├── e2e/                            # Testes end-to-end com Playwright
├── index.html
├── package.json                    # Scripts e dependências
├── vite.config.ts                  # Configuração do Vite e proxy /api
└── README.md                       # Documentação oficial do projeto
```

---

## 📝 Licença
Este projeto foi desenvolvido para fins educacionais e comunitários para a **Universidade Federal do Ceará - Campus Russas**.
