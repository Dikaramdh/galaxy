/* ============================================================
   js/cursor.js — Custom animated cursor
   ============================================================ */

(function () {
  const cursorRing = document.getElementById('custom-cursor');
  const cursorDot  = document.getElementById('cursor-dot');

  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;

  /* Track raw mouse position */
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top  = mouseY + 'px';
  });

  /* Smooth-lag ring follows mouse */
  function animateCursor() {
    ringX += (mouseX - ringX) * 0.13;
    ringY += (mouseY - ringY) * 0.13;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top  = ringY + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  /* Click press / release */
  document.addEventListener('mousedown', () => cursorRing.classList.add('clicking'));
  document.addEventListener('mouseup',   () => cursorRing.classList.remove('clicking'));

  /* Hover on interactive elements */
  const hoverTargets = 'button, a, [data-hover]';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) cursorRing.classList.add('hovering');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) cursorRing.classList.remove('hovering');
  });
})();
