<div align="center">

# 🗺️ Mapa do Calouro - UFC Campus Russas

  <p align="center">
    <strong>Guia geográfico, comunitário e interativo de navegação espacial para a Universidade Federal do Ceará.</strong>
  </p>

  <p align="center">
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
    <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" /></a>
    <a href="https://vercel.com/"><img src="https://img.shields.io/badge/Vercel-Deployment-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" /></a>
  </p>

</div>

---

## 📖 Sobre o Projeto

O **Mapa do Calouro** é uma aplicação web de alto desempenho (Single Page Application - SPA) desenvolvida para auxiliar estudantes, professores e visitantes no **Campus da Universidade Federal do Ceará (UFC Russas)**.

A plataforma oferece visualização espacial por mapas vetoriais e de satélite HD, busca de locais por categorias (alimentação, bibliotecas, salas, xerox, RU, moradias, transporte), cálculo de rotas em tempo real (pedestre e veículo), avaliações comunitárias e um **Painel Administrativo Completo com assistente inteligente por link do Google Maps**.

---

## ✨ Principais Funcionalidades

### 🗺️ Mapeamento Interativo HD
- **Vetor Padrão (OpenStreetMap)**: Visualização leve, precisa e veloz.
- **Satélite HD (Esri ArcGIS Imagery)**: Imagens de alta definição do campus.
- **Modo Escuro (CartoDB Dark)**: Visualização confortável para navegação noturna.

### 📱 Experiência Mobile Nativa (60fps)
- **Painéis Interativos (Bottom Sheets)**: Deslize por gestos táteis suaves.
- **Aproximação Suave (FlyTo Camera)**: Transição fluida sem tremores ao selecionar locais.
- **Balões Limpos**: Marcadores informativos elegantes com ação de detalhes rápida.

### 🚗 / 🚶 Rotas Inteligentes em Tempo Real (OSRM API)
- **Modo Pedestre (A pé)**: Rotas calculadas utilizando passeios e travessias do campus.
- **Modo Automóvel (Carro/Moto)**: Respeita o sentido das vias e trânsito urbano.
- **Origem Flexível**: Alterne instantaneamente entre a **Portaria da UFC** e a sua **Posição GPS em Tempo Real**.

### ⚙️ Painel de Gestão Admin
- **Cadastro Simplificado**: Assistente de auto-preenchimento automático ao colar links do Google Maps ou coordenadas.
- **Categorias Personalizadas**: Criador de categorias com paleta de cores e seletor de emojis.
- **Gestão de Avaliações**: Gerenciamento de notas de 1 a 5 estrelas e comentários da comunidade.

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Descrição |
| :--- | :--- |
| **React 18** | Biblioteca para interfaces reativas |
| **TypeScript** | Tipagem estática rigorosa para prevenção de erros |
| **Vite** | Build tool ultrarrápido para desenvolvimento e produção |
| **Tailwind CSS** | Estilização moderna e responsiva |
| **Leaflet & React-Leaflet** | Motor de renderização de mapas interativos |
| **OSRM API** | Serviço de cálculo de rotas urbanas e de pedestres |
| **Supabase** | Banco de dados PostgreSQL relacional na nuvem |
| **GitHub Actions** | Automação diária de Keep-Alive contra inatividade |

---

## 🚀 Como Rodar o Projeto

### 1. Clonar o Repositório
```bash
git clone https://github.com/Felipecoder07/mapa-calouro.git
cd mapa-calouro
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Executar o Projeto
```bash
# Iniciar o servidor e a interface juntos:
npm run dev:all
```

Acesse no seu navegador: `http://localhost:5173`

---

## 🧪 Testes e Qualidade

O projeto possui suíte completa de verificação:

```bash
# Checagem estrita de tipos TypeScript (0 erros)
npm run typecheck

# Testes unitários e de integração
npm test

# Testes End-to-End (E2E) com Playwright
npm run test:e2e
```

---

## 📄 Documentação e Guias Técnicos

- 📋 **[Especificação de Requisitos de Software (SRS IEEE 830)](docs/ESPECIFICACAO_REQUISITOS_SRS.md)** — Documentação técnica completa de requisitos funcionais, não funcionais e regras de negócio.
- 🚀 **[Guia Oficial de Deploy em Produção](docs/GUIA_DEPLOY_PRODUCAO.md)** — Passo a passo para publicação na Vercel e integração com o Supabase.
- 🔄 **[Manutenção Automática do Supabase (Keep-Alive)](docs/MANUTENCAO_KEEPALIVE_SUPABASE.md)** — Guia de configuração do workflow no GitHub Actions para manter o banco relacional 24/7 sem pausa por inatividade.

---

<div align="center">
  <sub>Desenvolvido com ❤️ para a comunidade acadêmica da <strong>Universidade Federal do Ceará - Campus Russas</strong>.</sub>
</div>
