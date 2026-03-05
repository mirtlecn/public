// Table of Contents
(function() {
  'use strict';

  // Create TOC button
  const button = document.createElement('button');
  button.id = 'toc-button';
  button.setAttribute('aria-label', 'Table of Contents');
  button.innerHTML = `
    <svg viewBox="0 0 16 16" width="16" height="16">
      <path d="M5.75 2.5h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5Zm0 5h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5Zm0 5h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5ZM2 14a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-6a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM2 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path>
    </svg>
  `;

  // Create TOC panel
  const panel = document.createElement('div');
  panel.id = 'toc-panel';
  panel.innerHTML = '<div id="toc-content"></div>';

  // Add to body
  document.body.appendChild(button);
  document.body.appendChild(panel);

  // Generate TOC
  function generateTOC() {
    const headings = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id]');
    const content = document.getElementById('toc-content');
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.substring(1));
      const link = document.createElement('a');
      link.href = '#' + heading.id;
      link.textContent = heading.textContent;
      link.className = 'toc-link toc-level-' + level;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        heading.scrollIntoView({ behavior: 'smooth' });
        panel.classList.remove('show');
      });
      content.appendChild(link);
    });
  }

  // Toggle panel
  button.addEventListener('click', () => {
    panel.classList.toggle('show');
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && !button.contains(e.target)) {
      panel.classList.remove('show');
    }
  });

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', generateTOC);
  } else {
    generateTOC();
  }
})();
