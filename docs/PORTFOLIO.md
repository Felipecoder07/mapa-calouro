# Mapa do Calouro — case para portfólio

A [apresentação final](APRESENTACAO.md) reúne a narrativa, as três imagens selecionadas, o texto curto para portfólio e a fala sugerida. Este documento concentra as evidências e seus limites.

## Apresentação curta

O Mapa do Calouro é um guia web para estudantes e visitantes da UFC Campus Russas. Organiza locais e serviços em um mapa com busca, categorias, detalhes, favoritos e consulta de rotas. Inclui gestão de locais e integração com fontes de dados locais e Supabase.

Projeto individual de Luiz Felipe Verissimo, que relata ter usado Pen.dev e Claude no desenvolvimento. O repositório permite examinar a implementação e sua evolução. Não há registros de prompts, respostas e revisões que sustentem uma divisão exata de tarefas entre autor e ferramentas.

## Problema, jornada e entrega

**Problema abordado:** reunir informações de localização e serviços para quem está chegando ao campus. Não foram apresentados estudos de usuários que quantifiquem essa dificuldade.

**Jornada principal:** abrir o mapa → buscar ou filtrar um local → consultar informações → solicitar rota desde a UFC ou da posição autorizada pelo usuário.

**Entrega observável:** código de uma aplicação web com interface responsiva, gestão de conteúdo e integração de dados. A existência do código não comprova adoção, implantação pública, economia de tempo ou satisfação dos estudantes.

## Minha contribuição

Texto em primeira pessoa baseado na confirmação do autor nesta revisão:

> Desenvolvi o Mapa do Calouro como projeto individual para reunir informações de locais e serviços da UFC Russas em uma interface com mapa, busca e consulta de rotas. Usei Pen.dev e Claude durante o desenvolvimento. O projeto inclui também gestão de locais e categorias. No portfólio, apresento a implementação, seu histórico e verificações locais, sem atribuir números de uso ou impacto que ainda não medi.

O autor confirmou o nome **Luiz Felipe Verissimo**. Os 25 commits disponíveis em `HEAD` são atribuídos a esse nome. Essa correspondência apoia a atribuição do histórico; não identifica trechos escritos manualmente ou gerados com IA.

## Uso de IA e evidências

| Afirmação | Evidência disponível | Limite |
| --- | --- | --- |
| Uso de Pen.dev e Claude | Relato direto do autor em 05/11/2026 | Sem registros de sessões ou exemplos associados a entregas específicas |
| Existe um prompt destinado ao Bolt | [Arquivo local](PROMPT_BOLT_GAMIFICACAO_TERRITORIOS.md) com requisitos de gamificação | Não comprova uso do Bolt; o autor informou Pen.dev e Claude |
| Existem implementação e testes | `src/`, `server/`, `tests/` e `e2e/` | Não identifica a ferramenta responsável por cada alteração |
| Preenchimento de cadastro por link | [Admin.tsx](../src/components/Admin.tsx), função `parseGoogleMapsInput` e consultas externas | Extração programática e geocodificação não equivalem a uso de LLM |

Para completar a evidência de construção com IA, registrar um exemplo real: problema → ferramenta e prompt → resposta ou alteração proposta → decisão/revisão do autor → arquivo ou commit → validação. Se a conversa original não estiver disponível, identificar o relato como retrospectivo; não reconstruir uma conversa como se fosse registro original.

## Evolução técnica

Hashes consultáveis com `git show <hash>`; descrevem entregas do repositório, não atribuição de geração por IA.

| Entrega | Evidência |
| --- | --- |
| Base com mapa, API SQLite e rotas | `e52684f`; [server/index.js](../server/index.js), [mapUtils.ts](../src/lib/mapUtils.ts) |
| Preenchimento por URL/coordenadas | `0d2af4a`; [Admin.tsx](../src/components/Admin.tsx) |
| Seleção de origem e persistência de rota | `69d803e`; [App.tsx](../src/App.tsx) |
| Ajustes mobile do painel administrativo | `c4785d4`; [Admin.tsx](../src/components/Admin.tsx) |
| Função serverless e configuração | `3b0c6d6`; [api/admin/login.js](../api/admin/login.js) |
| Tratamento de persistência e erros | `0d5a48a`; [api.ts](../src/lib/api.ts) |
| Contagem de categorias na sidebar | `5464314`; [Sidebar.tsx](../src/components/Sidebar.tsx) |

## Relação com a trilha AI Builder

A [vaga do programa GenAI do iFood](https://job-boards.greenhouse.io/ifoodcarreiras/jobs/8901054002), consultada em 05/11/2026, valoriza transformar o uso de IA em soluções concretas, incluindo demonstrações de produtos e ferramentas funcionais. O case pode contribuir com uma jornada de produto verificável e um relato de construção assistida por IA.

O argumento central é demonstrar o problema, a solução e decisões do autor. Automações com IA, orquestração de agentes, APIs de IA e impacto mensurável não foram comprovados nesta revisão. Também não há base para afirmar construção em poucos dias.

## Validação desta revisão

- Data: 05/11/2026. Base Git: `5464314`, com alterações locais preexistentes em `src/App.tsx`, SRS, componentes de territórios e prompt Bolt.
- Ambiente: Windows/PowerShell, Node.js `v24.15.0`, dependências já instaladas. Não houve reinstalação pelo lockfile.
- `npm.cmd run typecheck`: código de saída 0.
- `npm.cmd test`: código de saída 0; 57 testes aprovados em 11 arquivos.
- Parte dos testes reproduz lógica ou cria um servidor de teste, em vez de executar a implementação de produção. Casos com “E2E” no nome dentro de `tests/` não são, por isso, testes de navegador.
- Build de produção, suíte Playwright completa, deploy, perfis reais de rota e métricas de desempenho não foram validados nesta revisão.
- Três [capturas reais da interface](SCREENSHOTS.md) foram revisadas visualmente em desktop e viewport mobile, com snapshot local e API interceptada. A camada de satélite carregou; a padrão não carregou nas tentativas e a clara exibiu erro de chave de API. Não foram feitas alterações funcionais para corrigir essas camadas.
- O servidor aceita token de desenvolvimento na autenticação e o guia de Supabase possui políticas de escrita permissivas. Os testes aprovados não constituem auditoria de segurança.

## Alcance das evidências disponíveis

- Pen.dev e Claude são apresentados como relato do autor, sem atribuição de tarefas específicas ou transcrições de prompts.
- A demonstração é local e documentada por imagens. Não foi confirmada uma URL de demo pública.
- Não há números confirmados de usuários, tempo economizado ou impacto, nem registros de feedback fornecidos para esta revisão.

O case está concluído com esse alcance. Novos registros podem enriquecê-lo posteriormente, sem substituir os limites aqui documentados por suposições.

## Roteiro de apresentação — cerca de 90 segundos

1. Contexto: necessidade de localizar espaços e serviços ao chegar à UFC Russas.
2. Produto: mapa, busca, detalhes e consulta de rota, se o serviço externo responder.
3. Construção: trabalho individual, Pen.dev e Claude; detalhar apenas etapas que o autor consegue confirmar.
4. Decisão técnica: integração de dados e diferença entre persistência compartilhada e fallback no navegador.
5. Validação e limites: testes locais com seu escopo; adoção e impacto ainda sem medição.
