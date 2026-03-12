// Table of Contents
(function() {
  'use strict';

  // Create TOC button
  const button = document.createElement('button');
  button.id = 'toc-button';
  button.setAttribute('aria-label', 'Table of Contents');
  button.innerHTML = `
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path class="toc-icon-line toc-icon-line-top" d="M3 4.5h10"></path>
      <path class="toc-icon-line toc-icon-line-middle" d="M3 8h10"></path>
      <path class="toc-icon-line toc-icon-line-bottom" d="M3 11.5h10"></path>
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
        button.classList.remove('active');
      });
      content.appendChild(link);
    });
  }

  // Toggle panel
  button.addEventListener('click', () => {
    panel.classList.toggle('show');
    button.classList.toggle('active');
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && !button.contains(e.target)) {
      panel.classList.remove('show');
      button.classList.remove('active');
    }
  });

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      generateTOC();
      addCopyButtons();
    });
  } else {
    generateTOC();
    addCopyButtons();
  }

  // Copy buttons for code blocks
  function addCopyButtons() {
    const COPY_ICON = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path>
      <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>
    </svg>`;
    const CHECK_ICON = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path fill="#3fb950" d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
    </svg>`;

    document.querySelectorAll('pre').forEach(pre => {
      let wrapper = pre.parentElement;
      if (!wrapper || !wrapper.classList.contains('code-block-wrap')) {
        wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrap';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);
      }

      // avoid duplicates
      if (wrapper.querySelector('.copy-code-btn')) return;

      const btn = document.createElement('button');
      btn.className = 'copy-code-btn';
      btn.setAttribute('aria-label', 'Copy code');
      btn.innerHTML = COPY_ICON;

      const tooltip = document.createElement('span');
      tooltip.className = 'copy-code-tooltip';
      tooltip.textContent = 'Copied!';
      btn.appendChild(tooltip);

      btn.addEventListener('click', () => {
        const code = pre.querySelector('code');
        const text = code ? code.innerText : pre.innerText;
        navigator.clipboard.writeText(text).then(() => {
          btn.innerHTML = CHECK_ICON;
          btn.appendChild(tooltip);
          btn.classList.add('copied');
          tooltip.classList.add('show');
          setTimeout(() => {
            btn.innerHTML = COPY_ICON;
            btn.appendChild(tooltip);
            btn.classList.remove('copied');
            tooltip.classList.remove('show');
          }, 2000);
        });
      });

      wrapper.appendChild(btn);
    });
  }
})();
