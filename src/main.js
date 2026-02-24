const DATA_PATH = "/data/abdc.json";
const RUNTIME_SOURCE = "public/data/abdc.json";

const input = document.getElementById("journal-input");
const result = document.getElementById("result");
const status = document.getElementById("loaded-count");
const source = document.getElementById("data-source");
const fields = document.getElementById("field-info");

const scholarKeywordInput = document.getElementById("scholarKeyword");
const scholarJournalInput = document.getElementById("scholarJournal");
const scholarSearchBtn = document.getElementById("scholarSearchBtn");
const scholarStatus = document.getElementById("scholarStatus");
const journalList = document.getElementById("journalList");

const SCHOLAR_KEYWORD_STORAGE = "scholarKeyword";
const SCHOLAR_JOURNAL_STORAGE = "scholarJournal";

let scholarTab = null;

let journals = [];
let journalIndex = new Map();

function normalize(text) {
  return (text || "")
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
  return (item.name || item.title || "").trim();
}

function getRating(item) {
  return (item.rating || item.rank || "N/A").trim();
}

function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

function findSuggestions(query, count = 5) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  return journals
    .map((item) => {
      const title = getTitle(item);
      const normalizedTitle = normalize(title);
      const distance = levenshtein(normalizedQuery, normalizedTitle);
      const startsWithBonus = normalizedTitle.startsWith(normalizedQuery) ? -2 : 0;

      return {
        ...item,
        title,
        score: distance + startsWithBonus
      };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, count)
    .map((x) => x.item);
}

function renderFound(journal) {
  result.className = "result-card found";
  result.innerHTML = `
    <h2>FOUND</h2>
    <p><strong>${getTitle(journal)}</strong></p>
    <p>Rating: <strong>${getRating(journal)}</strong></p>
  `;
}

function renderNotFound(query) {
  const suggestions = findSuggestions(query);
  const suggestionItems = suggestions
    .map((item) => `<li>${item.title} <span class="rank">(${getRating(item)})</span></li>`)
    .join("");

  result.className = "result-card not-found";
  result.innerHTML = `
    <h2>NOT FOUND</h2>
    <p><strong>${query}</strong> is not an exact match.</p>
    <p class="suggestion-title">Suggestions:</p>
    <ul>${suggestionItems}</ul>
  `;
}

function renderEmpty() {
  result.className = "result-card";
  result.innerHTML = "<h2>Type a journal name to begin.</h2>";
}


function setScholarReadyState(ready) {
  scholarKeywordInput.disabled = !ready;
  scholarJournalInput.disabled = !ready;
  scholarSearchBtn.disabled = !ready;
}

function setScholarStatus(message) {
  scholarStatus.textContent = message;
}

function restoreScholarInputs() {
  scholarKeywordInput.value = localStorage.getItem(SCHOLAR_KEYWORD_STORAGE) || "";
  scholarJournalInput.value = localStorage.getItem(SCHOLAR_JOURNAL_STORAGE) || "";
}

function persistScholarInputs() {
  localStorage.setItem(SCHOLAR_KEYWORD_STORAGE, scholarKeywordInput.value);
  localStorage.setItem(SCHOLAR_JOURNAL_STORAGE, scholarJournalInput.value);
}

function populateScholarJournals(items) {
  const options = [...new Set(items.map((item) => getTitle(item)).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  journalList.innerHTML = "";
  const fragment = document.createDocumentFragment();
  for (const title of options) {
    const option = document.createElement("option");
    option.value = title;
    fragment.appendChild(option);
  }
  journalList.appendChild(fragment);
}

function openOrReuseTab(url, name = "scholarResults") {
  if (scholarTab && !scholarTab.closed) {
    scholarTab.location.href = url;
    scholarTab.focus();
    return true;
  }

  scholarTab = window.open(url, name);
  if (!scholarTab) {
    setScholarStatus("Popup blocked. Please allow popups and try again.");
    return false;
  }

  scholarTab.focus();
  return true;
}

function runScholarSearch() {
  if (!journals.length) {
    setScholarStatus("Loading journals...");
    return;
  }

  const keyword = scholarKeywordInput.value.trim();
  const journal = scholarJournalInput.value.trim();

  if (!keyword) {
    setScholarStatus("Keyword required");
    return;
  }

  if (!journal) {
    setScholarStatus("Select a journal");
    return;
  }

  persistScholarInputs();

  const escapedKeyword = keyword.replace(/"/g, String.raw`\\"`);
  const escapedJournal = journal.replace(/"/g, String.raw`\\"`);
  const q = `allintitle:"${escapedKeyword}" source:"${escapedJournal}"`;
  const url = `https://scholar.google.com/scholar?q=${encodeURIComponent(q)}`;

  if (openOrReuseTab(url)) {
    setScholarStatus("Opened Google Scholar in reusable tab.");
  }
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

function openOrReuseTab(url, name = "scholarResults") {
  // 用 window.open(url, name) 就能確保同名視窗會被重用
  const w = window.open(url, name);
  if (!w) {
    setScholarStatus("Popup blocked. Please allow popups and try again.");
    return false;
  }
  scholarTab = w;
  try {
    w.focus();
  } catch {
    // ignore
  }
  return true;
}

function runScholarSearch() {
  if (!HAS_SCHOLAR_UI) return;

  if (!journals.length) {
    setScholarStatus("Loading journals...");
    return;
  }

  const keyword = scholarKeywordInput.value.trim();
  const journal = scholarJournalInput.value.trim();

  if (!keyword) {
    setScholarStatus("Keyword required");
    return;
  }
  if (!journal) {
    setScholarStatus("Select a journal");
    return;
  }

  renderNotFound(query.trim());
}

async function loadJournals() {
  const response = await fetch(DATA_PATH);
  journals = await response.json();
  journalIndex = buildLookupIndex(journals);

  source.textContent = `Runtime data source: ${DATA_PATH} (served from ${RUNTIME_SOURCE})`;
  fields.textContent = "Lookup fields: title=name→title, rating=rating→rank";
  status.textContent = `Loaded ${journals.length} journals`;

  populateScholarJournals(journals);
  setScholarReadyState(true);
  setScholarStatus(`Ready. Journals loaded: ${journals.length}`);

  renderEmpty();
}

input.addEventListener("input", search);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    search();
  }
});


setScholarReadyState(false);
setScholarStatus("Loading journals...");
restoreScholarInputs();

scholarKeywordInput.addEventListener("input", persistScholarInputs);
scholarJournalInput.addEventListener("input", persistScholarInputs);
scholarSearchBtn.addEventListener("click", runScholarSearch);

loadJournals().catch(() => {
  source.textContent = `Runtime data source: ${DATA_PATH}`;
  fields.textContent = "Lookup fields: title=name→title, rating=rating→rank";
  status.textContent = "Could not load journal data";
  setScholarReadyState(false);
  setScholarStatus("Could not load journals for Scholar Search");
  result.className = "result-card not-found";
  result.innerHTML = "<h2>NOT FOUND</h2><p>Data failed to load.</p>";
});
