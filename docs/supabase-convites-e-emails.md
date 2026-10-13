# Supabase — convites, e-mails e configuração

Este projeto usa **Supabase Auth com e-mail e senha**, em fluxo SSR com cookies.

## O que dispara cada e-mail

- **Convite de aluna:** `admin.auth.admin.inviteUserByEmail(...)`, em `src/features/admin/actions.ts`.
- **Recuperação de senha:** `supabase.auth.resetPasswordForEmail(...)`, em `src/features/auth/actions.ts`.
- **Login normal:** `supabase.auth.signInWithPassword(...)`; não envia e-mail.

Ao convidar uma aluna, o sistema também cria o workspace, registra o convite em `event_fin_invites`, cria perfil e vínculo da aluna e prepara os dados iniciais do financeiro.

## Templates que precisam ser alterados

No painel do projeto Supabase, abra **Authentication → Email Templates**.

### 1. Invite user — obrigatório

Assunto:

```text
Seu acesso ao Eventos Sob Controle
```

Corpo HTML:

```html
<div style="margin:0;background:#fff8fb;padding:32px 16px;font-family:Arial,sans-serif;color:#120c12">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #f3d7e4;border-radius:22px;padding:32px">
    <p style="margin:0 0 18px;color:#be185d;font-size:14px;font-weight:700">EVENTOS SOB CONTROLE</p>
    <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2">Seu espaço está pronto</h1>
    <p style="margin:0 0 14px;font-size:16px;line-height:1.6">Olá! Você recebeu um convite para organizar clientes, eventos e financeiro em um só lugar.</p>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.6">Clique no botão abaixo para criar sua senha e acessar a plataforma.</p>
    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=invite&amp;next=/definir-senha" style="display:inline-block;background:#120c12;color:#fff8fb;text-decoration:none;font-weight:700;border-radius:14px;padding:14px 22px">Criar minha senha</a>
    <p style="margin:24px 0 0;color:#786b73;font-size:13px;line-height:1.5">Se você não esperava este convite, pode ignorar este e-mail.</p>
  </div>
</div>
```

### 2. Reset password — obrigatório

Assunto:

```text
Redefina sua senha | Eventos Sob Controle
```

Corpo HTML:

```html
<div style="margin:0;background:#fff8fb;padding:32px 16px;font-family:Arial,sans-serif;color:#120c12">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #f3d7e4;border-radius:22px;padding:32px">
    <p style="margin:0 0 18px;color:#be185d;font-size:14px;font-weight:700">EVENTOS SOB CONTROLE</p>
    <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2">Crie uma nova senha</h1>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.6">Recebemos uma solicitação para redefinir a senha da sua conta. O botão abaixo leva você à tela segura de alteração.</p>
    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=recovery&amp;next=/definir-senha" style="display:inline-block;background:#120c12;color:#fff8fb;text-decoration:none;font-weight:700;border-radius:14px;padding:14px 22px">Redefinir minha senha</a>
    <p style="margin:24px 0 0;color:#786b73;font-size:13px;line-height:1.5">Se você não pediu a alteração, ignore este e-mail e mantenha sua senha atual.</p>
  </div>
</div>
```

### 3. Password changed — recomendado

Ative a notificação de segurança e traduza o template para avisar a usuária sempre que a senha for alterada. Este template não precisa ter link de autenticação.

Os templates **Confirm signup**, **Magic link**, **Change email** e **Reauthentication** não são usados pelo fluxo atual. Se o cadastro público permanecer fechado, o template de confirmação de cadastro não será necessário.

## Configuração no painel do Supabase

### Authentication → URL Configuration

- **Site URL:** `https://sseventos.vercel.app`
- **Redirect URLs de produção:**
  - `https://sseventos.vercel.app/definir-senha`
  - `https://sseventos.vercel.app/auth/confirm`
  - `https://sseventos.vercel.app/auth/callback`
- **Desenvolvimento:** `http://localhost:3000/**`

Use URLs exatas em produção. Curingas devem ficar restritos ao desenvolvimento ou a previews controlados.

### Authentication → General Configuration e Providers → Email

- mantenha o provedor de e-mail ligado;
- em **General Configuration**, desligue **Allow new users to sign up**, pois neste projeto a entrada é somente por convite administrativo;
- não habilite login por Magic Link enquanto o produto continuar usando senha.
- configure **Email OTP Expiration** como `86400` segundos (24 horas). Esse mesmo prazo vale para convite e recuperação de senha e corresponde ao `expires_at` salvo pelo sistema.

### Project Settings → Authentication / SMTP

Configure SMTP próprio antes de enviar convites reais:

- remetente, por exemplo: `Eventos Sob Controle`;
- endereço de remetente em domínio verificado;
- host, porta, usuário e senha do provedor SMTP;
- desative rastreamento de links no provedor de e-mail, pois a reescrita da URL pode invalidar links de autenticação.

O serviço de e-mail padrão do Supabase é indicado apenas para testes, tem limite baixo e pode recusar destinatários que não façam parte da equipe do projeto.

## Variáveis do ambiente de produção

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://hfnwpzglvbzkvhrcwmet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=https://sseventos.vercel.app
```

`SUPABASE_SERVICE_ROLE_KEY` deve existir somente no servidor/hosting. Nunca exponha essa chave no navegador nem use o prefixo `NEXT_PUBLIC_` nela.

## Estado conferido em 12/10/2026

- o domínio de produção `https://sseventos.vercel.app` está publicado e redireciona corretamente para `/login`;
- `NEXT_PUBLIC_APP_URL` local permanece como `http://localhost:3000`, que é o valor correto para desenvolvimento;
- o valor de produção dessa variável precisa ser configurado na Vercel como `https://sseventos.vercel.app`;
- cadastro por e-mail está liberado no projeto remoto (`disable_signup: false`);
- confirmação automática de e-mail está ativa (`mailer_autoconfirm: true`);
- o provedor de e-mail está ativo e os provedores sociais estão desligados.

O prazo atual de **Email OTP Expiration** não é exposto pelo endpoint público do projeto. Até ele ser conferido no painel, considere o padrão do Supabase de 1 hora; o campo `expires_at` do sistema foi alinhado para 24 horas e requer a configuração `86400` no painel.

Antes de enviar convites reais em produção, configure a URL pública na Vercel e no Supabase, feche o cadastro público, configure SMTP e publique os dois templates obrigatórios acima.

## Teste final recomendado

1. Convide um endereço de teste que não pertença à equipe do Supabase.
2. Confirme remetente, assunto e entrega na caixa de entrada/spam.
3. Abra o convite e verifique se `/auth/confirm` leva a `/definir-senha`.
4. Crie a senha e confira o redirecionamento para `/app/boas-vindas`.
5. Saia e teste **Esqueci minha senha** com o mesmo endereço.

## Referências oficiais

- [Templates de e-mail do Supabase Auth](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Configuração de Site URL e Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [SMTP próprio para produção](https://supabase.com/docs/guides/auth/auth-smtp)
- [Limites de envio do Supabase Auth](https://supabase.com/docs/guides/auth/rate-limits)
- [Prazo dos links de convite e OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless)
