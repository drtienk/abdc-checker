const input = document.getElementById("journal-input");
const result = document.getElementById("result");
const status = document.getElementById("loaded-count");

let journals = [];

function normalize(text) {
  return (text || "").toLowerCase().replace(/[^a-z0-9]/g, "");
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
      const normalizedName = normalize(item.name);
      const distance = levenshtein(normalizedQuery, normalizedName);
      const startsWithBonus = normalizedName.startsWith(normalizedQuery) ? -2 : 0;

      return {
        ...item,
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
    <p><strong>${journal.name}</strong></p>
    <p>Rating: <strong>${journal.rating}</strong></p>
  `;
}

function renderNotFound(query) {
  const suggestions = findSuggestions(query);
  const suggestionItems = suggestions
    .map((item) => `<li>${item.name} <span class="rank">(${item.rating})</span></li>`)
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

function search() {
  const query = input.value.trim();

  if (!query) {
    renderEmpty();
    return;
  }

  const normalizedQuery = normalize(query);
  const match = journals.find((item) => normalize(item.name) === normalizedQuery);

  if (match) {
    renderFound(match);
    return;
  }

  renderNotFound(query);
}

async function loadJournals() {
  const response = await fetch("/data/abdc.json");
  journals = await response.json();
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
  status.textContent = "Could not load journal data";
  result.className = "result-card not-found";
  result.innerHTML = "<h2>NOT FOUND</h2><p>Data failed to load.</p>";
});
