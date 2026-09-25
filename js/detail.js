/* 交互模式管理：
 * 横向模式（默认）→ 点击年份节点 → 动画转场进入竖向模式：
 *   左侧竖向时间轴（年份节点，未选中项收起隐藏）
 *   右侧详情面板：
 *     · 该年只有一件大事 → 单张卡片
 *     · 一年多件大事 → 多张卡片横向重叠成一副牌，一次只展示一张，
 *       滚轮上下切换卡片；滑过最后一张仍按原先方式切换到上/下一年份。
 * 视图层级：年份卡片页 ⇄ 单事件互动演示页；面板头部唯一的返回按钮按层级回退。 */
(function () {
  const rail = document.getElementById("rail");
  const railCol = document.getElementById("railCol");
  const track = document.getElementById("railTrack");
  const panel = document.getElementById("detailPanel");
  const body = document.getElementById("detailBody");
  const backBtn = document.getElementById("panelBack");
  const timelineWrap = document.getElementById("timelineWrap");

  let current = null;       // 当前选中的年份组
  let cardIdx = 0;          // 年份组内的卡片序号
  let view = "intro";       // intro | demo
  let vmode = false;
  let currentDemo = null;
  let wheelLock = 0;

  const groups = () => window.TIMELINE_GROUPS || [];

  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function destroyDemo() {
    if (currentDemo && typeof currentDemo.destroy === "function") {
      try { currentDemo.destroy(); } catch (e) { /* ignore */ }
    }
    currentDemo = null;
  }

  /* ---------- 唯一的返回按钮：按层级回退 ---------- */
  function setBackBtn() {
    backBtn.textContent = view === "demo" ? "← 返回介绍" : "← 返回时间轴";
  }

  backBtn.addEventListener("click", () => {
    if (view === "demo") showIntro(current);
    else exitVMode();
  });

  /* ---------- 单事件年份：整张卡片 ---------- */
  function renderSingle(evt) {
    let html = '<div class="dg-head">' +
      '<span class="dg-year">' + esc(evt.year) + '</span>' +
      '<h2 class="dg-title">' + esc(evt.title) + '</h2>' +
      '<p class="dg-tagline">' + esc(evt.tagline || "") + '</p>' +
      '</div><div class="dg-hero">';
    if (evt.img) {
      html += '<figure class="dg-figure">' +
        '<img src="' + esc(evt.img) + '" alt="' + esc(evt.title) + '" ' +
        'onerror="this.parentNode.style.display=\'none\'">' +
        (evt.imgCaption ? '<figcaption>' + esc(evt.imgCaption) + '</figcaption>' : '') +
        '</figure>';
    }
    html += '<div class="dg-text">' +
      '<div class="dg-desc">' + evt.desc.map(p => '<p>' + esc(p) + '</p>').join("") + '</div>';
    if (evt.theory) {
      html += '<div class="dg-theory-box"><b>' + esc(evt.theory.title) + '</b>' + esc(evt.theory.text) + '</div>';
    }
    if (evt.demo) {
      html += '<div class="dg-actions"><button class="btn btn-primary" data-act="demo">互动演示</button></div>';
    }
    html += '</div></div>';
    return html;
  }

  /* ---------- 渲染：多事件年份 → 横向重叠的独立卡片牌堆 ---------- */
  function renderDeckCard(g, evt, idx) {
    let html = '<div class="dg-evt-top">' +
      '<span class="dg-evt-year">' + esc(g.year) + '</span>' +
      '<h3 class="dg-evt-title">' + esc(evt.title) + '</h3>' +
      '<span class="deck-count"></span>' +
      '</div>';
    if (evt.tagline) html += '<p class="dg-tagline">' + esc(evt.tagline) + '</p>';
    if (evt.img) {
      html += '<img class="dg-evt-img" src="' + esc(evt.img) + '" alt="' + esc(evt.title) + '" ' +
        'onerror="this.style.display=\'none\'">';
    }
    html += '<div class="dg-desc">' + evt.desc.map(p => '<p>' + esc(p) + '</p>').join("") + '</div>';
    if (evt.theory) {
      html += '<div class="dg-theory-box"><b>' + esc(evt.theory.title) + '</b>' + esc(evt.theory.text) + '</div>';
    }
    if (evt.demo) {
      html += '<div class="dg-actions"><button class="btn btn-primary" data-demo-idx="' + idx + '">互动演示</button></div>';
    }
    return html;
  }

  function renderGroup(g) {
    if (g.events.length === 1) return renderSingle(g.events[0]);

    let html = '<div class="card-deck">';
    g.events.forEach((evt, i) => {
      html += '<div class="big-card" data-card-idx="' + i + '">' + renderDeckCard(g, evt, i) + '</div>';
    });
    html += '</div>';
    return html;
  }

  /* 牌堆布局：所有卡片尺寸一致；非当前卡隐到两侧（切换时横向滑入/滑出） */
  function layoutDeck() {
    const deck = body.querySelector(".card-deck");
    if (!deck) return;
    deck.querySelectorAll(".big-card").forEach((c, i) => {
      const d = i - cardIdx;
      const off = d === 0 ? 0 : (d < 0 ? -60 : 60);
      c.style.transform = d === 0
        ? "translateX(0) scale(1)"
        : "translateX(" + off + "px) scale(0.97)";
      c.style.opacity = d === 0 ? "1" : "0";
      c.style.zIndex = String(20 - Math.min(15, Math.abs(d) * 2));
      c.style.pointerEvents = d === 0 ? "auto" : "none";
      c.classList.toggle("is-active", d === 0);
    });
    const count = deck.querySelector(".big-card.is-active .deck-count");
    deck.querySelectorAll(".deck-count").forEach(el => { el.textContent = ""; });
    if (count) count.textContent = (cardIdx + 1) + " / " + current.events.length;
  }

  function bindDetail(g) {
    body.querySelectorAll("[data-act='demo']").forEach(btn => {
      btn.addEventListener("click", () => openDemoView(g.events[0]));
    });
    body.querySelectorAll("[data-demo-idx]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openDemoView(g.events[+btn.dataset.demoIdx]);
      });
    });
    // 点击侧边露出的卡片直接跳到那一张
    body.querySelectorAll(".big-card").forEach(c => {
      c.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        const idx = +c.dataset.cardIdx;
        if (idx !== cardIdx) { cardIdx = idx; layoutDeck(); }
      });
    });
  }

  /* ---------- 视图切换 ---------- */
  /* dir: 0 保持原序号；1 进入该年第一张；-1 进入该年最后一张 */
  function showIntro(g, dir) {
    destroyDemo();
    view = "intro";
    body.innerHTML = renderGroup(g);
    // 多事件年份：去掉外层卡片外观，牌堆卡片直接浮在页面底色上
    const isDeck = g.events.length > 1;
    panel.classList.toggle("deck-mode", isDeck);
    if (isDeck) {
      if (dir > 0) cardIdx = 0;
      else if (dir < 0) cardIdx = g.events.length - 1;
      cardIdx = Math.min(cardIdx, g.events.length - 1);
      layoutDeck();
    }
    bindDetail(g);
    panel.scrollTop = 0;
    setBackBtn();
  }

  function openDemoView(evt) {
    destroyDemo();
    view = "demo";
    panel.classList.remove("deck-mode");
    body.innerHTML =
      '<div class="demo-view-head">' +
        '<span class="dg-year" style="font-size:20px">' + esc(evt.year) + '</span>' +
        '<h3>' + esc(evt.title) + ' · 互动演示</h3>' +
      '</div>' +
      '<div class="demo-mount" id="demoMount"></div>';

    const mount = document.getElementById("demoMount");
    const factory = window.DemoRegistry && window.DemoRegistry.get(evt.demo);
    if (factory) {
      currentDemo = factory(mount) || null;
    } else {
      mount.innerHTML = '<p style="color:#b9ad92">演示模块加载失败</p>';
    }
    panel.scrollTop = 0;
    setBackBtn();
  }

  /* ---------- 左侧竖向轨道（年份节点） ---------- */
  function renderRail() {
    track.innerHTML = "";
    groups().forEach((g) => {
      const item = document.createElement("div");
      const hasTheory = g.events.some(e => e.type === "theory");
      const allEra = g.events.every(e => e.type === "era");
      item.className = "rail-item " + (hasTheory ? "theory" : allEra ? "era" : "milestone");
      item.innerHTML =
        '<span class="rail-year">' + esc(g.year) + '</span>' +
        '<span class="rail-title">' +
          esc(g.events.map(e => e.title).join(" · ")) +
        '</span>';
      item.addEventListener("click", () => setEvent(g, 0));
      track.appendChild(item);
    });
  }

  function updateRailActive() {
    const idx = groups().indexOf(current);
    Array.prototype.forEach.call(track.children, (el, i) => {
      el.classList.toggle("active", i === idx);
    });
    const el = track.children[idx];
    if (!el) return;
    // 让当前项居于轨道中部，产生“列表上下转动”的效果
    const target = rail.clientHeight / 2 - (el.offsetTop + el.offsetHeight / 2);
    track.style.transform = "translateY(" + target + "px)";
  }

  /* ---------- 年份切换 ---------- */
  /* dir: 0 默认（进入第一张）；1 从上一年顺势进入；-1 从下一年回退进入 */
  function setEvent(g, dir) {
    destroyDemo();
    current = g;
    showIntro(g, dir || 0);
    updateRailActive();
  }

  /* ---------- 模式转场（横向 ⇄ 竖向） ---------- */
  function enterVMode(g) {
    if (!g) return;
    if (vmode) { setEvent(g, 0); return; }
    vmode = true;
    document.body.classList.add("vmode");

    // 1) 横向时间轴立刻开始退场（0.32s）
    timelineWrap.classList.add("leave-tl");
    setTimeout(() => {
      timelineWrap.hidden = true;
      timelineWrap.classList.remove("leave-tl");
    }, 330);

    // 2) 与退场重叠：轨道与卡片提前入场，消除空白卡顿感
    renderRail();
    setTimeout(() => {
      railCol.hidden = false;
      panel.hidden = false;
      railCol.classList.add("enter-rail");
      panel.classList.add("enter-panel");
      setEvent(g, 0);
      setTimeout(() => {
        railCol.classList.remove("enter-rail");
        panel.classList.remove("enter-panel");
      }, 540);
    }, 110);
  }

  function exitVMode() {
    if (!vmode) return;
    destroyDemo();
    vmode = false;
    view = "intro";
    railCol.classList.add("leave-rail");
    panel.classList.add("leave-panel");
    setTimeout(() => {
      railCol.hidden = true; panel.hidden = true;
      railCol.classList.remove("leave-rail");
      panel.classList.remove("leave-panel");
      timelineWrap.hidden = false;
      timelineWrap.classList.add("reenter-tl");
      setTimeout(() => timelineWrap.classList.remove("reenter-tl"), 460);
    }, 280);
    document.body.classList.remove("vmode");
    current = null;
  }

  /* ---------- 滚轮 / 键盘：年内切卡片，年外按原方式切年份 ---------- */
  function navigate(dir) {
    const gs = groups();
    const idx = gs.indexOf(current);
    const next = idx + dir;
    if (next < 0 || next >= gs.length) return;
    setEvent(gs[next], dir);
  }

  function step(dir) {
    const g = current;
    if (g.events.length > 1) {
      const next = cardIdx + dir;
      if (next >= g.events.length) { navigate(1); return; }   // 本年最后一张 → 下一年（原方式）
      if (next < 0) { navigate(-1); return; }                 // 本年第一张 → 上一年最后一张
      cardIdx = next;
      layoutDeck();
    } else {
      navigate(dir);
    }
  }

  /* 面板内容还能朝该方向滚动时，优先滚动内容 */
  function hasScrollableRoom(node, dir) {
    while (node && node !== document.body) {
      if (node.nodeType === 1) {
        const cs = getComputedStyle(node);
        if ((cs.overflowY === "auto" || cs.overflowY === "scroll") &&
            node.scrollHeight > node.clientHeight + 2) {
          if (dir > 0 ? node.scrollTop + node.clientHeight < node.scrollHeight - 2
                      : node.scrollTop > 2) return true;
        }
      }
      node = node.parentNode;
    }
    return false;
  }

  function tryStep(dir, throttleMs) {
    const now = Date.now();
    if (now - wheelLock < throttleMs) return;
    wheelLock = now;
    step(dir);
  }

  document.addEventListener("wheel", (e) => {
    if (!vmode) return;
    if (hasScrollableRoom(e.target, e.deltaY > 0 ? 1 : -1)) return;
    e.preventDefault();
    tryStep(e.deltaY > 0 ? 1 : -1, 400);
  }, { passive: false });

  document.addEventListener("keydown", (e) => {
    if (!vmode) return;
    if (e.key === "Escape") {
      if (view === "demo") showIntro(current);
      else exitVMode();
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); tryStep(1, 260); }
    if (e.key === "ArrowUp")   { e.preventDefault(); tryStep(-1, 260); }
  });

  window.addEventListener("resize", () => { if (vmode) updateRailActive(); });

  window.Detail = { open: enterVMode, close: exitVMode };
})();
