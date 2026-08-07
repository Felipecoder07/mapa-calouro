# 🔄 Sistema de Manutenção Automática Keep-Alive (Supabase 24/7)
### Mapa do Calouro UFC - Campus Russas

Este documento explica em detalhes como funciona a solução automatizada contra inatividade do **Supabase** no plano gratuito e o passo a passo para ativá-la no seu repositório GitHub.

---

## 📌 1. Por que esta solução é necessária?

No plano gratuito do Supabase:
- Se um projeto ficar **7 dias seguidos sem nenhuma requisição de banco de dados**, o Supabase o coloca em modo de espera (*Pausado*).
- NENHUM dado é perdido, porém, quando um aluno tenta acessar após 7 dias de inatividade, o banco precisa ser reativado manualmente no painel do Supabase.

---

## ⚡ 2. Como funciona a solução com GitHub Actions?

Para evitar o desligamento e manter o banco **100% acordado 365 dias por ano**, o projeto inclui o arquivo de automação:
`.github/workflows/keepalive.yml`

### Funcionamento Interno:
1. **Horário Agendado**: Todos os dias, pontualmente às **06:00 da manhã (UTC)**, os servidores do GitHub iniciam a automação.
2. **Requisição HTTP de Leitura**: O GitHub dispara um comando seguro (`curl`) contra a API REST do Supabase lendo 1 registro da tabela `categories`.
3. **Reset do Contador**: O Supabase registra essa consulta como **atividade real de banco de dados**. Isso zera o contador de 7 dias todos os dias!
4. **Resultado**: O banco de dados **NUNCA entra em pausa** e o site responde instantaneamente para todos os alunos da UFC.

---

## 🛠️ 3. Passo a Passo de Ativação no GitHub

Após publicar o projeto no seu repositório do GitHub, siga estes **3 passos simples**:

### Passo 3.1: Acessar as Configurações do Repositório
1. Abra a página do seu repositório no GitHub (ex: `github.com/Felipecoder07/mapa-calouro`).
2. Clique na aba superior **Settings** (⚙️ Engrenagem).
3. No menu lateral esquerdo, clique em **Secrets and variables** ➔ **Actions**.

### Passo 3.2: Cadastrar as Chaves Secretas
Clique no botão verde **"New repository secret"** e cadastre duas variáveis:

1. **Primeira Variável**:
   - **Name**: `VITE_SUPABASE_URL`
   - **Secret**: *(Cole a URL do seu projeto Supabase. Exemplo: `https://xyz.supabase.co`)*
   - Clique em **Add secret**.

2. **Segunda Variável**:
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Secret**: *(Cole a chave anon public do seu Supabase que começa com `ey...`)*
   - Clique em **Add secret**.

---

## 🧪 4. Como Testar ou Disparar Manualmente

Você não precisa esperar até as 06:00 da manhã para saber se a automação está funcionando!

1. No seu repositório do GitHub, acesse a aba superior **Actions**.
2. No menu esquerdo, clique na automação **"Keepalive Supabase"**.
3. No lado direito, clique no botão **"Run workflow"** ➔ **"Run workflow"**.
4. Em alguns segundos, um ícone verde de sucesso `✔` aparecerá confirmando que o ping foi entregue com sucesso ao Supabase!

---

*Documento técnico gerado para a equipe do Mapa do Calouro UFC.*
