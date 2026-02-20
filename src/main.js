const DATA_PATH = "/data/abdc.json";
const RUNTIME_SOURCE = "public/data/abdc.json";
const DEBUG_MODE = new URLSearchParams(window.location.search).get("debug") === "1";

const input = document.getElementById("journal-input");
const result = document.getElementById("result");
const status = document.getElementById("loaded-count");
const source = document.getElementById("data-source");

let journals = [];
let journalIndex = new Map();

function normalize(text) {
  return (text || "")
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, " ")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\band\b/g, "and")
    .replace(/\s+/g, "")
    .trim();
}

function getTitle(item) {
  return (item.title || item.name || "").trim();
}

function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }

  return matrix[a.length][b.length];
}

function findSuggestions(query, count = 5) {
  const normalizedQuery = normalize(query);

  return journals
    .map((item) => {
      const title = getTitle(item);
      const normalizedTitle = normalize(title);
      const distance = levenshtein(normalizedQuery, normalizedTitle);
      const startsWithBonus = normalizedTitle.startsWith(normalizedQuery) ? -2 : 0;

      return {
        ...item,
        title,
        normalizedTitle,
        score: distance + startsWithBonus
      };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, count);
}

function renderFound(journal) {
  result.className = "result-card found";
  result.innerHTML = `
    <h2>FOUND</h2>
    <p><strong>${getTitle(journal)}</strong></p>
    <p>Rating: <strong>${journal.rating || "N/A"}</strong></p>
  `;
}

function renderNotFound(query) {
  const normalizedQuery = normalize(query);
  const suggestions = findSuggestions(query);
  const suggestionItems = suggestions
    .map((item) => `<li>${item.title} <span class="rank">(${item.rating || "N/A"})</span></li>`)
    .join("");

  let debugBlock = "";
  if (DEBUG_MODE) {
    const closestNormalized = suggestions.map((item) => item.normalizedTitle).join(", ");
    console.debug("[ABDC DEBUG] not found", { normalizedQuery, closestNormalized, suggestions });
    debugBlock = `
      <details class="debug-block" open>
        <summary>Debug details</summary>
        <p><strong>Normalized query:</strong> <code>${normalizedQuery}</code></p>
        <p><strong>Closest normalized candidates:</strong> <code>${closestNormalized || "(none)"}</code></p>
      </details>
    `;
  }

  result.className = "result-card not-found";
  result.innerHTML = `
    <h2>NOT FOUND</h2>
    <p><strong>${query}</strong> is not an exact match.</p>
    <p class="suggestion-title">Suggestions:</p>
    <ul>${suggestionItems}</ul>
    ${debugBlock}
  `;
}

function renderEmpty() {
  result.className = "result-card";
  result.innerHTML = "<h2>Type a journal name to begin.</h2>";
}

function buildLookupIndex(items) {
  const index = new Map();
  for (const item of items) {
    const key = normalize(getTitle(item));
    if (key && !index.has(key)) {
      index.set(key, item);
    }
  }
  return index;
}

function search() {
  const query = input.value;
  if (!query.trim()) {
    renderEmpty();
    return;
  }

  const normalizedQuery = normalize(query);
  const match = journalIndex.get(normalizedQuery);

  if (match) {
    renderFound(match);
    return;
  }

  renderNotFound(query.trim());
}

async function loadJournals() {
  const response = await fetch(DATA_PATH);
  journals = await response.json();
  journalIndex = buildLookupIndex(journals);

  source.textContent = `Runtime data source: ${DATA_PATH} (served from ${RUNTIME_SOURCE})`;
  status.textContent = `Loaded ${journals.length} journals`;
  renderEmpty();
}

input.addEventListener("input", search);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    search();
  }
});

loadJournals().catch(() => {
  source.textContent = `Runtime data source: ${DATA_PATH}`;
  status.textContent = "Could not load journal data";
  result.className = "result-card not-found";
  result.innerHTML = "<h2>NOT FOUND</h2><p>Data failed to load.</p>";
});
