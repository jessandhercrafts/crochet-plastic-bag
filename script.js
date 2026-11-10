(() => {
  const viewport = document.getElementById('chart-viewport');
  const image = document.getElementById('pattern-image');
  const zoomInButton = document.getElementById('zoom-in');
  const zoomOutButton = document.getElementById('zoom-out');
  const zoomResetButton = document.getElementById('zoom-reset');
  const label = document.getElementById('zoom-level');
  const MIN = 1;
  const MAX = 4;
  let zoom = 1;
  let pinch = null;

  function baseWidth() {
    return viewport.clientWidth;
  }
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  function updateButtons() {
    label.textContent = Math.round(zoom * 100) + '%';
    zoomOutButton.disabled = zoom <= MIN + 0.001;
    zoomInButton.disabled = zoom >= MAX - 0.001;
  }
  function setZoom(target, focusX, focusY) {
    const next = clamp(target, MIN, MAX);
    const oldWidth = image.getBoundingClientRect().width || baseWidth();
    const vx = focusX ?? viewport.clientWidth / 2;
    const vy = focusY ?? viewport.clientHeight / 2;
    const originalX = viewport.scrollLeft + vx;
    const originalY = viewport.scrollTop + vy;
    const ratio = (baseWidth() * next) / oldWidth;
    zoom = next;
    viewport.classList.toggle('zoomed', zoom > 1.001);
    image.style.width = (baseWidth() * zoom) + 'px';
    // Set the scroll position to keep the same part of the stitch chart in view.
    viewport.scrollLeft = originalX * ratio - vx;
    viewport.scrollTop = originalY * ratio - vy;
    updateButtons();
  }

  zoomInButton.addEventListener('click', () => setZoom(zoom + .5));
  zoomOutButton.addEventListener('click', () => setZoom(zoom - .5));
  zoomResetButton.addEventListener('click', () => { setZoom(1, 0, 0); viewport.scrollTop = 0; viewport.scrollLeft = 0; });

  // Two-finger pinch zoom; ordinary one-finger vertical scroll remains native.
  function touchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }
  function midpoint(touches) {
    const box = viewport.getBoundingClientRect();
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2 - box.left,
      y: (touches[0].clientY + touches[1].clientY) / 2 - box.top
    };
  }
  viewport.addEventListener('touchstart', (event) => {
    if (event.touches.length === 2) {
      pinch = { distance: touchDistance(event.touches), zoom };
    }
  }, {passive:true});
  viewport.addEventListener('touchmove', (event) => {
    if (event.touches.length === 2) {
      event.preventDefault();
      if (!pinch) pinch = { distance:touchDistance(event.touches), zoom };
      const point = midpoint(event.touches);
      setZoom(pinch.zoom * touchDistance(event.touches) / pinch.distance, point.x, point.y);
    }
  }, {passive:false});
  viewport.addEventListener('touchend', (event) => { if (event.touches.length < 2) pinch = null; });
  viewport.addEventListener('touchcancel', () => { pinch = null; });

  // Desktop: scrolling navigates the enlarged chart. Shift+wheel pans horizontally.
  viewport.addEventListener('keydown', (event) => {
    if (event.key === '+' || event.key === '=') { event.preventDefault(); setZoom(zoom + .5); }
    if (event.key === '-') { event.preventDefault(); setZoom(zoom - .5); }
    if (event.key === '0') { event.preventDefault(); zoomResetButton.click(); }
  });
  window.addEventListener('resize', () => {
    image.style.width = (baseWidth() * zoom) + 'px';
  });
  image.addEventListener('dragstart', (event) => event.preventDefault());
  image.addEventListener('contextmenu', (event) => event.preventDefault());
  document.getElementById('year').textContent = new Date().getFullYear();
  image.style.width = '100%';
  updateButtons();
})();
