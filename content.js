(() => {
  const seen = new WeakMap();
  const MAX_FILES = 20;
  const credentialFormsSeen = new WeakMap();

  function cleanText(value, maxLength) {
    return String(value ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, maxLength);
  }

  function fileMeta(file) {
    const name = cleanText(file.name, 180);
    const parts = name.split(".");
    return {
      name,
      size: Number.isFinite(file.size) && file.size >= 0 ? Math.floor(file.size) : 0,
      type: cleanText(file.type || "", 120),
      extension: parts.length > 1 ? cleanText(parts.pop(), 16).toLowerCase().replace(/[^a-z0-9]/g, "") : "",
      lastModified: Number.isFinite(file.lastModified) && file.lastModified >= 0 ? Math.floor(file.lastModified) : null
    };
  }

  function originOnly(value) {
    try {
      const url = new URL(value, location.href);
      return new Set(["http:", "https:"]).has(url.protocol) ? url.origin : "";
    } catch {
      return "";
    }
  }

  function send(type, files, extra = {}) {
    const safeFiles = Array.from(files || []).slice(0, MAX_FILES).map(fileMeta).filter(file => file.name);
    if (!safeFiles.length) return;
    chrome.runtime.sendMessage({
      kind: "filewatch_event",
      event: {
        type,
        files: safeFiles,
        frame: window.top === window ? "top" : "iframe",
        ...extra
      }
    }).catch(() => {});
  }


  function credentialMeta(form) {
    const passwordFields = [...form.querySelectorAll('input[type="password"]')];
    if (!passwordFields.length) return null;
    const usernamePresent = Boolean(form.querySelector('input[autocomplete="username"],input[type="email"],input[name*="user" i],input[name*="login" i],input[name*="email" i]'));
    return {
      formAction: originOnly(form.action || location.href),
      method: cleanText((form.method || "get").toUpperCase(), 10),
      passwordFieldCount: Math.min(passwordFields.length, 10),
      usernamePresent,
      pageProtocol: location.protocol === "https:" ? "https" : location.protocol === "http:" ? "http" : "other",
      frame: window.top === window ? "top" : "iframe"
    };
  }

  function sendCredentialRisk(form) {
    const now = Date.now();
    const last = credentialFormsSeen.get(form) || 0;
    if (now - last < 5000) return;
    const meta = credentialMeta(form);
    if (!meta) return;
    credentialFormsSeen.set(form, now);
    chrome.runtime.sendMessage({ kind: "credential_form_event", event: meta }).catch(() => {});
  }

  document.addEventListener("change", event => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== "file" || !input.files?.length) return;
    const files = Array.from(input.files).slice(0, MAX_FILES);
    seen.set(input, files);
    send("file_selected", files, {
      fieldName: cleanText(input.name || "", 80),
      formAction: originOnly(input.form?.action || "")
    });
  }, true);

  document.addEventListener("submit", event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    sendCredentialRisk(form);
    const files = [];
    form.querySelectorAll('input[type="file"]').forEach(input => {
      if (files.length >= MAX_FILES) return;
      if (input.files?.length) files.push(...Array.from(input.files).slice(0, MAX_FILES - files.length));
      else if (seen.has(input)) files.push(...seen.get(input).slice(0, MAX_FILES - files.length));
    });
    send("form_submit", files, {
      formAction: originOnly(form.action || location.href),
      method: cleanText((form.method || "get").toUpperCase(), 10)
    });
  }, true);
})();
