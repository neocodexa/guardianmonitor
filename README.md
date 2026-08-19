# Guardian Monitor

Guardian Monitor é uma extensão local para navegadores baseados em Chromium e Firefox que registra metadados de arquivos selecionados para upload, tentativas de envio por formulários HTML, downloads, classificação local de risco de downloads e mudanças observáveis nas extensões instaladas.

O objetivo do projeto é ajudar o usuário a perceber atividades que merecem revisão sem enviar o histórico para servidores externos.

## Recursos

- Guardian Risk Engine local e reutilizável para downloads, extensões e formulários de credenciais.
- Guardian Risk Score de 0 a 100 com níveis Baixo, Atenção, Moderado, Alto e Crítico.
- Risk Replay com agrupamento local de eventos correlacionados, timeline, explicações e exportação de incidentes.
- Central de Segurança com indicadores por categoria e explicação dos sinais que contribuíram para cada evento.
- Registro de arquivos selecionados em campos de upload.
- Registro de tentativas de envio por formulários HTML.
- Scanner local de downloads baseado em metadados, extensão do arquivo, dupla extensão, MIME, origem e sinais de segurança fornecidos pelo navegador.
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

Os dados do Guardian Monitor são mantidos na API local de armazenamento do navegador. No Chromium, a extensão restringe esse armazenamento a contextos confiáveis da própria extensão usando `TRUSTED_CONTEXTS`.

Consulte [PRIVACY.md](PRIVACY.md) para detalhes.

## Permissões

| Permissão | Motivo |
| --- | --- |
| `storage` | Guardar configurações, histórico e linha de base local das extensões. |
| `notifications` | Mostrar alertas locais do Guardian Monitor. |
| `downloads` | Observar downloads, consultar seus metadados e acompanhar mudanças de estado e dos indicadores de segurança fornecidos pelo navegador. |
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
- Restrição do armazenamento local a contextos confiáveis quando essa proteção é disponibilizada pelo navegador.
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

### Guardian Risk Engine v2 para extensões

A auditoria separa **Capability Risk** (o poder técnico concedido pelas permissões) de **Behavior Risk** (sinais incomuns para a categoria funcional e mudanças desde a baseline). Ambos usam a escala 0–100: muito baixo (0–19), baixo (20–39), moderado (40–59), alto (60–79) e crítico (80–100). Capacidade elevada não indica intenção maliciosa.

Os pesos base de capacidade são: `storage` 2, `activeTab` 3, `tabs` 7, `downloads.open` e `clipboardWrite` 8, `downloads`, `privacy`, `geolocation` e `webRequest` 10, `cookies`, `clipboardRead` e `declarativeNetRequest` 12, `webRequestBlocking` 14, `scripting` e `declarativeNetRequestWithHostAccess` 16, `history`, `management` e `<all_urls>` 18, `proxy` 25, `nativeMessaging` 35 e `debugger` 42. Combinações adicionam capacidade quando ampliam controle ou superfície de acesso.

O Behavior Risk usa uma matriz central de compatibilidade (`esperada` 0, `possível` 2, `incomum` 9 e `muito incomum` 18), combinações fora de contexto, origem de instalação observável, estado da extensão e Permission Drift. Perfis funcionais nunca são concedidos apenas pelo nome: categorias sensíveis exigem também uma assinatura coerente de permissões. Quando faltam descrição, categoria, origem observável ou baseline, a confiança é reduzida.

A baseline guarda versão, permissões, hosts e a análise anterior. Deltas de 0–9 são pequenos, 10–24 relevantes e 25 ou mais significativos. O score legado usado no histórico de extensões corresponde ao Behavior Risk, priorizando sinais contextuais em vez de poder técnico isolado.

## Risk Replay

O Risk Replay transforma eventos de risco já armazenados em incidentes visuais. Nenhum dado adicional é coletado ou persistido para realizar o agrupamento.

Cada incidente exportado usa `schemaVersion: 1` e contém um identificador estável, início, fim, duração, Guardian Risk Score combinado, nível, motivos e a sequência normalizada de eventos. Cada evento da sequência inclui horário, tipo, domínio, destino, item, pontuação, explicações e sua relação observável com o evento anterior.

Eventos que já possuem `incidentId` são agrupados por esse identificador. Eventos antigos sem `incidentId` recebem um identificador determinístico iniciado por `legacy-` e são agrupados quando ocorrem em uma janela de até dois minutos e compartilham domínio, item ou extensão, ou quando são eventos de risco próximos. Esse agrupamento indica correlação temporal e técnica, não relação causal.

A pontuação do incidente combina as pontuações dos eventos em ordem decrescente, reduzindo progressivamente o peso dos eventos adicionais. O resultado ajuda na priorização, mas não confirma execução de arquivos, causalidade entre eventos ou comprometimento real.

As exportações JSON e HTML são geradas localmente. O relatório HTML não contém JavaScript, dependências ou recursos remotos. Todo conteúdo originado dos eventos passa por escaping de HTML antes de ser inserido no relatório.

## Instalação para desenvolvimento

1. Clone ou baixe este repositório.
2. Abra `chrome://extensions` no Chrome ou `edge://extensions` no Microsoft Edge.
3. Ative o modo de desenvolvedor.
4. Clique em **Carregar sem compactação**.
5. Selecione a pasta do projeto que contém `manifest.json`.

### Firefox

1. Execute `powershell -ExecutionPolicy Bypass -File .\scripts\build-packages.ps1` no PowerShell.
2. Abra `about:debugging#/runtime/this-firefox` no Firefox.
3. Clique em **Carregar extensão temporária**.
4. Selecione o arquivo `manifest.json` de uma cópia descompactada do ZIP criado em `dist`.

O script gera pacotes separados em `dist/chromium` e `dist/firefox`. O Firefox usa `manifests/firefox.json` durante a geração, sem alterar o `manifest.json` utilizado pelo Chrome e pelo Edge. Para distribuição permanente, envie o ZIP do Firefox para assinatura no Firefox Add-ons.

O build remove automaticamente os ZIPs antigos de cada pasta antes de gerar a versão atual. Para validar a organização, as versões e as referências sem gerar pacotes, execute `powershell -ExecutionPolicy Bypass -File .\scripts\validate-project.ps1`. A mesma validação é executada no GitHub Actions a cada push e pull request.

## Estrutura

```text
guardian-monitor/
├── manifest.json
├── manifests/
│   └── firefox.json
├── scripts/
│   ├── build-packages.ps1
│   └── validate-project.ps1
├── dist/
│   ├── chromium/
│   │   └── guardian-monitor-chromium-1.6.0.zip
│   └── firefox/
│       └── guardian-monitor-firefox-1.6.0.zip
├── src/
│   ├── background/
│   │   ├── background.js
│   │   ├── risk-engine.js
│   │   └── risk-replay.js
│   ├── content/
│   │   └── content.js
│   ├── dashboard/
│   │   ├── dashboard.html
│   │   ├── dashboard.js
│   │   ├── dashboard-detail.css
│   │   └── risk-replay.css
│   ├── popup/
│   │   ├── popup.html
│   │   └── popup.js
│   ├── shared/
│   │   ├── style.css
│   │   ├── dark.css
│   │   └── brand.css
│   └── icons/
│       ├── icon.png
│       ├── icon16.png
│       ├── icon32.png
│       ├── icon48.png
│       └── icon128.png
├── .github/workflows/validate.yml
├── README.md
├── PRIVACY.md
├── SECURITY.md
├── CHANGELOG.md
├── LICENSE
```

## Versão

Versão atual: **1.6.0**

## Licença

Distribuído sob a licença MIT. Consulte [LICENSE](LICENSE).
