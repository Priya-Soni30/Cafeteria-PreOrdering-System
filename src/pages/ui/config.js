(function () {
  const UI_BASE = "http://127.0.0.1:5500/src/pages/ui";
  const API_BASE = "http://127.0.0.1:5000";

  window.UI_BASE = UI_BASE;
  window.API_BASE = API_BASE;

  window.uiUrl = function (page) {
    const clean = String(page || "").replace(/^\/+/, "");
    return `${UI_BASE}/${clean}`;
  };

  window.apiUrl = function (path) {
    let clean = String(path || "").trim();
    if (!clean.startsWith("/")) clean = "/" + clean;
    return `${API_BASE}${clean}`;
  };
})();