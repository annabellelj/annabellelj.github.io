const year = document.getElementById("year");

if (year) {
  year.textContent = String(new Date().getFullYear());
}

const tabs = Array.from(document.querySelectorAll(".project-tab"));
const cards = Array.from(document.querySelectorAll(".project-card"));
const projectsGrid = document.getElementById("projects-grid");
const RANDOM_COUNT = 4;
const FILTERS = new Set(["all", "cs", "journalism"]);

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function showCards(filter) {
  if (!projectsGrid || cards.length === 0) {
    return;
  }

  cards.forEach((card) => {
    card.classList.remove("is-hidden");
  });

  if (filter === "all") {
    const randomized = shuffle(cards);
    const visible = new Set(randomized.slice(0, Math.min(RANDOM_COUNT, cards.length)));

    randomized.forEach((card) => {
      projectsGrid.append(card);
      if (!visible.has(card)) {
        card.classList.add("is-hidden");
      }
    });
    return;
  }

  const filtered = cards.filter((card) => card.dataset.category === filter);
  filtered.forEach((card) => {
    projectsGrid.append(card);
  });

  cards.forEach((card) => {
    if (card.dataset.category !== filter) {
      card.classList.add("is-hidden");
    }
  });
}

if (tabs.length > 0) {
  const params = new URLSearchParams(window.location.search);
  const initialFilter = params.get("filter");
  const activeFilter = FILTERS.has(initialFilter || "") ? initialFilter : "all";

  tabs.forEach((tab) => {
    const tabFilter = tab.dataset.filter || "all";
    tab.classList.toggle("active", tabFilter === activeFilter);
    tab.addEventListener("click", () => {
      tabs.forEach((item) => item.classList.remove("active"));
      tab.classList.add("active");
      showCards(tabFilter);

      const next = new URL(window.location.href);
      if (tabFilter === "all") {
        next.searchParams.delete("filter");
      } else {
        next.searchParams.set("filter", tabFilter);
      }
      history.replaceState(null, "", `${next.pathname}${next.search}${next.hash}`);
    });
  });

  showCards(activeFilter);
}
