const MAX_EVENTS = 2000;
const MAX_FILES_PER_EVENT = 20;
const MAX_NAME_LENGTH = 180;
const MAX_TEXT_LENGTH = 240;
const MAX_NOTE_LENGTH = 500;
const ALLOWED_EVENT_TYPES = new Set(["file_selected", "form_submit"]);
const CREDENTIAL_EVENT_TYPES = new Set(["credential_form_risk", "credential_extension_risk"]);
const EXECUTABLE_EXTENSIONS = new Set(["exe", "msi", "msp", "msix", "msixbundle", "appx", "appxbundle", "com", "scr", "pif", "cpl", "jar", "apk", "dmg", "pkg", "deb", "rpm", "run", "bin"]);
const SCRIPT_EXTENSIONS = new Set(["bat", "cmd", "ps1", "psm1", "vbs", "vbe", "js", "jse", "wsf", "wsh", "hta", "reg", "lnk"]);
const ARCHIVE_EXTENSIONS = new Set(["zip", "rar", "7z", "iso", "img", "cab", "gz", "tgz", "bz2", "xz"]);
const DECEPTIVE_PREFIX_EXTENSIONS = new Set(["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "jpg", "jpeg", "png", "gif", "txt", "csv"]);
const HIGH_DANGER_TYPES = new Set(["url", "content", "host", "unwanted", "deepScannedOpenedDangerous", "accountCompromise", "sensitiveContentBlock", "blockedScanFailed"]);
const MEDIUM_DANGER_TYPES = new Set(["file", "uncommon", "accepted", "passwordProtected", "deepScannedFailed", "sensitiveContentWarning", "blockedTooLarge", "promptForScanning", "promptForLocalPasswordScanning"]);
const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
const CREDENTIAL_PERMISSIONS = new Set(["cookies", "webRequest", "webRequestBlocking", "debugger", "nativeMessaging", "scripting", "clipboardRead"]);
const RISKY_PERMISSIONS = new Set([
  "cookies",
  "history",
  "downloads",
  "management",
  "nativeMessaging",
  "debugger",
  "proxy",
  "privacy",
  "clipboardRead",
  "clipboardWrite",
  "geolocation",
  "webRequest",
  "webRequestBlocking",
  "browsingData",
  "bookmarks",
  "topSites",
  "scripting"
]);
const DEFAULT_SETTINGS = Object.freeze({
  alerts: true,
  securityAlerts: true,
  credentialAlerts: true,
  language: "pt-BR",
  trustedDomains: [],
  sensitiveExtensions: ["pdf", "doc", "docx", "xls", "xlsx", "csv", "txt", "key", "pem", "p12", "pfx", "json", "env", "sql", "zip", "rar", "7z"]
});
let eventWriteQueue = Promise.resolve();

function cleanText(value, maxLength = MAX_TEXT_LENGTH) {
  return String(value ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, maxLength);
}

function cleanExtension(value) {
  return cleanText(value, 16).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function safeNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.min(Math.floor(number), Number.MAX_SAFE_INTEGER);
}

function normalizeDomainFromUrl(value) {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol === "file:") return "arquivo-local";
    return cleanText(url.hostname.toLowerCase(), 253) || "desconhecido";
  } catch {
    return "desconhecido";
  }
}

function normalizeOrigin(value) {
  try {
    const url = new URL(String(value || ""));
    if (!new Set(["http:", "https:"]).has(url.protocol)) return "";
    return cleanText(url.origin, MAX_TEXT_LENGTH);
  } catch {
    return "";
  }
}

function normalizeTrustedDomain(value) {
  const raw = cleanText(value, 300).toLowerCase();
  if (!raw) return "";
  try {
    const candidate = raw.includes("://") ? raw : `https://${raw}`;
    const hostname = new URL(candidate).hostname.toLowerCase();
    return cleanText(hostname, 253);
  } catch {
    return "";
  }
}

function normalizeSettings(input) {
  const source = input && typeof input === "object" ? input : {};
  const trustedDomains = Array.isArray(source.trustedDomains)
    ? [...new Set(source.trustedDomains.map(normalizeTrustedDomain).filter(Boolean))].slice(0, 200)
    : [];
  const sensitiveExtensions = Array.isArray(source.sensitiveExtensions)
    ? [...new Set(source.sensitiveExtensions.map(cleanExtension).filter(Boolean))].slice(0, 100)
    : DEFAULT_SETTINGS.sensitiveExtensions;
  return {
    alerts: source.alerts !== false,
    securityAlerts: source.securityAlerts !== false,
    credentialAlerts: source.credentialAlerts !== false,
    language: ["pt-BR", "en", "es"].includes(source.language) ? source.language : "pt-BR",
    trustedDomains,
    sensitiveExtensions: sensitiveExtensions.length ? sensitiveExtensions : DEFAULT_SETTINGS.sensitiveExtensions
  };
}

async function getSettings() {
  const { settings } = await chrome.storage.local.get("settings");
  return normalizeSettings({ ...DEFAULT_SETTINGS, ...(settings || {}) });
}

function sanitizeFile(file) {
  if (!file || typeof file !== "object") return null;
  const name = cleanText(file.name, MAX_NAME_LENGTH);
  if (!name) return null;
  return {
    name,
    size: safeNumber(file.size),
    type: cleanText(file.type, 120),
    extension: cleanExtension(file.extension),
    lastModified: safeNumber(file.lastModified) || null
  };
}

function sanitizePageEvent(rawEvent, senderUrl) {
  if (!rawEvent || typeof rawEvent !== "object") return null;
  if (!ALLOWED_EVENT_TYPES.has(rawEvent.type)) return null;
  const files = Array.isArray(rawEvent.files)
    ? rawEvent.files.slice(0, MAX_FILES_PER_EVENT).map(sanitizeFile).filter(Boolean)
    : [];
  if (!files.length) return null;
  const event = {
    type: rawEvent.type,
    domain: normalizeDomainFromUrl(senderUrl),
    files,
    frame: rawEvent.frame === "iframe" ? "iframe" : "top"
  };
  const actionOrigin = normalizeOrigin(rawEvent.formAction);
  if (actionOrigin) event.formActionOrigin = actionOrigin;
  if (rawEvent.type === "file_selected") {
    const fieldName = cleanText(rawEvent.fieldName, 80);
    if (fieldName) event.fieldName = fieldName;
  }
  if (rawEvent.type === "form_submit") {
    const method = cleanText(rawEvent.method, 10).toUpperCase();
    event.method = ALLOWED_METHODS.has(method) ? method : "OTHER";
  }
  return event;
}

function sanitizeStoredEvent(event) {
  const safe = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    type: cleanText(event.type, 80),
    severity: ["info", "medium", "high"].includes(event.severity) ? event.severity : undefined,
    domain: event.domain ? cleanText(event.domain, 253) : undefined,
    frame: event.frame === "iframe" ? "iframe" : event.frame === "top" ? "top" : undefined,
    formActionOrigin: event.formActionOrigin ? cleanText(event.formActionOrigin, MAX_TEXT_LENGTH) : undefined,
    fieldName: event.fieldName ? cleanText(event.fieldName, 80) : undefined,
    method: event.method ? cleanText(event.method, 10) : undefined,
    note: event.note ? cleanText(event.note, MAX_NOTE_LENGTH) : undefined,
    downloadId: Number.isInteger(event.downloadId) && event.downloadId >= 0 ? event.downloadId : undefined,
    danger: event.danger ? cleanText(event.danger, 80) : undefined,
    downloadState: event.downloadState ? cleanText(event.downloadState, 40) : undefined,
    riskScore: Number.isFinite(Number(event.riskScore)) ? Math.max(0, Math.min(100, Math.floor(Number(event.riskScore)))) : undefined,
    riskLevel: ["low", "medium", "high"].includes(event.riskLevel) ? event.riskLevel : undefined,
    riskReasons: Array.isArray(event.riskReasons) ? event.riskReasons.map(item => cleanText(item, 160)).filter(Boolean).slice(0, 12) : undefined,
    targetDomain: event.targetDomain ? cleanText(event.targetDomain, 253) : undefined,
    pageProtocol: ["http", "https", "other"].includes(event.pageProtocol) ? event.pageProtocol : undefined,
    passwordFieldCount: Number.isInteger(event.passwordFieldCount) ? Math.max(0, Math.min(10, event.passwordFieldCount)) : undefined,
    usernamePresent: typeof event.usernamePresent === "boolean" ? event.usernamePresent : undefined
  };
  if (Array.isArray(event.files)) safe.files = event.files.slice(0, MAX_FILES_PER_EVENT).map(sanitizeFile).filter(Boolean);
  if (event.extension && typeof event.extension === "object") safe.extension = sanitizeExtensionSnapshot(event.extension);
  return Object.fromEntries(Object.entries(safe).filter(([, value]) => value !== undefined));
}

function saveEvent(event) {
  const safeEvent = sanitizeStoredEvent(event);
  eventWriteQueue = eventWriteQueue.catch(() => {}).then(async () => {
    const result = await chrome.storage.local.get("events");
    const events = Array.isArray(result.events) ? result.events : [];
    events.unshift(safeEvent);
    if (events.length > MAX_EVENTS) events.length = MAX_EVENTS;
    await chrome.storage.local.set({ events });
  });
  return eventWriteQueue;
}

async function notify(title, message) {
  const settings = await getSettings();
  if (!settings.alerts) return;
  try {
    await chrome.notifications.create({
      type: "basic",
      iconUrl: "icon128.png",
      title: cleanText(title, 80),
      message: cleanText(message, 240),
      priority: 2
    });
  } catch {}
}

async function maybeAlert(event) {
  const settings = await getSettings();
  if (!settings.alerts || !ALLOWED_EVENT_TYPES.has(event.type)) return;
  const domain = event.domain || "desconhecido";
  const trusted = settings.trustedDomains.some(item => domain === item || domain.endsWith(`.${item}`));
  const sensitive = (event.files || []).some(file => settings.sensitiveExtensions.includes(cleanExtension(file.extension)));
  if (trusted && !sensitive) return;
  const titles={"pt-BR":["Guardian Monitor: arquivo potencialmente sensível","Guardian Monitor: arquivo em site não confiável"],en:["Guardian Monitor: potentially sensitive file","Guardian Monitor: file on untrusted site"],es:["Guardian Monitor: archivo potencialmente sensible","Guardian Monitor: archivo en sitio no confiable"]};
  const pair=titles[settings.language]||titles["pt-BR"];
  const title=sensitive?pair[0]:pair[1];
  const names = (event.files || []).slice(0, 3).map(file => cleanText(file.name, 60)).join(", ") || "arquivo";
  await notify(title, `${names} — ${domain}`);
}

function sameSiteHost(a, b) {
  const left = cleanText(a, 253).toLowerCase();
  const right = cleanText(b, 253).toLowerCase();
  if (!left || !right) return false;
  return left === right || left.endsWith(`.${right}`) || right.endsWith(`.${left}`);
}

function isIpHost(host) {
  const value = cleanText(host, 253);
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(value) || value.includes(":");
}

function assessCredentialForm(rawEvent, senderUrl) {
  if (!rawEvent || typeof rawEvent !== "object") return null;
  const sourceDomain = normalizeDomainFromUrl(senderUrl);
  const actionOrigin = normalizeOrigin(rawEvent.formAction);
  let targetDomain = sourceDomain;
  let actionProtocol = "";
  try {
    if (actionOrigin) {
      const action = new URL(actionOrigin);
      targetDomain = cleanText(action.hostname.toLowerCase(), 253) || sourceDomain;
      actionProtocol = action.protocol;
    }
  } catch {}
  const pageProtocol = ["http", "https"].includes(rawEvent.pageProtocol) ? rawEvent.pageProtocol : "other";
  const passwordFieldCount = Math.max(1, Math.min(10, Number(rawEvent.passwordFieldCount) || 1));
  const usernamePresent = Boolean(rawEvent.usernamePresent);
  const frame = rawEvent.frame === "iframe" ? "iframe" : "top";
  const reasons = [];
  let score = 0;
  if (pageProtocol === "http") { score += 80; reasons.push("A página de login usa HTTP sem criptografia"); }
  if (actionProtocol === "http:") { score += 90; reasons.push("O formulário de senha envia dados por HTTP sem criptografia"); }
  if (actionOrigin && !sameSiteHost(sourceDomain, targetDomain)) { score += 30; reasons.push(`O formulário envia para um domínio diferente: ${targetDomain}`); }
  if (!actionOrigin) { score += 10; reasons.push("Não foi possível validar o destino do formulário"); }
  if (frame === "iframe") { score += 15; reasons.push("O formulário de senha está dentro de um iframe"); }
  if (targetDomain.startsWith("xn--") || targetDomain.includes(".xn--")) { score += 20; reasons.push("O destino usa domínio internacionalizado em punycode"); }
  if (isIpHost(targetDomain)) { score += 25; reasons.push("O destino do login usa um endereço IP em vez de domínio"); }
  score = Math.min(100, score);
  if (score < 25) return null;
  return {
    type: "credential_form_risk",
    severity: score >= 60 ? "high" : "medium",
    domain: sourceDomain,
    targetDomain,
    frame,
    formActionOrigin: actionOrigin || undefined,
    method: ALLOWED_METHODS.has(cleanText(rawEvent.method, 10).toUpperCase()) ? cleanText(rawEvent.method, 10).toUpperCase() : "OTHER",
    pageProtocol,
    passwordFieldCount,
    usernamePresent,
    riskScore: score,
    riskLevel: score >= 60 ? "high" : "medium",
    riskReasons: reasons,
    note: "Possível risco no envio de credenciais. Nenhuma senha foi lida ou armazenada."
  };
}

async function maybeAlertCredential(event) {
  const settings = await getSettings();
  if (!settings.alerts || !settings.credentialAlerts) return;
  const levels={"pt-BR":event.severity === "high" ? "ALTO" : "MODERADO",en:event.severity === "high" ? "HIGH" : "MODERATE",es:event.severity === "high" ? "ALTO" : "MODERADO"};
  const level=levels[settings.language]||levels["pt-BR"];
  const detail = event.riskReasons?.[0] || event.note || "atividade de credencial que merece revisão";
  const credentialTitles={"pt-BR":`Guardian Monitor: risco ${level} para credenciais`,en:`Guardian Monitor: ${level} credential risk`,es:`Guardian Monitor: riesgo ${level} de credenciales`};
  await notify(credentialTitles[settings.language]||credentialTitles["pt-BR"], `${event.domain || "site"}: ${cleanText(detail, 150)}`);
}

function sanitizePermissionList(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map(item => cleanText(item, 200)).filter(Boolean))].sort().slice(0, 300);
}

function sanitizeExtensionSnapshot(ext) {
  const source = ext && typeof ext === "object" ? ext : {};
  return {
    id: cleanText(source.id, 64),
    name: cleanText(source.name || source.id || "Extensão", 160),
    version: cleanText(source.version, 40),
    enabled: Boolean(source.enabled),
    type: cleanText(source.type || "extension", 40),
    installType: cleanText(source.installType || "normal", 40),
    permissions: sanitizePermissionList(source.permissions),
    hostPermissions: sanitizePermissionList(source.hostPermissions)
  };
}

function extensionRisk(ext) {
  const riskyPermissions = (ext.permissions || []).filter(permission => RISKY_PERMISSIONS.has(permission));
  const broadHosts = (ext.hostPermissions || []).filter(host => host === "<all_urls>" || host.includes("*://*/*") || host.includes("http://*/*") || host.includes("https://*/*"));
  const credentialPermissions = (ext.permissions || []).filter(permission => CREDENTIAL_PERMISSIONS.has(permission));
  let score = riskyPermissions.length + broadHosts.length * 2;
  if (ext.installType && !["normal", "development"].includes(ext.installType)) score += 1;
  let credentialScore = 0;
  if (credentialPermissions.includes("debugger")) credentialScore += 5;
  if (credentialPermissions.includes("nativeMessaging")) credentialScore += 3;
  if (credentialPermissions.includes("cookies")) credentialScore += 3;
  if (credentialPermissions.includes("webRequest") || credentialPermissions.includes("webRequestBlocking")) credentialScore += 2;
  if (credentialPermissions.includes("scripting")) credentialScore += 2;
  if (credentialPermissions.includes("clipboardRead")) credentialScore += 1;
  if (broadHosts.length && credentialPermissions.length) credentialScore += 3;
  return { score, riskyPermissions, broadHosts, credentialPermissions, credentialScore };
}

async function hasManagementPermission() {
  return chrome.permissions.contains({ permissions: ["management"] });
}

async function getExtensions() {
  if (!(await hasManagementPermission())) return [];
  const all = await chrome.management.getAll();
  return all.filter(ext => ext.id !== chrome.runtime.id).map(sanitizeExtensionSnapshot);
}

async function recordSecurityEvent(type, ext, note, severity = "info") {
  await saveEvent({ type, severity, extension: ext, note });
}

async function securityAlert(title, ext, detail) {
  const settings = await getSettings();
  if (!settings.securityAlerts) return;
  const high=title.includes("mudança de segurança");
  const titles={"pt-BR":high?"Guardian Monitor: mudança de segurança":"Guardian Monitor: extensão alterada",en:high?"Guardian Monitor: security change":"Guardian Monitor: extension changed",es:high?"Guardian Monitor: cambio de seguridad":"Guardian Monitor: extensión modificada"};
  await notify(titles[settings.language]||titles["pt-BR"], `${cleanText(ext?.name || "Extensão", 80)}: ${cleanText(detail, 150)}`);
}

async function initializeBaseline(silent = true) {
  if (!(await hasManagementPermission())) return [];
  const extensions = await getExtensions();
  const baseline = Object.fromEntries(extensions.filter(ext => ext.id).map(ext => [ext.id, ext]));
  await chrome.storage.local.set({ extensionBaseline: baseline, lastSecurityAudit: Date.now() });
  if (!silent) await saveEvent({ type: "security_audit", severity: "info", note: `Auditoria concluída: ${extensions.length} extensões verificadas.` });
  return extensions;
}

function arrayDiff(current = [], previous = []) {
  return current.filter(item => !previous.includes(item));
}

async function auditExtensions({ alertChanges = true, recordAudit = true } = {}) {
  if (!(await hasManagementPermission())) return { current: [], findings: [], permissionRequired: true };
  const { extensionBaseline = null } = await chrome.storage.local.get("extensionBaseline");
  const current = await getExtensions();
  const currentMap = Object.fromEntries(current.filter(ext => ext.id).map(ext => [ext.id, ext]));
  if (!extensionBaseline || typeof extensionBaseline !== "object") {
    await chrome.storage.local.set({ extensionBaseline: currentMap, lastSecurityAudit: Date.now() });
    if (recordAudit) await saveEvent({ type: "security_audit", severity: "info", note: `Linha de base criada com ${current.length} extensões.` });
    return { current, findings: [] };
  }
  const findings = [];
  for (const ext of current) {
    const old = extensionBaseline[ext.id];
    const risk = extensionRisk(ext);
    if (!old) {
      const severity = risk.score >= 3 ? "high" : risk.score >= 1 ? "medium" : "info";
      const permissions = [...risk.riskyPermissions, ...risk.broadHosts].slice(0, 12).join(", ");
      const credentialDetail = risk.credentialScore >= 5 ? `; possível exposição de sessão/credenciais: ${risk.credentialPermissions.join(", ")}` : "";
      findings.push({ type: risk.credentialScore >= 5 ? "credential_extension_risk" : "extension_new", ext, severity: risk.credentialScore >= 5 ? "high" : severity, detail: `${permissions ? `nova extensão; permissões de atenção: ${permissions}` : "nova extensão instalada"}${credentialDetail}` });
      continue;
    }
    const newPermissions = arrayDiff(ext.permissions, old.permissions);
    const newHosts = arrayDiff(ext.hostPermissions, old.hostPermissions);
    if (newPermissions.length || newHosts.length) {
      const sensitiveAdded = newPermissions.filter(permission => RISKY_PERMISSIONS.has(permission));
      const broadAdded = newHosts.filter(host => host === "<all_urls>" || host.includes("*://*/*") || host.includes("http://*/*") || host.includes("https://*/*"));
      const severity = sensitiveAdded.length || broadAdded.length ? "high" : "medium";
      const changed = [...newPermissions, ...newHosts].slice(0, 16).join(", ");
      const currentRisk = extensionRisk(ext);
      const credentialAdded = newPermissions.filter(permission => CREDENTIAL_PERMISSIONS.has(permission));
      const credentialConcern = currentRisk.credentialScore >= 5 && (credentialAdded.length || broadAdded.length);
      findings.push({ type: credentialConcern ? "credential_extension_risk" : "extension_permissions_changed", ext, severity: credentialConcern ? "high" : severity, detail: `${credentialConcern ? "mudança com possível impacto em sessão/credenciais; " : ""}novas permissões: ${changed}` });
    }
    if (!old.enabled && ext.enabled) findings.push({ type: "extension_enabled", ext, severity: risk.score >= 2 ? "medium" : "info", detail: "extensão foi ativada" });
    if (old.version !== ext.version) findings.push({ type: "extension_updated", ext, severity: "info", detail: `atualizada de ${cleanText(old.version || "?", 40)} para ${cleanText(ext.version || "?", 40)}` });
  }
  for (const [id, old] of Object.entries(extensionBaseline)) {
    if (!currentMap[id]) findings.push({ type: "extension_removed", ext: sanitizeExtensionSnapshot(old), severity: "info", detail: "extensão removida" });
  }
  for (const finding of findings) {
    await recordSecurityEvent(finding.type, finding.ext, finding.detail, finding.severity);
    if (alertChanges && ["medium", "high"].includes(finding.severity)) {
      const title = finding.severity === "high" ? "Guardian Monitor: mudança de segurança" : "Guardian Monitor: extensão alterada";
      await securityAlert(title, finding.ext, finding.detail);
    }
  }
  await chrome.storage.local.set({ extensionBaseline: currentMap, lastSecurityAudit: Date.now() });
  if (recordAudit) {
    const severity = findings.some(item => item.severity === "high") ? "high" : findings.some(item => item.severity === "medium") ? "medium" : "info";
    const note = findings.length ? `Auditoria concluída: ${findings.length} mudança(s) encontrada(s).` : `Auditoria concluída: nenhuma mudança detectada em ${current.length} extensões.`;
    await saveEvent({ type: "security_audit", severity, note });
  }
  return { current, findings };
}


function filenameParts(name) {
  return cleanText(name, MAX_NAME_LENGTH).toLowerCase().split(".").filter(Boolean);
}

function detectDoubleExtension(name) {
  const parts = filenameParts(name);
  if (parts.length < 3) return false;
  const finalExt = cleanExtension(parts.at(-1));
  const previousExt = cleanExtension(parts.at(-2));
  return DECEPTIVE_PREFIX_EXTENSIONS.has(previousExt) && (EXECUTABLE_EXTENSIONS.has(finalExt) || SCRIPT_EXTENSIONS.has(finalExt));
}

function assessDownload(item) {
  const filename = cleanText(item.filename || "download", 400);
  const name = cleanText(filename.split(/[\\/]/).pop() || "download", MAX_NAME_LENGTH);
  const parts = name.split(".");
  const extension = parts.length > 1 ? cleanExtension(parts.at(-1)) : "";
  const danger = cleanText(item.danger || "", 80);
  const reasons = [];
  let score = 0;
  if (HIGH_DANGER_TYPES.has(danger)) { score += 80; reasons.push(`Chromium classificou o download como ${danger}`); }
  else if (MEDIUM_DANGER_TYPES.has(danger)) { score += 45; reasons.push(`Chromium sinalizou o download como ${danger}`); }
  else if (["asyncScanning", "asyncLocalPasswordScanning"].includes(danger)) { score += 15; reasons.push("O Chromium ainda está analisando o download"); }
  else if (["deepScannedSafe", "safe", "allowlistedByPolicy"].includes(danger)) reasons.push("Nenhum perigo conhecido foi indicado pelo Chromium");
  if (EXECUTABLE_EXTENSIONS.has(extension)) { score += 25; reasons.push(`Arquivo executável .${extension}`); }
  if (SCRIPT_EXTENSIONS.has(extension)) { score += 30; reasons.push(`Arquivo de script/comando .${extension}`); }
  if (ARCHIVE_EXTENSIONS.has(extension)) { score += 8; reasons.push(`Arquivo compactado ou imagem de disco .${extension}`); }
  if (detectDoubleExtension(name)) { score += 45; reasons.push("Nome usa dupla extensão potencialmente enganosa"); }
  const domain = normalizeDomainFromUrl(item.finalUrl || item.url);
  try {
    const u = new URL(String(item.finalUrl || item.url || ""));
    if (u.protocol === "http:") { score += 10; reasons.push("Download originado por conexão HTTP sem criptografia"); }
  } catch {}
  const mime = cleanText(item.mime || "", 120).toLowerCase();
  if ((EXECUTABLE_EXTENSIONS.has(extension) || SCRIPT_EXTENSIONS.has(extension)) && (mime.startsWith("text/") || mime.includes("pdf") || mime.startsWith("image/"))) {
    score += 20;
    reasons.push("Tipo MIME não combina com a extensão executável/script");
  }
  score = Math.min(100, score);
  const riskLevel = score >= 60 ? "high" : score >= 25 ? "medium" : "low";
  return {
    type: "download_scan",
    severity: riskLevel === "high" ? "high" : riskLevel === "medium" ? "medium" : "info",
    downloadId: Number.isInteger(item.id) ? item.id : undefined,
    domain,
    files: [{ name, size: item.fileSize || item.totalBytes || 0, type: item.mime || "", extension }],
    danger: danger || "unknown",
    downloadState: cleanText(item.state || "in_progress", 40),
    riskScore: score,
    riskLevel,
    riskReasons: reasons.length ? reasons : ["Nenhum sinal de risco relevante foi detectado pelos metadados"],
    note: `Scanner de download: risco ${riskLevel === "high" ? "alto" : riskLevel === "medium" ? "moderado" : "baixo"}`
  };
}

function upsertDownloadScan(event) {
  const safeEvent = sanitizeStoredEvent(event);
  eventWriteQueue = eventWriteQueue.catch(() => {}).then(async () => {
    const result = await chrome.storage.local.get("events");
    const events = Array.isArray(result.events) ? result.events : [];
    const index = events.findIndex(item => item.type === "download_scan" && item.downloadId === safeEvent.downloadId);
    if (index >= 0) safeEvent.id = events[index].id || safeEvent.id;
    if (index >= 0) events[index] = safeEvent;
    else events.unshift(safeEvent);
    if (events.length > MAX_EVENTS) events.length = MAX_EVENTS;
    await chrome.storage.local.set({ events });
  });
  return eventWriteQueue;
}

async function maybeAlertDownload(event) {
  const settings = await getSettings();
  if (!settings.alerts || !["medium", "high"].includes(event.riskLevel)) return;
  const file = event.files?.[0]?.name || "download";
  const levels={"pt-BR":event.riskLevel === "high" ? "ALTO" : "MODERADO",en:event.riskLevel === "high" ? "HIGH" : "MODERATE",es:event.riskLevel === "high" ? "ALTO" : "MODERADO"};
  const level=levels[settings.language]||levels["pt-BR"];
  const downloadTitles={"pt-BR":`Guardian Monitor: risco ${level} no download`,en:`Guardian Monitor: ${level} download risk`,es:`Guardian Monitor: riesgo ${level} en la descarga`};
  await notify(downloadTitles[settings.language]||downloadTitles["pt-BR"], `${cleanText(file, 80)} — ${event.domain || "origem desconhecida"}`);
}

async function refreshDownloadScan(downloadId) {
  if (!Number.isInteger(downloadId)) return;
  const items = await chrome.downloads.search({ id: downloadId });
  const item = items?.[0];
  if (!item) return;
  const event = assessDownload(item);
  await upsertDownloadScan(event);
  await maybeAlertDownload(event);
}

async function restrictStorageAccess() {
  await chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !message || typeof message !== "object") return false;
  if (message.kind === "filewatch_event") {
    const event = sanitizePageEvent(message.event, sender.url);
    if (!event) {
      sendResponse({ ok: false, error: "Evento inválido" });
      return false;
    }
    saveEvent(event)
      .then(() => maybeAlert(event))
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: false, error: "Falha ao registrar evento" }));
    return true;
  }
  if (message.kind === "credential_form_event") {
    const event = assessCredentialForm(message.event, sender.url);
    if (!event) {
      sendResponse({ ok: true, recorded: false });
      return false;
    }
    saveEvent(event)
      .then(() => maybeAlertCredential(event))
      .then(() => sendResponse({ ok: true, recorded: true }))
      .catch(() => sendResponse({ ok: false, error: "Falha ao registrar risco de credencial" }));
    return true;
  }
  if (message.kind === "run_security_audit") {
    auditExtensions({ alertChanges: true, recordAudit: true })
      .then(result => sendResponse({ ok: true, current: result.current, findings: result.findings, permissionRequired: Boolean(result.permissionRequired) }))
      .catch(() => sendResponse({ ok: false, error: "Falha na auditoria" }));
    return true;
  }
  if (message.kind === "get_extensions") {
    hasManagementPermission()
      .then(async auditEnabled => {
        const extensions = auditEnabled ? await getExtensions() : [];
        sendResponse({ ok: true, auditEnabled, extensions: extensions.map(ext => ({ ...ext, risk: extensionRisk(ext) })) });
      })
      .catch(() => sendResponse({ ok: false, error: "Falha ao consultar extensões" }));
    return true;
  }
  return false;
});

chrome.downloads.onCreated.addListener(async item => {
  const event = assessDownload(item);
  await upsertDownloadScan(event);
  await maybeAlertDownload(event);
});

chrome.downloads.onChanged.addListener(delta => {
  if (!delta || !Number.isInteger(delta.id)) return;
  if (!delta.danger && !delta.state && !delta.filename && !delta.finalUrl && !delta.mime && !delta.fileSize && !delta.totalBytes) return;
  refreshDownloadScan(delta.id).catch(() => {});
});

let managementListenersRegistered = false;

async function registerManagementListeners() {
  if (managementListenersRegistered || !(await hasManagementPermission())) return;
  managementListenersRegistered = true;
  chrome.management.onInstalled.addListener(async ext => {
    if (ext.id !== chrome.runtime.id) await auditExtensions({ alertChanges: true, recordAudit: false });
  });
  chrome.management.onEnabled.addListener(async ext => {
    if (ext.id !== chrome.runtime.id) await auditExtensions({ alertChanges: true, recordAudit: false });
  });
  chrome.management.onDisabled.addListener(async ext => {
    if (ext.id === chrome.runtime.id) return;
    await recordSecurityEvent("extension_disabled", sanitizeExtensionSnapshot(ext), "extensão foi desativada", "info");
    await auditExtensions({ alertChanges: false, recordAudit: false });
  });
  chrome.management.onUninstalled.addListener(async id => {
    const { extensionBaseline = {} } = await chrome.storage.local.get("extensionBaseline");
    const old = extensionBaseline[id];
    if (old) await recordSecurityEvent("extension_removed", sanitizeExtensionSnapshot(old), "extensão removida", "info");
    await auditExtensions({ alertChanges: false, recordAudit: false });
  });
}

chrome.runtime.onInstalled.addListener(async details => {
  await restrictStorageAccess();
  const current = await chrome.storage.local.get(["settings", "events", "extensionBaseline"]);
  await chrome.storage.local.set({ settings: normalizeSettings({ ...DEFAULT_SETTINGS, ...(current.settings || {}) }) });
  if (!Array.isArray(current.events)) await chrome.storage.local.set({ events: [] });
  if (await hasManagementPermission()) {
    await registerManagementListeners();
    if (!current.extensionBaseline) await initializeBaseline(true);
    else if (details.reason === "update") await auditExtensions({ alertChanges: true, recordAudit: true });
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await restrictStorageAccess();
  if (await hasManagementPermission()) {
    await registerManagementListeners();
    await auditExtensions({ alertChanges: true, recordAudit: true });
  }
});

chrome.permissions.onAdded.addListener(async permissions => {
  if (permissions.permissions?.includes("management")) {
    await registerManagementListeners();
    await initializeBaseline(true);
  }
});

chrome.permissions.onRemoved.addListener(async permissions => {
  if (permissions.permissions?.includes("management")) await chrome.storage.local.remove(["extensionBaseline", "lastSecurityAudit"]);
});

restrictStorageAccess().catch(() => {});
registerManagementListeners().catch(() => {});
