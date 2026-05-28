/* ============================================================
   js/controls.js — Camera orbit (drag/scroll/touch) + photo modal
   ============================================================ */

window.GalaxyControls = (function () {

  const { camera, clock } = window.GalaxyScene;
  const photos = window.GalaxyPhotos;

  /* ── Orbit state ────────────────────────────────────────── */
  let enabled    = false;      /* only active in galaxy mode */
  let isDragging = false;

  let camTheta  = Math.PI / 2;
  let camPhi    = Math.PI / 2.3;
  let camRadius = 80;

  let targetTheta  = Math.PI / 2;
  let targetPhi    = Math.PI / 2.3;
  let targetRadius = 80;

  let prevMouse = { x: 0, y: 0 };
  let lastTouch = null;


  /* ── Drag ───────────────────────────────────────────────── */
  document.addEventListener('mousedown', (e) => {
    if (!enabled) return;
    if (e.target.tagName === 'CANVAS') {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    }
  });

  document.addEventListener('mouseup', () => { isDragging = false; });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging || !enabled) return;
    const dx = e.clientX - prevMouse.x;
    const dy = e.clientY - prevMouse.y;
    targetTheta -= dx * 0.005;
    targetPhi    = Math.max(0.3, Math.min(Math.PI - 0.3, targetPhi + dy * 0.005));
    prevMouse = { x: e.clientX, y: e.clientY };
  });


  /* ── Scroll zoom ────────────────────────────────────────── */
  document.addEventListener('wheel', (e) => {
    if (!enabled) return;
    targetRadius = Math.max(14, Math.min(130, targetRadius + e.deltaY * 0.048));
  });


  /* ── Touch orbit ────────────────────────────────────────── */
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  });

  document.addEventListener('touchmove', (e) => {
    if (!enabled || !lastTouch || e.touches.length !== 1) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - lastTouch.x;
    const dy = e.touches[0].clientY - lastTouch.y;
    targetTheta -= dx * 0.005;
    targetPhi    = Math.max(0.3, Math.min(Math.PI - 0.3, targetPhi + dy * 0.005));
    lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: false });

  /* Touch pinch zoom */
  let lastPinchDist = null;
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist = Math.hypot(dx, dy);
    }
  });
  document.addEventListener('touchmove', (e) => {
    if (!enabled || e.touches.length !== 2) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    if (lastPinchDist) {
      targetRadius = Math.max(14, Math.min(130, targetRadius - (dist - lastPinchDist) * 0.08));
    }
    lastPinchDist = dist;
  }, { passive: false });


  /* ── Photo click ────────────────────────────────────────── */
  let clickStartPos = { x: 0, y: 0 };

  document.addEventListener('mousedown', (e) => {
    clickStartPos = { x: e.clientX, y: e.clientY };
  });

  document.addEventListener('click', (e) => {
    if (!enabled) return;
    const dx = Math.abs(e.clientX - clickStartPos.x);
    const dy = Math.abs(e.clientY - clickStartPos.y);
    if (dx > 5 || dy > 5) return;   /* was a drag, not a click */

    const hit = photos.checkClick(e.clientX, e.clientY);
    if (hit) {
      openModal(hit.userData.url);
      gsap.to(hit.scale, { x: 1.12, y: 1.12, z: 1.12, duration: 0.25, yoyo: true, repeat: 1 });
    }
  });


  /* ── Photo Modal ────────────────────────────────────────── */
  const modal     = document.getElementById('photo-modal');
  const modalImg  = document.getElementById('modal-img');
  const modalClose = document.getElementById('modal-close');

  function openModal(url) {
    modalImg.src = url;
    modal.classList.add('show');
  }

  function closeModal() {
    modal.classList.remove('show');
  }

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });


  /* ── Camera idle drift (landing mode) ──────────────────── */
  function idleDrift(t) {
    camera.position.x = Math.sin(t * 0.11) * 12;
    camera.position.y = 14 + Math.cos(t * 0.07) * 5;
    camera.position.z = 76;
    camera.lookAt(0, 0, 0);
  }


  /* ── Orbit update (galaxy mode) ─────────────────────────── */
  function orbitUpdate() {
    camTheta  += (targetTheta  - camTheta)  * 0.05;
    camPhi    += (targetPhi    - camPhi)    * 0.05;
    camRadius += (targetRadius - camRadius) * 0.05;

    camera.position.x = camRadius * Math.sin(camPhi) * Math.cos(camTheta);
    camera.position.y = camRadius * Math.cos(camPhi);
    camera.position.z = camRadius * Math.sin(camPhi) * Math.sin(camTheta);
    camera.lookAt(0, 0, 0);
  }


  /* ── Master tick (called from app.js loop) ──────────────── */
  function tick() {
    const t = clock.getElapsedTime();
    if (enabled) {
      orbitUpdate();
    } else {
      idleDrift(t);
    }
    photos.tick(t);
  }


  /* ── Enable / reset ─────────────────────────────────────── */
  function enable() {
    enabled = true;
  }

  function reset() {
    enabled = false;
    camTheta  = targetTheta  = Math.PI / 2;
    camPhi    = targetPhi    = Math.PI / 2.3;
    camRadius = targetRadius = 80;
    gsap.to(camera.position, {
      x: 0,
      y: 80 * Math.cos(Math.PI / 2.3),
      z: 80 * Math.sin(Math.PI / 2.3),
      duration: 2,
      ease: 'power2.inOut'
    });
  }


  /* ── Public API ─────────────────────────────────────────── */
  return { tick, enable, reset, openModal, closeModal };

})();
