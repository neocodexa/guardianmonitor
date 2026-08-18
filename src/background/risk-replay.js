(function (root) {
  "use strict";

  const SCHEMA_VERSION = 1;
  const CORRELATION_WINDOW_MS = 2 * 60 * 1000;
  const SECURITY_TYPES = new Set([
    "download_scan",
    "extension_new",
    "extension_permissions_changed",
    "extension_enabled",
    "extension_disabled",
    "extension_updated",
    "extension_removed",
    "security_audit",
    "credential_form_risk",
    "credential_extension_risk"
  ]);

  function text(value, limit = 500) {
    return String(value ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, limit);
  }

  function timestampOf(event) {
    const value = new Date(event?.timestamp).getTime();
    return Number.isFinite(value) ? value : 0;
  }

  function domainKeys(event) {
    return [event?.domain, event?.targetDomain]
      .map(value => text(value, 253).toLowerCase().replace(/^www\./, ""))
      .filter(Boolean);
  }

  function itemOf(event) {
    if (event?.extension) return text(event.extension.name || event.extension.id || "", 180);
    return text((event?.files || []).map(file => file?.name).filter(Boolean).join(", "), 300);
  }

  function correlationKeys(event) {
    const keys = new Set(domainKeys(event).map(domain => `domain:${domain}`));
    const extensionId = text(event?.extension?.id, 180);
    if (extensionId) keys.add(`extension:${extensionId}`);
    for (const file of event?.files || []) {
      const name = text(file?.name, 180).toLowerCase();
      if (name) keys.add(`file:${name}`);
    }
    return keys;
  }

  function isRiskRelevant(event) {
    return Number(event?.riskScore) > 0 || SECURITY_TYPES.has(event?.type) || ["medium", "high", "critical"].includes(event?.severity);
  }

  function sharesKey(left, right) {
    const leftKeys = correlationKeys(left);
    for (const key of correlationKeys(right)) if (leftKeys.has(key)) return true;
    const leftDomains = domainKeys(left);
    const rightDomains = domainKeys(right);
    return leftDomains.some(a => rightDomains.some(b => a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`)));
  }

  function hash(value) {
    let result = 2166136261;
    for (const character of String(value)) {
      result ^= character.charCodeAt(0);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(36);
  }

  function levelForScore(score) {
    if (score >= 80) return "critical";
    if (score >= 60) return "high";
    if (score >= 40) return "medium";
    if (score >= 20) return "guarded";
    return "low";
  }

  function riskAssessment(event) {
    const storedScore = Number(event?.riskScore);
    const storedReasons = Array.isArray(event?.riskReasons) ? event.riskReasons : [];
    if (Number.isFinite(storedScore) && storedReasons.length) {
      return { score: storedScore, level: event?.riskLevel || levelForScore(storedScore), reasons: storedReasons };
    }

    let derived = null;
    try {
      if (root.GuardianRiskEngine && event?.type === "download_scan") {
        const file = event.files?.[0] || {};
        derived = root.GuardianRiskEngine.analyzeDownload({ name: file.name, extension: file.extension, danger: event.danger, mime: file.type, protocol: event.protocol });
      }
      else if (root.GuardianRiskEngine && String(event?.type || "").startsWith("extension_")) {
        derived = root.GuardianRiskEngine.analyzeExtension(event.extension || {}, {
          isNew: event.type === "extension_new",
          recentlyEnabled: event.type === "extension_enabled",
          versionChanged: event.type === "extension_updated"
        });
      } else if (root.GuardianRiskEngine && event?.type === "credential_form_risk") {
        derived = root.GuardianRiskEngine.analyzeCredential({ ...event, pageDomain: event.domain, crossDomain: Boolean(event.domain && event.targetDomain && event.domain !== event.targetDomain), inIframe: event.frame === "iframe" });
      }
    } catch {}

    const score = Number.isFinite(storedScore) ? storedScore : Number(derived?.score) || 0;
    return {
      score,
      level: event?.riskLevel || derived?.level || levelForScore(score),
      reasons: storedReasons.length ? storedReasons : Array.isArray(derived?.reasons) ? derived.reasons : []
    };
  }

  function scoreIncident(events) {
    const scores = events.map(event => Math.max(0, Math.min(100, Number(riskAssessment(event).score) || 0))).filter(Boolean).sort((a, b) => b - a).slice(0, 8);
    let safeProbability = 1;
    scores.forEach((score, index) => {
      const diminishedScore = score * Math.pow(0.65, index);
      safeProbability *= 1 - diminishedScore / 100;
    });
    return Math.max(0, Math.min(100, Math.round(100 * (1 - safeProbability))));
  }

  function reasonBreakdown(events) {
    const reasons = new Map();
    for (const event of events) {
      for (const reason of riskAssessment(event).reasons) {
        const id = text(typeof reason === "string" ? reason : reason?.id || reason?.message, 80);
        const message = text(typeof reason === "string" ? reason : reason?.message || reason?.id, 240);
        const score = Math.round(Number(typeof reason === "object" ? reason?.score : 0) || 0);
        if (!id || score <= 0) continue;
        const existing = reasons.get(id);
        if (!existing || score > existing.score) reasons.set(id, { id, score, message });
      }
    }
    return [...reasons.values()].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, 20);
  }

  function relation(previous, current, explicitIncident) {
    if (!previous) return { code: "start", details: [] };
    const details = [];
    if (explicitIncident) details.push("incidentId");
    if (sharesKey(previous, current)) {
      if (domainKeys(previous).some(a => domainKeys(current).some(b => a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`)))) details.push("domain");
      if (itemOf(previous) && itemOf(previous).toLowerCase() === itemOf(current).toLowerCase()) details.push("item");
      if (previous?.extension?.id && previous.extension.id === current?.extension?.id) details.push("extension");
    }
    const gapSeconds = Math.max(0, Math.round((timestampOf(current) - timestampOf(previous)) / 1000));
    details.push("time");
    return { code: "related", details: [...new Set(details)], gapSeconds };
  }

  function buildIncident(sourceEvents, stableId, explicitIncident) {
    const sorted = [...sourceEvents].sort((a, b) => timestampOf(a) - timestampOf(b));
    const score = scoreIncident(sorted);
    const start = timestampOf(sorted[0]);
    const end = timestampOf(sorted.at(-1));
    return {
      schemaVersion: SCHEMA_VERSION,
      id: stableId,
      explicitIncidentId: explicitIncident,
      derived: !explicitIncident,
      startTimestamp: new Date(start).toISOString(),
      endTimestamp: new Date(end).toISOString(),
      durationSeconds: Math.max(0, Math.round((end - start) / 1000)),
      riskScore: score,
      riskLevel: levelForScore(score),
      reasons: reasonBreakdown(sorted),
      events: sorted.map((event, index) => {
        const assessment = riskAssessment(event);
        return {
        id: text(event?.id, 100) || null,
        timestamp: new Date(timestampOf(event)).toISOString(),
        type: text(event?.type, 80) || "event",
        domain: text(event?.domain, 253) || null,
        targetDomain: text(event?.targetDomain, 253) || null,
        item: itemOf(event) || null,
        riskScore: Math.max(0, Math.min(100, Math.round(Number(assessment.score) || 0))),
        riskLevel: text(assessment.level, 20) || levelForScore(Number(assessment.score) || 0),
        note: text(event?.note, 500) || null,
        danger: text(event?.danger, 100) || null,
        reasons: assessment.reasons.slice(0, 20).map(reason => ({
          id: text(typeof reason === "string" ? reason : reason?.id, 80),
          score: Math.round(Number(typeof reason === "object" ? reason?.score : 0) || 0),
          message: text(typeof reason === "string" ? reason : reason?.message || reason?.id, 240)
        })),
        relationToPrevious: relation(sorted[index - 1], event, explicitIncident)
      };
      })
    };
  }

  function deriveIncidents(events, options = {}) {
    const now = Number.isFinite(Number(options.now)) ? Number(options.now) : Date.now();
    const days = Math.max(1, Math.min(3650, Number(options.days) || 1));
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    const candidates = (Array.isArray(events) ? events : []).filter(event => timestampOf(event) >= cutoff && timestampOf(event) <= now);
    const explicitGroups = new Map();
    const legacy = [];

    for (const event of candidates) {
      const incidentId = text(event?.incidentId, 100);
      if (!incidentId) legacy.push(event);
      else {
        if (!explicitGroups.has(incidentId)) explicitGroups.set(incidentId, []);
        explicitGroups.get(incidentId).push(event);
      }
    }

    const incidents = [...explicitGroups.entries()].map(([id, group]) => buildIncident(group, id, true));
    const clusters = [];
    for (const event of legacy.sort((a, b) => timestampOf(a) - timestampOf(b))) {
      const current = clusters.at(-1);
      const previous = current?.at(-1);
      const closeInTime = previous && timestampOf(event) - timestampOf(previous) <= CORRELATION_WINDOW_MS;
      if (current && closeInTime && (sharesKey(previous, event) || (isRiskRelevant(previous) && isRiskRelevant(event)))) current.push(event);
      else clusters.push([event]);
    }

    clusters.filter(group => group.some(isRiskRelevant)).forEach(group => {
      const first = group[0];
      const fingerprint = group.map(event => event?.id || `${timestampOf(event)}:${event?.type}:${itemOf(event)}`).join("|");
      incidents.push(buildIncident(group, `legacy-${timestampOf(first)}-${hash(fingerprint)}`, false));
    });

    return incidents.sort((a, b) => new Date(b.startTimestamp) - new Date(a.startTimestamp));
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function exportObject(incident) {
    return {
      format: "guardian-risk-replay",
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      privacy: "Derived exclusively from events already stored locally by Guardian Monitor.",
      incident
    };
  }

  function exportHtml(incident, formatters = {}) {
    const labels = formatters.labels || {};
    const locale = formatters.locale || "en";
    const typeLabel = typeof formatters.typeLabel === "function" ? formatters.typeLabel : value => value;
    const reasonLabel = typeof formatters.reasonLabel === "function" ? formatters.reasonLabel : reason => reason.message || reason.id;
    const relationLabel = typeof formatters.relationLabel === "function" ? formatters.relationLabel : relation => relation.code;
    const eventRows = incident.events.map(event => `<li><time>${escapeHtml(new Date(event.timestamp).toLocaleString(locale))}</time><h2>${escapeHtml(typeLabel(event.type))}</h2><p>${escapeHtml([event.domain, event.targetDomain, event.item].filter(Boolean).join(" · "))}</p><p>${escapeHtml(event.note || event.danger || "")}</p><strong>${escapeHtml(event.riskScore)}/100</strong><small>${escapeHtml(relationLabel(event.relationToPrevious))}</small></li>`).join("");
    const reasonRows = incident.reasons.map(reason => `<li><strong>+${escapeHtml(reason.score)}</strong> ${escapeHtml(reasonLabel(reason))}</li>`).join("");
    return `<!doctype html><html lang="${escapeHtml(locale)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(labels.incident || "Incident")} ${escapeHtml(incident.id)}</title><style>body{max-width:900px;margin:40px auto;padding:0 20px;font:16px system-ui;color:#172033;background:#f4f7fb}header,section{background:#fff;border:1px solid #dce2eb;border-radius:16px;padding:24px;margin:16px 0}h1{margin-top:0}.score{font-size:32px;font-weight:800}.timeline{list-style:none;padding:0}.timeline li{border-left:3px solid #2563eb;padding:0 0 24px 20px}.timeline h2{font-size:18px;margin:4px 0}.timeline p{margin:5px 0}.timeline small,.timeline time{display:block;color:#667085}.facts{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media(max-width:650px){.facts{grid-template-columns:1fr}}</style></head><body><header><h1>${escapeHtml(labels.riskReplay || "Risk Replay")}</h1><p>${escapeHtml(labels.incident || "Incident")} ${escapeHtml(incident.id)}</p><div class="score">${escapeHtml(incident.riskScore)}/100 — ${escapeHtml(labels[incident.riskLevel] || incident.riskLevel)}</div></header><section><h2>${escapeHtml(labels.timeline || "Timeline")}</h2><ol class="timeline">${eventRows}</ol></section><section><h2>${escapeHtml(labels.why || "Why this score?")}</h2><ul>${reasonRows}</ul></section><div class="facts"><section><h2>${escapeHtml(labels.known || "What we know")}</h2><ul><li>${escapeHtml(labels.knownEvents || "These events were observed.")}</li><li>${escapeHtml(labels.knownTime || "They occurred close in time.")}</li><li>${escapeHtml(labels.knownSignals || "Some signals were classified as risk.")}</li></ul></section><section><h2>${escapeHtml(labels.unknown || "What we do not know")}</h2><ul><li>${escapeHtml(labels.unknownExecuted || "Whether a downloaded file was executed.")}</li><li>${escapeHtml(labels.unknownCausal || "Whether the events are causally related.")}</li><li>${escapeHtml(labels.unknownCompromise || "Whether a real compromise occurred.")}</li></ul></section></div></body></html>`;
  }

  root.GuardianRiskReplay = Object.freeze({ SCHEMA_VERSION, deriveIncidents, exportObject, exportHtml, escapeHtml });
})(typeof globalThis !== "undefined" ? globalThis : this);
