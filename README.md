# Eventos Sob Controle

Aplicação publicada em [sseventos.vercel.app](https://sseventos.vercel.app/).

## Configuração de produção

Na Vercel, configure `NEXT_PUBLIC_APP_URL=https://sseventos.vercel.app`, além das três variáveis do Supabase descritas no `.env.example`, e faça um novo deploy depois da alteração.

No Supabase, use `https://sseventos.vercel.app` como **Site URL** e autorize estas URLs de redirecionamento:

- `https://sseventos.vercel.app/definir-senha`
- `https://sseventos.vercel.app/auth/confirm`
- `https://sseventos.vercel.app/auth/callback`
- `http://localhost:3000/**` apenas para desenvolvimento

O checklist completo de autenticação, SMTP e templates está em [docs/supabase-convites-e-emails.md](docs/supabase-convites-e-emails.md).
