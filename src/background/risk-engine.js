(function (root) {
  "use strict";

  const VERSION = 1;
  const EXECUTABLES = new Set(["exe", "msi", "scr", "com", "bat", "cmd", "ps1", "vbs", "js", "jar", "dll"]);
  const ARCHIVES = new Set(["zip", "rar", "7z", "iso"]);
  const DECEPTIVE_PREFIXES = new Set(["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "jpg", "jpeg", "png", "gif", "txt", "csv"]);
  const ALLOWED_DANGER = new Set(["file", "url", "content", "host", "unwanted", "uncommon", "dangerous", "asyncScanning", "deepScannedFailed", "deepScannedSafe", "deepScannedOpenedDangerous", "accountCompromise", "sensitiveContentBlock", "blockedScanFailed", "safe", "allowlistedByPolicy", "unknown"]);
  const DANGER_SCORES = Object.freeze({ file: 35, url: 60, content: 60, host: 60, unwanted: 50, uncommon: 30, dangerous: 70, asyncScanning: 12, deepScannedFailed: 35, deepScannedSafe: -8, deepScannedOpenedDangerous: 70, accountCompromise: 70, sensitiveContentBlock: 60, blockedScanFailed: 45, safe: -8, allowlistedByPolicy: -8 });
  const PERMISSION_SCORES = Object.freeze({ cookies: 12, history: 8, webRequest: 8, webRequestBlocking: 12, scripting: 12, debugger: 35, nativeMessaging: 30, proxy: 20, clipboardRead: 10, clipboardWrite: 7, downloads: 6, management: 8, "<all_urls>": 12 });

  function text(value, limit) {
    return String(value ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, limit);
  }

  function list(value, limit = 300) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.slice(0, limit).map(item => text(item, 200)).filter(Boolean))];
  }

  function clamp(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : 0;
  }

  function levelForScore(score) {
    const value = clamp(score);
    if (value >= 80) return "critical";
    if (value >= 60) return "high";
    if (value >= 40) return "medium";
    if (value >= 20) return "guarded";
    return "low";
  }

  function result(reasons) {
    const safeReasons = reasons.slice(0, 20).map(reason => ({ id: text(reason.id, 64), score: Math.max(-100, Math.min(100, Math.round(Number(reason.score) || 0))), message: text(reason.message, 240) }));
    const score = clamp(safeReasons.reduce((sum, reason) => sum + reason.score, 0));
    return { score, level: levelForScore(score), reasons: safeReasons, riskEngineVersion: VERSION };
  }

  function reason(id, score, message) {
    return { id, score, message };
  }

  function extensionFromName(name) {
    const parts = text(name, 180).toLowerCase().split(".").filter(Boolean);
    return parts.length > 1 ? text(parts.at(-1), 16).replace(/[^a-z0-9]/g, "") : "";
  }

  function analyzeDownload(input) {
    const source = input && typeof input === "object" ? input : {};
    const name = text(source.name, 180) || "download";
    const extension = text(source.extension, 16).toLowerCase().replace(/[^a-z0-9]/g, "") || extensionFromName(name);
    const dangerValue = text(source.danger, 80);
    const danger = ALLOWED_DANGER.has(dangerValue) ? dangerValue : "unknown";
    const mime = text(source.mime, 120).toLowerCase();
    const protocol = ["http", "https", "other"].includes(source.protocol) ? source.protocol : "other";
    const parts = name.toLowerCase().split(".").filter(Boolean);
    const reasons = [];
    if (Object.hasOwn(DANGER_SCORES, danger)) reasons.push(reason(`chromium_${danger}`, DANGER_SCORES[danger], `Chromium informou o status ${danger}.`));
    if (EXECUTABLES.has(extension)) reasons.push(reason("executable_type", 15, `O tipo .${extension} pode executar código.`));
    if (ARCHIVES.has(extension)) reasons.push(reason("archive_type", 7, `O arquivo .${extension} pode conter outros arquivos.`));
    if (parts.length >= 3 && DECEPTIVE_PREFIXES.has(parts.at(-2)) && EXECUTABLES.has(extension)) reasons.push(reason("double_extension", 30, "Arquivo possui dupla extensão potencialmente enganosa."));
    if (protocol === "http") reasons.push(reason("unencrypted_http", 10, "Download originado por HTTP sem criptografia."));
    if (protocol === "https") reasons.push(reason("encrypted_https", -4, "Download originado por HTTPS."));
    if (EXECUTABLES.has(extension) && (mime.startsWith("text/") || mime.startsWith("image/") || mime.includes("pdf"))) reasons.push(reason("mime_mismatch", 20, "O tipo MIME não parece compatível com a extensão."));
    if (/\.(pdf|docx?|xlsx?|pptx?|jpe?g|png)[\s._-]*(exe|msi|scr|com|bat|cmd|ps1|vbs|js|jar|dll)$/i.test(name) || /\.(exe|scr|com)\s*\.(pdf|docx?|jpe?g|png)$/i.test(name)) reasons.push(reason("deceptive_name", 12, "O nome do arquivo pode induzir a uma interpretação incorreta."));
    return result(reasons);
  }

  function analyzeExtension(input, contextInput) {
    const source = input && typeof input === "object" ? input : {};
    const context = contextInput && typeof contextInput === "object" ? contextInput : {};
    const permissions = new Set([...list(source.permissions), ...list(source.hostPermissions)]);
    if ([...permissions].some(item => item === "*://*/*" || item === "http://*/*" || item === "https://*/*")) permissions.add("<all_urls>");
    const reasons = [];
    for (const [permission, score] of Object.entries(PERMISSION_SCORES)) if (permissions.has(permission)) reasons.push(reason(`permission_${permission.replace(/[^a-zA-Z]/g, "_")}`, score, `Permissão com capacidade relevante: ${permission}.`));
    if (permissions.has("cookies") && permissions.has("<all_urls>")) reasons.push(reason("combo_cookies_all_urls", 16, "Cookies combinados com acesso amplo a sites merecem revisão."));
    if (permissions.has("scripting") && permissions.has("<all_urls>")) reasons.push(reason("combo_scripting_all_urls", 18, "Scripts combinados com acesso amplo a sites elevam a capacidade."));
    if (permissions.has("cookies") && permissions.has("scripting") && permissions.has("<all_urls>")) reasons.push(reason("combo_credentials_pages", 14, "A combinação permite interação ampla com páginas e sessões."));
    if (permissions.has("proxy") && (permissions.has("webRequest") || permissions.has("webRequestBlocking"))) reasons.push(reason("combo_proxy_requests", 20, "Proxy combinado com observação de requisições merece revisão."));
    if (context.isNew) reasons.push(reason("context_new", 15, "A extensão é nova em relação à linha de base."));
    if (list(context.newPermissions, 100).length) reasons.push(reason("context_new_permissions", 14, "A extensão recebeu novas permissões."));
    if (context.recentlyEnabled) reasons.push(reason("context_enabled", 7, "A extensão foi ativada recentemente."));
    if (context.versionChanged) reasons.push(reason("context_version_changed", 5, "A versão da extensão mudou."));
    if (context.baselineKnown && !context.isNew && !list(context.newPermissions, 100).length && !context.recentlyEnabled && !context.versionChanged) reasons.push(reason("context_stable_baseline", -12, "A extensão é conhecida e está inalterada na linha de base local."));
    const assessed = result(reasons);
    return { ...assessed, assessment: assessed.score >= 60 ? "elevated_capability" : assessed.score >= 20 ? "review_recommended" : "low_risk" };
  }

  function analyzeCredential(input) {
    const source = input && typeof input === "object" ? input : {};
    const pageProtocol = ["http", "https", "other"].includes(source.pageProtocol) ? source.pageProtocol : "other";
    const actionProtocol = ["http", "https", "other", ""].includes(source.actionProtocol) ? source.actionProtocol : "";
    const pageDomain = text(source.pageDomain, 253).toLowerCase();
    const targetDomain = text(source.targetDomain, 253).toLowerCase();
    const reasons = [];
    if (pageProtocol === "http") reasons.push(reason("page_http", 35, "A página com senha usa HTTP sem criptografia."));
    if (actionProtocol === "http") reasons.push(reason("action_http", 45, "O formulário envia por HTTP sem criptografia."));
    if (source.crossDomain) reasons.push(reason("cross_domain_action", 25, `O destino difere do domínio da página: ${targetDomain || "desconhecido"}.`));
    if (source.ipTarget) reasons.push(reason("ip_target", 20, "O formulário aponta para um endereço IP."));
    if (source.punycode) reasons.push(reason("punycode_domain", 18, "O destino usa um domínio internacionalizado em punycode."));
    if (source.inIframe) reasons.push(reason("iframe_form", 12, "O formulário com senha está dentro de um iframe."));
    if (!targetDomain) reasons.push(reason("unknown_target", 8, "Não foi possível validar o domínio de destino."));
    if (reasons.filter(item => item.score > 0).length >= 3) reasons.push(reason("multiple_credential_signals", 12, "Vários sinais de exposição potencial foram observados juntos."));
    return result(reasons);
  }

  function overallScore(eventsInput, nowInput) {
    const events = Array.isArray(eventsInput) ? eventsInput.slice(0, 2000) : [];
    const now = Number.isFinite(Number(nowInput)) ? Number(nowInput) : Date.now();
    const buckets = { download: [], extension: [], credential: [], other: [] };
    for (const event of events) {
      if (!event || typeof event !== "object") continue;
      const score = clamp(event.riskScore);
      if (!score) continue;
      const age = Math.max(0, now - Number(event.timestamp || 0));
      const recency = age <= 86400000 ? 1 : age <= 604800000 ? 0.6 : 0.25;
      const severity = event.riskLevel === "critical" ? 1.25 : event.riskLevel === "high" ? 1.1 : event.riskLevel === "medium" ? 0.9 : event.riskLevel === "guarded" ? 0.7 : 0.45;
      const value = score * recency * severity;
      const bucket = event.type === "download_scan" ? "download" : event.type === "credential_form_risk" ? "credential" : String(event.type || "").startsWith("extension_") || event.type === "credential_extension_risk" ? "extension" : "other";
      buckets[bucket].push(value);
    }
    const categoryScores = Object.values(buckets).map(values => {
      values.sort((a, b) => b - a);
      return values.slice(0, 10).reduce((sum, value, index) => sum + value * Math.pow(0.55, index), 0);
    });
    const score = clamp(100 * (1 - Math.exp(-categoryScores.reduce((sum, value) => sum + value, 0) / 115)));
    return { score, level: levelForScore(score) };
  }

  root.GuardianRiskEngine = Object.freeze({ VERSION, levelForScore, analyzeDownload, analyzeExtension, analyzeCredential, overallScore });
})(typeof globalThis === "object" ? globalThis : this);
