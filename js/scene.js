/* ============================================================
   js/scene.js — Three.js scene: renderer, stars, nebula, rings
   ============================================================ */

/* Exposed globally so other modules can access */
window.GalaxyScene = (function () {

  /* ── Renderer & Camera ──────────────────────────────────── */
  const canvas   = document.getElementById('canvas');
  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 0, 80);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 1);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });


  /* ── Stars ──────────────────────────────────────────────── */
  function makeStars(count, size, spread, colorHexList) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const clrs = colorHexList.map(h => new THREE.Color(h));

    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
      const c = clrs[Math.floor(Math.random() * clrs.length)];
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size, vertexColors: true, transparent: true, opacity: 0.9, sizeAttenuation: true,
    });
    return new THREE.Points(geo, mat);
  }

  const stars1 = makeStars(3000, 0.3, 650, ['#ffffff', '#e8d5ff', '#c4b5fd']);
  const stars2 = makeStars(1500, 0.5, 420, ['#a855f7', '#ec4899', '#06b6d4', '#8b5cf6']);
  const stars3 = makeStars(500,  0.9, 320, ['#ec4899', '#f0abfc', '#7c3aed']);
  scene.add(stars1, stars2, stars3);


  /* ── Nebula Cloud ───────────────────────────────────────── */
  function makeNebula() {
    const count = 2200;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const clrs = ['#4c0870','#7c3aed','#be185d','#1e3a5f','#0c4a6e'].map(h => new THREE.Color(h));

    for (let i = 0; i < count; i++) {
      const r     = Math.random() * 160 + 40;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.random() * Math.PI;
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.38;
      pos[i * 3 + 2] = r * Math.cos(phi);
      const c = clrs[Math.floor(Math.random() * clrs.length)];
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

    return new THREE.Points(geo, new THREE.PointsMaterial({
      size: 2.2, vertexColors: true, transparent: true, opacity: 0.22, sizeAttenuation: true,
    }));
  }
  scene.add(makeNebula());


  /* ── Glowing Rings ──────────────────────────────────────── */
  function makeRing(radius, tube, color, opacity = 0.14) {
    const geo = new THREE.TorusGeometry(radius, tube, 8, 80);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
    return new THREE.Mesh(geo, mat);
  }

  const ring1 = makeRing(72,  0.28, 0xa855f7);
  const ring2 = makeRing(92,  0.18, 0xec4899, 0.10);
  const ring3 = makeRing(52,  0.20, 0x06b6d4, 0.12);
  const ring4 = makeRing(108, 0.14, 0x7c3aed, 0.08);
  ring1.rotation.x = Math.PI / 2.5;
  ring2.rotation.x = Math.PI / 3;
  ring3.rotation.x = Math.PI / 1.8;
  ring4.rotation.x = Math.PI / 4;
  ring4.rotation.z = 0.3;
  scene.add(ring1, ring2, ring3, ring4);


  /* ── Render Loop ────────────────────────────────────────── */
  const clock = new THREE.Clock();

  function tick() {
    requestAnimationFrame(tick);
    const t = clock.getElapsedTime();

    /* Slow star rotation */
    stars1.rotation.y =  t * 0.014;
    stars2.rotation.y = -t * 0.009;
    stars3.rotation.y =  t * 0.019;

    /* Ring spin */
    ring1.rotation.z =  t * 0.07;
    ring2.rotation.z = -t * 0.05;
    ring3.rotation.z =  t * 0.11;
    ring4.rotation.z =  t * 0.03;

    renderer.render(scene, camera);
  }
  tick();


  /* ── Public API ─────────────────────────────────────────── */
  return { scene, camera, renderer, clock, stars2, stars3 };

})();
