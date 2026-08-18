# Segurança

## Relato responsável

Relate vulnerabilidades de forma privada pelo recurso **Report a vulnerability** na aba **Security** deste repositório.

Não abra uma issue pública para vulnerabilidades. Inclua a versão, o navegador, os passos mínimos para reprodução e o impacto observado, sem anexar senhas, cookies, arquivos pessoais ou históricos reais.

## Modelo de segurança

Guardian Monitor usa Manifest V3, Content Security Policy restritiva e processamento local. Não usa código remoto, `eval`, `new Function`, WebSocket, telemetria ou analytics. Dados recebidos de páginas são tratados como não confiáveis, normalizados e limitados antes do armazenamento. A interface usa APIs DOM seguras e `textContent`.

O Guardian Risk Engine é heurístico. Uma pontuação elevada não confirma malware, invasão, roubo de credenciais ou comprometimento de sessão.

## Escopo

A extensão não substitui antivírus, proteção do sistema operacional, autenticação multifator nem investigação forense. A permissão opcional `management` é necessária apenas para a auditoria local de extensões.
