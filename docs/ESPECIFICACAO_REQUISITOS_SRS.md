# 📋 Documento de Especificação de Requisitos de Software
## Sistema: Mapa do Calouro - UFC Campus Russas
**Versão:** 7.0 | **Data:** Agosto de 2026 | **Status:** Aprovado para Produção 

---

## 1. Visão Geral e Introdução

### 1.1 Propósito
Este documento especifica minuciosamente todos os requisitos funcionais, requisitos não-funcionais, regras de negócio e a arquitetura técnica completa do sistema **Mapa do Calouro UFC Campus Russas**. Trata-se do guia geográfico, universitário e comunitário oficial voltado para calouros, veteranos, professores, servidores e visitantes do campus da Universidade Federal do Ceará em Russas - CE.

### 1.2 Escopo do Sistema
O **Mapa do Calouro** é uma aplicação web progressiva e reativa (Single Page Application - SPA) de alto desempenho que provê:
- Mapeamento geográfico interativo em tempo real com mapas vetoriais e visão por satélite HD.
- Sistema de busca textual e filtragem por categorias de pontos de interesse (restaurantes, salas, bibliotecas, laboratórios, moradias, pontos de ônibus, farmácias, impressões, etc.).
- Cálculo de rotas urbanas inteligentes com regras de trânsito locais para pedestres e veículos.
- Sistema comunitário de avaliações, comentários e notas de 1 a 5 estrelas.
- Painel Administrativo de Gestão com assistente de inteligência de extração de dados por link do Google Maps.
- Arquitetura de persistência híbrida e robô de manutenção diária contra inatividade do banco de dados na nuvem.

### 1.3 Stack Tecnológico e Infraestrutura
- **Frontend App:** React 18.3, TypeScript 5.5, Vite 5.4, Tailwind CSS 3.4, Lucide Icons.
- **Mapeamento & Geoprocessamento:** Leaflet 1.9, React-Leaflet 4.2, OSRM API (Open Source Routing Machine), Esri ArcGIS World Imagery, CartoDB Basemaps.
- **Backend & Persistência Relacional:** Node.js, Express, SQLite (`better-sqlite3`), Supabase (PostgreSQL Cloud Relacional), `localStorage` (Fallback local).
- **Automações de Infraestrutura:** GitHub Actions (Keep-Alive Cronjob), Vercel CDN Global, Cloudflare Tunnel.

---

## 2. Requisitos Funcionais (RF) Detalhados

### 2.1 Mapeamento e Visualização Espacial
* **[RF-01] Renderização do Mapa Interativo Multi-Camadas:**
  - O sistema deve renderizar o mapa em 100% da viewport com inicialização centrada na UFC Russas (`Lat: -4.9471, Lng: -37.9745`).
  - O alternador de camadas no canto inferior direito deve permitir alternar em tempo real entre 4 provedores:
    1. **🗺️ Mapa Vetorial Padrão (OpenStreetMap)**: Renderização leve para vias urbanas.
    2. **🛰️ Satélite HD (Esri ArcGIS World Imagery)**: Resolução aérea detalhada do campus.
    3. **🌙 Modo Escuro (CartoDB Dark)**: Interface otimizada para navegação noturna.
    4. **🏢 Modo Claro Minimalista (CartoDB Light)**: Interface limpa para impressão ou leitura externa.

* **[RF-02] Ajuste Dinâmico de Limite de Zoom (`maxZoom`):**
  - Ao alternar para a camada de Satélite Esri, o mapa deve ajustar automaticamente o `maxZoom` para **18** (para evitar tela cinza de falta de tiles em alta resolução).
  - Ao alternar para camadas vetoriais, o mapa deve expandir o `maxZoom` para **22**.

* **[RF-03] Marcadores e Emojis por Categoria:**
  - Cada local cadastrado deve exibir um pino marcador com a cor hexadecimal e o emoji representativo da sua categoria.
  - O marcador oficial da **UFC Russas** deve possuir ícone azul marinho em destaque com brasão universitário e maior prioridade de camada (`zIndexOffset: 1000`).
  - A posição em tempo real do usuário deve ser sinalizada por um marcador azul pulso com anel de precisão (`zIndexOffset: 900`).

* **[RF-04] Prevenção de Tremor na Animação da Câmera:**
  - Ao selecionar um local, o sistema deve interromper animações pendentes (`map.stop()`), fechar popups abertos (`map.closePopup()`) e executar a aproximação da câmera (`map.flyTo`) para zoom 17 em **0.8 segundos**, garantindo transição sem tremores.
  - O balão nativo `<Popup>` do Leaflet deve ser configurado com `autoPan={false}` e `closeButton={false}` para impedir disputas de posicionamento com a câmera.

---

### 2.2 Busca, Filtros e Favoritos
* **[RF-05] Busca Textual em Tempo Real:**
  - O sistema deve filtrar instantaneamente os locais à medida que o usuário digita no campo de busca por **Nome do local**, **Endereço** ou **Palavras-chave**.

* **[RF-06] Filtro por Carrossel de Categorias (Chips Carousel):**
  - O sistema deve disponibilizar pílulas de categorias deslizantes com suporte a multi-seleção simultânea.

* **[RF-07] Persistência de Favoritos:**
  - O usuário deve poder favoritar/desfavoritar qualquer local com 1 toque na estrela.
  - Os favoritos devem ser salvos no `localStorage` do navegador e ser filtráveis rapidamente no botão de filtro "Apenas Favoritos ".

---

### 2.3 Roteamento Inteligente e Geolocalização
* **[RF-08] Dupla Origem de Rota (UFC vs GPS):**
  - O sistema deve oferecer duas opções de origem para cálculo de percurso:
    1. **Da UFC Russas:** Origem iniciada na Portaria Oficial de Saída na Rua Felipe Santiago (`Lat: -4.945620, Lng: -37.975554`).
    2. **De você (GPS):** Origem baseada nas coordenadas físicas reais obtidas do GPS do usuário.

* **[RF-09] Modos de Transporte e Perfis de Vias:**
  - **Modo Pedestre (`foot`):** Calcula rotas por travessias, passeios e atalhos de pedestres, calculando tempo médio a 4.5 km/h.
  - **Modo Bicicleta (`bike`):** Calcula rotas para ciclistas estimando tempo a 15 km/h.
  - **Modo Automóvel (`driving`):** Utiliza o perfil veicular da OSRM respeitando estritamente o sentido das ruas de mão única (`oneway`) e conversões na cidade de Russas - CE, estimando tempo a 40 km/h.

* **[RF-10] Fallback de Rota em Linha Reta (Haversine):**
  - Caso a API de rotas OSRM fique offline, o sistema deve desenhar automaticamente uma linha reta com estilo pontilhado indicando a rota de contingência e exibir um aviso amigável: *"Modo Linha Reta (OSRM Inacessível)"*.
  - No fallback a pé, o tempo de caminhada deve ser calculado dividindo a distância por 4.5 km/h (e não 40 km/h de carro).

* **[RF-11] Sincronização do Nome do Destino no Banner de Rota:**
  - Se o aluno clicar em um segundo local enquanto uma rota já estiver ativa, o banner superior flutuante deve atualizar imediatamente o nome do novo destino sem manter o nome do local anterior.

* **[RF-12] Monitoramento Contínuo por GPS (Watch Position) e Recálculo Silencioso:**
  - Em rotas iniciadas pelo GPS do usuário, o sistema deve iniciar o monitoramento contínuo em segundo plano (`watchPosition`).
  - Se o usuário se deslocar mais de **15 metros**, a rota deve ser recalculada de forma silenciosa (`suppressFit: true`) sem provocar saltos brutos na tela.
  - Se o usuário arrastar o mapa manualmente, o modo de acompanhamento `isFollowing` deve ser desativado imediatamente.
  - Ao aproximar-se a menos de **30 metros** do destino, o sistema deve emitir o aviso "Você chegou ao destino!" e encerrar o monitoramento.

* **[RF-13] Recorte Dinâmico da Polilinha da Rota:**
  - O sistema deve apagar progressivamente a linha azul da rota atrás do usuário conforme ele avança na caminhada, mantendo desenhada apenas a parte da rota que ainda falta percorrer.

---

### 2.4 Interface Mobile e Bottom Sheets Táteis
* **[RF-14] Painéis Deslizantes Interativos Mobile (Bottom Sheets 60fps):**
  - No celular (< 768px), o painel de **Explorar Locais** e o card de **Detalhes do Local** devem operar como *Bottom Sheets* deslizantes por gestos de toque.
  - A movimentação deve ser feita via manipulação direta do DOM (`useRef`), garantindo taxa de atualização de 60 quadros por segundo sem travamentos de estado no React.
  - O painel deve permitir arrastar para baixo para fechar ou expandir para até 90% da altura da tela (`90dvh`).
  - O modal deve contar com trava contra recarregamento involuntário de página (*Pull-to-refresh*).

* **[RF-15] Exclusividade de Modais (1 Modal por vez):**
  - Ao selecionar um local na lista do celular, o painel de busca deve fechar antes do modal de detalhes abrir, evitando telas sobrepostas.

---

### 2.5 Detalhes do Local e Avaliações Comunitárias
* **[RF-16] Detalhes do Ponto de Interesse:**
  - O card de detalhes deve exibir galeria de fotos, endereço completo, horário de funcionamento, telefone com atalho de ligação (`tel:`), descrição e média geral de estrelas.
  - Deve fornecer atalho para abrir a navegação externa no aplicativo instalado do Google Maps / Waze.

* **[RF-17] Sistema de Avaliações dos Alunos:**
  - Usuários podem enviar avaliações com nota obrigatoriamente entre 1 e 5 estrelas e comentários em texto.
  - O sistema deve recalcular instantaneamente a média de estrelas e atualizar o número total de avaliações do local no banco de dados.

---

### 2.6 Painel Administrativo e Automação Inteligente
* **[RF-18] Painel de Controle Admin Protegido:**
  - Acesso protegido via senha administrativa em ([Admin.tsx](file:///c:/Users/Mateus/Downloads/mapa-calouro-main/src/components/Admin.tsx)).
  - Validação via backend e emissão de Token de Sessão em `sessionStorage` (`crypto.randomBytes(32)`).
  - Tabela interativa para busca, adição, edição e exclusão de locais e categorias.

* **[RF-19] Assistente de Auto-Preenchimento por Link do Google Maps:**
  - Ao colar qualquer URL do Google Maps (links normais, links curtos `maps.app.goo.gl`, coordenadas `@lat,lng` ou texto puro), o formulário deve extrair automaticamente: **Nome do Local**, **Categoria recomendada**, **Latitude**, **Longitude**, **Endereço formatado** (via geocodificação reversa OpenStreetMap Nominatim) e **Foto de Preview**.

* **[RF-20] Seletor de Emojis e Cores Hexadecimais:**
  - O criador de categorias deve permitir selecionar emojis de um grid de 22 ícones populares ou digitar qualquer emoji personalizado do teclado.
  - Deve oferecer paleta de cores rápidas e campo hexadecimal customizado.

* **[RF-21] Captura de Coordenadas por Clique no Mapa:**
  - No painel Admin, o usuário pode clicar em qualquer ponto do mapa interativo para preencher automaticamente as coordenadas no formulário.

* **[RF-22] Sincronização Silenciosa em Segundo Plano (10s Polling):**
  - O frontend deve consultar o backend a cada **10 segundos** de forma transparente. Se o administrador cadastrar ou editar um local, ele aparece automaticamente no mapa de todos os alunos sem recarregar a tela.

* **[RF-23] Automação de Manutenção Diária de Banco (Keep-Alive Cronjob):**
  - O repositório deve contar com automação no GitHub Actions (`.github/workflows/keepalive.yml`) executando uma consulta diária às 06:00 AM UTC contra o Supabase na nuvem, zerando o contador de inatividade dos 7 dias e mantendo o banco acordado 24/7.

---

## 3. Requisitos Não-Funcionais (RNF)

| Código | Requisito | Descrição |
| :--- | :--- | :--- |
| **[RNF-01]** | **Desempenho de Carga** | O carregamento inicial da página deve ocorrer em menos de **1.5 segundos** em conexões 4G. |
| **[RNF-02]** | **Taxa de Quadros (60fps Mobile)** | Os gestos dos modais no celular devem responder a 60fps usando aceleração de hardware por GPU (`transform: translateY`). |
| **[RNF-03]** | **Arquitetura de Resiliência Tripla** | O sistema de dados deve operar na ordem: **1. Supabase Cloud ➔ 2. API Server SQLite ➔ 3. LocalStorage**. Se a nuvem cair, o app migra de camada sem travar o usuário. |
| **[RNF-04]** | **Sanitização XSS e Injeção SQL** | Todos os textos recebidos são sanitizados por `sanitizeString()`. Consultas no SQLite usam *prepared statements* parametrizados. |
| **[RNF-05]** | **Autenticação Segura sem Exposição** | A senha administrativa deve ser lida dinamicamente via variável de ambiente `ADMIN_PASSWORD` no `.env` e jamais ser embutida no bundle do cliente. |
| **[RNF-06]** | **Capacidade de Payload Grande** | O backend Express deve aceitar requisições de até **50MB** para upload de imagens convertidas em Base64. |
| **[RNF-07]** | **SEO e Social Graph** | O `index.html` deve conter meta tags Open Graph (`og:image`, `og:title`, `og:description`) para exibir cards visuais quando compartilhado no WhatsApp ou redes sociais. |
| **[RNF-08]** | **Custo Operacional R$ 0,00** | A arquitetura deve rodar em produção de forma 100% gratuita (Vercel Free Tier + Supabase Free Tier + GitHub Actions). |

---

## 4. Regras de Negócio (RN)

> [!IMPORTANT]
> - **[RN-01] Saída Oficial da UFC Russas:** O marcador visual da UFC indica o centro do campus (`-4.9471, -37.9745`), porém **toda rota com origem "Da UFC" deve obrigatoriamente iniciar na Portaria Oficial de Saída na Rua Felipe Santiago** (`-4.945620, -37.975554`) para evitar rotas em contramão.
> - **[RN-02] Respeito às Leis de Trânsito:** Rotas veiculares (`driving`) não podem trafegar no sentido contrário das vias de mão única de Russas - CE.
> - **[RN-03] Regras de Avaliação:** Notas de avaliação devem ser números inteiros de 1 a 5 estrelas. O nome do autor é campo obrigatório.
> - **[RN-04] Sigilo de Credencial Admin:** A senha administrativa não deve ser exibida na interface sob nenhuma hipótese.
> - **[RN-05] Prevenção de Conflito de Animação do Mapa:** Antes de aproximar a câmera (`flyTo`), o sistema deve parar transições anteriores (`map.stop()`) e fechar balões (`map.closePopup()`).

---


