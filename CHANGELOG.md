# Changelog

## 1.5.2 - 2026-08-18

- Substitui as iniciais `GM` pelo novo logo do Guardian Monitor no painel e no popup da extensão.
- Atualiza os ícones utilizados pelo navegador e adiciona a arte do logo em alta resolução.
- Adiciona manifesto e empacotamento específicos para Firefox, mantendo o pacote Chromium separado.
- Adapta background, armazenamento e notificações para as diferenças entre Firefox e Chromium.
- Organiza manifestos, scripts e pacotes distribuíveis em diretórios separados por navegador.
- Corrige os separadores de caminho internos dos ZIPs para compatibilidade com o validador da Mozilla.
- Adiciona acesso ao repositório do projeto no GitHub pelo painel e pelo popup da extensão.

## 1.5.1 - 2026-08-18

- Ajusta o histórico de atividade para exibir todas as colunas, incluindo o status, sem rolagem horizontal.
- Corrige o alinhamento do Guardian Risk Score para manter a pontuação junto de `/ 100`.

## Próxima versão

- Adiciona o Guardian Risk Engine com pontuações padronizadas de 0 a 100.
- Integra análise heurística de downloads, extensões e formulários de credenciais.
- Adiciona os níveis `low`, `guarded`, `medium`, `high` e `critical`.
- Adiciona a Central de Segurança e o Guardian Risk Score normalizado por recência e gravidade.
- Adiciona motivos estruturados e versão da engine aos eventos novos, mantendo compatibilidade com o histórico anterior.
- Integra o contexto da baseline à avaliação de extensões.
- Documenta limites, privacidade e caráter não conclusivo das pontuações.
