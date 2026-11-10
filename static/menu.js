// Collapse / expand each section (sidebar sections and settings panels)
document.querySelectorAll(".section-header").forEach(btn => {
  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
  });
});
 
// Open a settings panel when its sidebar link is clicked
document.querySelectorAll('.sidebar a[href^="#"]').forEach(link => {
  link.addEventListener("click", () => {
    const panel = document.querySelector(link.getAttribute("href"));
    const header = panel && panel.querySelector(".section-header");
    if (header) header.setAttribute("aria-expanded", "true");
  });
});
 
// Collapse / expand the whole sidebar, and remember the choice
const sidebar = document.getElementById("sidebar");
try {
  if (localStorage.getItem("sidebarCollapsed") === "1") {
    sidebar.classList.add("collapsed");
  }
} catch (e) {}
 
document.getElementById("sidebarToggle").addEventListener("click", () => {
  const collapsed = sidebar.classList.toggle("collapsed");
  try {
    localStorage.setItem("sidebarCollapsed", collapsed ? "1" : "0");
  } catch (e) {}
});
 
