# Mapa do Calouro — UFC Russas

Criei o Mapa do Calouro para ajudar quem está chegando à UFC Russas a encontrar lugares e serviços do campus e da cidade. A ideia é reunir essas informações em um mapa: a pessoa busca o que precisa, consulta os detalhes do local e pode traçar uma rota até lá.

Desenvolvi o projeto individualmente, usando **Pen.dev e Claude** como apoio durante o desenvolvimento.

![Mapa do Calouro com a lista de locais e a visão de satélite de Russas](docs/screenshots/01-mapa-desktop.png)

*Demonstração local com nove locais do banco SQLite. [Veja também as telas de busca e mobile](docs/SCREENSHOTS.md).*

<details>
<summary>Sobre a captura e os créditos do mapa</summary>

Nesta captura, os dados do SQLite são fornecidos à interface por uma interceptação da API no navegador. Os detalhes da sessão estão no [registro das imagens](docs/SCREENSHOTS.md).

Satélite: Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community.

</details>

## O que dá para fazer

- Encontrar locais pelo nome, endereço ou categoria.
- Consultar informações, notas e comentários sobre cada lugar.
- Salvar favoritos no navegador.
- Solicitar rotas a partir da UFC ou da própria localização, com permissão de GPS.
- Usar o mapa e os painéis em desktop ou celular.
- Gerenciar locais e categorias pelo painel administrativo.

No cadastro, também é possível preencher informações a partir de coordenadas ou links do Google Maps. Esse recurso extrai dados do link e faz consultas externas para ajudar no preenchimento.

## Como o projeto funciona

A interface usa **React, TypeScript e Tailwind CSS**, com **Leaflet** para o mapa e **OSRM** para consultar rotas.

A camada de dados integra o **Supabase** e uma API local em **Express com SQLite**. Também há armazenamento no navegador como alternativa em algumas operações. Nesse modo, os dados ficam restritos ao navegador usado.

As rotas dependem da disponibilidade do serviço externo. Quando a consulta falha, a aplicação pode exibir uma estimativa de distância e tempo.

| Pasta | Conteúdo |
| --- | --- |
| `src/components/` | Mapa, busca, detalhes e painel administrativo |
| `src/lib/` | Acesso aos dados, rotas, distâncias e favoritos |
| `server/` | API local com Express e SQLite |
| `api/` | Função serverless de login |
| `supabase/migrations/` | Estrutura do banco |
| `tests/` e `e2e/` | Testes com Vitest e Playwright |
| `docs/` | Documentação e apresentação do projeto |

## Uso de IA

Usei **Pen.dev e Claude** durante a construção do Mapa do Calouro. Esse uso faz parte do processo de desenvolvimento; as funcionalidades de mapa, busca e rotas são implementadas com as bibliotecas e os serviços descritos acima.

Reuni o histórico de evolução, os arquivos relacionados às entregas e os detalhes sobre o uso de IA na [documentação do projeto](docs/PORTFOLIO.md).

## Como rodar

Com Node.js e npm instalados, execute na pasta do projeto:

```bash
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite, normalmente `http://localhost:5173`.

Para usar o banco SQLite, inicie a API em outro terminal:

```bash
npm run server
```

O servidor usa o arquivo `data/database.sqlite`, e o Vite encaminha as chamadas de `/api` para a porta `3001`. Sem Supabase ou API local, o catálogo inicial de locais no navegador fica vazio.

Para configurar o Supabase, use [.env.example](.env.example) como referência e defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em um arquivo `.env.local`. A variável `ADMIN_PASSWORD` deve ser definida no ambiente do servidor, pois o comando `npm run server` não carrega o arquivo `.env` automaticamente.

No PowerShell, use `npm.cmd` caso a execução de `npm.ps1` esteja bloqueada.

## Testes

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Na verificação de 05/11/2026, a checagem de tipos passou e os **57 testes de 11 arquivos do Vitest** foram aprovados. Parte dos testes usa simulações. O escopo da execução está no [registro de validação](docs/PORTFOLIO.md#validação-desta-revisão); build e testes de navegador não foram executados nessa verificação.

## Documentação

- [Apresentação do projeto](docs/APRESENTACAO.md)
- [Histórico, contribuição e uso de IA](docs/PORTFOLIO.md)
- [Screenshots desktop e mobile](docs/SCREENSHOTS.md)
- [Especificação de requisitos](docs/ESPECIFICACAO_REQUISITOS_SRS.md)
- [Configuração de deploy](docs/GUIA_DEPLOY_PRODUCAO.md)
- [Manutenção do Supabase](docs/MANUTENCAO_KEEPALIVE_SUPABASE.md)

**Antes de publicar uma instância:** a autenticação da API ainda aceita um token de desenvolvimento, e o guia de Supabase contém políticas de escrita permissivas. Esses pontos precisam ser revistos para uso público.

---

Desenvolvido por **Luiz Felipe Verissimo**.
