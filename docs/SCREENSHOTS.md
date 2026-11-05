# Seleção de screenshots

Não havia screenshots de apresentação nos arquivos encontrados no início desta revisão. As cenas prioritárias são:

| Ordem | Cena | O que mostrar | Legenda |
| --- | --- | --- | --- |
| 1 — capa | Mapa desktop, 1440 × 900 | Mapa carregado, busca e categorias | “Mapa do Calouro: navegação por locais e serviços da UFC Russas.” |
| 2 — jornada | Busca e detalhes | Termo de busca e informações do mesmo local | “Da busca às informações do local em uma única interface.” |
| 3 — mobile | Mapa e detalhes, 390 × 844 | Controles legíveis, sem cortes | “Interface em viewport mobile; captura de navegador, não teste em aparelho físico.” |
| 4 — opcional | Gestão de locais | Lista ou formulário sem credenciais | “Painel de gestão de locais e categorias.” |

Para o README, priorizar a capa. Para slides, usar capa, jornada e mobile. O painel administrativo é apoio para explicar manutenção do conteúdo. A gamificação não integra a seleção principal.

## Arquivos capturados nesta revisão

| Arquivo | Uso selecionado | Ambiente |
| --- | --- | --- |
| [Mapa desktop](screenshots/01-mapa-desktop.png) | Capa | 1440 × 900 |
| [Busca e detalhes desktop](screenshots/02-detalhes-desktop.png) | Jornada de consulta | 1440 × 900 |
| [Detalhes mobile](screenshots/03-detalhes-mobile.png) | Slide de interface responsiva | 390 × 844 |

Capturas de 05/11/2026 em `http://127.0.0.1:5174`, Chromium, na cópia de trabalho baseada em `5464314`. A sessão usa um snapshot dos nove locais do SQLite local por interceptação de `/api` no navegador; acesso ao Supabase bloqueado e avaliações substituídas por lista vazia. Os dados não foram inventados nem escritos no banco. Isso demonstra a interface, não a integração real com o backend.

A camada escolhida é **Satélite (ArcGIS/Esri)**. O mapa padrão não carregou nas tentativas iniciais e a camada clara retornou imagens com “API key required”; essas tentativas foram descartadas da seleção. O botão “Conquista BETA” aparece porque pertence às alterações locais preexistentes; a captura não valida esse recurso.

Crédito das imagens de satélite, conforme a configuração da camada no projeto: **Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community**. O app desabilita a atribuição no mapa; manter este crédito junto às imagens ao utilizá-las em slides ou portfólio. A interface não foi alterada para a captura.

O [registro de captura](screenshots/capture.json) informa ambiente e contagem de tiles. As três imagens finais foram revisadas visualmente. Essa contagem não substitui revisão visual: o provedor pode retornar uma imagem de erro. O [script de captura](capture-screenshots.mjs) documenta a reprodução e depende do SQLite local, não versionado. Não distribui o banco nem estabelece uma fixture pública.

Para reproduzir, a partir da raiz, iniciar um servidor Vite dedicado e executar o script em outro terminal:

```bash
node --input-type=module -e "import {createServer} from 'vite'; const s=await createServer({envDir:false,server:{host:'127.0.0.1',port:5174,strictPort:true}});await s.listen();s.printUrls();"
node docs/capture-screenshots.mjs
```

Requer dependências e Chromium do Playwright instalados, banco local existente e acesso aos tiles. O script bloqueia requisições a `*.supabase.co`, mesmo se o Vite herdar variáveis de ambiente. A reprodução sobrescreve os PNGs e o registro de captura; revisar visualmente antes de usar.

## Procedência e critérios

Para cada PNG, registrar data, versão/cópia de trabalho, URL, viewport, origem dos dados e limitações. Usar somente capturas da aplicação executada; mockups ou imagens geradas não comprovam funcionamento.

- Identificar dados de demonstração; contagens de locais e avaliações não são métricas de adoção.
- Manter atribuição dos provedores do mapa visível.
- Esperar os tiles; descartar como capa imagens com mapa quebrado, erro ou loading.
- Não criar cadastros ou avaliações em produção para preparar imagens.
- Só incluir rota como evidência distinguindo resposta do OSRM de estimativa alternativa.

## Demo complementar

Gravar mapa → busca → detalhes → rota, identificando ambiente e origem dos dados. Uma captura mostra a interface; uma gravação demonstra interação, sem comprovar adoção ou impacto.
