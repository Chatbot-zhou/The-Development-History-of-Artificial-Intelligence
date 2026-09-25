/* 演示③：特征工程
 * 双臂螺旋数据：原始特征 (x,y) 下线性模型永远分不开；
 * 构造特征 (x, y, x²+y²) 后立刻可分。真实逻辑回归 + 梯度下降。 */
(function () {

  function factory(root) {
    root.innerHTML =
      '<div class="demo">' +
        '<p class="demo-intro">下面是一条徐徐旋出的<b>螺旋线</b>：<b style="color:var(--orange)">内侧一段是橙色</b>，' +
        '<b style="color:var(--green)">外侧一段是绿色</b>。先看<b style="color:var(--orange)">原始特征</b>模式下模型如何束手无策，' +
        '再切换到<b style="color:var(--blue)">构造特征</b>——只加一个 x²+y²（到圆心的距离），模型立刻开窍。</p>' +
        '<div class="fe-layout">' +
          '<div class="fe-left">' +
            '<canvas class="fe-canvas" width="520" height="400"></canvas>' +
          '</div>' +
          '<div class="fe-side">' +
            '<div class="fe-mode-row">' +
              '<button class="btn fe-mode active" data-mode="raw">① 原始特征 (x, y)</button>' +
              '<button class="btn fe-mode" data-mode="eng">② 构造特征 (+ x²+y²)</button>' +
            '</div>' +
            '<button class="btn btn-primary fe-train">▶ 重新训练</button>' +
            '<button class="btn btn-ghost fe-newdata">🔄 换一批数据</button>' +
            '<div class="fe-stat">' +
              '<div>训练轮数 <b class="fe-epoch">0</b></div>' +
              '<div>准确率 <b class="fe-acc">–</b></div>' +
              '<div class="fe-verdict demo-note"></div>' +
            '</div>' +
            '<p class="demo-note fe-tip"></p>' +
          '</div>' +
        '</div>' +
      '</div>';

    const $ = (s) => root.querySelector(s);
    const canvas = $(".fe-canvas"), ctx = canvas.getContext("2d");
    const CW = 520, CH = 400;

    let points = [], mode = "raw", running = false, raf = 0, epoch = 0, stopAt = 0;
    let w = [0, 0, 0, 0]; // [b, x, y, r²]

    const sig = (z) => 1 / (1 + Math.exp(-z));

    function setFeatures(p) {
      return mode === "raw" ? [1, p.x, p.y, 0] : [1, p.x, p.y, p.x * p.x + p.y * p.y];
    }

    function predict(f) {
      return sig(w[0] * f[0] + w[1] * f[1] + w[2] * f[2] + w[3] * f[3]);
    }

    function trainStep() {
      const n = points.length;
      if (!n) return 0;
      const g = [0, 0, 0, 0];
      let loss = 0;
      const lr = mode === "raw" ? 2.5 : 0.9;
      points.forEach(p => {
        const f = setFeatures(p);
        const o = predict(f), y = p.label;
        loss += -(y * Math.log(o + 1e-9) + (1 - y) * Math.log(1 - o + 1e-9));
        const err = o - y;
        for (let k = 0; k < 4; k++) g[k] += err * f[k];
      });
      for (let k = 0; k < 4; k++) w[k] -= lr * g[k] / n;
      epoch++;
      return loss / n;
    }

    function genData() {
      points = [];
      const n = 120;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const label = t < 0.5 ? 0 : 1;          // 内段橙、外段绿
        const ang = 4.4 * Math.PI * t;
        const r = 0.08 + 0.85 * t;
        const noise = 0.028;
        points.push({
          x: Math.max(-0.98, Math.min(0.98, r * Math.sin(ang) + (Math.random() - 0.5) * noise * 2)),
          y: Math.max(-0.98, Math.min(0.98, r * Math.cos(ang) + (Math.random() - 0.5) * noise * 2)),
          label
        });
      }
    }

    /* ---------- 绘制 ---------- */
    const toPx = (x, y) => [(x + 1) / 2 * CW, (1 - y) / 2 * CH];

    function paintBoundary() {
      const cols = 104, rows = 80, cw = CW / cols, ch = CH / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = (c + 0.5) / cols * 2 - 1;
          const y = 1 - (r + 0.5) / rows * 2;
          const f = [1, x, y, x * x + y * y];
          const p = mode === "raw"
            ? sig(w[0] + w[1] * x + w[2] * y)
            : predict(f);
          const t = Math.abs(p - 0.5) * 2;
          ctx.fillStyle = p > 0.5
            ? "rgba(16,185,129," + (0.07 + t * 0.30) + ")"
            : "rgba(245,158,11," + (0.09 + t * 0.32) + ")";
          ctx.fillRect(c * cw, r * ch, cw + 1, ch + 1);
        }
      }
    }

    function paint() {
      ctx.clearRect(0, 0, CW, CH);
      ctx.fillStyle = "#fffdf6"; ctx.fillRect(0, 0, CW, CH);
      paintBoundary();
      points.forEach(p => {
        const [px, py] = toPx(p.x, p.y);
        ctx.beginPath(); ctx.arc(px, py, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = p.label === 1 ? "#10b981" : "#f59e0b";
        ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = "#fff"; ctx.stroke();
      });
    }

    function updateStat() {
      let ok = 0;
      points.forEach(p => { if ((predict(setFeatures(p)) > 0.5 ? 1 : 0) === p.label) ok++; });
      const acc = Math.round(ok / points.length * 100);
      $(".fe-acc").textContent = acc + "%";
      $(".fe-epoch").textContent = epoch;
      const verdict = $(".fe-verdict");
      if (!running) {
        if (mode === "raw") {
          verdict.textContent = acc < 70
            ? "❌ 直线怎么切都切不开——真正的分界其实是「半径」"
            : "模型尽力了，但一条直线表达不了圆形边界";
          verdict.style.color = "#b45309";
        } else {
          verdict.textContent = acc >= 90
            ? "✅ 加上 x²+y² 后，弯的边界轻松分开螺旋内外段！"
            : "再多训一会儿…点击「重新训练」";
          verdict.style.color = acc >= 90 ? "#047857" : "#6b7280";
        }
      }
    }

    function loop() {
      if (!running) return;
      for (let s = 0; s < 12; s++) trainStep();
      paint(); updateStat();
      if (performance.now() > stopAt) { running = false; updateStat(); return; }
      raf = setTimeout(loop, 16);
    }

    function startTrain(seconds) {
      clearTimeout(raf);
      running = true;
      epoch = 0;
      w = [0, 0, 0, 0];
      stopAt = performance.now() + seconds * 1000;
      $(".fe-train").textContent = "⏳ 训练中…";
      loop();
      // 恢复按钮文案
      setTimeout(() => { $(".fe-train").textContent = "▶ 重新训练"; }, seconds * 1000);
    }

    /* ---------- 交互 ---------- */
    root.querySelectorAll(".fe-mode").forEach(btn => {
      btn.addEventListener("click", () => {
        mode = btn.dataset.mode;
        root.querySelectorAll(".fe-mode").forEach(b => b.classList.toggle("active", b === btn));
        $(".fe-tip").textContent = mode === "raw"
          ? "现在的模型只能画一条直线（w·x+b=0）。对螺旋数据来说，无论怎么调整，直线都做不到 >70% 的准确率。"
          : "新特征 r²=x²+y² 把「到圆心的距离」显式告诉了模型——边界变成圆形，与数据天然匹配。";
        startTrain(mode === "raw" ? 2.6 : 3.2);
      });
    });
    $(".fe-train").addEventListener("click", () => startTrain(2.6));
    $(".fe-newdata").addEventListener("click", () => { genData(); paint(); startTrain(2.6); });

    /* ---------- 启动 ---------- */
    genData();
    $(".fe-tip").textContent = "先试试 ① 原始特征模式，观察准确率卡在低位；再切到 ② 看奇迹发生。";
    startTrain(2.6);

    return {
      destroy() { running = false; clearTimeout(raf); }
    };
  }

  window.DemoRegistry.register("feature-eng", factory);
})();
