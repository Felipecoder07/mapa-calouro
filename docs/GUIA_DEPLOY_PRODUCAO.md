# 🚀 Guia Completo de Deploy em Produção
## Mapa do Calouro UFC - Campus Russas (Vercel + Supabase)

Este documento contém o passo a passo completo, detalhado e simplificado para publicar o **Mapa do Calouro UFC** na nuvem de forma **100% gratuita**, rápida e 24h/7d online.

---

## 📋 Sumário
1. [Passo 1: Criar o Banco de Dados no Supabase](#-passo-1-criar-o-banco-de-dados-no-supabase)
2. [Passo 2: Executar o Script SQL de Tabelas](#-passo-2-executar-o-script-sql-de-tabelas)
3. [Passo 3: Obter as Chaves do Supabase](#-passo-3-obter-as-chaves-do-supabase)
4. [Passo 4: Publicar o Site na Vercel](#-passo-4-publicar-o-site-na-vercel)
5. [Passo 5: Testar e Validar em Produção](#-passo-5-testar-e-validar-em-produção)
6. [💡 Dicas Importantes e Resolução de Problemas](#-dicas-importantes-e-resolução-de-problemas)

---

## 🟢 Passo 1: Criar o Banco de Dados no Supabase

1. Acesse [supabase.com](https://supabase.com) e clique em **Sign In** (Faça login com sua conta do GitHub).
2. Na página inicial do Supabase, clique no botão **"New Project"** (Novo Projeto).
3. Preencha os dados do projeto:
   - **Name**: `mapa-calouro-ufc`
   - **Database Password**: Crie uma senha segura (guarde ela se precisar no futuro).
   - **Region**: Selecione `São Paulo (sa-east-1)` para menor latência no Brasil.
   - **Pricing Plan**: Selecione `Free Tier` (Gratuito).
4. Clique em **"Create new project"** e aguarde cerca de 1 a 2 minutos até o banco ser provisionado.

---

## 🟡 Passo 2: Executar o Script SQL de Tabelas

1. No painel do seu projeto no Supabase, abra o menu lateral esquerdo e clique em **SQL Editor** (ícone `>_`).
2. Clique em **"+ New Query"** (Nova consulta).
3. Cole o código SQL abaixo na janela:

```sql
-- ======================================================
-- 1. TABELA DE CATEGORIAS
-- ======================================================
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- ======================================================
-- 2. TABELA DE LOCAIS (CAMPUS UFC)
-- ======================================================
CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
  hours TEXT,
  contact TEXT,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ======================================================
-- 3. TABELA DE AVALIAÇÕES DOS LOCAIS
-- ======================================================
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  place_id TEXT REFERENCES places(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  rating INT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ======================================================
-- 4. HABILITAR SEGURANÇA E ACESSO PÚBLICO (RLS)
-- ======================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública (Qualquer aluno lê sem login)
CREATE POLICY "Leitura publica categorias" ON categories FOR SELECT USING (true);
CREATE POLICY "Leitura publica locais" ON places FOR SELECT USING (true);
CREATE POLICY "Leitura publica avaliacoes" ON reviews FOR SELECT USING (true);

-- Políticas de Escrita (Gerenciamento do Admin e avaliações)
CREATE POLICY "Escrita categorias" ON categories FOR ALL USING (true);
CREATE POLICY "Escrita locais" ON places FOR ALL USING (true);
CREATE POLICY "Escrita avaliacoes" ON reviews FOR ALL USING (true);
```

4. Clique no botão **RUN** (▶️) no canto inferior direito para executar o script.
5. Você verá a mensagem **`Success. No rows returned`**. Todas as 3 tabelas estão criadas!

---

## 🟠 Passo 3: Obter as Chaves do Supabase

1. No painel do Supabase, clique no ícone de engrenagem no canto inferior esquerdo (**Project Settings**).
2. Acesse a aba **API**.
3. Localize e copie estas duas chaves:
   - **Project URL**: (exemplo: `https://abcdefghijk.supabase.co`)
   - **anon public key**: (uma chave longa que começa com `ey...`)

---

## 🔵 Passo 4: Publicar o Site na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta do GitHub.
2. Clique no botão **"Add New..."** ➔ **"Project"**.
3. Encontre o repositório **`mapa-calouro`** na lista e clique em **Import**.
4. Na tela de configuração do projeto na Vercel:
   - **Framework Preset**: O Vercel detecta automaticamente como `Vite`.
   - **Root Directory**: `./` (padrão).
5. Abra a seção **Environment Variables** (Variáveis de Ambiente) e adicione as 3 variáveis:

| Key (Nome da Variável) | Value (Valor) |
| :--- | :--- |
| `VITE_SUPABASE_URL` | *(Cole a URL do Supabase que você copiou)* |
| `VITE_SUPABASE_ANON_KEY` | *(Cole a chave anon public do Supabase)* |
| `ADMIN_PASSWORD` | *(Crie uma senha forte para o painel Admin)* |

6. Clique no botão **Deploy**.
7. Aguarde cerca de 45 segundos enquanto a Vercel compila e publica o site.
8. Pronto! A Vercel vai exibir confetes 🎉 e fornecer o link oficial (ex: `https://mapa-calouro.vercel.app`).

---

## 🟢 Passo 5: Testar e Validar em Produção

Após o deploy concluir, faça os seguintes testes no link da Vercel:

1. **Testar Acesso Mobile & Desktop**:
   - Abra o link no celular e no computador.
   - Verifique a fluidez do mapa, dos marcadores e da lista.
2. **Testar o GPS**:
   - No celular, clique no botão `📍 Seguir`.
   - Aceite a permissão nativa de localização e confirme se o pino azul da sua posição aparece no mapa.
3. **Testar o Painel Admin**:
   - Acesse o menu de Configurações / Admin.
   - Faça login com a senha definida em `ADMIN_PASSWORD`.
   - Cadastre ou edite um local e verifique se ele é salvo instantaneamente no Supabase.

---

## 💡 Dicas Importantes e Resolução de Problemas

- **HTTPS Automático**: A Vercel fornece certificado SSL (HTTPS) seguro 100% automático. Isso garante que o GPS do celular funcionará perfeitamente.
- **Domínio Personalizado**: Se a universidade quiser usar um domínio próprio (ex: `mapa.russas.ufc.br`), você pode adicioná-lo gratuitamente na aba **Domains** no painel da Vercel.
- **Inatividade do Supabase**: O Supabase só entra em pausa se ficar 7 dias seguidos sem nenhuma visita. Para manter ativo sempre, basta acessar o site 1 vez por semana ou ter tráfego constante de alunos.

---

*Documento gerado para a equipe do Mapa do Calouro UFC - Campus Russas.*
