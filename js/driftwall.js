/* =========================================================
   DriftWall — vanilla JavaScript port of the React Bits component
   (https://reactbits.dev · `npx shadcn@latest add @react-bits/DriftWall-JS-CSS`,
   MIT + Commons Clause).

   EventSphere is a no-build HTML/CSS/JS site, so the React component's logic is
   reproduced here 1:1: an endless perspective wall of tiles drifting past in
   alternating columns, lifting on hover, with damped pointer parallax.

   Additions for EventSphere:
   - `captions`   show the tile's title while it is lifted
   - `onSelect`   click (or Enter) on a tile calls back with its item
   - `decorative` wall is aria-hidden and its tiles are not focusable
   - pauses its animation loop while off-screen or in a hidden tab
   ========================================================= */
(function () {
  'use strict';

  const DEFAULTS = {
    items: [],
    columns: 5,
    tileWidth: 200,
    tileHeight: 132,
    gap: 18,
    radius: 14,
    tilt: 16,
    turn: -14,
    roll: 0,
    perspective: 1200,
    depth: 120,
    speed: 42,
    direction: 'up',
    variance: 0.45,
    parallax: 0.6,
    pauseOnHover: false,
    lift: 64,
    fade: 0.6,
    dim: 0.55,
    grayscale: false,
    overlayColor: '#060010',
    captions: false,
    decorative: false,
    onSelect: null
  };

  // Same golden-ratio spread as the original: each column drifts at its own pace.
  const columnFactor = (index, variance) => {
    const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
    return 1 + variance * pseudo;
  };

  function createDriftWall(container, options) {
    const o = Object.assign({}, DEFAULTS, options);
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = reducedQuery.matches;

    container.classList.add('drift-wall');
    container.classList.toggle('drift-wall--reduced', reduced);
    const vars = {
      '--dw-tile-w': o.tileWidth + 'px',
      '--dw-tile-h': o.tileHeight + 'px',
      '--dw-gap': o.gap + 'px',
      '--dw-radius': o.radius + 'px',
      '--dw-perspective': o.perspective + 'px',
      '--dw-lift': o.lift + 'px',
      '--dw-dim': o.dim,
      '--dw-gray': o.grayscale ? 1 : 0,
      '--dw-overlay': o.overlayColor,
      '--dw-edge': Math.max(0, (1 - o.fade) * 100) + '%'
    };
    Object.keys(vars).forEach((k) => container.style.setProperty(k, vars[k]));
    if (o.decorative) {
      container.setAttribute('aria-hidden', 'true');
    } else {
      container.setAttribute('role', 'group');
      container.setAttribute('aria-label', 'Drifting wall of tiles');
    }

    // Distribute items round-robin into columns (empty columns reuse the first item).
    const columnItems = Array.from({ length: o.columns }, () => []);
    o.items.forEach((item, i) => columnItems[i % o.columns].push({ item, index: i }));
    columnItems.forEach((col, c) => {
      if (!col.length && o.items.length) columnItems[c] = [{ item: o.items[0], index: 0 }];
    });

    const unit = o.tileHeight + o.gap;
    const dirSign = o.direction === 'up' ? 1 : -1;
    const baseVelocities = columnItems.map(
      (_, c) => o.speed * columnFactor(c, o.variance) * dirSign * (c % 2 === 0 ? 1 : -1)
    );

    const plane = document.createElement('div');
    plane.className = 'drift-wall__plane';
    container.appendChild(plane);

    let containerHeight = container.clientHeight || 600;
    let meta = [];
    let tracks = [];
    let offsets = [];
    let velocities = [];

    const metaFor = (height) =>
      columnItems.map((col) => {
        const copyHeight = Math.max(unit, col.length * unit);
        const copies = Math.max(2, Math.ceil((height * 1.6) / copyHeight) + 1);
        return { copyHeight, copies };
      });

    function buildTile(entry, id, col) {
      const { item, index } = entry;
      const tile = document.createElement('div');
      tile.className = 'drift-wall__tile';
      tile.dataset.tileId = id;
      tile.dataset.col = String(col);
      tile.dataset.index = String(index);
      if (!o.decorative) {
        tile.tabIndex = 0;
        tile.setAttribute('role', 'button');
        tile.setAttribute('aria-label', item.title || 'tile');
      }

      const inner = document.createElement('span');
      inner.className = 'drift-wall__inner';
      const img = document.createElement('img');
      img.src = item.image;
      img.alt = o.decorative ? '' : item.title || '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.draggable = false;
      const overlay = document.createElement('span');
      overlay.className = 'drift-wall__overlay';
      overlay.setAttribute('aria-hidden', 'true');
      inner.append(img, overlay);
      if (o.captions && item.title) {
        const label = document.createElement('span');
        label.className = 'drift-wall__label';
        label.textContent = item.title;
        inner.appendChild(label);
      }
      tile.appendChild(inner);
      return tile;
    }

    function build() {
      meta = metaFor(containerHeight);
      plane.textContent = '';
      tracks = columnItems.map((col, c) => {
        const colEl = document.createElement('div');
        colEl.className = 'drift-wall__col';
        const track = document.createElement('div');
        track.className = 'drift-wall__track';
        const frag = document.createDocumentFragment();
        for (let copy = 0; copy < meta[c].copies; copy++) {
          col.forEach((entry, i) => frag.appendChild(buildTile(entry, c + '-' + copy + '-' + i, c)));
        }
        track.appendChild(frag);
        colEl.appendChild(track);
        plane.appendChild(colEl);
        return track;
      });
      offsets = meta.map((m, c) => m.copyHeight * ((c * 0.37) % 1));
      velocities = columnItems.map(() => 0);
    }

    // ---- Interaction state ----
    let hoveredCol = -1;
    let wallHovered = false;
    let activeTile = null;
    const pointer = { x: 0, y: 0 };
    const damped = { x: 0, y: 0 };

    function setActive(tile) {
      if (tile === activeTile) return;
      if (activeTile) activeTile.classList.remove('is-active');
      activeTile = tile;
      hoveredCol = tile ? Number(tile.dataset.col) : -1;
      if (tile) tile.classList.add('is-active');
    }

    function applyPlaneTransform(px, py) {
      plane.style.transform =
        'translate(-50%, -50%) scale(1.18) ' +
        'rotateX(' + (o.tilt + py) + 'deg) rotateY(' + (o.turn + px) + 'deg) rotateZ(' + o.roll + 'deg) ' +
        'translateZ(' + -o.depth + 'px)';
    }

    // ---- Animation loop (same physics as the original) ----
    let raf = 0;
    let lastTs = null;
    let visible = true;

    function frame(ts) {
      raf = 0;
      if (lastTs === null) lastTs = ts;
      const dt = Math.min(0.05, Math.max(0, ts - lastTs) / 1000);
      lastTs = ts;

      const maxTilt = o.parallax * 8;
      const damp = 1 - Math.exp(-dt / 0.12);
      damped.x += (pointer.x * maxTilt - damped.x) * damp;
      damped.y += (-pointer.y * maxTilt - damped.y) * damp;
      applyPlaneTransform(damped.x, damped.y);

      for (let c = 0; c < tracks.length; c++) {
        const m = meta[c];
        if (!reduced) {
          const paused = wallHovered && o.pauseOnHover;
          const target = paused || hoveredCol === c ? 0 : baseVelocities[c];
          const ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));
          velocities[c] += (target - velocities[c]) * ease;
          let next = (offsets[c] || 0) + velocities[c] * dt;
          next = ((next % m.copyHeight) + m.copyHeight) % m.copyHeight;
          offsets[c] = next;
        }
        tracks[c].style.transform = 'translate3d(0, ' + -(offsets[c] || 0) + 'px, 0)';
      }
      schedule();
    }

    function schedule() {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    }
    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      lastTs = null;
    }

    // ---- Events ----
    function onPointerMove(e) {
      const rect = container.getBoundingClientRect();
      if (o.parallax > 0 && !reduced) {
        pointer.x = (e.clientX - rect.left) / rect.width - 0.5;
        pointer.y = (e.clientY - rect.top) / rect.height - 0.5;
      }
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      const tile = hit && hit.closest ? hit.closest('[data-tile-id]') : null;
      if (tile && container.contains(tile)) setActive(tile);
    }
    function onPointerEnter() {
      wallHovered = true;
    }
    function onPointerLeave() {
      wallHovered = false;
      pointer.x = 0;
      pointer.y = 0;
      setActive(null);
    }
    function select(tile) {
      if (tile && typeof o.onSelect === 'function') o.onSelect(o.items[Number(tile.dataset.index)]);
    }
    function onClick(e) {
      select(e.target.closest && e.target.closest('[data-tile-id]'));
    }
    function onFocusIn(e) {
      const tile = e.target.closest('[data-tile-id]');
      if (tile) setActive(tile);
    }
    function onFocusOut() {
      setActive(null);
    }
    function onKeyDown(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        const tile = e.target.closest('[data-tile-id]');
        if (tile) {
          e.preventDefault();
          select(tile);
        }
      }
    }
    function onReducedChange(e) {
      reduced = e.matches;
      container.classList.toggle('drift-wall--reduced', reduced);
    }
    function onVisibility() {
      if (document.hidden) stop();
      else schedule();
    }

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerenter', onPointerEnter);
    container.addEventListener('pointerleave', onPointerLeave);
    container.addEventListener('click', onClick);
    if (!o.decorative) {
      container.addEventListener('focusin', onFocusIn);
      container.addEventListener('focusout', onFocusOut);
      container.addEventListener('keydown', onKeyDown);
    }
    reducedQuery.addEventListener('change', onReducedChange);
    document.addEventListener('visibilitychange', onVisibility);

    // Rebuild only when the number of copies a column needs actually changes.
    const resizeObserver = new ResizeObserver(([entry]) => {
      const height = entry.contentRect.height || 600;
      const changed = metaFor(height).some((m, c) => !meta[c] || m.copies !== meta[c].copies);
      containerHeight = height;
      if (changed) build();
    });
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
      else stop();
    });

    build();
    applyPlaneTransform(0, 0);
    resizeObserver.observe(container);
    intersectionObserver.observe(container);
    schedule();

    return {
      destroy() {
        stop();
        resizeObserver.disconnect();
        intersectionObserver.disconnect();
        container.removeEventListener('pointermove', onPointerMove);
        container.removeEventListener('pointerenter', onPointerEnter);
        container.removeEventListener('pointerleave', onPointerLeave);
        container.removeEventListener('click', onClick);
        container.removeEventListener('focusin', onFocusIn);
        container.removeEventListener('focusout', onFocusOut);
        container.removeEventListener('keydown', onKeyDown);
        reducedQuery.removeEventListener('change', onReducedChange);
        document.removeEventListener('visibilitychange', onVisibility);
        plane.remove();
      }
    };
  }

  window.createDriftWall = createDriftWall;
})();
