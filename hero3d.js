/* Pinned point cloud that spells things out.
   The cloud is sampled from real glyphs drawn to an offscreen 2D canvas, so
   it can morph between "AJ", "</>" and a pair of quote marks as the
   scrollytelling steps go by. Exposes window.heroScene.setMood(name).
   Degrades silently if three.js or WebGL is unavailable. */
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

  const COUNT = 6200;
  const WORLD_W = 4.6;
  const CAM_DIST = 4.6;
  const SHEET_W = 900;
  const SHEET_H = 420;
  const FONT = "'Space Grotesk', 'Helvetica Neue', Arial, sans-serif";

  /* ---- glyph sampling ---------------------------------------------------- */

  const sheet = document.createElement("canvas");
  sheet.width = SHEET_W;
  sheet.height = SHEET_H;
  const ctx = sheet.getContext("2d");

  if (!ctx) {
    canvas.classList.add("is-inactive");
    return;
  }

  function fitFont(text) {
    let size = 340;
    while (size > 40) {
      ctx.font = "700 " + size + "px " + FONT;
      const m = ctx.measureText(text);
      if (m.width <= SHEET_W * 0.84 && size <= SHEET_H * 0.82) break;
      size -= 8;
    }
    return size;
  }

  /* Returns COUNT positions sampled from the opaque pixels of `text`. */
  function sampleText(text) {
    ctx.clearRect(0, 0, SHEET_W, SHEET_H);
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 " + fitFont(text) + "px " + FONT;
    ctx.fillText(text, SHEET_W / 2, SHEET_H / 2);

    const data = ctx.getImageData(0, 0, SHEET_W, SHEET_H).data;
    const hits = [];
    for (let y = 0; y < SHEET_H; y += 2) {
      for (let x = 0; x < SHEET_W; x += 2) {
        if (data[(y * SHEET_W + x) * 4 + 3] > 128) hits.push(x, y);
      }
    }

    const out = new Float32Array(COUNT * 3);
    if (hits.length === 0) return out;

    /* Centre on the ink, not the sheet: quote marks and letters sit at very
       different heights inside the em box. */
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < hits.length; i += 2) {
      if (hits[i] < minX) minX = hits[i];
      if (hits[i] > maxX) maxX = hits[i];
      if (hits[i + 1] < minY) minY = hits[i + 1];
      if (hits[i + 1] > maxY) maxY = hits[i + 1];
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const scale = WORLD_W / SHEET_W;
    const pairs = hits.length / 2;

    for (let i = 0; i < COUNT; i += 1) {
      const h = (Math.random() * pairs) | 0;
      const px = hits[h * 2];
      const py = hits[h * 2 + 1];

      out[i * 3] = (px - cx) * scale + (Math.random() - 0.5) * 0.022;
      out[i * 3 + 1] = -(py - cy) * scale + (Math.random() - 0.5) * 0.022;
      out[i * 3 + 2] = (Math.random() - 0.5) * 0.34;
    }
    return out;
  }

  /* ---- palettes ---------------------------------------------------------- */

  const BLUE = new THREE.Color(0x8ecdf0);
  const BLUE_DEEP = new THREE.Color(0x2f6f95);
  const PINK = new THREE.Color(0xf79ec0);
  const PINK_DEEP = new THREE.Color(0xb84e74);

  /* Colour each point by where it sits horizontally, so the cloud always
     carries a blue-to-pink gradient rather than a flat fill. */
  function paint(shape, from, to) {
    const out = new Float32Array(COUNT * 3);
    const c = new THREE.Color();

    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i < COUNT; i += 1) {
      if (shape[i * 3] < lo) lo = shape[i * 3];
      if (shape[i * 3] > hi) hi = shape[i * 3];
    }
    const span = hi - lo || 1;

    for (let i = 0; i < COUNT; i += 1) {
      c.copy(from).lerp(to, (shape[i * 3] - lo) / span);
      out[i * 3] = c.r;
      out[i * 3 + 1] = c.g;
      out[i * 3 + 2] = c.b;
    }
    return out;
  }

  /* Glyph width in world units, used to size each shape to the viewport. */
  function glyphWidth(shape) {
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i < COUNT; i += 1) {
      if (shape[i * 3] < lo) lo = shape[i * 3];
      if (shape[i * 3] > hi) hi = shape[i * 3];
    }
    return Math.max(hi - lo, 0.001);
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, CAM_DIST);

  const live = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const speed = new Float32Array(COUNT);
  const drift = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i += 1) {
    speed[i] = 0.5 + Math.random() * 1.3;
    drift[i] = Math.random() * Math.PI * 2;
    /* start scattered, so the first shape assembles itself */
    live[i * 3] = (Math.random() - 0.5) * 7;
    live[i * 3 + 1] = (Math.random() - 0.5) * 4;
    live[i * 3 + 2] = (Math.random() - 0.5) * 3;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(live, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.032,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  });

  const cloud = new THREE.Points(geometry, material);
  scene.add(cloud);

  const MOODS = {};
  let current = null;
  let pending = "hero";

  function build() {
    const aj = sampleText("AJ");
    const code = sampleText("</>");
    const quote = sampleText("“”");

    /* anchor: where the glyph sits across the viewport (0 = left, 1 = right)
       fill:   how much of the viewport width it should span */
    MOODS.hero = {
      shape: aj,
      colors: paint(aj, BLUE_DEEP, PINK_DEEP),
      size: 0.03,
      anchor: 0.75,
      fill: 0.38,
      width: glyphWidth(aj),
    };
    MOODS.cs = {
      shape: code,
      colors: paint(code, BLUE_DEEP, BLUE),
      size: 0.028,
      anchor: 0.7,
      fill: 0.44,
      width: glyphWidth(code),
    };
    MOODS.journalism = {
      shape: quote,
      colors: paint(quote, PINK_DEEP, PINK),
      size: 0.034,
      anchor: 0.28,
      fill: 0.34,
      width: glyphWidth(quote),
    };

    current = MOODS[pending] || MOODS.hero;
    colors.set(current.colors);
    geometry.attributes.color.needsUpdate = true;
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(build).catch(build);
  } else {
    build();
  }

  window.heroScene = {
    setMood: function (name) {
      pending = name;
      if (MOODS[name]) current = MOODS[name];
    },
  };

  /* ---- interaction ------------------------------------------------------- */

  const pointer = { x: 0, y: 0, inside: false };
  const tilt = { x: 0, y: 0 };
  const drag = { active: false, x: 0, y: 0 };
  const spin = { x: 0, y: 0 };
  const repel = new THREE.Vector3();
  let size = 0.032;
  let halfH = 1;
  let visibleW = 1;
  let narrow = false;
  let scale = 0.6;
  let offsetX = 0;
  let offsetY = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(rect.width, 1);
    const h = Math.max(rect.height, 1);
    const aspect = w / h;

    renderer.setSize(w, h, false);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    halfH = CAM_DIST * Math.tan((45 * Math.PI) / 360);
    visibleW = 2 * halfH * aspect;
    /* Portrait viewports have no room for a side-by-side layout: centre the
       glyph and let the copy sit on top of it. */
    narrow = aspect < 0.95;
  }

  canvas.addEventListener("pointermove", function (event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    pointer.inside = true;

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
    pointer.inside = false;
  });

  let onscreen = true;
  let running = true;
  let frame = null;

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      onscreen = entries[0].isIntersecting;
    }, { threshold: 0.01 }).observe(canvas);
  }

  document.addEventListener("visibilitychange", function () {
    running = !document.hidden;
  });

  const clock = new THREE.Clock();

  function render() {
    frame = requestAnimationFrame(render);
    if (!onscreen || !running || !current) {
      clock.getDelta();
      return;
    }

    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;
    const ease = Math.min(dt * 2.6, 1);

    size += (current.size - size) * ease;
    material.size = size;

    /* Slide and resize the glyph toward this step's slot on screen. */
    const wantFill = narrow ? 0.58 : current.fill;
    const wantAnchor = narrow ? 0.5 : current.anchor;
    const wantScale = (visibleW * wantFill) / current.width;
    const wantOffset = (wantAnchor - 0.5) * visibleW;
    /* Portrait: the glyph takes the top of the screen and the copy sits
       below it, rather than the two fighting over the same space. */
    const wantOffsetY = narrow ? halfH * 0.66 : 0;

    scale += (wantScale - scale) * ease;
    offsetX += (wantOffset - offsetX) * ease;
    offsetY += (wantOffsetY - offsetY) * ease;
    cloud.scale.setScalar(scale);
    cloud.position.x = offsetX;
    cloud.position.y = offsetY;
    material.opacity = 0.95;

    /* Pointer position on the z = 0 plane, in the cloud's own space, so
       points can shy away from the cursor. */
    const s = scale || 1;
    repel.set(
      (pointer.x * halfH * camera.aspect - offsetX) / s,
      (pointer.y * halfH - offsetY) / s,
      0
    );

    const pos = geometry.attributes.position.array;
    const col = geometry.attributes.color.array;
    const want = current.shape;
    const wantCol = current.colors;

    for (let i = 0; i < COUNT; i += 1) {
      const ix = i * 3;
      const wave = reduceMotion ? 0 : Math.sin(time * 0.85 + drift[i]) * 0.018;
      const k = Math.min(ease * speed[i], 1);

      let tx = want[ix] + wave;
      let ty = want[ix + 1] + wave * 0.6;
      let tz = want[ix + 2] + wave;

      if (pointer.inside && !reduceMotion) {
        const dx = tx - repel.x;
        const dy = ty - repel.y;
        const d2 = dx * dx + dy * dy;
        const reach = 0.5 / (s * s);
        if (d2 < reach) {
          const push = (reach - d2) * 2.1 * s;
          const d = Math.sqrt(d2) || 0.0001;
          tx += (dx / d) * push;
          ty += (dy / d) * push;
          tz += push * 0.4;
        }
      }

      pos[ix] += (tx - pos[ix]) * k;
      pos[ix + 1] += (ty - pos[ix + 1]) * k;
      pos[ix + 2] += (tz - pos[ix + 2]) * k;

      col[ix] += (wantCol[ix] - col[ix]) * ease;
      col[ix + 1] += (wantCol[ix + 1] - col[ix + 1]) * ease;
      col[ix + 2] += (wantCol[ix + 2] - col[ix + 2]) * ease;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;

    /* The cloud spells words, so it must stay readable: no free spinning.
       A drag tips it, then it eases back to face the viewer. */
    if (!drag.active) {
      spin.x *= 1 - Math.min(dt * 1.1, 1);
      spin.y *= 1 - Math.min(dt * 1.1, 1);
    }

    tilt.x += ((pointer.inside ? -pointer.y * 0.12 : 0) - tilt.x) * 0.05;
    tilt.y += ((pointer.inside ? pointer.x * 0.22 : 0) - tilt.y) * 0.05;

    const breathe = reduceMotion ? 0 : Math.sin(time * 0.32) * 0.09;

    cloud.rotation.x = spin.x + tilt.x;
    cloud.rotation.y = spin.y + tilt.y + breathe;

    renderer.render(scene, camera);
  }

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

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
