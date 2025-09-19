// assets/js/include.js
async function includeHTML(id, filePath) {
  const element = document.getElementById(id);
  if (element) {
    const res = await fetch(filePath);
    const html = await res.text();
    element.innerHTML = html;
    if (id === "header") {
      setActiveNavLink(); 
    }
  }
}




includeHTML("footer", "footer-header/footer.html");
