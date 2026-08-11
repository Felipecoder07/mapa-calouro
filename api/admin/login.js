import crypto from 'node:crypto';

// Vercel Serverless Function — roda SOMENTE no servidor, nunca no browser
// A variável ADMIN_PASSWORD é configurada no dashboard do Vercel (Settings > Environment Variables)
// e JAMAIS é enviada ao frontend.

export default function handler(req, res) {
  // Apenas aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { password } = req.body || {};

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Senha não informada' });
  }

  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedPass) {
    // Servidor não configurado corretamente — não revelar detalhes ao cliente
    console.error('[admin/login] Variável ADMIN_PASSWORD não configurada no servidor.');
    return res.status(500).json({ error: 'Servidor não configurado. Contate o administrador.' });
  }

  if (password === expectedPass) {
    // Gera token aleatório seguro de 64 caracteres hexadecimais
    const token = crypto.randomBytes(32).toString('hex');
    return res.status(200).json({ success: true, token });
  }

  // Pequeno delay para dificultar ataques de força bruta por timing
  return res.status(401).json({ error: 'Senha incorreta' });
}
