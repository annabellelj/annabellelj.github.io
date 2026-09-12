/* Interactive point-cloud hero. Degrades silently if WebGL is unavailable. */
(function () {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas || typeof THREE === "undefined") {
    if (canvas) canvas.classList.add("is-inactive");
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
  } catch (err) {
    canvas.classList.add("is-inactive");
    return;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 4.2);

  /* Sample a torus knot surface, then jitter each sample so the cloud reads
     as scattered splats rather than a wireframe. */
  const source = new THREE.TorusKnotGeometry(1.05, 0.34, 240, 28);
  const src = source.attributes.position;
  const count = src.count;

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const drift = new Float32Array(count);

  const cool = new THREE.Color(0x6b5b73);
  const warm = new THREE.Color(0xd98a9e);
  const glow = new THREE.Color(0xebb3a9);
  const tint = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    const x = src.getX(i);
    const y = src.getY(i);
    const z = src.getZ(i);

    positions[i * 3] = x + (Math.random() - 0.5) * 0.05;
    positions[i * 3 + 1] = y + (Math.random() - 0.5) * 0.05;
    positions[i * 3 + 2] = z + (Math.random() - 0.5) * 0.05;

    const t = (y + 1.4) / 2.8;
    tint.copy(cool).lerp(warm, Math.min(Math.max(t, 0), 1)).lerp(glow, Math.random() * 0.35);
    colors[i * 3] = tint.r;
    colors[i * 3 + 1] = tint.g;
    colors[i * 3 + 2] = tint.b;

    drift[i] = Math.random() * Math.PI * 2;
  }
  source.dispose();

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.034,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  });

  const cloud = new THREE.Points(geometry, material);
  scene.add(cloud);

  const base = positions.slice();
  const pointer = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  const drag = { active: false, x: 0, y: 0 };
  const spin = { x: 0, y: 0 };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(rect.width, 1);
    const h = Math.max(rect.height, 1);
    const aspect = w / h;

    renderer.setSize(w, h, false);
    camera.aspect = aspect;

    /* On portrait viewports the cloud would otherwise swallow the copy:
       pull the camera back, centre it, and let it sit further behind. */
    const narrow = aspect < 0.95;
    camera.position.z = narrow ? 7.4 : 4.2;
    cloud.position.x = narrow ? 0 : 0.45;
    material.opacity = narrow ? 0.5 : 0.95;

    camera.updateProjectionMatrix();
  }

  canvas.addEventListener("pointermove", function (event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;

    if (drag.active) {
      spin.y += (event.clientX - drag.x) * 0.006;
      spin.x += (event.clientY - drag.y) * 0.006;
      drag.x = event.clientX;
      drag.y = event.clientY;
    }
  });

  canvas.addEventListener("pointerdown", function (event) {
    drag.active = true;
    drag.x = event.clientX;
    drag.y = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("is-grabbing");
  });

  function endDrag() {
    drag.active = false;
    canvas.classList.remove("is-grabbing");
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", function () {
    endDrag();
    pointer.x = 0;
    pointer.y = 0;
  });

  let visible = true;
  let running = true;
  let frame = null;

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    }, { threshold: 0.01 }).observe(canvas);
  }

  document.addEventListener("visibilitychange", function () {
    running = !document.hidden;
  });

  const clock = new THREE.Clock();

  function render() {
    frame = requestAnimationFrame(render);
    if (!visible || !running) {
      clock.getDelta();
      return;
    }

    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;

    if (!reduceMotion) {
      spin.y += dt * 0.18;

      const pos = geometry.attributes.position.array;
      for (let i = 0; i < count; i += 1) {
        const wave = Math.sin(time * 0.9 + drift[i]) * 0.022;
        pos[i * 3] = base[i * 3] + wave;
        pos[i * 3 + 1] = base[i * 3 + 1] + wave * 0.6;
        pos[i * 3 + 2] = base[i * 3 + 2] + wave;
      }
      geometry.attributes.position.needsUpdate = true;
    }

    target.x += (pointer.y * 0.28 - target.x) * 0.05;
    target.y += (pointer.x * 0.35 - target.y) * 0.05;

    cloud.rotation.x = spin.x + target.x;
    cloud.rotation.y = spin.y + target.y;

    renderer.render(scene, camera);
  }

  window.addEventListener("resize", resize);
  resize();
  render();

  window.addEventListener("pagehide", function () {
    if (frame) cancelAnimationFrame(frame);
    renderer.dispose();
    geometry.dispose();
    material.dispose();
  });
})();
