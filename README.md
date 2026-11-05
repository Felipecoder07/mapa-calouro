# Mapa do Calouro — UFC Russas

Guia web para ajudar estudantes e visitantes a localizar serviços e espaços da UFC Campus Russas e arredores. Reúne mapa, busca por categorias, detalhes de locais, favoritos, avaliações e consulta de rotas em uma interface responsiva.

**Projeto individual de Luiz Felipe Verissimo**, com uso de **Pen.dev e Claude** no desenvolvimento, conforme relato do autor. Conheça a [apresentação de portfólio](docs/APRESENTACAO.md) e o [registro de evidências](docs/PORTFOLIO.md), que distingue implementação, contribuição declarada e limites da validação.

![Mapa do Calouro em desktop, com nove locais do catálogo local e camada de satélite](docs/screenshots/01-mapa-desktop.png)

Captura local de 05/11/2026, com snapshot do SQLite servido por interceptação no navegador; não comprova backend ou deploy. [Galeria, contexto e limitações](docs/SCREENSHOTS.md). Satélite: Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community.

## Problema e solução

Quem chega ao campus precisa descobrir onde ficam espaços acadêmicos e serviços do cotidiano. O Mapa do Calouro organiza essas informações em uma interface geográfica: buscar um local, consultar seus detalhes e solicitar uma rota a partir da universidade ou da localização autorizada pelo usuário.

O painel administrativo permite cadastrar e editar locais e categorias. O preenchimento por links do Google Maps usa extração de coordenadas e consultas externas; esse mecanismo não comprova IA generativa dentro do produto.

## Recursos presentes no código

- Mapa Leaflet com camadas clara, escura e de satélite.
- Busca por nome/endereço, filtros por categoria e favoritos no navegador.
- Detalhes dos locais, notas e comentários.
- Consulta de rotas via OSRM, com seleção de origem e modos de deslocamento na interface.
- Painel administrativo para gestão de locais e categorias.
- Integração com Supabase, API Express/SQLite e armazenamento local, conforme configuração e operação.

As rotas dependem de serviço externo. A interface possui estimativa alternativa quando a consulta falha; não há comprovação de trânsito ao vivo, precisão de caminhos de pedestres ou desempenho de 60 fps. Dados salvos apenas no navegador não demonstram persistência compartilhada.

## Tecnologias e estrutura

| Camada | Implementação |
| --- | --- |
| Interface | React, TypeScript, Vite e Tailwind CSS |
| Mapas e rotas | Leaflet, React-Leaflet e OSRM |
| Dados | Supabase/PostgreSQL; Express e SQLite; fallback local |
| Verificação | Vitest, Playwright e TypeScript |
| Operação | Função de login em `api/` e workflow de manutenção no GitHub Actions |

`src/components/` contém a interface; `src/lib/`, acesso a dados e cálculos; `server/`, a API local; `supabase/migrations/`, a estrutura SQL; `tests/` e `e2e/`, os testes.

## Executar localmente

Com Node.js e npm instalados, na pasta do projeto:

```bash
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite (normalmente `http://localhost:5173`). Sem Supabase e sem API local, a aplicação usa o fallback do navegador, cujo catálogo inicial de locais está vazio.

Para usar a API SQLite, execute também, em outro terminal:

```bash
npm run server
```

O Vite encaminha `/api` para a porta `3001`. O servidor cria/usa `data/database.sqlite`. Para configurar Supabase, use os nomes de variáveis em [.env.example](.env.example): `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Defina `ADMIN_PASSWORD` no ambiente do processo servidor; o script `server` não carrega automaticamente um arquivo `.env`.

No PowerShell, caso a política de scripts bloqueie `npm.ps1`, use `npm.cmd`. A revisão foi verificada com Node.js `v24.15.0`; isso não define uma versão mínima de compatibilidade.

## Verificação

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Na revisão de **05/11/2026**, `typecheck` passou e `npm test` passou com **57 testes em 11 arquivos**, na cópia de trabalho. Há testes com lógica simulada e servidor reconstruído para teste; isso não significa cobertura total. Consulte o [registro de validação](docs/PORTFOLIO.md#validação-desta-revisão). Os comandos de build e E2E acima são instruções, não uma declaração de aprovação nesta revisão.

## Documentação

- [Índice da documentação](docs/README.md)
- [Apresentação final com imagens e texto para portfólio](docs/APRESENTACAO.md)
- [Case de portfólio, contribuição e uso de IA](docs/PORTFOLIO.md)
- [Seleção de screenshots e demonstração](docs/SCREENSHOTS.md)
- [Especificação de requisitos](docs/ESPECIFICACAO_REQUISITOS_SRS.md)
- [Guia de deploy existente](docs/GUIA_DEPLOY_PRODUCAO.md)
- [Manutenção do Supabase](docs/MANUTENCAO_KEEPALIVE_SUPABASE.md)

Os guias operacionais registram configuração proposta, não comprovam deploy ativo ou disponibilidade contínua. Antes de exposição pública, as políticas de escrita do Supabase e a autenticação da API precisam de revisão: o guia contém políticas permissivas e o servidor aceita um token de desenvolvimento. Esta revisão é documental e não altera esses mecanismos.
