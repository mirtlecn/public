// Table of Contents
(function() {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const PANEL_GAP = 32;
  const PANEL_WIDTH = 260;
  const DEFAULT_PINNED_PANEL_WIDTH = 280;
  const MIN_CONTENT_GUTTER = 32;
  const BUTTON_ICON = {
    menu: `
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <path class="toc-icon-line" d="M3 4.5h10"></path>
        <path class="toc-icon-line" d="M3 8h10"></path>
        <path class="toc-icon-line" d="M3 11.5h10"></path>
      </svg>
    `,
    pin: `
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none">
        <path d="M13.6315 8.22382L13.2651 7.85744C11.735 6.32736 10.97 5.56232 10.1406 5.56299C9.86971 5.56321 9.60165 5.61847 9.35273 5.72542C8.59071 6.05283 8.19063 7.05807 7.39047 9.06855L7.33256 9.21406C7.10572 9.78403 6.9923 10.069 6.81015 10.2989C6.67197 10.4733 6.50565 10.6235 6.31804 10.7431C6.07076 10.9009 5.77568 10.9846 5.18554 11.1521C4.27042 11.4118 3.81287 11.5417 3.60981 11.8186C3.4589 12.0244 3.3924 12.2802 3.42392 12.5334C3.46633 12.8742 3.80265 13.2105 4.47529 13.8832L7.60579 17.0137C8.27843 17.6863 8.61475 18.0226 8.95553 18.065C9.20879 18.0966 9.46451 18.03 9.67033 17.8791C9.94727 17.6761 10.0771 17.2185 10.3369 16.3034C10.5044 15.7133 10.5881 15.4182 10.7458 15.1709C10.8655 14.9833 11.0156 14.817 11.19 14.6788C11.4199 14.4967 11.7049 14.3832 12.2749 14.1564L12.4204 14.0985C14.4309 13.2983 15.4361 12.8982 15.7635 12.1362C15.8705 11.8873 15.9257 11.6192 15.926 11.3483C15.9266 10.5189 15.1616 9.7539 13.6315 8.22382Z" stroke="currentColor" stroke-width="1.5"></path>
        <path opacity="0.5" d="M3.34679 18.142L6.04053 15.4482" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
        <path opacity="0.5" d="M22 8H17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
        <path opacity="0.5" d="M22 12.5H18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
        <path opacity="0.5" d="M22 17H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
      </svg>
    `,
    close: `
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <path d="M3.22 3.22a.75.75 0 0 1 1.06 0L8 6.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L9.06 8l3.72 3.72a.75.75 0 1 1-1.06 1.06L8 9.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06L6.94 8 3.22 4.28a.75.75 0 0 1 0-1.06Z" fill="currentColor"></path>
      </svg>
    `
  };
  const contentShell = document.createElement('div');
  const contentSlot = document.createElement('div');
  let isPinned = false;
  let baseContentWidth = 0;
  let buttonIconMode = 'menu';
  let buttonIconTimer = null;
  let pinnedCloseTimer = null;
  let isPanelHovered = false;
  let isButtonHovered = false;
  let pinnedPanelWidth = DEFAULT_PINNED_PANEL_WIDTH;

  // Create TOC button
  const button = document.createElement('button');
  button.id = 'toc-button';
  button.setAttribute('aria-label', 'Open table of contents');
  button.innerHTML = BUTTON_ICON.menu;

  // Create TOC panel
  const panel = document.createElement('div');
  panel.id = 'toc-panel';
  panel.innerHTML = '<div id="toc-content"></div>';

  contentShell.id = 'toc-layout-shell';
  contentSlot.id = 'toc-layout-content';
  contentShell.appendChild(contentSlot);

  function movePageContentIntoShell() {
    const movableNodes = Array.from(body.childNodes).filter(node => {
      if (node === button || node === panel) {
        return false;
      }

      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SCRIPT') {
        return false;
      }

      return true;
    });

    if (!movableNodes.length) {
      const firstScript = body.querySelector('script');
      if (firstScript) {
        body.insertBefore(contentShell, firstScript);
      } else {
        body.appendChild(contentShell);
      }
      return;
    }

    body.insertBefore(contentShell, movableNodes[0]);
    movableNodes.forEach(node => {
      contentSlot.appendChild(node);
    });
  }

  movePageContentIntoShell();
  body.appendChild(button);
  body.appendChild(panel);

  function isTransparentColor(color) {
    return !color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)';
  }

  function parseRgbColor(color) {
    const match = color && color.match(/\d+(\.\d+)?/g);
    if (!match || match.length < 3) {
      return null;
    }

    return match.slice(0, 3).map(Number);
  }

  function mixColor(baseColor, targetColor, ratio) {
    const baseRgb = parseRgbColor(baseColor);
    const targetRgb = parseRgbColor(targetColor);

    if (!baseRgb || !targetRgb) {
      return baseColor;
    }

    const mixed = baseRgb.map((value, index) => {
      return Math.round(value * (1 - ratio) + targetRgb[index] * ratio);
    });

    return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
  }

  function getPageThemeStyles() {
    const themeElement = document.querySelector('.markdown-body, main, article, [role="main"]') || document.body;
    const themeStyle = window.getComputedStyle(themeElement);
    const bodyStyle = window.getComputedStyle(document.body);
    const htmlStyle = window.getComputedStyle(root);
    const backgroundColor = isTransparentColor(themeStyle.backgroundColor)
      ? (isTransparentColor(bodyStyle.backgroundColor) ? htmlStyle.backgroundColor : bodyStyle.backgroundColor)
      : themeStyle.backgroundColor;
    const textColor = themeStyle.color || bodyStyle.color || htmlStyle.color;

    return {
      backgroundColor: isTransparentColor(backgroundColor) ? '#ffffff' : backgroundColor,
      textColor: textColor || '#24292f',
      accentColor: themeStyle.getPropertyValue('--ravel-accent-color').trim(),
      fontFamily: themeStyle.fontFamily || bodyStyle.fontFamily || htmlStyle.fontFamily
    };
  }

  function getContentWidth() {
    return Math.ceil(contentSlot.getBoundingClientRect().width);
  }

  function getPinnedContentWidth() {
    return Math.max(baseContentWidth, getContentWidth(), 0);
  }

  function getPinnedPanelWidth() {
    return Math.max(pinnedPanelWidth, PANEL_WIDTH);
  }

  function measurePinnedPanelWidth() {
    const panelRect = panel.getBoundingClientRect();
    if (!panelRect.width) {
      pinnedPanelWidth = DEFAULT_PINNED_PANEL_WIDTH;
      return;
    }

    pinnedPanelWidth = Math.max(Math.round(window.innerWidth - panelRect.left), PANEL_WIDTH);
  }

  function canPinPanel() {
    const pinnedContentWidth = getPinnedContentWidth();
    const requiredWidth = pinnedContentWidth + getPinnedPanelWidth() + PANEL_GAP + (MIN_CONTENT_GUTTER * 2);
    return window.innerWidth >= requiredWidth;
  }

  function getAccentColor(fallbackColor) {
    const link = document.querySelector('a[href]');
    if (!link) {
      return fallbackColor;
    }

    const linkColor = window.getComputedStyle(link).color;
    return isTransparentColor(linkColor) ? fallbackColor : linkColor;
  }

  function syncTocTheme() {
    const theme = getPageThemeStyles();
    const accentColor = theme.accentColor || getAccentColor(theme.textColor);

    root.style.setProperty('--toc-background-color', theme.backgroundColor);
    root.style.setProperty('--toc-text-color', theme.textColor);
    root.style.setProperty('--toc-border-color', mixColor(theme.backgroundColor, theme.textColor, 0.18));
    root.style.setProperty('--toc-hover-background-color', mixColor(theme.backgroundColor, theme.textColor, 0.08));
    root.style.setProperty('--toc-hover-border-color', mixColor(theme.backgroundColor, theme.textColor, 0.28));
    root.style.setProperty('--toc-active-shadow-color', mixColor(theme.backgroundColor, theme.textColor, 0.12));
    root.style.setProperty('--toc-accent-color', accentColor);
    root.style.setProperty('--toc-muted-color', mixColor(theme.textColor, theme.backgroundColor, 0.3));
    root.style.setProperty('--toc-subtle-color', mixColor(theme.textColor, theme.backgroundColor, 0.45));
    root.style.setProperty('--copy-button-background-color', mixColor(theme.backgroundColor, theme.textColor, 0.08));
    root.style.setProperty('--copy-button-border-color', mixColor(theme.backgroundColor, theme.textColor, 0.18));
    root.style.setProperty('--copy-button-text-color', mixColor(theme.textColor, theme.backgroundColor, 0.3));
    root.style.setProperty('--copy-button-hover-background-color', mixColor(theme.backgroundColor, theme.textColor, 0.14));
    root.style.setProperty('--copy-button-hover-border-color', mixColor(theme.backgroundColor, theme.textColor, 0.28));
    root.style.setProperty('--copy-button-hover-text-color', theme.textColor);
    root.style.setProperty('--copy-button-success-color', mixColor(accentColor, 'rgb(63, 185, 80)', 0.35));
    root.style.setProperty('--copy-tooltip-background-color', theme.textColor);
    root.style.setProperty('--copy-tooltip-text-color', theme.backgroundColor);
    root.style.setProperty('--image-skeleton-bg', mixColor(theme.backgroundColor, theme.textColor, 0.08));
    root.style.setProperty('--image-skeleton-highlight', mixColor(theme.backgroundColor, theme.textColor, 0.14));
    root.style.setProperty('--image-skeleton-border', mixColor(theme.backgroundColor, theme.textColor, 0.12));
    if (theme.fontFamily) {
      root.style.setProperty('--toc-font-family', theme.fontFamily);
    }
  }

  function syncPinnedLayout() {
    if (!isPinned) {
      root.style.removeProperty('--toc-content-width');
      root.style.removeProperty('--toc-sidebar-space');
      root.style.removeProperty('--toc-pinned-width');
      return;
    }

    const contentWidth = getPinnedContentWidth();
    const panelWidth = getPinnedPanelWidth();
    root.style.setProperty('--toc-content-width', `${contentWidth}px`);
    root.style.setProperty('--toc-pinned-width', `${panelWidth}px`);
    root.style.setProperty('--toc-sidebar-space', `${panelWidth + PANEL_GAP}px`);
  }

  function setButtonCloseVisibility(visible) {
    body.classList.toggle('is-toc-close-visible', visible);
  }

  function syncPinnedButtonVisibility() {
    setButtonCloseVisibility(isPinned && (isPanelHovered || isButtonHovered));
  }

  function setButtonIcon(mode, label) {
    if (buttonIconMode !== mode) {
      button.classList.add('is-icon-switching');
      if (buttonIconTimer) {
        window.clearTimeout(buttonIconTimer);
      }
      buttonIconTimer = window.setTimeout(() => {
        button.classList.remove('is-icon-switching');
      }, 170);
    }

    button.innerHTML = BUTTON_ICON[mode];
    button.setAttribute('aria-label', label);
    buttonIconMode = mode;
  }

  function updateButtonIcon() {
    if (isPinned) {
      setButtonIcon('close', 'Close pinned table of contents');
      return;
    }

    if (panel.classList.contains('show')) {
      if (canPinPanel()) {
        setButtonIcon('pin', 'Pin table of contents');
      } else {
        setButtonIcon('close', 'Close table of contents');
      }
      return;
    }

    setButtonIcon('menu', 'Open table of contents');
  }

  function openFloatingPanel() {
    isPinned = false;
    isPanelHovered = false;
    isButtonHovered = false;
    body.classList.remove('is-toc-pinned');
    panel.classList.remove('is-pinned');
    panel.classList.add('show');
    syncPinnedButtonVisibility();
    syncPinnedLayout();
    updateButtonIcon();
  }

  function pinPanel() {
    measurePinnedPanelWidth();
    if (!canPinPanel()) {
      return false;
    }

    const contentWidth = getPinnedContentWidth();
    const panelWidth = getPinnedPanelWidth();
    root.style.setProperty('--toc-content-width', `${contentWidth}px`);
    root.style.setProperty('--toc-pinned-width', `${panelWidth}px`);
    root.style.setProperty('--toc-sidebar-space', `${panelWidth + PANEL_GAP}px`);
    isPinned = true;
    isPanelHovered = false;
    isButtonHovered = false;
    body.classList.add('is-toc-pinned');
    panel.classList.add('show', 'is-pinned');
    syncPinnedButtonVisibility();
    updateButtonIcon();
    return true;
  }

  function closePanel() {
    const wasPinned = isPinned;
    isPinned = false;
    isPanelHovered = false;
    isButtonHovered = false;
    syncPinnedButtonVisibility();
    panel.classList.remove('show');
    updateButtonIcon();

    if (pinnedCloseTimer) {
      window.clearTimeout(pinnedCloseTimer);
      pinnedCloseTimer = null;
    }

    if (wasPinned) {
      pinnedCloseTimer = window.setTimeout(() => {
        body.classList.remove('is-toc-pinned');
        panel.classList.remove('is-pinned');
        syncPinnedLayout();
        pinnedCloseTimer = null;
      }, 190);
      return;
    }

    body.classList.remove('is-toc-pinned');
    panel.classList.remove('is-pinned');
    syncPinnedLayout();
  }

  function watchSystemThemeChange() {
    if (!window.matchMedia) {
      return;
    }

    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      // Wait one frame so computed styles reflect the new media query state.
      window.requestAnimationFrame(syncTocTheme);
    };

    if (typeof colorSchemeQuery.addEventListener === 'function') {
      colorSchemeQuery.addEventListener('change', handleThemeChange);
      return;
    }

    if (typeof colorSchemeQuery.addListener === 'function') {
      colorSchemeQuery.addListener(handleThemeChange);
    }
  }

  function isContentImage(image) {
    if (!image || !image.src) {
      return false;
    }

    if (
      image.closest('table') ||
      image.closest('g-emoji') ||
      image.classList.contains('emoji') ||
      image.closest('.code-block-wrap') ||
      image.closest('.image-loading-wrap')
    ) {
      return false;
    }

    const container = image.parentElement;
    if (!container) {
      return false;
    }

    const isSupportedContainer =
      container.matches('p, figure, a, div') ||
      container.classList.contains('markdown-body');

    if (!isSupportedContainer) {
      return false;
    }

    const width = Number(image.getAttribute('width')) || image.naturalWidth || image.width || 0;
    const height = Number(image.getAttribute('height')) || image.naturalHeight || image.height || 0;
    if ((width && width < 80) || (height && height < 80)) {
      return false;
    }

    return true;
  }

  function getImageAspectRatio(image) {
    const width = Number(image.getAttribute('width')) || image.naturalWidth || image.width || 0;
    const height = Number(image.getAttribute('height')) || image.naturalHeight || image.height || 0;
    if (!width || !height) {
      return '16 / 9';
    }

    return `${width} / ${height}`;
  }

  function markImageLoaded(wrapper, image) {
    wrapper.classList.remove('is-loading', 'is-error');
    wrapper.classList.add('is-loaded');
    image.classList.add('is-loaded');
  }

  function markImageError(wrapper, image) {
    wrapper.classList.remove('is-loading');
    wrapper.classList.add('is-error');
    image.classList.add('is-loaded');
  }

  function enhanceImages() {
    document.querySelectorAll('.markdown-body img').forEach(image => {
      if (!isContentImage(image)) {
        return;
      }

      if (image.dataset.imageEnhanced === 'true') {
        return;
      }

      image.dataset.imageEnhanced = 'true';

      const wrapper = document.createElement('span');
      wrapper.className = 'image-loading-wrap is-loading';
      wrapper.style.setProperty('--image-aspect-ratio', getImageAspectRatio(image));

      image.parentNode.insertBefore(wrapper, image);
      wrapper.appendChild(image);
      image.classList.add('enhanced-content-image');

      if (image.complete && image.naturalWidth > 0) {
        markImageLoaded(wrapper, image);
        return;
      }

      if (image.complete && image.naturalWidth === 0) {
        markImageError(wrapper, image);
        return;
      }

      image.addEventListener('load', () => {
        wrapper.style.setProperty('--image-aspect-ratio', getImageAspectRatio(image));
        markImageLoaded(wrapper, image);
      }, { once: true });

      image.addEventListener('error', () => {
        markImageError(wrapper, image);
      }, { once: true });
    });
  }

  // Generate TOC
  function generateTOC() {
    const headings = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id]');
    const content = document.getElementById('toc-content');
    content.innerHTML = '';
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.substring(1));
      const link = document.createElement('a');
      link.href = '#' + heading.id;
      link.textContent = heading.textContent;
      link.className = 'toc-link toc-level-' + level;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        heading.scrollIntoView({ behavior: 'smooth' });
        if (!isPinned) {
          closePanel();
        }
      });
      content.appendChild(link);
    });
  }

  function handleButtonClick() {
    if (isPinned) {
      closePanel();
      return;
    }

    if (panel.classList.contains('show')) {
      if (!pinPanel()) {
        closePanel();
      }
      return;
    }

    openFloatingPanel();
  }

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    handleButtonClick();
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (isPinned) {
      return;
    }

    if (!panel.contains(e.target) && !button.contains(e.target)) {
      closePanel();
    }
  });

  panel.addEventListener('mouseenter', () => {
    isPanelHovered = true;
    syncPinnedButtonVisibility();
  });

  panel.addEventListener('mouseleave', () => {
    isPanelHovered = false;
    syncPinnedButtonVisibility();
  });

  button.addEventListener('mouseenter', () => {
    isButtonHovered = true;
    syncPinnedButtonVisibility();
  });

  button.addEventListener('mouseleave', () => {
    isButtonHovered = false;
    syncPinnedButtonVisibility();
  });

  button.addEventListener('focus', () => {
    isButtonHovered = true;
    syncPinnedButtonVisibility();
  });

  button.addEventListener('blur', () => {
    isButtonHovered = false;
    syncPinnedButtonVisibility();
  });

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      syncTocTheme();
      baseContentWidth = getContentWidth();
      generateTOC();
      enhanceImages();
      addCopyButtons();
      updateButtonIcon();
    });
  } else {
    syncTocTheme();
    baseContentWidth = getContentWidth();
    generateTOC();
    enhanceImages();
    addCopyButtons();
    updateButtonIcon();
  }

  const themeObserver = new MutationObserver(() => {
    syncTocTheme();
  });

  themeObserver.observe(root, { attributes: true, attributeFilter: ['class', 'style'] });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });

  window.addEventListener('load', syncTocTheme);
  window.addEventListener('pageshow', syncTocTheme);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      syncTocTheme();
      if (!isPinned) {
        baseContentWidth = getContentWidth();
      }
      syncPinnedLayout();
    }
  });
  window.addEventListener('resize', () => {
    if (isPinned && !canPinPanel()) {
      closePanel();
      return;
    }

    if (!isPinned) {
      baseContentWidth = getContentWidth();
      if (panel.classList.contains('show')) {
        measurePinnedPanelWidth();
      }
    } else {
      measurePinnedPanelWidth();
    }
    syncPinnedLayout();
    updateButtonIcon();
  });
  watchSystemThemeChange();

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
