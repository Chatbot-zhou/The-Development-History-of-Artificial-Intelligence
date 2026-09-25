/* 演示④：梯度下降
 * 在带涟漪的损失曲面上放置小球，调节学习率，观察它如何“下山”。
 * 损失函数与梯度均为真实解析计算。 */
(function () {

  function factory(root) {
    root.innerHTML =
      '<div class="demo">' +
        '<p class="demo-intro">下图是模型的<b>损失地形</b>：绿色越深 = 损失越低 = 模型越好。' +
        '<b>点击地形任意位置</b>把小球放上去，再按 <b>开始下山</b>——它会沿最陡的下坡方向前进。' +
        '试着拖动学习率滑块：太小走不动，太大直接飞出山谷。</p>' +
        '<div class="gd-layout">' +
          '<div class="gd-left">' +
            '<canvas class="gd-canvas" width="520" height="400"></canvas>' +
            '<p class="demo-note">绿色谷底 = 损失最小 · 点击画布放置小球</p>' +
          '</div>' +
          '<div class="gd-side">' +
            '<div class="gd-lr-row">' +
              '<label>学习率 η</label>' +
              '<input type="range" class="gd-lr" min="1" max="100" value="18">' +
              '<b class="gd-lr-val">0.18</b>' +
            '</div>' +
            '<div class="gd-btn-row">' +
              '<button class="btn btn-primary gd-run">▶ 开始下山</button>' +
              '<button class="btn btn-ghost gd-reset">↩ 回到起点</button>' +
              '<button class="btn btn-ghost gd-random">🎲 随机起点</button>' +
            '</div>' +
            '<div class="gd-stat">' +
              '<div>当前损失 <b class="gd-loss">–</b></div>' +
              '<div>步数 <b class="gd-steps">0</b></div>' +
              '<div>状态 <b class="gd-state">待命</b></div>' +
            '</div>' +
            '<p class="demo-note gd-tip">提示：把学习率拉到 0.9 以上试试——小球会在谷底之间来回“爆炸”；拉到 0.05 以下，它走得极其缓慢。这就是训练大模型时调节学习率的真实体验。</p>' +
          '</div>' +
        '</div>' +
      '</div>';

    const $ = (s) => root.querySelector(s);
    const canvas = $(".gd-canvas"), ctx = canvas.getContext("2d");
    const CW = 520, CH = 400;

    /* 损失函数与解析梯度（域 [-3,3]²） */
    const A1 = 1.8, A2 = 0.6;
    function loss(x, y) {
      return (x * x + y * y) / 4 + A2 * Math.sin(A1 * x) * Math.sin(A1 * y);
    }
    function grad(x, y) {
      return [
        x / 2 + A1 * A2 * Math.cos(A1 * x) * Math.sin(A1 * y),
        y / 2 + A1 * A2 * Math.sin(A1 * x) * Math.cos(A1 * y)
      ];
    }

    const DOM = 3; // 坐标域 [-3,3]
    const toPx = (x, y) => [(x + DOM) / (2 * DOM) * CW, (DOM - y) / (2 * DOM) * CH];
    const toXY = (px, py) => [px / CW * 2 * DOM - DOM, DOM - py / CH * 2 * DOM];

    let ball = null, ballVis = null, trail = [], running = false, raf = 0, steps = 0;
    let lr = 0.18;

    /* ---------- 背景：等高线热图 ---------- */
    function paintTerrain() {
      // ImageData 低分辨率渲染再放大，保证性能
      const sw = 130, sh = 100;
      const off = document.createElement("canvas");
      off.width = sw; off.height = sh;
      const octx = off.getContext("2d");
      const img = octx.createImageData(sw, sh);

      let vals = [];
      for (let j = 0; j < sh; j++) for (let i = 0; i < sw; i++) {
        const x = (i / sw * 2 - 1) * DOM, y = (1 - j / sh * 2) * DOM;
        vals.push(loss(x, y));
      }
      const mn = Math.min(...vals), mx = Math.max(...vals);

      let k = 0;
      for (let j = 0; j < sh; j++) for (let i = 0; i < sw; i++) {
        const t = (vals[k] - mn) / (mx - mn);          // 0 谷底 1 山顶
        // 谷底亮绿 -> 中间米白 -> 山顶暖橙
        let r, g, b;
        if (t < 0.5) {
          const u = t / 0.5;
          r = 16 + (253 - 16) * u; g = 185 + (250 - 185) * u; b = 129 + (238 - 129) * u;
        } else {
          const u = (t - 0.5) / 0.5;
          r = 253 + (240 - 253) * u; g = 250 + (166 - 250) * u; b = 238 + (98 - 238) * u;
        }
        img.data[k * 4] = r; img.data[k * 4 + 1] = g; img.data[k * 4 + 2] = b;
        img.data[k * 4 + 3] = 255;
        k++;
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.clearRect(0, 0, CW, CH);
      ctx.drawImage(off, 0, 0, CW, CH);

      // 等高线（简单阈值描线，用半透明白）
      ctx.strokeStyle = "rgba(120,100,60,.14)";
      ctx.lineWidth = 1;
      const levels = 14;
      for (let l = 1; l < levels; l++) {
        const th = mn + (mx - mn) * l / levels;
        for (let j = 1; j < sh; j++) for (let i = 1; i < sw; i++) {
          const v = vals[j * sw + i], vl = vals[j * sw + i - 1], vu = vals[(j - 1) * sw + i];
          if ((v - th) * (vl - th) < 0 || (v - th) * (vu - th) < 0) {
            ctx.fillStyle = "rgba(120,100,60,.10)";
            ctx.fillRect(i / sw * CW, j / sh * CH, CW / sw, CH / sh);
          }
        }
      }
    }

    function paintBall() {
      if (!ball || !ballVis) return;
      // 最陡下降方向箭头（红色虚线）
      const [gx0, gy0] = grad(ballVis[0], ballVis[1]);
      const mag0 = Math.hypot(gx0, gy0);
      if (mag0 > 0.03 && steps < 400) {
        const ux = -gx0 / mag0, uy = -gy0 / mag0, L = 0.5;
        const [ax1, ay1] = toPx(ballVis[0], ballVis[1]);
        const [ax2, ay2] = toPx(ballVis[0] + ux * L, ballVis[1] + uy * L);
        ctx.strokeStyle = "rgba(224,92,92,.85)"; ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(ax1, ay1); ctx.lineTo(ax2, ay2); ctx.stroke();
        ctx.setLineDash([]);
        const ang = Math.atan2(ay2 - ay1, ax2 - ax1);
        ctx.beginPath();
        ctx.moveTo(ax2, ay2);
        ctx.lineTo(ax2 - 9 * Math.cos(ang - 0.4), ay2 - 9 * Math.sin(ang - 0.4));
        ctx.lineTo(ax2 - 9 * Math.cos(ang + 0.4), ay2 - 9 * Math.sin(ang + 0.4));
        ctx.closePath();
        ctx.fillStyle = "rgba(224,92,92,.85)"; ctx.fill();
      }
      // 轨迹
      trail.forEach((p, i) => {
        const [px, py] = toPx(p[0], p[1]);
        ctx.beginPath();
        ctx.arc(px, py, 2 + i / trail.length * 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(37,99,235," + (0.12 + i / trail.length * 0.45) + ")";
        ctx.fill();
      });
      const [px, py] = toPx(ballVis[0], ballVis[1]);
      ctx.beginPath();
      ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.fillStyle = "#2563eb";
      ctx.shadowColor = "rgba(37,99,235,.55)"; ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 2.5; ctx.strokeStyle = "#fff"; ctx.stroke();
    }

    function paintAll() { paintTerrain(); paintBall(); updateStat(); }

    function updateStat() {
      if (!ball) { $(".gd-loss").textContent = "–"; return; }
      $(".gd-loss").textContent = loss(ball[0], ball[1]).toFixed(3);
      $(".gd-steps").textContent = steps;
    }

    /* ---------- 下山动画 ---------- */
    function loop() {
      if (!running) return;
      const [gx, gy] = grad(ball[0], ball[1]);
      ball[0] -= lr * gx;
      ball[1] -= lr * gy;
      steps++;
      trail.push([ball[0], ball[1]]);
      if (trail.length > 120) trail.shift();
      // 可视位置向逻辑位置平滑插值（消除逐帧跳动感）
      ballVis[0] += (ball[0] - ballVis[0]) * 0.3;
      ballVis[1] += (ball[1] - ballVis[1]) * 0.3;

      const out = Math.abs(ball[0]) > DOM + 0.8 || Math.abs(ball[1]) > DOM + 0.8;
      const [gx2, gy2] = grad(ball[0], ball[1]);
      const mag = Math.hypot(gx2, gy2);

      if (out) {
        running = false;
        $(".gd-state").textContent = "💥 学习率过大，飞出山谷！";
        $(".gd-run").textContent = "▶ 开始下山";
      } else if (mag < 0.004 && steps > 5) {
        running = false;
        $(".gd-state").textContent = "✅ 已收敛到谷底";
        $(".gd-run").textContent = "▶ 开始下山";
      }
      paintTerrain(); paintBall(); updateStat();
      if (running) raf = setTimeout(loop, 16);
    }

    function startRun() {
      if (!ball) place([2.2, 2.2]);
      if (running) { // 暂停
        running = false; clearTimeout(raf);
        $(".gd-run").textContent = "▶ 继续下山";
        $(".gd-state").textContent = "暂停";
        return;
      }
      running = true;
      $(".gd-run").textContent = "⏸ 暂停";
      $(".gd-state").textContent = "下山中…";
      loop();
    }

    function place(xy) {
      running = false; clearTimeout(raf);
      ball = [xy[0], xy[1]];
      steps = 0; trail = [[xy[0], xy[1]]];
      $(".gd-run").textContent = "▶ 开始下山";
      $(".gd-state").textContent = "待命";
      paintTerrain(); paintBall(); updateStat();
    }

    /* ---------- 交互 ---------- */
    canvas.addEventListener("click", (e) => {
      const r = canvas.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width * CW;
      const py = (e.clientY - r.top) / r.height * CH;
      const [x, y] = toXY(px, py);
      place([Math.max(-DOM, Math.min(DOM, x)), Math.max(-DOM, Math.min(DOM, y))]);
    });

    $(".gd-run").addEventListener("click", startRun);
    $(".gd-reset").addEventListener("click", () => place([2.2, 2.2]));
    $(".gd-random").addEventListener("click", () => {
      place([(Math.random() * 2 - 1) * 2.6, (Math.random() * 2 - 1) * 2.6]);
    });
    $(".gd-lr").addEventListener("input", (e) => {
      lr = e.target.value / 100;
      $(".gd-lr-val").textContent = lr.toFixed(2);
    });

    /* ---------- 启动 ---------- */
    paintTerrain();
    place([2.35, 2.1]);

    return {
      destroy() { running = false; clearTimeout(raf); }
    };
  }

  window.DemoRegistry.register("gradient", factory);
})();
