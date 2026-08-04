# 🗺️ Mapa do Calouro - UFC Campus Russas

Um guia geográfico e comunitário interativo desenvolvido para estudantes e visitantes do campus da **Universidade Federal do Ceará (UFC - Russas)**. O sistema permite localizar pontos de interesse (restaurantes, bibliotecas, salas, farmácias, moradias), calcular rotas inteligentes em tempo real e consultar/enviar avaliações comunitárias.

---

## 📌 Sumário
- [Recursos Principais](#-recursos-principais)
- [Como Funciona a Arquitetura](#-como-funciona-a-arquitetura)
- [Requisitos do Sistema](#-requisitos-do-sistema)
- [Passo a Passo de Instalação e Uso](#-passo-a-passo-de-instalação-e-uso)
- [Expondo o Projeto para a Internet (Túnel Remoto)](#-expondo-o-projeto-para-a-internet-túnel-remoto)
- [Estrutura de Pastas e Arquivos](#-estrutura-de-pastas-e-arquivos)

---

## ✨ Recursos Principais

- 🗺️ **Mapa Interativo (Leaflet + OpenStreetMap):** Exibição de pinos customizados por categoria e marcador da UFC Russas no centro do campus.
- 🚗 / 🚶 **Rotas Inteligentes com OSRM:**
  - **Modo Pedestre (A pé):** Calcula a menor caminhada, atravessando atalhos e vias de pedestre.
  - **Modo Automóvel (Carro/Moto):** Respeita o sentido obrigatório das ruas de mão única e regras de trânsito locais.
- 📍 **Origens de Rota Dinâmicas:**
  - **Da UFC Russas:** Rota inicia na portaria oficial de saída do campus (`-4.945620, -37.975554`) para evitar saídas em contramão.
  - **De você (GPS):** Rota inicia a partir da localização real do seu dispositivo.
- 📊 **Comparador de Tempos & Distâncias:** Alternância fácil entre origens (`Da UFC` / `De você`) e modos (`A pé` / `Automóvel`) com atualização em tempo real.
- ⭐ **Avaliações Comunitárias:** Alunos podem enviar notas de 1 a 5 estrelas e comentários para cada local.
- ⚙️ **Painel Administrativo:** Interface protegida para cadastrar, editar ou remover locais e categorias com upload de imagens.
- 💾 **Persistência Híbrida em SQLite:** Banco de dados relacional leve rodando em servidor local Node.js (`data/database.sqlite`), garantindo sincronização instantânea.

---

## 🏗️ Como Funciona a Arquitetura

O sistema é construído em uma arquitetura moderna dividida em:

1. **Frontend (React + Vite + Tailwind CSS):** Roda na porta `5173`. É responsável por toda a interface, mapa interativo e cálculos em tela.
2. **Backend (Node.js + Express + SQLite):** Roda na porta `3001`. Gerencia a persistência no banco `data/database.sqlite` e expõe a API REST em `/api/...`.
3. **API de Roteamento (OSRM API):** Serviços externos que traçam as polilinhas e calculam distâncias pelas vias urbanas de Russas.

---

## 📋 Requisitos do Sistema

Antes de iniciar, certifique-se de ter instalado em seu computador:

- **Node.js:** Versão 18.x ou superior.
- **npm:** Versão 9.x ou superior (já vem com o Node.js).
- **Git:** Para clonar o repositório.
- **(Opcional) Cloudflared:** Para gerar links públicos temporários de teste.

---

## 🚀 Passo a Passo de Instalação e Uso

### 1. Clonar o Repositório
Abra o seu terminal e execute:
```bash
git clone https://github.com/Felipecoder07/mapa-calouro.git
cd mapa-calouro
```

### 2. Instalar as Dependências
Execute o comando abaixo para instalar todos os pacotes do projeto:
```bash
npm install
```

---

### 3. Executando o Projeto

O projeto necessita do **Servidor Backend** (para carregar/salvar o banco SQLite) e do **Frontend Vite**.

#### Opção A: Executar em Terminais Separados (Recomendado)

**Terminal 1: Iniciar o Banco de Dados e Servidor Backend (Porta 3001)**
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

## 🌐 Expondo o Projeto para a Internet (Túnel Remoto)

Se você deseja testar o site no seu celular ou compartilhar com colegas em outras redes enquanto roda no seu PC:

1. Baixe e instale o [Cloudflare Tunnel (cloudflared)](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/).
2. Com o `npm run dev` e o `npm run server` rodando, abra um **terceiro terminal** e execute:
   ```bash
   cloudflared tunnel --url http://localhost:5173
   ```
3. O Cloudflare gerará um link público seguro (ex: `https://xxxx.trycloudflare.com`). Qualquer pessoa poderá acessar seu site por esse link!

---

## 📁 Estrutura de Pastas e Arquivos

```text
mapa-calouro/
├── data/
│   └── database.sqlite      # Arquivo do banco de dados SQLite (gerado automaticamente)
├── server/
│   └── index.js             # Servidor Express com rotas REST e inicialização do SQLite
├── src/
│   ├── components/
│   │   ├── Admin.tsx        # Painel administrativo de cadastro de locais
│   │   ├── MapView.tsx      # Renderização do mapa Leaflet e rotas
│   │   ├── PlaceDetails.tsx # Painel de detalhes, fotos e avaliações
│   │   └── Sidebar.tsx      # Lista de locais, filtros e barra de busca
│   ├── lib/
│   │   ├── api.ts           # Integração de chamadas REST com o backend/SQLite
│   │   ├── constants.ts     # Coordenadas oficiais da UFC Russas e portaria
│   │   ├── distance.ts      # Utilitários de distância e cálculo de tempo
│   │   └── mapUtils.ts      # Integração com a API OSRM para rotas
│   ├── types/               # Tipagens TypeScript (Category, Place, Review)
│   ├── App.tsx              # Componente raiz da aplicação
│   └── main.tsx             # Ponto de entrada do React
├── index.html
├── package.json             # Scripts e dependências do projeto
├── vite.config.ts           # Configuração do Vite e proxy para /api
└── README.md
```

---

## 📝 Licença
Este projeto foi desenvolvido para fins educacionais e comunitários para a **Universidade Federal do Ceará - Campus Russas**.
