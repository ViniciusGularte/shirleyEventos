# Vídeo da plataforma

Tour educativo com narração clonada em português do Brasil e legendas embutidas, gravado diretamente no **Eventos Sob Controle** em funcionamento. O vídeo mostra o cursor, a digitação, calendários, seleções, salvamentos, mensagens de sucesso e os valores atualizados.

Duração: **aproximadamente 5 minutos e 18 segundos**.

## Conteúdo

1. login com o acesso recebido;
2. leitura inicial do painel;
3. cadastro completo de uma cliente;
4. criação de um evento campo por campo;
5. registro real de recebimento e despesa;
6. contas e distribuição;
7. retorno ao painel recalculado.

## Gerar novamente

```bash
yarn video:render
```

O arquivo final é salvo em `docs/video/eventos-sob-controle-shirley.mp4`.

Também há uma versão pronta para envio pelo WhatsApp em `docs/video/eventos-sob-controle-shirley-whatsapp.mp4` (720p e aproximadamente 8,6 MB). O arquivo principal em Full HD tem aproximadamente 26 MB.

Para revisar e ajustar as cenas no editor do Remotion:

```bash
yarn video:studio
```

O texto-base fica em `video/shirley-script.json`. Ele alimenta a voz, as legendas e a gravação para evitar diferenças entre o que é dito e o que aparece na tela. O relatório `docs/video/sync-quality-report.json` valida automaticamente se cada fala e cada ação cabem na cena correta.

O roteiro para uma gravação manual, com instruções do que fazer na tela e sugestões de fala, está em `docs/video/roteiro-gravacao-shirley.txt`.

A gravação bruta do navegador está em `docs/manual/screenshots/shirley-platform-tour.webm`. Para refazer toda a navegação com uma usuária temporária:

```bash
node scripts/record-shirley-tour.mjs
```

A usuária, o workspace e os dados de demonstração são apagados automaticamente ao terminar a captura.
