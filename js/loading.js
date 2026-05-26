/* ============================================================
   js/loading.js — Loading screen with progress bar
   ============================================================ */

(function () {
  const loadingEl  = document.getElementById('loading');
  const loadingBar = document.getElementById('loading-bar');
  const loadingTxt = document.getElementById('loading-text');

  const messages = [
    'Initializing Galaxy',
    'Loading Memories',
    'Building Universe',
    'Almost Ready...',
  ];

  let pct = 0;

  const interval = setInterval(() => {
    pct += Math.random() * 13 + 3;
    if (pct > 100) pct = 100;

    loadingBar.style.width = pct + '%';
    loadingTxt.textContent = messages[Math.floor(pct / 26) % messages.length];

    if (pct >= 100) {
      clearInterval(interval);
      setTimeout(finishLoading, 700);
    }
  }, 210);

  function finishLoading() {
    gsap.to(loadingEl, {
      opacity: 0,
      duration: 1,
      onComplete: () => {
        loadingEl.style.display = 'none';
        /* Signal app.js that loading is done */
        document.dispatchEvent(new Event('galaxyReady'));
      },
    });
  }
})();
