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


  /* ── Canvas Textures for Realistic Glowing Particles ──────── */
  function createStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.15, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.4, 'rgba(235, 210, 255, 0.5)');
    grad.addColorStop(0.7, 'rgba(150, 90, 255, 0.12)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
  }

  function createGasTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    grad.addColorStop(0.3, 'rgba(200, 130, 255, 0.22)');
    grad.addColorStop(0.65, 'rgba(100, 50, 240, 0.06)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }


  /* ── Background Starfield (Distant Backdrop) ──────────────── */
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

    const starTexture = createStarTexture();
    const mat = new THREE.PointsMaterial({
      size,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    return new THREE.Points(geo, mat);
  }

  const stars1 = makeStars(800, 0.45, 800, ['#ffffff', '#fda4af', '#f472b6', '#c084fc', '#818cf8']);
  scene.add(stars1);


  /* ── Advanced Procedural Spiral Galaxy Generator ──────────── */
  const galaxyGroup = new THREE.Group();
  
  // Set the galaxy group perfectly flat in the XZ plane. The camera elevation provides the oblique horizon view.
  galaxyGroup.rotation.x = 0; 
  galaxyGroup.rotation.z = 0;
  scene.add(galaxyGroup);

  const starCount = 5000;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  const starAngles0 = new Float32Array(starCount);
  const starRadii   = new Float32Array(starCount);
  const starHeights = new Float32Array(starCount);
  const starSpeeds  = new Float32Array(starCount);

  const gasCount = 2500;
  const gasGeo = new THREE.BufferGeometry();
  const gasPositions = new Float32Array(gasCount * 3);
  const gasColors = new Float32Array(gasCount * 3);

  const gasAngles0 = new Float32Array(gasCount);
  const gasRadii   = new Float32Array(gasCount);
  const gasHeights = new Float32Array(gasCount);
  const gasSpeeds  = new Float32Array(gasCount);

  // Stellar colors matching the gorgeous purple/magenta/pink theme from the screenshot
  const colorCore   = new THREE.Color('#ec4899'); // Bright Neon Pink Nucleus
  const colorMiddle = new THREE.Color('#d946ef'); // Vibrant Neon Fuchsia
  const colorOuter  = new THREE.Color('#a855f7'); // Deep Royal Purple
  const colorSpur   = new THREE.Color('#6366f1'); // Cosmic Indigo

  const numArms = 3;
  const maxRadius = 100;
  const coreRadius = 18; // slightly wider core for massive glowing effect
  const curl = 0.20; // spiral curl factor

  function getSpiralPos(i, count, isGas) {
    // Distribute radii denser towards the center using a power function
    const r = Math.pow(Math.random(), 1.68) * maxRadius;

    // Distribute into 3 distinct arms
    const armIndex = i % numArms;
    const armAngle = (armIndex / numArms) * Math.PI * 2;

    // Spiral curve based on radius
    const spiralAngle = r * curl;

    // Beautiful fluffy dispersion
    const dispersion = 2.6 / (1.0 + r * 0.06);
    const angleOffset = (Math.random() - 0.5) * dispersion;

    const theta = armAngle + spiralAngle + angleOffset;

    // Height bulge in the center, tapering exponentially towards the edges
    const thickness = isGas ? 6.8 : 4.2;
    const height = (Math.random() - 0.5) * thickness * Math.exp(-r / 36);

    // Differential angular orbital speed: omega(r) = Vmax / (r + r0)
    const vMax = isGas ? 0.012 : 0.018;
    const r0 = 8.5;
    const speed = (vMax / (r + r0)) * (0.8 + Math.random() * 0.4);

    // Dynamic color gradient based on distance
    const color = new THREE.Color();
    if (r < coreRadius) {
      const ratio = r / coreRadius;
      const coreCenterColor = new THREE.Color('#ffffff'); // Brilliant White Core Center
      color.copy(coreCenterColor).lerp(colorCore, ratio);
    } else if (r < maxRadius * 0.6) {
      const ratio = (r - coreRadius) / (maxRadius * 0.6 - coreRadius);
      color.copy(colorCore).lerp(colorMiddle, ratio);
    } else {
      const ratio = (r - maxRadius * 0.6) / (maxRadius * 0.4);
      color.copy(colorMiddle).lerp(colorSpur, ratio);
    }

    // Add bright cosmic dust variations
    if (isGas) {
      color.add(new THREE.Color(0.05, 0.01, 0.1)); // blend with deep cosmic violet
    } else {
      color.multiplyScalar(0.85 + Math.random() * 0.3);
    }

    return { r, theta, height, speed, color };
  }

  // Populate Stars
  for (let i = 0; i < starCount; i++) {
    const p = getSpiralPos(i, starCount, false);
    starRadii[i]   = p.r;
    starAngles0[i] = p.theta;
    starHeights[i] = p.height;
    starSpeeds[i]  = p.speed;

    starPositions[i * 3]     = Math.cos(p.theta) * p.r;
    starPositions[i * 3 + 1] = p.height;
    starPositions[i * 3 + 2] = Math.sin(p.theta) * p.r;

    starColors[i * 3]     = p.color.r;
    starColors[i * 3 + 1] = p.color.g;
    starColors[i * 3 + 2] = p.color.b;
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('color',    new THREE.BufferAttribute(starColors, 3));

  // Populate Gas Clouds
  for (let i = 0; i < gasCount; i++) {
    const p = getSpiralPos(i, gasCount, true);
    gasRadii[i]   = p.r;
    gasAngles0[i] = p.theta;
    gasHeights[i] = p.height;
    gasSpeeds[i]  = p.speed;

    gasPositions[i * 3]     = Math.cos(p.theta) * p.r;
    gasPositions[i * 3 + 1] = p.height;
    gasPositions[i * 3 + 2] = Math.sin(p.theta) * p.r;

    gasColors[i * 3]     = p.color.r;
    gasColors[i * 3 + 1] = p.color.g;
    gasColors[i * 3 + 2] = p.color.b;
  }

  gasGeo.setAttribute('position', new THREE.BufferAttribute(gasPositions, 3));
  gasGeo.setAttribute('color',    new THREE.BufferAttribute(gasColors, 3));

  // Construct ThreeJS Points with Canvas Textures
  const starTexture = createStarTexture();
  const gasTexture  = createGasTexture();

  const stars2 = new THREE.Points(starGeo, new THREE.PointsMaterial({
    size: 0.75, // slightly larger, brighter stars
    map: starTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  }));

  const stars3 = new THREE.Points(gasGeo, new THREE.PointsMaterial({
    size: 8.5, // massive, soft, volumetric clouds
    map: gasTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.30, // denser glowing fog
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  }));

  galaxyGroup.add(stars2);
  galaxyGroup.add(stars3);


  /* ── Glowing Sci-Fi Coordinate Rings ──────────────────────── */
  function makeRing(radius, tube, color, opacity = 0.12) {
    const geo = new THREE.TorusGeometry(radius, tube, 6, 80);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.Mesh(geo, mat);
  }

  // Tilted digital orbit coordinate lines to emphasize the cyber memory aesthetic
  const ring1 = makeRing(72,  0.15, 0xa855f7);
  const ring2 = makeRing(92,  0.12, 0xec4899, 0.08);
  const ring3 = makeRing(52,  0.18, 0x06b6d4, 0.10);
  const ring4 = makeRing(112, 0.08, 0x7c3aed, 0.06);
  
  ring1.rotation.x = Math.PI / 2.5;
  ring2.rotation.x = Math.PI / 3;
  ring3.rotation.x = Math.PI / 1.8;
  ring4.rotation.x = Math.PI / 4;
  ring4.rotation.z = 0.3;
  scene.add(ring1, ring2, ring3, ring4);


  /* ── Render Loop with Dynamic Differential Orbitals ───────── */
  const clock = new THREE.Clock();

  function tick() {
    requestAnimationFrame(tick);
    const t = clock.getElapsedTime();

    // Deterministic differential orbital updates for stars
    const starPosAttr = stars2.geometry.getAttribute('position');
    const starPosArray = starPosAttr.array;
    for (let i = 0; i < starCount; i++) {
      const angle = starAngles0[i] + starSpeeds[i] * t * 50; // multiply speed for visual satisfaction
      const radius = starRadii[i];
      starPosArray[i * 3]     = Math.cos(angle) * radius;
      starPosArray[i * 3 + 2] = Math.sin(angle) * radius;
    }
    starPosAttr.needsUpdate = true;

    // Deterministic differential orbital updates for nebula gas
    const gasPosAttr = stars3.geometry.getAttribute('position');
    const gasPosArray = gasPosAttr.array;
    for (let i = 0; i < gasCount; i++) {
      const angle = gasAngles0[i] + gasSpeeds[i] * t * 50;
      const radius = gasRadii[i];
      gasPosArray[i * 3]     = Math.cos(angle) * radius;
      gasPosArray[i * 3 + 2] = Math.sin(angle) * radius;
    }
    gasPosAttr.needsUpdate = true;

    // Slow rotation of distant backdrop stars
    stars1.rotation.y = t * 0.006;
    stars1.rotation.x = t * 0.003;

    // Ring spins
    ring1.rotation.z =  t * 0.05;
    ring2.rotation.z = -t * 0.03;
    ring3.rotation.z =  t * 0.08;
    ring4.rotation.z =  t * 0.02;

    renderer.render(scene, camera);
  }
  tick();


  /* ── Public API ─────────────────────────────────────────── */
  return { scene, camera, renderer, clock, stars2, stars3 };

})();
