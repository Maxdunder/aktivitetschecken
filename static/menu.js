// Collapse / expand each section (sidebar sections and settings panels)
document.querySelectorAll(".section-header").forEach(btn => {
  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
  });
});

// Tabs: clicking a sidebar link shows its panel and hides the others
const tabLinks = document.querySelectorAll("[data-tab]");
const panels = document.querySelectorAll(".tab-panel");

function showTab(id) {
  const target = document.getElementById(id);
  if (!target) return;
  panels.forEach(p => { p.hidden = (p !== target); });
  tabLinks.forEach(l => l.classList.toggle("active", l.dataset.tab === id));
}

tabLinks.forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    showTab(link.dataset.tab);
    history.replaceState(null, "", "#" + link.dataset.tab);
  });
});

if (location.hash) showTab(location.hash.slice(1));

// Collapse / expand the whole sidebar, and remember the choice
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");

if (sidebar && sidebarToggle) {
  try {
    if (localStorage.getItem("sidebarCollapsed") === "1") {
      sidebar.classList.add("collapsed");
    }
  } catch (e) {}

  sidebarToggle.addEventListener("click", () => {
    const collapsed = sidebar.classList.toggle("collapsed");
    try {
      localStorage.setItem("sidebarCollapsed", collapsed ? "1" : "0");
    } catch (e) {}
  });
}
