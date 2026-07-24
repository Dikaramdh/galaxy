/* ============================================================
   js/photos.js — Floating photo sprites in 3D space
   ============================================================ */

window.GalaxyPhotos = (function () {

  const { scene, camera } = window.GalaxyScene;

  /* ── Photo URLs (replace with real images as needed) ────── */
  const photoUrls = [
    'images/k1.jpg',
    'images/k4.png',
    'images/k6.png',
    'images/k5.png',
    'images/ule.jpg',
    'images/k3.jpg',
    'images/k2.jpg',
    'images/k1.jpg',
    'images/k3.jpg',
    'images/k2.jpg',
    'images/k1.jpg', 
    'images/ule.jpg',
    'images/ule.jpg',
    'images/k4.png',
    'images/k6.png',
    'images/k5.png',
    'images/ule.jpg',
    'images/k3.jpg',
    'images/k2.jpg',
    'images/k1.jpg',
    'images/k3.jpg',
    'images/k2.jpg',
    'images/k1.jpg', 
    'images/ule.jpg',
    'images/ule.jpg',
    'images/k1.jpg',
    'images/k3.jpg',
    'images/k2.jpg',
    'images/k1.jpg', 
    'images/ule.jpg',

    
  ];

  const photoMeshes = [];
  const photoGroup  = new THREE.Group();
  scene.add(photoGroup);


  /* ── Thin glowing border frame ──────────────────────────── */
  function makeFrame(w, h) {
    const pts = [
      new THREE.Vector3(-w / 2 - 0.15, -h / 2 - 0.15, 0),
      new THREE.Vector3( w / 2 + 0.15, -h / 2 - 0.15, 0),
      new THREE.Vector3( w / 2 + 0.15,  h / 2 + 0.15, 0),
      new THREE.Vector3(-w / 2 - 0.15,  h / 2 + 0.15, 0),
      new THREE.Vector3(-w / 2 - 0.15, -h / 2 - 0.15, 0),
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: 0xc084fc, transparent: true, opacity: 0,
    });
    return new THREE.Line(geo, mat);
  }


  /* ── Place a single photo in the scene ──────────────────── */
  function placePhoto(url, index) {
    const loader = new THREE.TextureLoader();

    loader.load(url, (tex) => {
      const aspect = tex.image.width / tex.image.height;
      const h = 8.5;
      const w = h * aspect;

      const geo = new THREE.PlaneGeometry(w, h);
      const mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true, opacity: 0, side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);

      /* Distribute in an outward spiral, then animate each photo around the center */
      const total = photoUrls.length;
      const initialAngle = index * 2.39996 + (Math.random() - 0.5) * 0.4;  /* golden angle */
      const initialRadius = 28 + (index / total) * 65 + Math.random() * 10;
      const orbitSpeed = 0.03 + Math.random() * 0.03;
      const orbitOffset = (Math.random() - 0.5) * 0.8;

      mesh.position.set(
        initialRadius * Math.cos(initialAngle),
        (Math.random() - 0.5) * 4,
        initialRadius * Math.sin(initialAngle),
      );
      mesh.rotation.y = Math.random() * Math.PI * 2;
      mesh.rotation.x = (Math.random() - 0.5) * 0.25;

      /* Glow frame child */
      const frame = makeFrame(w, h);
      mesh.add(frame);

      /* Store meta for animation & click */
      mesh.userData = {
        url,
        index,
        frame,
        origY:       mesh.position.y,
        initialAngle,
        initialRadius,
        orbitSpeed,
        orbitOffset,
        floatOffset: Math.random() * Math.PI * 2,
        floatSpeed:  0.28 + Math.random() * 0.38,
        rotOffset:   Math.random() * Math.PI * 2,
      };

      photoGroup.add(mesh);
      photoMeshes.push(mesh);
    });
  }

  photoUrls.forEach((url, i) => placePhoto(url, i));


  /* ── Animate: called from controls.js tick ──────────────── */
  function tick(t) {
    photoMeshes.forEach((m) => {
      const d = m.userData;
      const orbitAngle = d.initialAngle + t * d.orbitSpeed + d.orbitOffset;
      const orbitRadius = d.initialRadius + Math.sin(t * 0.25 + d.floatOffset) * 0.5;

      /* Orbit around the center */
      m.position.x = Math.cos(orbitAngle) * orbitRadius;
      m.position.z = Math.sin(orbitAngle) * orbitRadius;

      /* Floating bob */
      m.position.y = d.origY + Math.sin(t * d.floatSpeed + d.floatOffset) * 1.8;

      /* Gentle sway */
      m.rotation.y = m.userData.baseRotY !== undefined
        ? m.userData.baseRotY + Math.sin(t * 0.28 + d.rotOffset) * 0.12
        : m.rotation.y;
    });
  }


  /* ── Show / hide all photos ─────────────────────────────── */
  function showAll() {
    photoMeshes.forEach((m, i) => {
      /* Save initial Y-rotation as base */
      m.userData.baseRotY = m.rotation.y;
      gsap.to(m.material, { opacity: 1,    duration: 1.6, delay: i * 0.11, ease: 'power2.out' });
      gsap.to(m.userData.frame.material, { opacity: 0.5, duration: 1.6, delay: i * 0.11 + 0.3 });
    });
  }

  function hideAll() {
    photoMeshes.forEach((m) => {
      gsap.to(m.material, { opacity: 0, duration: 0.8 });
      gsap.to(m.userData.frame.material, { opacity: 0, duration: 0.6 });
    });
  }


  /* ── Raycaster for click detection ─────────────────────── */
  const raycaster = new THREE.Raycaster();
  const mouse2D   = new THREE.Vector2();

  function checkClick(clientX, clientY) {
    mouse2D.x =  (clientX / window.innerWidth)  * 2 - 1;
    mouse2D.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse2D, camera);
    const hits = raycaster.intersectObjects(photoMeshes);
    if (hits.length) return hits[0].object;
    return null;
  }


  /* ── Public API ─────────────────────────────────────────── */
  return { photoMeshes, photoGroup, tick, showAll, hideAll, checkClick };

})();
