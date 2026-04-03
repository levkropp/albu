// Loads the canonical sidebar and highlights the current page
(function() {
  const sidebar = document.querySelector('.docs-sidebar');
  if (!sidebar) return;
  const page = sidebar.getAttribute('data-active');

  fetch('/albu/docs/sidebar.html')
    .then(r => r.text())
    .then(html => {
      sidebar.innerHTML = html;
      if (page) {
        const link = sidebar.querySelector('[data-page="' + page + '"]');
        if (link) link.classList.add('active');
      }
    })
    .catch(() => {
      // Fallback: leave whatever static sidebar content is there
    });
})();
