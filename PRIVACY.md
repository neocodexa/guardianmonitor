# Política de Privacidade

## Visão geral

Guardian Monitor foi projetado para funcionar localmente no navegador. O projeto não possui backend, telemetria ou analytics e não envia o histórico monitorado para servidores do projeto.

## Dados observados

Ao selecionar arquivos para upload, a extensão pode registrar nome do arquivo, tamanho, tipo MIME informado pelo navegador, extensão, data de modificação informada pelo navegador, domínio da página, origem do formulário, método do formulário, contexto de frame e horário do evento.

Ao iniciar downloads, a extensão registra o nome final observado, tamanho, tipo MIME, extensão, domínio de origem, estado, indicador `danger` fornecido pelo Chromium e uma classificação de risco calculada localmente. A URL completa do download não é persistida. O conteúdo do arquivo não é lido e nenhum arquivo, hash ou histórico é enviado a serviço externo pelo scanner.

Na auditoria do navegador, após autorização explícita do usuário, a extensão consulta informações disponibilizadas pela API `chrome.management`, como nome, versão, estado, tipo de instalação e permissões das extensões instaladas. A permissão de gerenciamento é opcional.

## Dados que não são coletados

Guardian Monitor não foi projetado para ler senhas salvas, cookies, conteúdo dos arquivos, conteúdo de campos de texto, mensagens, histórico completo de navegação ou dados de outros aplicativos do computador.

## Armazenamento

Histórico, configurações e linha de base das extensões ficam em `chrome.storage.local`. O acesso ao armazenamento é configurado como `TRUSTED_CONTEXTS`, restringindo-o às páginas e ao service worker da própria extensão.

O histórico é limitado a 2.000 eventos.

## Compartilhamento

O projeto não possui mecanismo automático de envio ou compartilhamento do histórico. A exportação em JSON ou CSV acontece somente quando o usuário solicita pelo painel.

## Exclusão

O histórico pode ser apagado pelo botão **Apagar histórico** no painel. A remoção da extensão também remove os dados locais associados conforme o comportamento do navegador.
