const I18N={"pt-BR":{popupSubtitle:"Monitor local de segurança",activeProtection:"Proteção ativa",recentEvents:"Últimos eventos",openDashboard:"Abrir painel completo",popupPrivacy:"A extensão não lê o conteúdo dos seus arquivos e não envia seu histórico para servidores.",developedBy:"Desenvolvido por",none:"Nenhum evento registrado.",selected:"Arquivo selecionado",submitted:"Tentativa de envio",download:"Download iniciado",scanner:"Scanner de download",newExt:"Extensão nova",perm:"Permissões alteradas",enabled:"Extensão ativada",disabled:"Extensão desativada",updated:"Extensão atualizada",removed:"Extensão removida",audit:"Auditoria",cred:"Risco de credenciais",extCred:"Extensão e credenciais",high:"risco alto",medium:"risco moderado",low:"risco baixo",destination:"destino",noPassword:"nenhuma senha foi armazenada",unknown:"desconhecido",noDetails:"Sem detalhes"},"en":{popupSubtitle:"Local security monitor",activeProtection:"Protection active",recentEvents:"Recent events",openDashboard:"Open full dashboard",popupPrivacy:"The extension does not read your file contents or send your history to servers.",developedBy:"Developed by",none:"No events recorded.",selected:"File selected",submitted:"Submission attempted",download:"Download started",scanner:"Download scanner",newExt:"New extension",perm:"Permissions changed",enabled:"Extension enabled",disabled:"Extension disabled",updated:"Extension updated",removed:"Extension removed",audit:"Audit",cred:"Credential risk",extCred:"Extension and credentials",high:"high risk",medium:"moderate risk",low:"low risk",destination:"destination",noPassword:"no password was stored",unknown:"unknown",noDetails:"No details"},"es":{popupSubtitle:"Monitor local de seguridad",activeProtection:"Protección activa",recentEvents:"Últimos eventos",openDashboard:"Abrir panel completo",popupPrivacy:"La extensión no lee el contenido de sus archivos ni envía su historial a servidores.",developedBy:"Desarrollado por",none:"No hay eventos registrados.",selected:"Archivo seleccionado",submitted:"Intento de envío",download:"Descarga iniciada",scanner:"Escáner de descarga",newExt:"Extensión nueva",perm:"Permisos modificados",enabled:"Extensión activada",disabled:"Extensión desactivada",updated:"Extensión actualizada",removed:"Extensión eliminada",audit:"Auditoría",cred:"Riesgo de credenciales",extCred:"Extensión y credenciales",high:"riesgo alto",medium:"riesgo moderado",low:"riesgo bajo",destination:"destino",noPassword:"no se almacenó ninguna contraseña",unknown:"desconocido",noDetails:"Sin detalles"}};
let currentLanguage="pt-BR";function t(k){return I18N[currentLanguage]?.[k]||I18N["pt-BR"][k]||k}function locale(){return currentLanguage==="en"?"en-US":currentLanguage==="es"?"es-ES":"pt-BR"}function applyTranslations(){document.documentElement.lang=currentLanguage;document.querySelectorAll("[data-i18n]").forEach(n=>n.textContent=t(n.dataset.i18n))}
function formatSize(value) {
  let number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let index = 0;
  while (number >= 1024 && index < units.length - 1) {
    number /= 1024;
    index += 1;
  }
  return `${number.toFixed(index ? 1 : 0)} ${units[index]}`;
}

function label(type) {
  return {
    file_selected: t("selected"),
    form_submit: t("submitted"),
    download_started: t("download"),
    download_scan: t("scanner"),
    extension_new: t("newExt"),
    extension_permissions_changed: t("perm"),
    extension_enabled: t("enabled"),
    extension_disabled: t("disabled"),
    extension_updated: t("updated"),
    extension_removed: t("removed"),
    security_audit: t("audit"),
    credential_form_risk: t("cred"),
    credential_extension_risk: t("extCred")
  }[type] || "Evento";
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderEvent(event) {
  const card = element("div", "event");
  const top = element("div");
  top.append(element("strong", "", label(event.type)));
  top.append(element("span", "", event.domain || event.extension?.name || ""));
  const files = Array.isArray(event.files) ? event.files : [];
  const detail = event.type === "download_scan"
    ? `${files[0]?.name || t("download")} · ${event.riskLevel === "high" ? t("high") : event.riskLevel === "medium" ? t("medium") : t("low")} · Chromium: ${event.danger || t("unknown")}`
    : event.type === "credential_form_risk"
      ? `${event.riskLevel === "high" ? t("high") : t("medium")} · ${t("destination")}: ${event.targetDomain || t("unknown")} · ${t("noPassword")}`
      : event.note || files.map(file => `${file.name} (${formatSize(file.size)})`).join(", ") || t("noDetails");
  card.append(top);
  card.append(element("small", "", detail));
  card.append(element("time", "", new Date(event.timestamp).toLocaleString(locale())));
  return card;
}

async function init() {
  const { events = [], settings = {} } = await chrome.storage.local.get(["events","settings"]);
  currentLanguage=["pt-BR","en","es"].includes(settings.language)?settings.language:"pt-BR";
  applyTranslations();
  const box = document.getElementById("recent");
  if (!Array.isArray(events) || !events.length) {
    box.append(element("div", "empty", t("none")));
  } else {
    events.slice(0, 5).forEach(event => box.append(renderEvent(event)));
  }
}

document.getElementById("openDashboard").addEventListener("click", () => chrome.runtime.openOptionsPage());
init();
