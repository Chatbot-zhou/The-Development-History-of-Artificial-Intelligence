/* 演示②：机器学习训练
 * 用户点击画布放置两类样本，选择线性模型或小型神经网络，实时训练并绘制决策边界。
 * 前端真实执行梯度下降（全批量 BCE），loss 曲线同步绘制。 */
(function () {

  function factory(root) {
    root.innerHTML =
      '<div class="demo">' +
        '<p class="demo-intro">在画布上<b style="color:var(--orange)">点击放置橙色样本</b>，' +
        '切换到<b style="color:var(--green)">绿色类</b>再点击放置另一类。选好模型后按 <b>开始训练</b>——' +
        '背景色就是模型的“判断区域”，你将亲眼看到它一步步学会分开两类数据。</p>' +
        '<div class="mlt-layout">' +
          '<div class="mlt-left">' +
            '<canvas class="mlt-canvas" width="560" height="380"></canvas>' +
            '<p class="demo-note">点击画布添加当前类别的样本点 · 拖动无效，仅单击</p>' +
          '</div>' +
          '<div class="mlt-side">' +
            '<div class="mlt-ctrl-row">' +
              '<button class="btn cls-btn cls-a active">● 橙色类</button>' +
              '<button class="btn cls-btn cls-b">● 绿色类</button>' +
            '</div>' +
            '<div class="mlt-ctrl-row">' +
              '<label>模型 <select class="mlt-model">' +
                '<option value="linear">线性模型（直线切分）</option>' +
                '<option value="nn">神经网络（8 神经元）</option>' +
              '</select></label>' +
            '</div>' +
            '<div class="mlt-ctrl-row">' +
              '<button class="btn btn-primary mlt-train">▶ 开始训练</button>' +
              '<button class="btn btn-ghost mlt-sample">🎲 示例数据</button>' +
              '<button class="btn btn-ghost mlt-clear">🗑 清空</button>' +
            '</div>' +
            '<div class="mlt-stat">' +
              '<div>训练轮数 <b class="mlt-epoch">0</b></div>' +
              '<div>准确率 <b class="mlt-acc">–</b></div>' +
            '</div>' +
            '<div class="mlt-loss-wrap">' +
              '<div class="demo-note">损失 Loss（越低越好）</div>' +
              '<canvas class="mlt-loss" width="240" height="90"></canvas>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    const $ = (s) => root.querySelector(s);
    const canvas = $(".mlt-canvas"), ctx = canvas.getContext("2d");
    const lossCv = $(".mlt-loss"), lctx = lossCv.getContext("2d");

    let points = [];          // {x, y, label}  坐标域 [-1,1]
    let activeCls = 0;        // 0 橙 1 绿
    let modelType = "linear";
    let running = false, raf = 0, epoch = 0;
    let lossHist = [];

    /* ---------- 模型参数 ---------- */
    // 线性: w[3];  NN: 2-8-1
    const H = 8;
    let W = null;

    function initParams() {
      epoch = 0; lossHist = [];
      if (modelType === "linear") {
        W = { w: [0, 0, 0] };
      } else {
        const r = () => (Math.random() * 2 - 1) * 0.8;
        W = {
          w1: Array.from({ length: H }, () => [r(), r()]),
          b1: new Array(H).fill(0),
          w2: Array.from({ length: H }, () => r()),
          b2: 0
        };
      }
    }
    const sig = (z) => 1 / (1 + Math.exp(-z));
    const tanh = Math.tanh;

    /* 前向：返回整批预测与缓存 */
    function forwardBatch(xs) {
      if (modelType === "linear") {
        return xs.map(p => {
          const z = W.w[0] + W.w[1] * p.x + W.w[2] * p.y;
          return { p: sig(z), z };
        });
      }
      return xs.map(pt => {
        const h = [], z1 = [];
        for (let j = 0; j < H; j++) {
          const z = W.b1[j] + W.w1[j][0] * pt.x + W.w1[j][1] * pt.y;
          z1.push(z); h.push(tanh(z));
        }
        let z2 = W.b2;
        for (let j = 0; j < H; j++) z2 += W.w2[j] * h[j];
        return { p: sig(z2), h, z1 };
      });
    }

    /* 一步全批量梯度下降 */
    function trainStep(xs) {
      const n = xs.length;
      if (!n) return 0;
      const preds = forwardBatch(xs);
      let loss = 0;

      if (modelType === "linear") {
        const g = [0, 0, 0], lr = 1.2;
        preds.forEach((o, i) => {
          const y = xs[i].label;
          const err = o.p - y;
          loss += -(y * Math.log(o.p + 1e-9) + (1 - y) * Math.log(1 - o.p + 1e-9));
          g[0] += err; g[1] += err * xs[i].x; g[2] += err * xs[i].y;
        });
        for (let k = 0; k < 3; k++) W.w[k] -= lr * g[k] / n;
      } else {
        const lr = 0.9;
        const gw1 = Array.from({ length: H }, () => [0, 0]);
        const gb1 = new Array(H).fill(0);
        const gw2 = new Array(H).fill(0);
        let gb2 = 0;
        preds.forEach((o, i) => {
          const y = xs[i].label;
          loss += -(y * Math.log(o.p + 1e-9) + (1 - y) * Math.log(1 - o.p + 1e-9));
          const dz2 = (o.p - y);                 // sigmoid + BCE
          gb2 += dz2;
          for (let j = 0; j < H; j++) {
            gw2[j] += dz2 * o.h[j];
            const dh = dz2 * W.w2[j] * (1 - Math.tanh(o.z1[j]) ** 2);
            gb1[j] += dh;
            gw1[j][0] += dh * xs[i].x;
            gw1[j][1] += dh * xs[i].y;
          }
        });
        W.b2 -= lr * gb2 / n;
        for (let j = 0; j < H; j++) {
          W.w2[j] -= lr * gw2[j] / n;
          W.b1[j] -= lr * gb1[j] / n;
          W.w1[j][0] -= lr * gw1[j][0] / n;
          W.w1[j][1] -= lr * gw1[j][1] / n;
        }
      }
      epoch++;
      return loss / n;
    }

    /* ---------- 绘制 ---------- */
    const CW = 560, CH = 380;
    const toPx = (x, y) => [(x + 1) / 2 * CW, (1 - y) / 2 * CH];

    function paintBoundary() {
      const cols = 112, rows = 76;
      const cw = CW / cols, ch = CH / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = (c + 0.5) / cols * 2 - 1;
          const y = 1 - (r + 0.5) / rows * 2;
          let p;
          if (modelType === "linear") p = sig(W.w[0] + W.w[1] * x + W.w[2] * y);
          else {
            let z2 = W.b2;
            for (let j = 0; j < H; j++) z2 += W.w2[j] * tanh(W.b1[j] + W.w1[j][0] * x + W.w1[j][1] * y);
            p = sig(z2);
          }
          const t = Math.abs(p - 0.5) * 2;        // 0 边界处 1 置信
          ctx.fillStyle = p > 0.5
            ? "rgba(16,185,129," + (0.08 + t * 0.30) + ")"
            : "rgba(245,158,11," + (0.10 + t * 0.32) + ")";
          ctx.fillRect(c * cw, r * ch, cw + 1, ch + 1);
        }
      }
    }

    function paint() {
      ctx.clearRect(0, 0, CW, CH);
      ctx.fillStyle = "#fffdf6";
      ctx.fillRect(0, 0, CW, CH);
      if (W) paintBoundary();

      // 网格
      ctx.strokeStyle = "rgba(190,175,140,.25)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(CW * i / 4, 0); ctx.lineTo(CW * i / 4, CH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, CH * i / 4); ctx.lineTo(CW, CH * i / 4); ctx.stroke();
      }
      // 样本点
      points.forEach(p => {
        const [px, py] = toPx(p.x, p.y);
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = p.label === 1 ? "#10b981" : "#f59e0b";
        ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = "#fff";
        ctx.stroke();
      });
      paintLoss();
    }

    function paintLoss() {
      const w = lossCv.width, h = lossCv.height;
      lctx.clearRect(0, 0, w, h);
      lctx.fillStyle = "#fffdf6"; lctx.fillRect(0, 0, w, h);
      if (lossHist.length > 1) {
        const mx = Math.max(...lossHist), mn = Math.min(...lossHist);
        const rng = Math.max(mx - mn, 1e-6);
        lctx.beginPath();
        lossHist.forEach((v, i) => {
          const x = i / (lossHist.length - 1) * (w - 8) + 4;
          const y = h - 8 - (v - mn) / rng * (h - 16);
          i ? lctx.lineTo(x, y) : lctx.moveTo(x, y);
        });
        lctx.strokeStyle = "#2563eb"; lctx.lineWidth = 2; lctx.stroke();
      }
    }

    function updateAcc() {
      if (!points.length) { $(".mlt-acc").textContent = "–"; return; }
      const preds = forwardBatch(points);
      let ok = 0;
      preds.forEach((o, i) => { if ((o.p > 0.5 ? 1 : 0) === points[i].label) ok++; });
      $(".mlt-acc").textContent = Math.round(ok / points.length * 100) + "%";
      $(".mlt-epoch").textContent = epoch;
    }

    /* ---------- 训练循环 ---------- */
    function loop() {
      if (!running) return;
      let loss = 0;
      for (let s = 0; s < 15; s++) loss = trainStep(points);
      if (loss) { lossHist.push(loss); if (lossHist.length > 300) lossHist.shift(); }
      paint(); updateAcc();
      raf = setTimeout(loop, 16);
    }

    function setRunning(v) {
      running = v;
      $(".mlt-train").textContent = v ? "⏸ 暂停训练" : "▶ 开始训练";
      $(".mlt-train").classList.toggle("btn-orange", v);
      if (v) loop(); else clearTimeout(raf);
    }

    /* ---------- 交互 ---------- */
    canvas.addEventListener("click", (e) => {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * 2 - 1;
      const y = 1 - (e.clientY - r.top) / r.height * 2;
      points.push({ x, y, label: activeCls });
      initParams(); paint(); updateAcc();
    });

    $(".cls-a").addEventListener("click", () => { activeCls = 0; toggleClsBtns(); });
    $(".cls-b").addEventListener("click", () => { activeCls = 1; toggleClsBtns(); });
    function toggleClsBtns() {
      $(".cls-a").classList.toggle("active", activeCls === 0);
      $(".cls-b").classList.toggle("active", activeCls === 1);
    }

    $(".mlt-model").addEventListener("change", (e) => {
      modelType = e.target.value;
      setRunning(false);
      initParams(); paint(); updateAcc();
    });

    $(".mlt-train").addEventListener("click", () => {
      if (!points.length) { seedSample(); }
      setRunning(!running);
    });
    $(".mlt-sample").addEventListener("click", () => { setRunning(false); seedSample(); });
    $(".mlt-clear").addEventListener("click", () => {
      setRunning(false); points = []; initParams(); paint(); updateAcc();
    });

    function seedSample() {
      points = [];
      const blob = (cx, cy, label, spread) => {
        for (let i = 0; i < 22; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = Math.sqrt(Math.random()) * spread;
          points.push({
            x: Math.max(-0.95, Math.min(0.95, cx + Math.cos(a) * r * 1.3)),
            y: Math.max(-0.95, Math.min(0.95, cy + Math.sin(a) * r)),
            label
          });
        }
      };
      blob(-0.45, 0.3, 0, 0.28);
      blob(0.45, -0.3, 1, 0.28);
      // 交叉重叠区加几个点，让线性模型不能轻松满分
      for (let i = 0; i < 6; i++) points.push({ x: Math.random() * 0.6 - 0.3, y: Math.random() * 0.6 - 0.15, label: i % 2 });
      initParams(); paint(); updateAcc();
    }

    /* ---------- 启动 ---------- */
    seedSample();
    setRunning(true);

    return {
      destroy() { setRunning(false); }
    };
  }

  window.DemoRegistry.register("ml-trainer", factory);
})();
