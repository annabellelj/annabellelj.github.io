const year = document.getElementById("year");
if (year) {
  year.textContent = String(new Date().getFullYear());
}

/* Reveal sections as they scroll into view. */
(function () {
  const items = Array.from(document.querySelectorAll(".reveal"));
  if (items.length === 0) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  items.forEach((item) => observer.observe(item));
})();

/* Highlight the nav link for whichever section is in view. */
(function () {
  const links = Array.from(document.querySelectorAll(".nav-links a[data-spy]"));
  if (links.length === 0 || !("IntersectionObserver" in window)) return;

  const byId = new Map();
  const sections = [];

  links.forEach((link) => {
    const section = document.getElementById(link.dataset.spy);
    if (!section) return;
    byId.set(section.id, link);
    sections.push(section);
  });

  if (sections.length === 0) return;

  const visible = new Set();

  function paint() {
    let active = null;
    sections.forEach((section) => {
      if (visible.has(section.id)) active = active || section.id;
    });

    links.forEach((link) => {
      const on = link.dataset.spy === active;
      link.classList.toggle("is-active", on);
      if (on) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visible.add(entry.target.id);
        } else {
          visible.delete(entry.target.id);
        }
      });
      paint();
    },
    { threshold: 0, rootMargin: "-45% 0px -45% 0px" }
  );

  sections.forEach((section) => observer.observe(section));
})();

/* Thin progress bar across the top of the page. */
(function () {
  const bar = document.getElementById("scroll-bar");
  if (!bar) return;

  let ticking = false;

  function update() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    bar.style.transform = "scaleX(" + ratio + ")";
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );

  window.addEventListener("resize", update);
  update();
})();

/* Keep the split panes in sync: hovering one dims the other, and a keyboard
   focus gets the same treatment so the two tracks stay legible. */
(function () {
  const split = document.querySelector(".split");
  if (!split) return;

  const panes = Array.from(split.querySelectorAll(".split-pane"));

  panes.forEach((pane) => {
    ["mouseenter", "focus"].forEach((evt) =>
      pane.addEventListener(evt, () => split.classList.add("is-engaged"))
    );
    ["mouseleave", "blur"].forEach((evt) =>
      pane.addEventListener(evt, () => split.classList.remove("is-engaged"))
    );
  });
})();

/* Drive the pinned point cloud from whichever scrollytelling step is
   centred in the viewport. */
(function () {
  const steps = Array.from(document.querySelectorAll(".step[data-step]"));
  if (steps.length === 0) return;

  function activate(step) {
    steps.forEach((s) => s.classList.toggle("is-current", s === step));
    if (window.heroScene) window.heroScene.setMood(step.dataset.step);
  }

  if (!("IntersectionObserver" in window)) {
    steps.forEach((s) => s.classList.add("is-current"));
    return;
  }

  activate(steps[0]);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) activate(entry.target);
      });
    },
    { threshold: 0, rootMargin: "-45% 0px -45% 0px" }
  );

  steps.forEach((step) => observer.observe(step));
})();
