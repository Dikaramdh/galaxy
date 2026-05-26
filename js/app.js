/* ============================================================
   js/app.js — Main orchestrator: state, transitions, render loop
   ============================================================ */

(function () {

  /* ── Shortcuts ───────────────────────────────────────────── */
  const scene    = window.GalaxyScene;
  const photos   = window.GalaxyPhotos;
  const controls = window.GalaxyControls;

  const landingContent = document.getElementById('landing-content');
  const galaxyText     = document.getElementById('galaxy-text');
  const uiOverlay      = document.getElementById('ui-overlay');
  const ctaBtn         = document.getElementById('cta-btn');
  const backBtn        = document.getElementById('back-btn');
  const burstContainer = document.getElementById('burst-particles');

  let galaxyMode = false;


  /* ── Wait for loading to finish ─────────────────────────── */
  document.addEventListener('galaxyReady', () => {
    landingContent.classList.add('visible');
  });


  /* ── Burst particle explosion ───────────────────────────── */
  function spawnBurst() {
    burstContainer.innerHTML = '';
    const colors = ['#a855f7','#ec4899','#06b6d4','#f0abfc','#7c3aed','#ffffff','#c084fc'];

    for (let i = 0; i < 90; i++) {
      const p    = document.createElement('div');
      const c    = colors[Math.floor(Math.random() * colors.length)];
      const sz   = Math.random() * 5 + 1;
      const dur  = 1.6 + Math.random() * 2;
      const ang  = Math.random() * Math.PI * 2;
      const dist = Math.random() * Math.min(window.innerWidth, window.innerHeight) * 0.62 + 40;

      Object.assign(p.style, {
        position:     'absolute',
        borderRadius: '50%',
        width:        sz + 'px',
        height:       sz + 'px',
        background:   c,
        left:         '50%',
        top:          '50%',
        boxShadow:    `0 0 ${sz * 3}px ${c}`,
      });

      burstContainer.appendChild(p);

      gsap.to(p, {
        x:        Math.cos(ang) * dist,
        y:        Math.sin(ang) * dist,
        opacity:  0,
        scale:    Math.random() * 0.5,
        duration: dur,
        ease:     'power2.out',
        onComplete: () => p.remove(),
      });
    }
  }


  /* ── Enter Galaxy ────────────────────────────────────────── */
  function enterGalaxy() {
    if (galaxyMode) return;
    galaxyMode = true;

    /* Hide landing */
    gsap.to(landingContent, { opacity: 0, y: -30, duration: 0.8 });

    /* Burst + star brightening */
    spawnBurst();
    gsap.to(scene.stars2.material, { opacity: 1.0, duration: 2.5 });
    gsap.to(scene.stars3.material, { opacity: 1.0, duration: 2.5 });

    /* Camera zoom in */
    gsap.to(scene.camera.position, { z: 34, duration: 3.2, ease: 'power2.inOut' });

    /* Enable orbit controls */
    setTimeout(() => controls.enable(), 3200);

    /* Show photos */
    setTimeout(() => photos.showAll(), 900);

    /* "Only For You" text */
    setTimeout(() => {
      galaxyText.classList.add('show');
      setTimeout(() => galaxyText.classList.remove('show'), 4200);
    }, 2200);

    /* UI overlay */
    setTimeout(() => uiOverlay.classList.add('show'), 3400);
  }


  /* ── Reset to Landing ────────────────────────────────────── */
  function resetScene() {
    galaxyMode = false;

    photos.hideAll();
    controls.reset();

    uiOverlay.classList.remove('show');
    gsap.to(scene.stars2.material, { opacity: 0.85, duration: 1.5 });
    gsap.to(scene.stars3.material, { opacity: 0.85, duration: 1.5 });

    gsap.to(landingContent, { opacity: 1, y: 0, duration: 1.2, delay: 0.4 });
  }


  /* ── Button bindings ────────────────────────────────────── */
  ctaBtn.addEventListener('click', enterGalaxy);
  backBtn.addEventListener('click', resetScene);

  /* Keyboard shortcut */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && galaxyMode) resetScene();
    if (e.key === 'Enter'  && !galaxyMode) enterGalaxy();
  });


  /* ── Master render / tick loop ───────────────────────────── */
  /* scene.js already has its own RAF loop for stars/rings/renderer.
     controls.js tick handles camera + photo float.
     We hook controls into the existing loop via a second RAF. */
  (function controlsTick() {
    requestAnimationFrame(controlsTick);
    controls.tick();
  })();


  /* ── Expose resetScene globally (used by back button in HTML) */
  window.resetScene = resetScene;

})();
