if (typeof importScripts === "function") importScripts("risk-engine.js");

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
  theme: "light",
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
    theme: ["light", "dark"].includes(source.theme) ? source.theme : "light",
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
    severity: ["info", "guarded", "medium", "high", "critical"].includes(event.severity) ? event.severity : undefined,
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
    riskLevel: ["low", "guarded", "medium", "high", "critical"].includes(event.riskLevel) ? event.riskLevel : undefined,
    riskEngineVersion: Number.isInteger(event.riskEngineVersion) && event.riskEngineVersion > 0 ? Math.min(event.riskEngineVersion, 999) : undefined,
    riskReasons: Array.isArray(event.riskReasons) ? event.riskReasons.slice(0, 20).map(item => {
      if (typeof item === "string") return cleanText(item, 240);
      if (!item || typeof item !== "object") return null;
      return { id: cleanText(item.id, 64), score: Math.max(-100, Math.min(100, Math.round(Number(item.score) || 0))), message: cleanText(item.message, 240) };
    }).filter(Boolean) : undefined,
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
    const options = {
      type: "basic",
      iconUrl: "src/icons/icon128.png",
      title: cleanText(title, 80),
      message: cleanText(message, 240)
    };
    if (typeof browser === "undefined") options.priority = 2;
    await chrome.notifications.create(options);
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
  let targetDomain = "";
  let actionProtocol = "";
  try {
    if (actionOrigin) {
      const action = new URL(actionOrigin);
      targetDomain = cleanText(action.hostname.toLowerCase(), 253);
      actionProtocol = action.protocol.replace(":", "");
    }
  } catch {}
  const pageProtocol = ["http", "https"].includes(rawEvent.pageProtocol) ? rawEvent.pageProtocol : "other";
  const passwordFieldCount = Math.max(1, Math.min(10, Number(rawEvent.passwordFieldCount) || 1));
  const usernamePresent = Boolean(rawEvent.usernamePresent);
  const frame = rawEvent.frame === "iframe" ? "iframe" : "top";
  const risk = GuardianRiskEngine.analyzeCredential({ pageProtocol, actionProtocol, pageDomain: sourceDomain, targetDomain, crossDomain: Boolean(targetDomain && !sameSiteHost(sourceDomain, targetDomain)), ipTarget: isIpHost(targetDomain), punycode: targetDomain.startsWith("xn--") || targetDomain.includes(".xn--"), inIframe: frame === "iframe" });
  if (risk.score < 20) return null;
  return {
    type: "credential_form_risk",
    severity: risk.level,
    domain: sourceDomain,
    targetDomain,
    frame,
    formActionOrigin: actionOrigin || undefined,
    method: ALLOWED_METHODS.has(cleanText(rawEvent.method, 10).toUpperCase()) ? cleanText(rawEvent.method, 10).toUpperCase() : "OTHER",
    pageProtocol,
    passwordFieldCount,
    usernamePresent,
    riskScore: risk.score,
    riskLevel: risk.level,
    riskReasons: risk.reasons,
    riskEngineVersion: risk.riskEngineVersion,
    note: "Possível risco no envio de credenciais. Nenhuma senha foi lida ou armazenada."
  };
}

async function maybeAlertCredential(event) {
  const settings = await getSettings();
  if (!settings.alerts || !settings.credentialAlerts) return;
  const levels={"pt-BR":event.severity === "high" ? "ALTO" : "MODERADO",en:event.severity === "high" ? "HIGH" : "MODERATE",es:event.severity === "high" ? "ALTO" : "MODERADO"};
  const level=levels[settings.language]||levels["pt-BR"];
  const firstReason = event.riskReasons?.[0];
  const detail = (typeof firstReason === "string" ? firstReason : firstReason?.message) || event.note || "atividade de credencial que merece revisão";
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
    description: cleanText(source.description, 500),
    version: cleanText(source.version, 40),
    enabled: Boolean(source.enabled),
    type: cleanText(source.type || "extension", 40),
    installType: cleanText(source.installType || "normal", 40),
    mayDisable: Boolean(source.mayDisable),
    permissions: sanitizePermissionList(source.permissions),
    hostPermissions: sanitizePermissionList(source.hostPermissions)
  };
}

function extensionRisk(ext, baseline = null) {
  const riskyPermissions = (ext.permissions || []).filter(permission => RISKY_PERMISSIONS.has(permission));
  const broadHosts = (ext.hostPermissions || []).filter(host => host === "<all_urls>" || host.includes("*://*/*") || host.includes("http://*/*") || host.includes("https://*/*"));
  const credentialPermissions = (ext.permissions || []).filter(permission => CREDENTIAL_PERMISSIONS.has(permission));
  const assessed = GuardianRiskEngine.analyzeExtension(ext, { baseline, baselineKnown: Boolean(baseline) });
  return { ...assessed, riskyPermissions, broadHosts, credentialPermissions, credentialScore: assessed.score };
}

async function hasManagementPermission() {
  return chrome.permissions.contains({ permissions: ["management"] });
}

async function getExtensions() {
  if (!(await hasManagementPermission())) return [];
  const all = await chrome.management.getAll();
  return all.filter(ext => ext.id !== chrome.runtime.id).map(sanitizeExtensionSnapshot);
}

async function recordSecurityEvent(type, ext, note, severity = "info", risk = null) {
  await saveEvent({ type, severity, extension: ext, note, riskScore: risk?.behavior?.score ?? risk?.score, riskLevel: risk?.behavior?.level ?? risk?.level, riskReasons: risk?.behavior?.reasons ?? risk?.reasons, capabilityRisk: risk?.capability, behaviorRisk: risk?.behavior, riskConfidence: risk?.confidence, riskDrift: risk?.drift, riskDelta: risk?.riskDelta, riskEngineVersion: risk?.riskEngineVersion });
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
  const baseline = Object.fromEntries(extensions.filter(ext => ext.id).map(ext => { const risk = GuardianRiskEngine.analyzeExtension(ext, {}); return [ext.id, { ...ext, risk }]; }));
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
  const currentMap = {};
  if (!extensionBaseline || typeof extensionBaseline !== "object") {
    for (const ext of current) currentMap[ext.id] = { ...ext, risk: GuardianRiskEngine.analyzeExtension(ext, {}) };
    await chrome.storage.local.set({ extensionBaseline: currentMap, lastSecurityAudit: Date.now() });
    if (recordAudit) await saveEvent({ type: "security_audit", severity: "info", note: `Linha de base criada com ${current.length} extensões.` });
    return { current, findings: [] };
  }
  const findings = [];
  for (const ext of current) {
    const old = extensionBaseline[ext.id];
    const newPermissions = old ? arrayDiff(ext.permissions, old.permissions) : ext.permissions;
    const newHosts = old ? arrayDiff(ext.hostPermissions, old.hostPermissions) : ext.hostPermissions;
    const risk = GuardianRiskEngine.analyzeExtension(ext, { baseline: old, baselineKnown: Boolean(old), isNew: !old, recentlyEnabled: Boolean(old && !old.enabled && ext.enabled), versionChanged: Boolean(old && old.version !== ext.version) });
    currentMap[ext.id] = { ...ext, risk };
    if (!old) {
      const permissions = [...ext.permissions.filter(permission => RISKY_PERMISSIONS.has(permission)), ...ext.hostPermissions.filter(host => host.includes("*"))].slice(0, 12).join(", ");
      findings.push({ type: risk.score >= 60 ? "credential_extension_risk" : "extension_new", ext, severity: risk.level === "low" ? "info" : risk.level, risk, detail: permissions ? `nova extensão; permissões de atenção: ${permissions}` : "nova extensão instalada" });
      continue;
    }
    if (newPermissions.length || newHosts.length) {
      const sensitiveAdded = newPermissions.filter(permission => RISKY_PERMISSIONS.has(permission));
      const broadAdded = newHosts.filter(host => host === "<all_urls>" || host.includes("*://*/*") || host.includes("http://*/*") || host.includes("https://*/*"));
      const severity = sensitiveAdded.length || broadAdded.length ? "high" : "medium";
      const changed = [...newPermissions, ...newHosts].slice(0, 16).join(", ");
      const credentialAdded = newPermissions.filter(permission => CREDENTIAL_PERMISSIONS.has(permission));
      const credentialConcern = risk.score >= 60 && (credentialAdded.length || broadAdded.length);
      findings.push({ type: credentialConcern ? "credential_extension_risk" : "extension_permissions_changed", ext, severity: risk.level === "low" ? severity : risk.level, risk, detail: `${credentialConcern ? "mudança com possível impacto em sessão/credenciais; " : ""}novas permissões: ${changed}` });
    }
    if (!old.enabled && ext.enabled) findings.push({ type: "extension_enabled", ext, severity: risk.level === "low" ? "info" : risk.level, risk, detail: "extensão foi ativada" });
    if (old.version !== ext.version) findings.push({ type: "extension_updated", ext, severity: risk.level === "low" ? "info" : risk.level, risk, detail: `atualizada de ${cleanText(old.version || "?", 40)} para ${cleanText(ext.version || "?", 40)}` });
  }
  for (const [id, old] of Object.entries(extensionBaseline)) {
    if (!currentMap[id]) findings.push({ type: "extension_removed", ext: sanitizeExtensionSnapshot(old), severity: "info", detail: "extensão removida" });
  }
  for (const finding of findings) {
    await recordSecurityEvent(finding.type, finding.ext, finding.detail, finding.severity, finding.risk);
    if (alertChanges && ["medium", "high", "critical"].includes(finding.severity)) {
      const title = ["high", "critical"].includes(finding.severity) ? "Guardian Monitor: mudança de segurança" : "Guardian Monitor: extensão alterada";
      await securityAlert(title, finding.ext, finding.detail);
    }
  }
  await chrome.storage.local.set({ extensionBaseline: currentMap, lastSecurityAudit: Date.now() });
  if (recordAudit) {
    const severity = findings.some(item => item.severity === "critical") ? "critical" : findings.some(item => item.severity === "high") ? "high" : findings.some(item => item.severity === "medium") ? "medium" : findings.some(item => item.severity === "guarded") ? "guarded" : "info";
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
  const domain = normalizeDomainFromUrl(item.finalUrl || item.url);
  let protocol = "other";
  try {
    const u = new URL(String(item.finalUrl || item.url || ""));
    protocol = u.protocol === "http:" ? "http" : u.protocol === "https:" ? "https" : "other";
  } catch {}
  const mime = cleanText(item.mime || "", 120).toLowerCase();
  const risk = GuardianRiskEngine.analyzeDownload({ name, extension, danger, mime, protocol });
  return {
    type: "download_scan",
    severity: risk.level === "low" ? "info" : risk.level,
    downloadId: Number.isInteger(item.id) ? item.id : undefined,
    domain,
    files: [{ name, size: item.fileSize || item.totalBytes || 0, type: item.mime || "", extension }],
    danger: danger || "unknown",
    downloadState: cleanText(item.state || "in_progress", 40),
    riskScore: risk.score,
    riskLevel: risk.level,
    riskReasons: risk.reasons,
    riskEngineVersion: risk.riskEngineVersion,
    note: `Scanner de download: risco ${risk.level}`
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
  if (!settings.alerts || !["medium", "high", "critical"].includes(event.riskLevel)) return;
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
  if (typeof chrome.storage.local.setAccessLevel === "function") {
    await chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
  }
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
        const { extensionBaseline = {} } = auditEnabled ? await chrome.storage.local.get("extensionBaseline") : {};
        sendResponse({ ok: true, auditEnabled, extensions: extensions.map(ext => ({ ...ext, risk: extensionRisk(ext, extensionBaseline?.[ext.id] || null) })) });
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
