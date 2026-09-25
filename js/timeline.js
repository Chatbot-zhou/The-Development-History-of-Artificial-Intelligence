/* 横向时间轴：渲染、拖拽平移、滚轮平移、点击节点
 * 布局按真实年份等比例展开；节点常显年份与事件名称；
 * 理论突破挂在轴线上方，里程碑/时代分界挂在下方，天然一上一下错开；
 * 同侧相邻节点过近时自动翻到另一侧，保证名称互不重叠。
 * 默认以最小形态（紧凑且无重叠）展示，无缩放控件；滚轮/拖拽平移浏览。 */
(function () {
  const viewport = document.getElementById("tlViewport");
  const canvas = document.getElementById("tlCanvas");

  const groups = window.TIMELINE_GROUPS || [];
  if (!groups.length) return;

  const MIN_YEAR = 1946, MAX_YEAR = 2026;
  const PAD_X = 150;                 // 轴线两端留白
  let PPY = window.innerWidth < 700 ? 80 : 110;  // 每年像素数（手机更紧凑）
  const MIN_SAME = 108;              // 同侧相邻节点的最小间距（名称不重叠）
  let offset = 0;                    // 画布平移量

  const canvasW = () => PAD_X * 2 + (MAX_YEAR - MIN_YEAR) * PPY;
  const xOf = (year) => PAD_X + (year - MIN_YEAR) * PPY;

  /* ---------- 渲染节点 ---------- */
  let renderedOnce = false;
  function render() {
    canvas.style.width = canvasW() + "px";
    canvas.innerHTML = "";
    // 平移不变、重渲染（窗口尺寸变化）时不重播入场动画
    canvas.classList.toggle("no-anim", renderedOnce);
    renderedOnce = true;

    const axis = document.createElement("div");
    axis.className = "tl-axis";
    canvas.appendChild(axis);

    // 年代刻度：每 10 年一个淡灰标签（悬在轴线上方远处，帮助在空白区定位）
    for (let y = 1950; y <= 2020; y += 10) {
      const tick = document.createElement("span");
      tick.className = "tl-decade";
      tick.style.left = xOf(y) + "px";
      tick.textContent = y;
      canvas.appendChild(tick);
    }

    let lastAbove = -Infinity, lastBelow = -Infinity;
    groups.forEach((g, i) => {
      const x = xOf(g.year);

      // 基础归属：理论突破在上方，里程碑/时代分界在下方
      const base = g.events.some(e => e.type === "theory") ? "above" : "below";
      let side = base;
      // 同侧过近时翻到另一侧；两侧都挤则保持基础归属
      const lastSame = side === "above" ? lastAbove : lastBelow;
      if (lastSame > -Infinity && x - lastSame < MIN_SAME) {
        const other = side === "above" ? "below" : "above";
        const lastOther = other === "above" ? lastAbove : lastBelow;
        if (lastOther === -Infinity || x - lastOther >= MIN_SAME) side = other;
      }
      if (side === "above") lastAbove = x; else lastBelow = x;

      const node = document.createElement("div");
      const allEra = g.events.every(e => e.type === "era");
      node.className = "tl-node " + (allEra ? "era-node" : "") + " " + side;
      node.style.left = x + "px";
      node.style.animationDelay = (0.04 * i) + "s";

      if (g.events.some(e => e.demo)) {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = "互动演示";
        node.appendChild(badge);
      }
      if (g.events.length > 1) {
        const tip = document.createElement("span");
        tip.className = "tip";
        tip.textContent = g.events.map(e => e.title).join(" · ");
        node.appendChild(tip);
      }

      // above：[年份, 名称, 连杆, 圆点]；below：[圆点, 连杆, 年份, 名称]
      const year = document.createElement("span");
      year.className = "year";
      year.innerHTML = g.year + (g.events.length > 1 ? "<sup>" + g.events.length + "</sup>" : "");
      const title = document.createElement("span");
      title.className = "title";
      title.textContent = g.events[0].title;
      title.title = g.events.map(e => e.title).join(" · ");
      const stem = document.createElement("span");
      stem.className = "stem";
      const dotp = document.createElement("span");
      dotp.className = "dotp";

      if (side === "above") {
        node.appendChild(year);
        node.appendChild(title);
        node.appendChild(stem);
        node.appendChild(dotp);
      } else {
        node.appendChild(dotp);
        node.appendChild(stem);
        node.appendChild(year);
        node.appendChild(title);
      }

      node.addEventListener("click", () => {
        if (suppressClick) return;
        window.Detail.open(g);
      });
      canvas.appendChild(node);
    });

    applyTransform();
  }

  function applyTransform() {
    canvas.style.transform = "translateX(" + offset + "px)";
  }

  /* 初始视角：让第一个节点（1950）出现在左侧 */
  function centerInitial() {
    offset = viewport.clientWidth * 0.08 - xOf(1950);
    applyTransform();
  }

  /* ---------- 拖拽平移 ---------- */
  let dragging = false, moved = 0, lastX = 0, suppressClick = false;

  viewport.addEventListener("mousedown", (e) => {
    dragging = true; moved = 0; lastX = e.clientX;
    viewport.classList.add("dragging");
    e.preventDefault();
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    moved += Math.abs(dx);
    offset += dx;
    clampOffset();
    applyTransform();
    suppressClick = moved > 6;
  });
  window.addEventListener("mouseup", () => {
    dragging = false;
    viewport.classList.remove("dragging");
    setTimeout(() => { suppressClick = false; }, 0);
  });

  /* ---------- 触摸拖动（手机横滑浏览） ---------- */
  let touchX = null;
  viewport.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) { touchX = null; return; }
    touchX = e.touches[0].clientX;
    dragging = true; moved = 0; suppressClick = false;
    viewport.classList.add("dragging");
  }, { passive: true });
  viewport.addEventListener("touchmove", (e) => {
    if (touchX === null || e.touches.length !== 1) return;
    const x = e.touches[0].clientX;
    const dx = x - touchX;
    touchX = x;
    moved += Math.abs(dx);
    offset += dx;
    clampOffset();
    applyTransform();
    if (moved > 8) suppressClick = true;
  }, { passive: true });
  const endTouch = () => {
    touchX = null; dragging = false;
    viewport.classList.remove("dragging");
    setTimeout(() => { suppressClick = false; }, 0);
  };
  viewport.addEventListener("touchend", endTouch);
  viewport.addEventListener("touchcancel", endTouch);

  /* ---------- 滚轮：沿时间轴左右平移 ---------- */
  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
    offset -= delta;
    clampOffset();
    applyTransform();
  }, { passive: false });

  function clampOffset() {
    // 内容比视口窄时直接居中
    if (canvasW() <= viewport.clientWidth) {
      offset = (viewport.clientWidth - canvasW()) / 2;
      return;
    }
    offset = Math.min(offset, 60);                                    // 左端：起点最多左移 60px
    offset = Math.max(offset, viewport.clientWidth - canvasW() - 60); // 右端：终点距右缘 60px
  }

  window.addEventListener("resize", () => { render(); clampOffset(); applyTransform(); });

  /* ---------- 启动 ---------- */
  render();
  centerInitial();
})();
