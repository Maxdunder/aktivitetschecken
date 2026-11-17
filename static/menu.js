// Collapse / expand each section (sidebar sections and the Account section)
document.querySelectorAll(".section-header").forEach(btn => {
  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
  });
});

// Tabs: clicking a sidebar link shows its panel and hides the others.
// Panel ids ("panel-...") differ from the URL hash ("#tab-..."), so the
// browser never scrolls the page down to the panel when a hash is present.
const tabLinks = document.querySelectorAll("[data-tab]");
const panels = document.querySelectorAll(".tab-panel");

function showTab(name) {
  const target = document.getElementById("panel-" + name);
  if (!target) return;
  panels.forEach(p => { p.hidden = (p !== target); });
  tabLinks.forEach(l => l.classList.toggle("active", l.dataset.tab === name));
}

tabLinks.forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    showTab(link.dataset.tab);
    history.replaceState(null, "", "#tab-" + link.dataset.tab);
  });
});

// Open the tab named in the URL, e.g. /profile#tab-aktiviteter (default: account)
if (location.hash.startsWith("#tab-")) {
  showTab(location.hash.slice(5));
} else {
  showTab("account");
}

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
