# Guardian Monitor

Guardian Monitor é uma extensão local para navegadores baseados em Chromium que registra metadados de arquivos selecionados para upload, tentativas de envio por formulários HTML, downloads, classificação local de risco de downloads e mudanças observáveis nas extensões instaladas.

O objetivo do projeto é ajudar o usuário a perceber atividades que merecem revisão sem enviar o histórico para servidores externos.

## Recursos

- Guardian Risk Engine local e reutilizável para downloads, extensões e formulários de credenciais.
- Guardian Risk Score de 0 a 100 com níveis Baixo, Atenção, Moderado, Alto e Crítico.
- Central de Segurança com indicadores por categoria e explicação dos sinais que contribuíram para cada evento.
- Registro de arquivos selecionados em campos de upload.
- Registro de tentativas de envio por formulários HTML.
- Scanner local de downloads baseado em metadados, extensão do arquivo, dupla extensão, MIME, origem e sinais de segurança fornecidos pelo Chromium.
- Alertas de risco moderado e alto em downloads.
- Detecção de nomes potencialmente enganosos, como `documento.pdf.exe`.
- Alertas locais para arquivos potencialmente sensíveis.
- Lista configurável de sites confiáveis.
- Auditoria das extensões instaladas no navegador.
- Detecção de novas extensões e novas permissões observáveis.
- Classificação de permissões que merecem atenção.
- Histórico local com busca e filtros.
- Exportação em JSON e CSV.
- Proteção contra CSV Formula Injection na exportação.
- Sem telemetria, analytics, backend ou código remoto.

## Privacidade

O Guardian Monitor não lê o conteúdo dos arquivos monitorados. Para uploads, guarda somente metadados como nome, tamanho, tipo, extensão, domínio e horário. URLs completas de páginas não são armazenadas.

Os dados do Guardian Monitor são mantidos em `chrome.storage.local`. A extensão restringe esse armazenamento a contextos confiáveis da própria extensão usando `TRUSTED_CONTEXTS`.

Consulte [PRIVACY.md](PRIVACY.md) para detalhes.

## Permissões

| Permissão | Motivo |
| --- | --- |
| `storage` | Guardar configurações, histórico e linha de base local das extensões. |
| `notifications` | Mostrar alertas locais do Guardian Monitor. |
| `downloads` | Observar downloads, consultar seus metadados e acompanhar mudanças de estado e do indicador `danger` do Chromium. |
| `management` | Permissão opcional solicitada somente quando o usuário ativa a auditoria de extensões. |
| `<all_urls>` | Observar campos de upload nas páginas acessadas pelo usuário. |

A permissão `tabs` não é utilizada. A permissão `management` é opcional e não é solicitada durante a instalação.

## Segurança

A versão 1.3 aplica as seguintes medidas:

- Manifest V3.
- Content Security Policy restritiva.
- Nenhum `eval`, `new Function`, JavaScript remoto ou WebSocket.
- Nenhum `fetch` para servidores externos.
- Nenhum `innerHTML` com dados dinâmicos.
- Construção de interface com `textContent` e APIs DOM.
- Validação e limitação de mensagens recebidas dos content scripts.
- Limite de arquivos e tamanho de strings recebidas das páginas.
- Armazenamento somente do mínimo necessário.
- URLs completas de páginas e downloads não são persistidas.
- O scanner de downloads não lê o conteúdo do arquivo e não envia hashes ou arquivos a serviços externos.
- Restrição do `chrome.storage.local` a contextos confiáveis.
- Histórico limitado para reduzir exposição e uso excessivo de armazenamento.
- Sanitização das exportações CSV contra execução de fórmulas ao abrir em planilhas.

Consulte [SECURITY.md](SECURITY.md) para relatar problemas.

## Limitações

Um alerta do Guardian Monitor não significa que houve invasão. A extensão aponta eventos observáveis que merecem revisão.

O Guardian Risk Engine é heurístico. O Risk Score não confirma malware, invasão, roubo de senha ou comprometimento de sessão; ele agrega metadados e sinais observáveis para ajudar a priorizar revisões.

### Fórmula do Guardian Risk Score

Cada evento recebe uma pontuação limitada a 0–100. Para o score geral, eventos das últimas 24 horas usam peso 1,0, eventos de até 7 dias usam 0,6 e eventos mais antigos usam 0,25. O nível do evento também multiplica sua influência: Crítico 1,25, Alto 1,1, Moderado 0,9, Atenção 0,7 e Baixo 0,45.

Os eventos são separados em downloads, extensões, credenciais e outros. Dentro de cada categoria, somente os dez maiores valores influenciam o resultado, com decaimento geométrico de 0,55 entre ocorrências. A soma é normalizada por `100 × (1 − e^(−soma/115))`. Isso preserva a influência de eventos recentes e graves e impede que centenas de ocorrências pequenas levem artificialmente o score a 100.

Ela não consegue provar que um servidor recebeu ou armazenou um arquivo, detectar roubo de senhas ou cookies por malware, detectar acesso a uma conta feito em outro dispositivo, observar atividades anteriores à instalação ou substituir antivírus e ferramentas de segurança do sistema operacional. A classificação de downloads é heurística: risco alto significa que existem sinais relevantes, não que malware foi confirmado.

## Instalação para desenvolvimento

1. Clone ou baixe este repositório.
2. Abra `chrome://extensions` no Chrome ou `edge://extensions` no Microsoft Edge.
3. Ative o modo de desenvolvedor.
4. Clique em **Carregar sem compactação**.
5. Selecione a pasta do projeto que contém `manifest.json`.

## Estrutura

```text
guardian-monitor/
├── manifest.json
├── background.js
├── content.js
├── risk-engine.js
├── popup.html
├── popup.js
├── dashboard.html
├── dashboard.js
├── style.css
├── icon16.png
├── icon32.png
├── icon48.png
├── icon128.png
├── README.md
├── PRIVACY.md
├── LICENSE
└── .gitignore
```

## Versão

Versão atual: **1.5.1**

## Licença

Distribuído sob a licença MIT. Consulte [LICENSE](LICENSE).
