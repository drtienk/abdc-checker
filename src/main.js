const input = document.getElementById("journal-input");
const button = document.getElementById("search-btn");
const result = document.getElementById("result");
const loadedNote = document.getElementById("loaded-note");

let journals = [];

function normalize(text) {
  let value = String(text || "").toLowerCase();
  value = value.replace(/&/g, " and ");
  value = value.replace(/^\s*the\s+/i, "");
  value = value.replace(/[^a-z0-9\s]/g, " ");
  value = value.replace(/\s+/g, " ").trim();
  return value;
}

function compact(text) {
  return normalize(text).replace(/\s+/g, "");
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

function suggestionsFor(query, list, count = 5) {
  const normalizedQuery = compact(query);
  return list
    .map((item) => {
      const normalizedTitle = compact(item.title);
      return {
        ...item,
        score: levenshtein(normalizedQuery, normalizedTitle)
      };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, count);
}

function renderFound(journal) {
  result.className = "result-card found";
  result.innerHTML = `
    <h2>Found in ABDC list</h2>
    <p><strong>${journal.title}</strong></p>
    <p>Rating: <strong>${journal.rating || "N/A"}</strong></p>
    <p>ISSN: ${journal.issn || "N/A"}</p>
    <p>Online ISSN: ${journal.issn_online || "N/A"}</p>
    <p>Publisher: ${journal.publisher || "N/A"}</p>
    <p>FoR: ${journal.for_code || "N/A"}</p>
    <p>Year inception: ${journal.year || "N/A"}</p>
  `;
}

function renderNotFound(query) {
  const suggestions = suggestionsFor(query, journals)
    .map((item) => `<li>${item.title} <span class="rank">(${item.rating || "N/A"})</span></li>`)
    .join("");

  result.className = "result-card not-found";
  result.innerHTML = `
    <h2>Not found in ABDC list</h2>
    <p><strong>${query}</strong> is not an exact normalized match.</p>
    <p>Top suggestions:</p>
    <ul>${suggestions}</ul>
  `;
}

function search() {
  const query = input.value.trim();
  if (!query) {
    result.className = "result-card not-found";
    result.innerHTML = "<h2>Please enter a journal title.</h2>";
    return;
  }

  const normalizedQuery = compact(query);
  const match = journals.find((item) => compact(item.title) === normalizedQuery);

  if (match) {
    renderFound(match);
  } else {
    renderNotFound(query);
  }
}

async function loadData() {
  try {
    const response = await fetch("/data/abdc.json");
    if (!response.ok) throw new Error("Failed to fetch data");
    journals = await response.json();
    loadedNote.textContent = `Loaded ${journals.length} journals`;
  } catch (_error) {
    loadedNote.textContent = "Loaded 0 journals";
    result.className = "result-card error";
    result.innerHTML = "<h2>Failed to load ABDC data.</h2><p>Run data generation and try again.</p>";
  }
}

button.addEventListener("click", search);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") search();
});

loadData();
