// Rise Essay Box with SCORM 2004 Reporting for Articulate Reach
// Revised: no text limits, no course completion, dynamic shortcode labels

console.log("🎯 simple-test.js loaded (revised)");

(function () {
  console.log("Rise Essay Box Script - Starting...");

  let scormAPI = null;

  // ---- SCORM Helpers ----
  function findSCORMAPI() {
    let win = window;
    for (let i = 0; i < 10; i++) {
      if (win.API_1484_11) return win.API_1484_11;
      if (win.API) return win.API;
      if (win === win.parent) break;
      win = win.parent;
    }
    return null;
  }

  function saveReflectionToSCORM(id, label) {
    const text = document.getElementById(`essay-input-${id}`).value;
    const statusSpan = document.getElementById(`essay-savestatus-${id}`);

    if (!scormAPI) scormAPI = findSCORMAPI();
    if (!scormAPI) {
      statusSpan.textContent = "⚠️ No LMS connection";
      return;
    }

    try {
      const index = parseInt(scormAPI.GetValue("cmi.interactions._count") || "0");
      const now = new Date();
      const timestamp = now.toISOString();

      scormAPI.SetValue(`cmi.interactions.${index}.id`, id);
      scormAPI.SetValue(`cmi.interactions.${index}.type`, "fill-in");
      scormAPI.SetValue(`cmi.interactions.${index}.timestamp`, timestamp);
      scormAPI.SetValue(`cmi.interactions.${index}.description`, label);
      scormAPI.SetValue(`cmi.interactions.${index}.learner_response`, text);
      scormAPI.SetValue(`cmi.interactions.${index}.result`, "neutral");

      const commitResult = scormAPI.Commit("");
      statusSpan.textContent =
        commitResult === "true" ? "💾 Saved" : "❌ Save failed";
    } catch (e) {
      statusSpan.textContent = "❌ Error: " + e.message;
    }
  }

  // ---- Shortcode Parser ----
  const SHORTCODE_REGEX = /^\[essay(?:\s+([^\]]+))?\]$/i;

  function parseAttributesSmart(str) {
    const attrs = {};
    if (!str) return attrs;
    const re = /(\w+)=["'“”‘’]([^"'“”‘’]+)["'“”‘’]/g;
    let m;
    while ((m = re.exec(str)) !== null) attrs[m[1]] = m[2];
    return attrs;
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (ch) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[ch])
    );
  }

  function createEssayHTML(id, label) {
    return `
      <div id="essay-${id}" class="reach-essay" style="margin:1rem 0; padding:1rem; border:1px solid #ddd; border-radius:8px;">
        <label for="essay-input-${id}" style="display:block; font-weight:600; margin-bottom:.5rem;">
          ${escapeHtml(label || "Essay Question")}
        </label>
        <textarea id="essay-input-${id}" rows="5"
          style="width:100%; padding:.75rem; font:inherit; border:1px solid #ccc; border-radius:6px; resize: vertical;"
          placeholder="Type your response here..."></textarea>
        <div style="display:flex; gap:1rem; align-items:center; margin-top:.5rem;">
          <span id="essay-charcount-${id}">0 characters</span>
          <span id="essay-savestatus-${id}" aria-live="polite"></span>
        </div>
        <div style="margin-top:.75rem; display:flex; gap:.5rem; flex-wrap:wrap;">
          <button id="essay-save-${id}" type="button"
            style="padding:.5rem .75rem; border:1px solid #0078D4; background:#0078D4; color:#fff; border-radius:4px; cursor:pointer;">
            💾 Save Response
          </button>
          <button id="essay-clear-${id}" type="button"
            style="padding:.5rem .75rem; border:1px solid #999; background:#fff; color:#333; border-radius:4px; cursor:pointer;">
            Clear
          </button>
        </div>
      </div>
    `;
  }

  function attachHandlers(id, label) {
    const ta = document.getElementById(`essay-input-${id}`);
    const count = document.getElementById(`essay-charcount-${id}`);
    const saveBtn = document.getElementById(`essay-save-${id}`);
    const clearBtn = document.getElementById(`essay-clear-${id}`);
    const status = document.getElementById(`essay-savestatus-${id}`);

    if (ta && count) {
      const update = () => (count.textContent = `${ta.value.length} characters`);
      ta.addEventListener("input", update);
      update();
    }
    if (saveBtn && ta && status) {
      saveBtn.addEventListener("click", () =>
        saveReflectionToSCORM(id, label)
      );
    }
    if (clearBtn && ta && status) {
      clearBtn.addEventListener("click", () => {
        ta.value = "";
        ta.dispatchEvent(new Event("input"));
        status.textCon
