const detailStylesheet = document.createElement("link");
detailStylesheet.rel = "stylesheet";
detailStylesheet.href = "dashboard-detail.css";
document.head.append(detailStylesheet);
const darkStylesheet = document.createElement("link");
darkStylesheet.rel = "stylesheet";
darkStylesheet.href = "../shared/dark.css";
document.head.append(darkStylesheet);

const I18N={
"pt-BR":{navHistory:"Histórico",navAudit:"Auditoria do navegador",navTrusted:"Sites confiáveis",navSettings:"Configurações",navLimits:"Limitações",developedBy:"Desenvolvido por",titleHistory:"Histórico de atividade",subtitleHistory:"Eventos observados localmente neste navegador.",titleAudit:"Auditoria do navegador",titleTrusted:"Sites confiáveis",titleSettings:"Configurações",titleLimits:"Limitações e privacidade",exportCsv:"Exportar CSV",exportJson:"Exportar JSON",clearHistory:"Apagar histórico",events:"Eventos",selections:"Seleções",submissions:"Envios tentados",securityAlerts:"Alertas de segurança",searchPlaceholder:"Buscar arquivo, domínio ou extensão",filterAll:"Todos os eventos",filterSelected:"Arquivos selecionados",filterSubmitted:"Tentativas de envio",filterDownloads:"Scanner de downloads",filterCredentials:"Riscos de credenciais",filterSecurity:"Eventos de segurança",date:"Data",event:"Evento",item:"Item",origin:"Origem",detail:"Detalhe",status:"Status",auditExtensions:"Auditoria de extensões",auditDescription:"Compara as extensões instaladas com uma linha de base local e destaca permissões potencialmente sensíveis.",runAudit:"Executar auditoria agora",enableAudit:"Ativar auditoria de extensões",loading:"Carregando…",extension:"Extensão",version:"Versão",state:"Estado",installation:"Instalação",attentionPermissions:"Permissões de atenção",risk:"Risco",sessionProtection:"Proteção de sessão e credenciais:",sessionProtectionText:"a auditoria destaca extensões novas ou alteradas com combinações de permissões capazes de acessar páginas, tráfego, cookies ou integração nativa. Isso indica exposição potencial, não roubo confirmado.",important:"Importante:",permissionWarning:"uma permissão ampla não prova que a extensão é maliciosa. O painel serve para apontar mudanças que merecem revisão.",trustedSites:"Sites confiáveis",trustedText:"Domínios desta lista não geram alerta comum. Arquivos com extensões sensíveis ainda podem gerar alerta.",add:"Adicionar",language:"Idioma",languageText:"Escolha o idioma da interface.",alerts:"Alertas",generalNotifications:"Mostrar notificações gerais",extensionWarnings:"Alertar mudanças suspeitas em extensões",credentialWarnings:"Alertar riscos observáveis para sessão e credenciais",sensitiveExtensions:"Extensões de arquivo sensíveis",commaSeparated:"Separe por vírgulas.",saveSettings:"Salvar configurações",canObserve:"O que este monitor consegue observar",observe1:"Arquivos escolhidos em campos de upload das páginas.",observe2:"Tentativas de envio por formulários HTML.",observe3:"Downloads iniciados pelo navegador e sinais de risco disponibilizados pela API de downloads do Chromium.",observe4:"Extensões instaladas, ativadas/desativadas e alterações de permissões visíveis à API do Chromium.",observe5:"Formulários de senha enviados para destinos HTTP, domínios diferentes, endereços IP ou contextos que merecem revisão, sem ler a senha.",observe6:"Combinações de permissões de extensões que podem aumentar a exposição de sessão e credenciais.",cannotProve:"O que ele não consegue provar",limit1:"Que um servidor realmente recebeu ou armazenou um arquivo.",limit2:"Confirmar com certeza que suas senhas ou cookies foram roubados. O Guardian Monitor detecta alguns indícios observáveis e alerta quando eles merecem revisão.",limit3:"Que outra pessoa entrou na sua conta por outro dispositivo.",limit4:"Atividade anterior à instalação da extensão.",limit5:"Ações realizadas por malware fora do Chromium.",limit6:"Confirmar que um arquivo é malware apenas por metadados. O scanner indica risco, não substitui antivírus.",privacy:"Privacidade:",privacyText:"o Guardian Monitor não lê senhas, cookies nem o conteúdo dos seus arquivos. Ele guarda localmente apenas metadados e informações públicas das extensões que o navegador disponibiliza.",noneEvent:"Nenhum evento encontrado.",noneDomain:"Nenhum domínio cadastrado.",noneExtension:"Nenhuma extensão encontrada.",browserExtension:"Extensão do navegador",selected:"Selecionado",submitted:"Envio tentado",download:"Download",downloadScanner:"Scanner de download",newExtension:"Extensão nova",permissionsChanged:"Permissões alteradas",enabledExtension:"Extensão ativada",disabledExtension:"Extensão desativada",updatedExtension:"Extensão atualizada",removedExtension:"Extensão removida",audit:"Auditoria",credentialRisk:"Risco de credenciais",extensionCredentials:"Extensão e credenciais",reviewCredentials:"Revisar credenciais",highRisk:"Risco alto",mediumRisk:"Risco moderado",lowRisk:"Risco baixo",highAttention:"Atenção alta",review:"Revisar",informational:"Informativo",sensitive:"Sensível",trusted:"Confiável",observed:"Observado",high:"Alto",attention:"Atenção",low:"Baixo",active:"Ativa",disabled:"Desativada",noneHighlighted:"Nenhuma destacada",settingsSaved:"Configurações salvas localmente.",auditDisabled:"Auditoria desativada. A permissão de gerenciamento de extensões só será solicitada quando você ativar este recurso.",lastAudit:"Última auditoria",extensionsChecked:"extensões verificadas",auditNotEnabled:"Auditoria não ativada. A permissão opcional não foi concedida.",runningAudit:"Executando auditoria…",auditFailed:"Falha na auditoria.",auditComplete:"Auditoria concluída",changes:"mudança(s) desde a última linha de base",confirmClear:"Apagar todo o histórico local?",destination:"destino",score:"pontuação",passwordNotStored:"nenhuma senha foi lida ou armazenada",file:"arquivo",chromium:"Chromium"},
"en":{navHistory:"History",navAudit:"Browser audit",navTrusted:"Trusted sites",navSettings:"Settings",navLimits:"Limitations",developedBy:"Developed by",titleHistory:"Activity history",subtitleHistory:"Events observed locally in this browser.",titleAudit:"Browser audit",titleTrusted:"Trusted sites",titleSettings:"Settings",titleLimits:"Limitations and privacy",exportCsv:"Export CSV",exportJson:"Export JSON",clearHistory:"Clear history",events:"Events",selections:"Selections",submissions:"Submission attempts",securityAlerts:"Security alerts",searchPlaceholder:"Search file, domain or extension",filterAll:"All events",filterSelected:"Selected files",filterSubmitted:"Submission attempts",filterDownloads:"Download scanner",filterCredentials:"Credential risks",filterSecurity:"Security events",date:"Date",event:"Event",item:"Item",origin:"Origin",detail:"Detail",status:"Status",auditExtensions:"Extension audit",auditDescription:"Compares installed extensions against a local baseline and highlights potentially sensitive permissions.",runAudit:"Run audit now",enableAudit:"Enable extension audit",loading:"Loading…",extension:"Extension",version:"Version",state:"State",installation:"Installation",attentionPermissions:"Permissions to review",risk:"Risk",sessionProtection:"Session and credential protection:",sessionProtectionText:"the audit highlights new or changed extensions with permission combinations capable of accessing pages, traffic, cookies or native integration. This indicates potential exposure, not confirmed theft.",important:"Important:",permissionWarning:"a broad permission does not prove an extension is malicious. The panel highlights changes that deserve review.",trustedSites:"Trusted sites",trustedText:"Domains on this list do not trigger the standard alert. Files with sensitive extensions may still trigger alerts.",add:"Add",language:"Language",languageText:"Choose the interface language.",alerts:"Alerts",generalNotifications:"Show general notifications",extensionWarnings:"Alert on suspicious extension changes",credentialWarnings:"Alert on observable session and credential risks",sensitiveExtensions:"Sensitive file extensions",commaSeparated:"Separate with commas.",saveSettings:"Save settings",canObserve:"What this monitor can observe",observe1:"Files selected in page upload fields.",observe2:"Submission attempts through HTML forms.",observe3:"Browser downloads and risk signals exposed by the Chromium downloads API.",observe4:"Installed, enabled/disabled extensions and permission changes visible to the Chromium API.",observe5:"Password forms submitted to HTTP destinations, different domains, IP addresses or contexts that deserve review, without reading the password.",observe6:"Extension permission combinations that can increase session and credential exposure.",cannotProve:"What it cannot prove",limit1:"That a server actually received or stored a file.",limit2:"Confirm with certainty that passwords or cookies were stolen. Guardian Monitor detects some observable indicators and alerts when they deserve review.",limit3:"That another person accessed your account from another device.",limit4:"Activity from before the extension was installed.",limit5:"Actions performed by malware outside Chromium.",limit6:"Confirm that a file is malware from metadata alone. The scanner indicates risk and does not replace antivirus software.",privacy:"Privacy:",privacyText:"Guardian Monitor does not read passwords, cookies or file contents. It stores only metadata and public extension information exposed by the browser, locally.",noneEvent:"No events found.",noneDomain:"No domains added.",noneExtension:"No extensions found.",browserExtension:"Browser extension",selected:"Selected",submitted:"Submission attempted",download:"Download",downloadScanner:"Download scanner",newExtension:"New extension",permissionsChanged:"Permissions changed",enabledExtension:"Extension enabled",disabledExtension:"Extension disabled",updatedExtension:"Extension updated",removedExtension:"Extension removed",audit:"Audit",credentialRisk:"Credential risk",extensionCredentials:"Extension and credentials",reviewCredentials:"Review credentials",highRisk:"High risk",mediumRisk:"Moderate risk",lowRisk:"Low risk",highAttention:"High attention",review:"Review",informational:"Informational",sensitive:"Sensitive",trusted:"Trusted",observed:"Observed",high:"High",attention:"Attention",low:"Low",active:"Active",disabled:"Disabled",noneHighlighted:"None highlighted",settingsSaved:"Settings saved locally.",auditDisabled:"Audit disabled. Extension management permission will only be requested when you enable this feature.",lastAudit:"Last audit",extensionsChecked:"extensions checked",auditNotEnabled:"Audit not enabled. Optional permission was not granted.",runningAudit:"Running audit…",auditFailed:"Audit failed.",auditComplete:"Audit complete",changes:"change(s) since the last baseline",confirmClear:"Clear all local history?",destination:"destination",score:"score",passwordNotStored:"no password was read or stored",file:"file",chromium:"Chromium"},
"es":{navHistory:"Historial",navAudit:"Auditoría del navegador",navTrusted:"Sitios de confianza",navSettings:"Configuración",navLimits:"Limitaciones",developedBy:"Desarrollado por",titleHistory:"Historial de actividad",subtitleHistory:"Eventos observados localmente en este navegador.",titleAudit:"Auditoría del navegador",titleTrusted:"Sitios de confianza",titleSettings:"Configuración",titleLimits:"Limitaciones y privacidad",exportCsv:"Exportar CSV",exportJson:"Exportar JSON",clearHistory:"Borrar historial",events:"Eventos",selections:"Selecciones",submissions:"Intentos de envío",securityAlerts:"Alertas de seguridad",searchPlaceholder:"Buscar archivo, dominio o extensión",filterAll:"Todos los eventos",filterSelected:"Archivos seleccionados",filterSubmitted:"Intentos de envío",filterDownloads:"Escáner de descargas",filterCredentials:"Riesgos de credenciales",filterSecurity:"Eventos de seguridad",date:"Fecha",event:"Evento",item:"Elemento",origin:"Origen",detail:"Detalle",status:"Estado",auditExtensions:"Auditoría de extensiones",auditDescription:"Compara las extensiones instaladas con una línea base local y destaca permisos potencialmente sensibles.",runAudit:"Ejecutar auditoría ahora",enableAudit:"Activar auditoría de extensiones",loading:"Cargando…",extension:"Extensión",version:"Versión",state:"Estado",installation:"Instalación",attentionPermissions:"Permisos a revisar",risk:"Riesgo",sessionProtection:"Protección de sesión y credenciales:",sessionProtectionText:"la auditoría destaca extensiones nuevas o modificadas con combinaciones de permisos capaces de acceder a páginas, tráfico, cookies o integración nativa. Esto indica exposición potencial, no robo confirmado.",important:"Importante:",permissionWarning:"un permiso amplio no demuestra que una extensión sea maliciosa. El panel señala cambios que merecen revisión.",trustedSites:"Sitios de confianza",trustedText:"Los dominios de esta lista no generan la alerta común. Los archivos con extensiones sensibles aún pueden generar alertas.",add:"Añadir",language:"Idioma",languageText:"Elige el idioma de la interfaz.",alerts:"Alertas",generalNotifications:"Mostrar notificaciones generales",extensionWarnings:"Alertar sobre cambios sospechosos en extensiones",credentialWarnings:"Alertar sobre riesgos observables de sesión y credenciales",sensitiveExtensions:"Extensiones de archivo sensibles",commaSeparated:"Separe con comas.",saveSettings:"Guardar configuración",canObserve:"Lo que este monitor puede observar",observe1:"Archivos seleccionados en campos de carga de las páginas.",observe2:"Intentos de envío mediante formularios HTML.",observe3:"Descargas iniciadas por el navegador y señales de riesgo disponibles mediante la API de descargas de Chromium.",observe4:"Extensiones instaladas, activadas/desactivadas y cambios de permisos visibles para la API de Chromium.",observe5:"Formularios de contraseña enviados a destinos HTTP, dominios diferentes, direcciones IP o contextos que merecen revisión, sin leer la contraseña.",observe6:"Combinaciones de permisos de extensiones que pueden aumentar la exposición de sesión y credenciales.",cannotProve:"Lo que no puede demostrar",limit1:"Que un servidor realmente recibió o almacenó un archivo.",limit2:"Confirmar con certeza que sus contraseñas o cookies fueron robadas. Guardian Monitor detecta algunos indicios observables y alerta cuando merecen revisión.",limit3:"Que otra persona accedió a su cuenta desde otro dispositivo.",limit4:"Actividad anterior a la instalación de la extensión.",limit5:"Acciones realizadas por malware fuera de Chromium.",limit6:"Confirmar que un archivo es malware solo por sus metadatos. El escáner indica riesgo y no sustituye a un antivirus.",privacy:"Privacidad:",privacyText:"Guardian Monitor no lee contraseñas, cookies ni el contenido de sus archivos. Solo almacena localmente metadatos e información pública de extensiones que proporciona el navegador.",noneEvent:"No se encontraron eventos.",noneDomain:"No hay dominios añadidos.",noneExtension:"No se encontraron extensiones.",browserExtension:"Extensión del navegador",selected:"Seleccionado",submitted:"Intento de envío",download:"Descarga",downloadScanner:"Escáner de descarga",newExtension:"Extensión nueva",permissionsChanged:"Permisos modificados",enabledExtension:"Extensión activada",disabledExtension:"Extensión desactivada",updatedExtension:"Extensión actualizada",removedExtension:"Extensión eliminada",audit:"Auditoría",credentialRisk:"Riesgo de credenciales",extensionCredentials:"Extensión y credenciales",reviewCredentials:"Revisar credenciales",highRisk:"Riesgo alto",mediumRisk:"Riesgo moderado",lowRisk:"Riesgo bajo",highAttention:"Atención alta",review:"Revisar",informational:"Informativo",sensitive:"Sensible",trusted:"Confiable",observed:"Observado",high:"Alto",attention:"Atención",low:"Bajo",active:"Activa",disabled:"Desactivada",noneHighlighted:"Ninguno destacado",settingsSaved:"Configuración guardada localmente.",auditDisabled:"Auditoría desactivada. El permiso de administración de extensiones solo se solicitará al activar esta función.",lastAudit:"Última auditoría",extensionsChecked:"extensiones verificadas",auditNotEnabled:"Auditoría no activada. No se concedió el permiso opcional.",runningAudit:"Ejecutando auditoría…",auditFailed:"La auditoría falló.",auditComplete:"Auditoría completada",changes:"cambio(s) desde la última línea base",confirmClear:"¿Borrar todo el historial local?",destination:"destino",score:"puntuación",passwordNotStored:"no se leyó ni almacenó ninguna contraseña",file:"archivo",chromium:"Chromium"}};
Object.assign(I18N["pt-BR"],{navCenter:"Central de Segurança",titleCenter:"Central de Segurança",guardianRiskScore:"Guardian Risk Score",riskDisclaimer:"Pontuação heurística para priorização. Não confirma malware ou invasão.",suspiciousDownloads:"Downloads suspeitos",extensionsReview:"Extensões que merecem revisão",credentialRisks:"Riscos de credenciais",criticalAlerts:"Alertas críticos",recentSecurityEvents:"Eventos recentes de segurança",lowLevel:"Baixo",guardedLevel:"Atenção",mediumLevel:"Moderado",highLevel:"Alto",criticalLevel:"Crítico",reasons:"Motivos"});
Object.assign(I18N.en,{navCenter:"Security Center",titleCenter:"Security Center",guardianRiskScore:"Guardian Risk Score",riskDisclaimer:"Heuristic prioritization score. It does not confirm malware or intrusion.",suspiciousDownloads:"Suspicious downloads",extensionsReview:"Extensions to review",credentialRisks:"Credential risks",criticalAlerts:"Critical alerts",recentSecurityEvents:"Recent security events",lowLevel:"Low",guardedLevel:"Guarded",mediumLevel:"Moderate",highLevel:"High",criticalLevel:"Critical",reasons:"Reasons"});
Object.assign(I18N.es,{navCenter:"Centro de Seguridad",titleCenter:"Centro de Seguridad",guardianRiskScore:"Guardian Risk Score",riskDisclaimer:"Puntuación heurística para priorización. No confirma malware ni intrusión.",suspiciousDownloads:"Descargas sospechosas",extensionsReview:"Extensiones que merecen revisión",credentialRisks:"Riesgos de credenciales",criticalAlerts:"Alertas críticos",recentSecurityEvents:"Eventos recientes de seguridad",lowLevel:"Bajo",guardedLevel:"Atención",mediumLevel:"Moderado",highLevel:"Alto",criticalLevel:"Crítico",reasons:"Motivos"});
Object.assign(I18N["pt-BR"],{appearance:"Aparência",appearanceText:"Escolha como o Guardian Monitor deve ser exibido.",lightTheme:"Modo claro",darkTheme:"Modo escuro"});
Object.assign(I18N.en,{appearance:"Appearance",appearanceText:"Choose how Guardian Monitor should be displayed.",lightTheme:"Light mode",darkTheme:"Dark mode"});
Object.assign(I18N.es,{appearance:"Apariencia",appearanceText:"Elige cómo se debe mostrar Guardian Monitor.",lightTheme:"Modo claro",darkTheme:"Modo oscuro"});
Object.assign(I18N["pt-BR"],{developedBy:"Dev pela"});
Object.assign(I18N.en,{developedBy:"By"});
Object.assign(I18N.es,{developedBy:"Por"});
Object.assign(I18N["pt-BR"],{
  navReplay:"Risk Replay",titleReplay:"Risk Replay",riskReplay:"Risk Replay",replayDescription:"Reconstrói incidentes prováveis usando somente eventos já armazenados localmente.",period:"Período",last24Hours:"Últimas 24h",last7Days:"7 dias",last30Days:"30 dias",noIncidents:"Nenhum incidente encontrado neste período.",incident:"Incidente",eventsCount:"eventos",duration:"duração",replayIncident:"Reproduzir incidente",timeline:"Linha do tempo",whyScore:"Por que este incidente recebeu essa pontuação?",known:"O que sabemos",unknown:"O que não sabemos",knownEvents:"Estes eventos foram observados pelo Guardian Monitor.",knownTime:"Os eventos agrupados ocorreram próximos no tempo ou compartilham sinais.",knownSignals:"Determinados metadados foram classificados como risco.",unknownExecuted:"Não sabemos se um arquivo baixado foi executado.",unknownCausal:"Não sabemos se os eventos possuem relação causal.",unknownCompromise:"Não sabemos se houve comprometimento real.",exportIncidentJson:"Exportar incidente JSON",exportIncidentHtml:"Exportar relatório HTML",closeReplay:"Fechar",derivedIncident:"Agrupamento derivado do histórico",storedIncident:"Agrupamento identificado nos eventos",relation:"Relação com o evento anterior",relationStart:"Evento inicial do incidente.",relationIncidentId:"Mesmo identificador de incidente.",relationDomain:"Domínio igual ou relacionado.",relationItem:"Mesmo item observado.",relationExtension:"Mesma extensão.",relationTime:"Ocorreram próximos no tempo",seconds:"segundos",noExplanation:"Nenhuma explicação adicional registrada.",incidentScoreMethod:"A pontuação combina os riscos dos eventos com peso decrescente, sem afirmar causalidade.",reportPrivacy:"Relatório criado localmente somente com eventos já armazenados."
});
Object.assign(I18N.en,{
  navReplay:"Risk Replay",titleReplay:"Risk Replay",riskReplay:"Risk Replay",replayDescription:"Reconstructs likely incidents using only events already stored locally.",period:"Period",last24Hours:"Last 24 hours",last7Days:"7 days",last30Days:"30 days",noIncidents:"No incidents found in this period.",incident:"Incident",eventsCount:"events",duration:"duration",replayIncident:"Replay incident",timeline:"Timeline",whyScore:"Why did this incident receive this score?",known:"What we know",unknown:"What we do not know",knownEvents:"These events were observed by Guardian Monitor.",knownTime:"Grouped events occurred close in time or share signals.",knownSignals:"Certain metadata was classified as risk.",unknownExecuted:"We do not know whether a downloaded file was executed.",unknownCausal:"We do not know whether the events are causally related.",unknownCompromise:"We do not know whether a real compromise occurred.",exportIncidentJson:"Export incident JSON",exportIncidentHtml:"Export HTML report",closeReplay:"Close",derivedIncident:"Grouping derived from history",storedIncident:"Grouping identified in stored events",relation:"Relation to the previous event",relationStart:"Initial event in the incident.",relationIncidentId:"Same incident identifier.",relationDomain:"Same or related domain.",relationItem:"Same observed item.",relationExtension:"Same extension.",relationTime:"Occurred close in time",seconds:"seconds",noExplanation:"No additional explanation was recorded.",incidentScoreMethod:"The score combines event risks with decreasing weight and does not assert causality.",reportPrivacy:"Report created locally using only events already stored."
});
Object.assign(I18N.es,{
  navReplay:"Risk Replay",titleReplay:"Risk Replay",riskReplay:"Risk Replay",replayDescription:"Reconstruye incidentes probables usando solamente eventos ya almacenados localmente.",period:"Período",last24Hours:"Últimas 24 h",last7Days:"7 días",last30Days:"30 días",noIncidents:"No se encontraron incidentes en este período.",incident:"Incidente",eventsCount:"eventos",duration:"duración",replayIncident:"Reproducir incidente",timeline:"Línea de tiempo",whyScore:"¿Por qué este incidente recibió esta puntuación?",known:"Lo que sabemos",unknown:"Lo que no sabemos",knownEvents:"Estos eventos fueron observados por Guardian Monitor.",knownTime:"Los eventos agrupados ocurrieron cerca en el tiempo o comparten señales.",knownSignals:"Determinados metadatos fueron clasificados como riesgo.",unknownExecuted:"No sabemos si se ejecutó un archivo descargado.",unknownCausal:"No sabemos si los eventos tienen una relación causal.",unknownCompromise:"No sabemos si hubo un compromiso real.",exportIncidentJson:"Exportar incidente JSON",exportIncidentHtml:"Exportar informe HTML",closeReplay:"Cerrar",derivedIncident:"Agrupación derivada del historial",storedIncident:"Agrupación identificada en los eventos",relation:"Relación con el evento anterior",relationStart:"Evento inicial del incidente.",relationIncidentId:"Mismo identificador de incidente.",relationDomain:"Dominio igual o relacionado.",relationItem:"Mismo elemento observado.",relationExtension:"Misma extensión.",relationTime:"Ocurrieron cerca en el tiempo",seconds:"segundos",noExplanation:"No se registró una explicación adicional.",incidentScoreMethod:"La puntuación combina los riesgos de los eventos con peso decreciente, sin afirmar causalidad.",reportPrivacy:"Informe creado localmente solo con eventos ya almacenados."
});
const REASON_MESSAGES={
  en:{executable_type:"The file type can execute code.",archive_type:"The archive may contain other files.",double_extension:"The file has a potentially misleading double extension.",unencrypted_http:"The download originated over unencrypted HTTP.",encrypted_https:"The download originated over HTTPS.",mime_mismatch:"The MIME type does not appear to match the extension.",deceptive_name:"The filename may be misleading.",combo_cookies_all_urls:"Cookies combined with broad site access deserve review.",combo_scripting_all_urls:"Scripts combined with broad site access increase capability.",combo_credentials_pages:"The combination enables broad interaction with pages and sessions.",combo_proxy_requests:"Proxy combined with request observation deserves review.",context_new:"The extension is new compared with the local baseline.",context_new_permissions:"The extension received new permissions.",context_enabled:"The extension was recently enabled.",context_version_changed:"The extension version changed.",context_stable_baseline:"The extension is known and unchanged in the local baseline.",page_http:"The page containing the password form uses unencrypted HTTP.",action_http:"The form submits over unencrypted HTTP.",cross_domain_action:"The destination differs from the page domain.",ip_target:"The form points to an IP address.",punycode_domain:"The destination uses a Punycode internationalized domain.",iframe_form:"The password form is inside an iframe.",unknown_target:"The destination domain could not be validated.",multiple_credential_signals:"Multiple potential exposure signals were observed together."},
  es:{executable_type:"El tipo de archivo puede ejecutar código.",archive_type:"El archivo comprimido puede contener otros archivos.",double_extension:"El archivo tiene una doble extensión potencialmente engañosa.",unencrypted_http:"La descarga se originó mediante HTTP sin cifrar.",encrypted_https:"La descarga se originó mediante HTTPS.",mime_mismatch:"El tipo MIME no parece coincidir con la extensión.",deceptive_name:"El nombre del archivo puede ser engañoso.",combo_cookies_all_urls:"Las cookies combinadas con acceso amplio a sitios merecen revisión.",combo_scripting_all_urls:"Los scripts combinados con acceso amplio aumentan la capacidad.",combo_credentials_pages:"La combinación permite una interacción amplia con páginas y sesiones.",combo_proxy_requests:"El proxy combinado con la observación de solicitudes merece revisión.",context_new:"La extensión es nueva respecto a la línea base local.",context_new_permissions:"La extensión recibió nuevos permisos.",context_enabled:"La extensión fue activada recientemente.",context_version_changed:"La versión de la extensión cambió.",context_stable_baseline:"La extensión es conocida y no cambió en la línea base local.",page_http:"La página con el formulario de contraseña usa HTTP sin cifrar.",action_http:"El formulario se envía mediante HTTP sin cifrar.",cross_domain_action:"El destino difiere del dominio de la página.",ip_target:"El formulario apunta a una dirección IP.",punycode_domain:"El destino usa un dominio internacionalizado Punycode.",iframe_form:"El formulario de contraseña está dentro de un iframe.",unknown_target:"No se pudo validar el dominio de destino.",multiple_credential_signals:"Se observaron juntas varias señales de posible exposición."}
};
let currentLanguage="pt-BR";
function t(key){return I18N[currentLanguage]?.[key]||I18N["pt-BR"][key]||key}
function locale(){return currentLanguage==="en"?"en-US":currentLanguage==="es"?"es-ES":"pt-BR"}
function applyTranslations(){document.documentElement.lang=currentLanguage;document.querySelectorAll("[data-i18n]").forEach(node=>{node.textContent=t(node.dataset.i18n)});document.querySelectorAll("[data-i18n-placeholder]").forEach(node=>{node.placeholder=t(node.dataset.i18nPlaceholder)});const active=document.querySelector(".nav.active");if(active){const titles={history:"titleHistory",center:"titleCenter",replay:"titleReplay",security:"titleAudit",trusted:"titleTrusted",settings:"titleSettings",about:"titleLimits"};document.getElementById("viewTitle").textContent=t(titles[active.dataset.view]||"titleHistory")}}
let events = [];
let settings = {};
let browserExtensions = [];
let replayIncidents = [];
let selectedReplayId = null;
const DEFAULT_SENSITIVE_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "csv", "txt", "key", "pem", "p12", "pfx", "json", "env", "sql", "zip", "rar", "7z"];
const CREDENTIAL_TYPES = new Set(["credential_form_risk", "credential_extension_risk"]);
const SECURITY_TYPES = new Set(["extension_new", "extension_permissions_changed", "extension_enabled", "extension_disabled", "extension_updated", "extension_removed", "security_audit", "download_scan", ...CREDENTIAL_TYPES]);
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function clear(node) {
  node.replaceChildren();
}

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

function typeLabel(type) {
  return {
    file_selected: t("selected"),
    form_submit: t("submitted"),
    download_started: t("download"),
    download_scan: t("downloadScanner"),
    extension_new: t("newExtension"),
    extension_permissions_changed: t("permissionsChanged"),
    extension_enabled: t("enabledExtension"),
    extension_disabled: t("disabledExtension"),
    extension_updated: t("updatedExtension"),
    extension_removed: t("removedExtension"),
    security_audit: t("audit"),
    credential_form_risk: t("credentialRisk"),
    credential_extension_risk: t("extensionCredentials")
  }[type] || t("event");
}

function isTrusted(domain) {
  return (settings.trustedDomains || []).some(item => domain === item || domain.endsWith(`.${item}`));
}

function isSensitive(file) {
  return (settings.sensitiveExtensions || []).includes(String(file?.extension || "").toLowerCase());
}

function eventText(event) {
  if (event.extension) return event.extension.name || event.extension.id || "Extensão";
  return (event.files || []).map(file => file.name).join(", ") || "—";
}

function eventOrigin(event) {
  if (event.extension) return t("browserExtension");
  return event.domain || "—";
}

function reasonText(reason) {
  if (typeof reason === "string") return reason;
  if (!reason || typeof reason !== "object") return "";
  const points = Number(reason.score);
  let message = String(reason.message || reason.id || "");
  if (currentLanguage !== "pt-BR") {
    if (String(reason.id).startsWith("chromium_")) message = `Chromium: ${String(reason.id).slice(9)}`;
    else if (String(reason.id).startsWith("permission_")) message = `${currentLanguage === "es" ? "Permiso con capacidad relevante" : "Permission with relevant capability"}: ${message.split(":").at(-1).trim()}`;
    else message = REASON_MESSAGES[currentLanguage]?.[reason.id] || message;
  }
  return `${Number.isFinite(points) && points >= 0 ? `+${points} ` : ""}${message}`.trim();
}

function eventDetail(event) {
  if (event.extension) {
    const parts = [event.note].filter(Boolean);
    if (Number.isFinite(Number(event.riskScore))) parts.push(`${t("score")} ${event.riskScore}/100`);
    if (Array.isArray(event.riskReasons) && event.riskReasons.length) parts.push(`${t("reasons")}: ${event.riskReasons.map(reasonText).filter(Boolean).join("; ")}`);
    return parts.join(" · ") || "—";
  }
  if (event.type === "credential_form_risk") {
    const parts = [];
    if (event.targetDomain) parts.push(`${t("destination")}: ${event.targetDomain}`);
    if (Number.isFinite(Number(event.riskScore))) parts.push(`${t("score")} ${event.riskScore}/100`);
    if (Array.isArray(event.riskReasons) && event.riskReasons.length) parts.push(`${t("reasons")}: ${event.riskReasons.map(reasonText).filter(Boolean).join("; ")}`);
    parts.push(t("passwordNotStored"));
    return parts.join(" · ");
  }
  if (event.type === "download_scan") {
    const file = event.files?.[0];
    const parts = [];
    if (file) parts.push(`${file.extension || t("file")} · ${formatSize(file.size)}`);
    if (event.danger) parts.push(`${t("chromium")}: ${event.danger}`);
    if (Number.isFinite(Number(event.riskScore))) parts.push(`${t("score")} ${event.riskScore}/100`);
    if (Array.isArray(event.riskReasons) && event.riskReasons.length) parts.push(`${t("reasons")}: ${event.riskReasons.map(reasonText).filter(Boolean).join("; ")}`);
    return parts.join(" · ") || event.note || "—";
  }
  const files = event.files || [];
  if (files.length) return files.map(file => `${file.extension || "arquivo"} · ${formatSize(file.size)}`).join(", ");
  return event.note || "—";
}

function statusNode(event) {
  if (Number.isFinite(Number(event.riskScore))) {
    const level = ["low", "guarded", "medium", "high", "critical"].includes(event.riskLevel) ? event.riskLevel : GuardianRiskEngine.levelForScore(event.riskScore);
    const labels = { low: "lowLevel", guarded: "guardedLevel", medium: "mediumLevel", high: "highLevel", critical: "criticalLevel" };
    const className = level === "low" ? "ok" : ["high", "critical"].includes(level) ? "risk high" : "risk";
    return element("span", className, `${event.riskScore}/100 · ${t(labels[level])}`);
  }
  if (event.type === "credential_form_risk" || event.type === "credential_extension_risk") {
    if (event.severity === "high") return element("span", "risk high", t("credentialRisk"));
    return element("span", "risk", t("reviewCredentials"));
  }
  if (event.type === "download_scan") {
    if (event.riskLevel === "high") return element("span", "risk high", t("highRisk"));
    if (event.riskLevel === "medium") return element("span", "risk", t("mediumRisk"));
    return element("span", "ok", t("lowRisk"));
  }
  if (SECURITY_TYPES.has(event.type)) {
    if (event.severity === "high") return element("span", "risk high", t("highAttention"));
    if (event.severity === "medium") return element("span", "risk", t("review"));
    return element("span", "neutral", t("informational"));
  }
  const firstFile = (event.files || [])[0] || {};
  if (isSensitive(firstFile)) return element("span", "risk", t("sensitive"));
  if (isTrusted(event.domain || "")) return element("span", "ok", t("trusted"));
  return element("span", "neutral", t("observed"));
}

function cell(text, className) {
  const td = element("td", className || "", text);
  if (text) td.title = text;
  return td;
}

function render() {
  $("#countAll").textContent = String(events.length);
  $("#countSelected").textContent = String(events.filter(event => event.type === "file_selected").length);
  $("#countSubmitted").textContent = String(events.filter(event => event.type === "form_submit").length);
  $("#countSecurity").textContent = String(events.filter(event => SECURITY_TYPES.has(event.type) && ["medium", "high"].includes(event.severity)).length);
  const query = $("#search").value.toLowerCase();
  const filter = $("#filter").value;
  const rows = events.filter(event => {
    const typeMatches = filter === "all" || (filter === "security" ? SECURITY_TYPES.has(event.type) : filter === "credentials" ? CREDENTIAL_TYPES.has(event.type) : event.type === filter);
    const haystack = [event.domain, event.note, event.danger, ...(event.riskReasons || []).map(reasonText), event.extension?.name, event.extension?.id, ...(event.files || []).map(file => file.name)].filter(Boolean).join(" ").toLowerCase();
    return typeMatches && (!query || haystack.includes(query));
  });
  const body = $("#rows");
  clear(body);
  if (!rows.length) {
    const tr = element("tr");
    const td = element("td", "empty", t("noneEvent"));
    td.colSpan = 6;
    tr.append(td);
    body.append(tr);
    return;
  }
  rows.forEach(event => {
    const tr = element("tr");
    tr.append(cell(new Date(event.timestamp).toLocaleString(locale())));
    const typeCell = element("td");
    typeCell.append(element("span", "badge", typeLabel(event.type)));
    tr.append(typeCell);
    tr.append(cell(eventText(event)));
    tr.append(cell(eventOrigin(event)));
    tr.append(cell(eventDetail(event), "detail-cell"));
    const statusCell = element("td");
    statusCell.append(statusNode(event));
    tr.append(statusCell);
    body.append(tr);
  });
  renderSecurityCenter();
  renderRiskReplay();
}

function renderSecurityCenter() {
  const overall = GuardianRiskEngine.overallScore(events);
  $("#overallScore").textContent = String(overall.score);
  const labels = { low: "lowLevel", guarded: "guardedLevel", medium: "mediumLevel", high: "highLevel", critical: "criticalLevel" };
  const levelNode = $("#overallLevel");
  levelNode.textContent = t(labels[overall.level]).toUpperCase();
  levelNode.className = `level-${overall.level}`;
  const review = event => Number(event.riskScore) >= 20;
  $("#riskDownloads").textContent = String(events.filter(event => event.type === "download_scan" && review(event)).length);
  $("#riskExtensions").textContent = String(events.filter(event => (String(event.type || "").startsWith("extension_") || event.type === "credential_extension_risk") && review(event)).length);
  $("#riskCredentials").textContent = String(events.filter(event => event.type === "credential_form_risk" && review(event)).length);
  $("#riskCritical").textContent = String(events.filter(event => event.riskLevel === "critical").length);
  const feed = $("#securityFeed");
  clear(feed);
  const recent = events.filter(event => SECURITY_TYPES.has(event.type) && (Number(event.riskScore) > 0 || ["medium", "high", "critical"].includes(event.severity))).slice(0, 8);
  if (!recent.length) {
    feed.append(element("p", "empty", t("noneEvent")));
    return;
  }
  recent.forEach(event => {
    const item = element("article", "security-item");
    const heading = element("div", "security-item-head");
    heading.append(element("strong", "", typeLabel(event.type)));
    heading.append(statusNode(event));
    item.append(heading, element("p", "", eventDetail(event)), element("time", "", new Date(event.timestamp).toLocaleString(locale())));
    feed.append(item);
  });
}

function replayRelationText(relation) {
  if (!relation || relation.code === "start") return t("relationStart");
  const labels = [];
  if (relation.details?.includes("incidentId")) labels.push(t("relationIncidentId"));
  if (relation.details?.includes("domain")) labels.push(t("relationDomain"));
  if (relation.details?.includes("item")) labels.push(t("relationItem"));
  if (relation.details?.includes("extension")) labels.push(t("relationExtension"));
  labels.push(`${t("relationTime")}: ${relation.gapSeconds || 0} ${t("seconds")}.`);
  return labels.join(" ");
}

function replayEventExplanation(event) {
  const parts = [];
  if (event.note) parts.push(event.note);
  if (event.danger) parts.push(`${t("chromium")}: ${event.danger}`);
  if (event.reasons?.length) parts.push(event.reasons.map(reasonText).filter(Boolean).join("; "));
  return parts.join(" · ") || t("noExplanation");
}

function replayIncidentName(incident) {
  const index = replayIncidents.findIndex(item => item.id === incident.id);
  return `${t("incident")} #${index < 0 ? 1 : index + 1}`;
}

function replayFilename(incident, extension) {
  const safeId = String(incident.id || "incident").replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80);
  return `guardian-risk-replay-${safeId}.${extension}`;
}

function exportReplayJson(incident) {
  const payload = GuardianRiskReplay.exportObject(incident);
  download(replayFilename(incident, "json"), JSON.stringify(payload, null, 2), "application/json");
}

function exportReplayHtml(incident) {
  const labels = {
    riskReplay: t("riskReplay"), incident: t("incident"), timeline: t("timeline"), why: t("whyScore"), known: t("known"), unknown: t("unknown"),
    knownEvents: t("knownEvents"), knownTime: t("knownTime"), knownSignals: t("knownSignals"), unknownExecuted: t("unknownExecuted"), unknownCausal: t("unknownCausal"), unknownCompromise: t("unknownCompromise"),
    low: t("lowLevel"), guarded: t("guardedLevel"), medium: t("mediumLevel"), high: t("highLevel"), critical: t("criticalLevel")
  };
  const html = GuardianRiskReplay.exportHtml(incident, { locale: locale(), labels, typeLabel, reasonLabel: reason => reasonText(reason).replace(/^\+\d+\s+/, ""), relationLabel: replayRelationText });
  download(replayFilename(incident, "html"), html, "text/html;charset=utf-8");
}

function renderReplayDetail() {
  const panel = $("#replayDetail");
  const incident = replayIncidents.find(item => item.id === selectedReplayId);
  clear(panel);
  if (!incident) {
    panel.hidden = true;
    return;
  }

  panel.hidden = false;
  const header = element("div", "replay-detail-head");
  const heading = element("div");
  heading.append(element("h3", "", replayIncidentName(incident)));
  const source = element("p", "", incident.derived ? t("derivedIncident") : t("storedIncident"));
  heading.append(source, element("p", "", `${new Date(incident.startTimestamp).toLocaleString(locale())} · ${incident.events.length} ${t("eventsCount")} · ${t("duration")}: ${incident.durationSeconds} ${t("seconds")}`));
  const actions = element("div", "replay-actions");
  const jsonButton = element("button", "", t("exportIncidentJson"));
  jsonButton.type = "button";
  jsonButton.addEventListener("click", () => exportReplayJson(incident));
  const htmlButton = element("button", "", t("exportIncidentHtml"));
  htmlButton.type = "button";
  htmlButton.addEventListener("click", () => exportReplayHtml(incident));
  const closeButton = element("button", "", t("closeReplay"));
  closeButton.type = "button";
  closeButton.addEventListener("click", () => {
    selectedReplayId = null;
    renderReplayDetail();
  });
  actions.append(jsonButton, htmlButton, closeButton);
  header.append(heading, actions);
  panel.append(header);

  const scoreLine = element("p", "incident-score", `${t("guardianRiskScore")}: ${incident.riskScore}/100 · ${t({ low:"lowLevel", guarded:"guardedLevel", medium:"mediumLevel", high:"highLevel", critical:"criticalLevel" }[incident.riskLevel])}`);
  panel.append(scoreLine, element("p", "", t("incidentScoreMethod")), element("h3", "", t("timeline")));

  const timeline = element("ol", "replay-timeline");
  incident.events.forEach(event => {
    const item = element("li", "replay-event");
    const time = element("time", "", new Date(event.timestamp).toLocaleTimeString(locale()));
    time.title = new Date(event.timestamp).toLocaleString(locale());
    item.append(time, element("h4", "", typeLabel(event.type)));
    const context = [event.domain, event.targetDomain, event.item].filter(Boolean).join(" · ");
    if (context) item.append(element("p", "", context));
    item.append(riskNode(event.riskScore), element("p", "", replayEventExplanation(event)));
    item.append(element("small", "replay-relation", `${t("relation")}: ${replayRelationText(event.relationToPrevious)}`));
    timeline.append(item);
  });
  panel.append(timeline, element("h3", "", t("whyScore")));

  const reasons = element("ul", "replay-reasons");
  if (!incident.reasons.length) reasons.append(element("li", "empty", t("noExplanation")));
  incident.reasons.forEach(reason => {
    const item = element("li");
    item.append(element("strong", "", `+${reason.score} `), document.createTextNode(reasonText(reason).replace(/^\+\d+\s+/, "")));
    reasons.append(item);
  });
  panel.append(reasons);

  const facts = element("div", "replay-facts");
  const known = element("section");
  known.append(element("h4", "", t("known")));
  const knownList = element("ul");
  ["knownEvents", "knownTime", "knownSignals"].forEach(key => knownList.append(element("li", "", t(key))));
  known.append(knownList);
  const unknown = element("section");
  unknown.append(element("h4", "", t("unknown")));
  const unknownList = element("ul");
  ["unknownExecuted", "unknownCausal", "unknownCompromise"].forEach(key => unknownList.append(element("li", "", t(key))));
  unknown.append(unknownList);
  facts.append(known, unknown);
  panel.append(facts, element("p", "tiny", t("reportPrivacy")));
}

function renderRiskReplay() {
  const range = Number($("#replayRange")?.value || 1);
  replayIncidents = GuardianRiskReplay.deriveIncidents(events, { days: range });
  const list = $("#replayList");
  clear(list);
  if (!replayIncidents.length) {
    list.append(element("div", "panel wide empty", t("noIncidents")));
    selectedReplayId = null;
    renderReplayDetail();
    return;
  }

  replayIncidents.forEach(incident => {
    const card = element("article", "incident-card");
    const description = element("div");
    description.append(element("h3", "", replayIncidentName(incident)), element("p", "", `${new Date(incident.startTimestamp).toLocaleString(locale())} · ${incident.events.length} ${t("eventsCount")}`));
    const meta = element("div", "incident-meta");
    meta.append(element("strong", "incident-score", `${incident.riskScore}/100`), element("span", `level-${incident.riskLevel}`, t({ low:"lowLevel", guarded:"guardedLevel", medium:"mediumLevel", high:"highLevel", critical:"criticalLevel" }[incident.riskLevel])));
    const button = element("button", "primary", t("replayIncident"));
    button.type = "button";
    button.addEventListener("click", () => {
      selectedReplayId = incident.id;
      renderReplayDetail();
      $("#replayDetail").scrollIntoView({ block: "start" });
    });
    card.append(description, meta, button);
    list.append(card);
  });
  if (selectedReplayId && !replayIncidents.some(incident => incident.id === selectedReplayId)) selectedReplayId = null;
  renderReplayDetail();
}

function renderDomains() {
  const list = $("#domainList");
  clear(list);
  const domains = settings.trustedDomains || [];
  if (!domains.length) {
    list.append(element("span", "empty", t("noneDomain")));
    return;
  }
  domains.forEach(domain => {
    const button = element("button", "chip", `${domain} ×`);
    button.type = "button";
    button.dataset.domain = domain;
    button.addEventListener("click", async () => {
      settings.trustedDomains = settings.trustedDomains.filter(item => item !== domain);
      await saveSettings();
      renderDomains();
      render();
    });
    list.append(button);
  });
}

function riskNode(score) {
  const level = GuardianRiskEngine.levelForScore(score);
  const labels = { low: "lowLevel", guarded: "guardedLevel", medium: "mediumLevel", high: "highLevel", critical: "criticalLevel" };
  return element("span", level === "low" ? "ok" : ["high", "critical"].includes(level) ? "risk high" : "risk", `${score}/100 · ${t(labels[level])}`);
}

function renderExtensions() {
  const body = $("#extensionRows");
  clear(body);
  const sorted = [...browserExtensions].sort((a, b) => (b.risk?.score || 0) - (a.risk?.score || 0) || String(a.name).localeCompare(String(b.name)));
  if (!sorted.length) {
    const tr = element("tr");
    const td = element("td", "empty", t("noneExtension"));
    td.colSpan = 6;
    tr.append(td);
    body.append(tr);
    return;
  }
  sorted.forEach(extension => {
    const tr = element("tr");
    const nameCell = element("td");
    nameCell.append(element("strong", "", extension.name || "Extensão"));
    nameCell.append(document.createElement("br"));
    nameCell.append(element("small", "", extension.id || ""));
    tr.append(nameCell);
    tr.append(cell(extension.version || "—"));
    const stateCell = element("td");
    stateCell.append(element("span", extension.enabled ? "ok" : "neutral", extension.enabled ? t("active") : t("disabled")));
    tr.append(stateCell);
    tr.append(cell(extension.installType || "—"));
    const permissionsCell = element("td", "wrap");
    const attention = [...(extension.risk?.riskyPermissions || []), ...(extension.risk?.broadHosts || [])];
    if (!attention.length) permissionsCell.append(element("span", "neutral", t("noneHighlighted")));
    else attention.forEach(permission => permissionsCell.append(element("span", "perm", permission)));
    tr.append(permissionsCell);
    const riskCell = element("td");
    const score = extension.risk?.score || 0;
    riskCell.append(riskNode(score));
    tr.append(riskCell);
    body.append(tr);
  });
}

function normalizeDomain(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  try {
    const candidate = raw.includes("://") ? raw : `https://${raw}`;
    return new URL(candidate).hostname.toLowerCase().slice(0, 253);
  } catch {
    return "";
  }
}

function normalizeExtensions(value) {
  return [...new Set(String(value || "").split(",").map(item => item.trim().toLowerCase().replace(/^\./, "").replace(/[^a-z0-9]/g, "")).filter(Boolean))].slice(0, 100);
}

async function saveSettings() {
  await chrome.storage.local.set({ settings });
}

function download(name, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvValue(value) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

async function loadExtensions() {
  const response = await chrome.runtime.sendMessage({ kind: "get_extensions" });
  const auditEnabled = Boolean(response?.auditEnabled);
  browserExtensions = response?.ok && Array.isArray(response.extensions) ? response.extensions : [];
  renderExtensions();
  const button = $("#runAudit");
  button.textContent = auditEnabled ? t("runAudit") : t("enableAudit");
  if (!auditEnabled) {
    $("#auditStatus").textContent = "Auditoria desativada. A permissão de gerenciamento de extensões só será solicitada quando você ativar este recurso.";
    return;
  }
  const { lastSecurityAudit } = await chrome.storage.local.get("lastSecurityAudit");
  $("#auditStatus").textContent = lastSecurityAudit
    ? `${t("lastAudit")}: ${new Date(lastSecurityAudit).toLocaleString(locale())}. ${browserExtensions.length} ${t("extensionsChecked")}.`
    : `${browserExtensions.length} ${t("extensionsChecked")}.`;
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
}

function createThemeControl() {
  if ($("#theme")) return;
  const wrapper = element("div", "theme-setting");
  const title = element("h3", "", t("appearance"));
  title.dataset.i18n = "appearance";
  const description = element("p", "", t("appearanceText"));
  description.dataset.i18n = "appearanceText";
  const select = element("select", "language-select");
  select.id = "theme";
  const light = element("option", "", t("lightTheme"));
  light.value = "light";
  light.dataset.i18n = "lightTheme";
  const dark = element("option", "", t("darkTheme"));
  dark.value = "dark";
  dark.dataset.i18n = "darkTheme";
  select.append(light, dark);
  select.value = settings.theme;
  select.addEventListener("change", async () => {
    settings.theme = select.value === "dark" ? "dark" : "light";
    applyTheme(settings.theme);
    await saveSettings();
  });
  wrapper.append(title, description, select);
  $("#language").after(wrapper);
}

async function init() {
  const data = await chrome.storage.local.get(["events", "settings"]);
  events = Array.isArray(data.events) ? data.events : [];
  settings = {
    alerts: data.settings?.alerts !== false,
    securityAlerts: data.settings?.securityAlerts !== false,
    credentialAlerts: data.settings?.credentialAlerts !== false,
    language: ["pt-BR","en","es"].includes(data.settings?.language) ? data.settings.language : "pt-BR",
    theme: ["light", "dark"].includes(data.settings?.theme) ? data.settings.theme : "light",
    trustedDomains: Array.isArray(data.settings?.trustedDomains) ? data.settings.trustedDomains : [],
    sensitiveExtensions: Array.isArray(data.settings?.sensitiveExtensions) && data.settings.sensitiveExtensions.length ? data.settings.sensitiveExtensions : DEFAULT_SENSITIVE_EXTENSIONS
  };
  currentLanguage = settings.language;
  $("#language").value = settings.language;
  applyTheme(settings.theme);
  createThemeControl();
  applyTranslations();
  $("#alerts").checked = settings.alerts;
  $("#securityAlerts").checked = settings.securityAlerts;
  $("#credentialAlerts").checked = settings.credentialAlerts;
  $("#extensions").value = settings.sensitiveExtensions.join(", ");
  render();
  renderDomains();
  await loadExtensions();
}

$$('.nav').forEach(button => button.addEventListener("click", () => {
  $$('.nav,.view').forEach(item => item.classList.remove("active"));
  button.classList.add("active");
  $(`#${button.dataset.view}`).classList.add("active");
  const titles={history:"titleHistory",center:"titleCenter",replay:"titleReplay",security:"titleAudit",trusted:"titleTrusted",settings:"titleSettings",about:"titleLimits"};
  $("#viewTitle").textContent=t(titles[button.dataset.view]||"titleHistory");
}));

$("#search").addEventListener("input", render);
$("#filter").addEventListener("change", render);
$("#replayRange").addEventListener("change", () => {
  selectedReplayId = null;
  renderRiskReplay();
});

$("#addDomain").addEventListener("click", async () => {
  const domain = normalizeDomain($("#domainInput").value);
  if (!domain) {
    $("#domainInput").focus();
    return;
  }
  if (!settings.trustedDomains.includes(domain)) settings.trustedDomains.push(domain);
  $("#domainInput").value = "";
  await saveSettings();
  renderDomains();
  render();
});

$("#language").addEventListener("change",async()=>{settings.language=$("#language").value;currentLanguage=settings.language;await saveSettings();applyTranslations();render();renderDomains();renderExtensions();renderRiskReplay();await loadExtensions();});

$("#saveSettings").addEventListener("click", async () => {
  settings.alerts = $("#alerts").checked;
  settings.securityAlerts = $("#securityAlerts").checked;
  settings.credentialAlerts = $("#credentialAlerts").checked;
  settings.language = $("#language").value;
  currentLanguage=settings.language;
  applyTranslations();
  const extensions = normalizeExtensions($("#extensions").value);
  settings.sensitiveExtensions = extensions.length ? extensions : DEFAULT_SENSITIVE_EXTENSIONS;
  await saveSettings();
  $("#extensions").value = settings.sensitiveExtensions.join(", ");
  $("#subtitle").textContent = t("settingsSaved");
});

$("#runAudit").addEventListener("click", async () => {
  const button = $("#runAudit");
  button.disabled = true;
  try {
    const granted = await chrome.permissions.request({ permissions: ["management"] });
    if (!granted) {
      $("#auditStatus").textContent = t("auditNotEnabled");
      return;
    }
    $("#auditStatus").textContent = t("runningAudit");
    const response = await chrome.runtime.sendMessage({ kind: "run_security_audit" });
    if (!response?.ok || response.permissionRequired) {
      $("#auditStatus").textContent = t("auditFailed");
      return;
    }
    const data = await chrome.storage.local.get("events");
    events = Array.isArray(data.events) ? data.events : [];
    await loadExtensions();
    render();
    $("#auditStatus").textContent = `${t("auditComplete")}: ${response.findings?.length || 0} ${t("changes")}. ${browserExtensions.length} ${t("extensionsChecked")}.`;
  } finally {
    button.disabled = false;
  }
});

$("#clear").addEventListener("click", async () => {
  if (!confirm(t("confirmClear"))) return;
  events = [];
  await chrome.storage.local.set({ events: [] });
  render();
});

$("#exportJson").addEventListener("click", () => {
  download(`guardian-monitor-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(events, null, 2), "application/json");
});

$("#exportCsv").addEventListener("click", () => {
  const lines = [
    ["data", "evento", "item", "origem", "detalhe", "severidade"],
    ...events.map(event => [new Date(event.timestamp).toISOString(), event.type, eventText(event), eventOrigin(event), eventDetail(event), event.severity || ""])
  ];
  const csv = lines.map(row => row.map(csvValue).join(",")).join("\n");
  download(`guardian-monitor-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv");
});

init();
