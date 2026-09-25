/* 演示⑨：GAN 生成对抗（2014）
 * 一维世界里的真实 GAN 训练：生成器 MLP 对抗判别器逻辑回归。
 * 橙点 = 真实样本，蓝点 = 生成样本；曲线 = 判别器认为“真”的概率。 */
(function () {

  function factory(root) {
    root.innerHTML =
      '<div class="demo">' +
        '<p class="demo-intro">这是一场一维世界里的<b>真实 GAN 博弈</b>（前端逐帧实算梯度）：' +
        '<b style="color:var(--orange)">生成器 G</b> 从随机噪声出发，学习把点搬到<b style="color:var(--green)">真实数据（橙点）</b>所在的位置；' +
        '<b style="color:var(--blue)">判别器 D</b>（蓝色曲线）则学习区分真假。双方互相逼迫——曲线被压下去的地方，点就会被 G 搬过来。' +
        '注意观察 G 如何找到两个“数据峰”，以及著名的<b>模式崩塌</b>现象。</p>' +
        '<canvas class="gn-canvas" width="860" height="170"></canvas>' +
        '<div class="gn-controls">' +
          '<button class="btn btn-primary gn-run">▶ 开始训练</button>' +
          '<button class="btn btn-ghost gn-reset">↩ 重置</button>' +
          '<span class="demo-note gn-stat">迭代 0 | D 损失 – | G 损失 –</span>' +
        '</div>' +
        '<p class="demo-note gn-tip">看点：G 先学到大峰（数据多的地方），再慢慢发现另一个峰；如果运气不好卡在一个峰上，就是<b>模式崩塌</b>——按重置多试几次。</p>' +
      '</div>';

    const $ = (s) => root.querySelector(s);
    const cv = $(".gn-canvas"), ctx = cv.getContext("2d");
    const CW = 860, CH = 170, XMIN = -4, XMAX = 4;

    /* ---------- 真实数据：双峰混合 ---------- */
    const REAL = [];
    for (let i = 0; i < 26; i++) REAL.push(gauss() * 0.45 - 1.6);
    for (let i = 0; i < 14; i++) REAL.push(gauss() * 0.35 + 1.8);
    function gauss() {
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }
    const xToPx = (x) => (x - XMIN) / (XMAX - XMIN) * CW;

    /* ---------- 判别器 D：逻辑回归（特征 [x, x², x³, x⁴]） ---------- */
    let v, c;
    /* ---------- 生成器 G：1→6→1 的 tanh 小网络 ---------- */
    let w1, b1, w2, b2;

    function reset() {
      v = [0.3, -0.1, 0.1, -0.05]; c = 0;
      w1 = []; b1 = [];
      for (let j = 0; j < 6; j++) { w1.push(gauss() * 0.5); b1.push(0); }
      w2 = []; b2 = 0;
      for (let j = 0; j < 6; j++) w2.push(gauss() * 0.5);
      iter = 0; dLoss = 0; gLoss = 0;
      fakes = [];
      for (let i = 0; i < 26; i++) fakes.push(forwardG(gauss())[0]);
      draw();
      updateStat();
    }

    function forwardG(z) {
      const h = w1.map((w, j) => Math.tanh(w * z + b1[j]));
      let x = b2;
      for (let j = 0; j < 6; j++) x += w2[j] * h[j];
      return [x, h];
    }

    function D(x) {
      const f = [x, x * x, x ** 3, x ** 4];
      let z = c;
      for (let i = 0; i < 4; i++) z += v[i] * f[i];
      return 1 / (1 + Math.exp(-z));
    }
    const dDdx = (x) => {
      const d = D(x);
      return d * (1 - d) * (v[0] + 2 * v[1] * x + 3 * v[2] * x * x + 4 * v[3] * x ** 3);
    };

    let iter = 0, dLoss = 0, gLoss = 0;
    let fakes = [];

    function trainStep() {
      const lrD = 0.06, lrG = 0.035, B = 16;
      /* --- 训练 D：真实=1，生成=0 --- */
      const gv = [0, 0, 0, 0];
      let gc = 0;
      for (let b = 0; b < B; b++) {
        const x = REAL[Math.floor(Math.random() * REAL.length)];
        const d = D(x), err = d - 1;
        const f = [x, x * x, x ** 3, x ** 4];
        for (let i = 0; i < 4; i++) gv[i] += err * f[i];
        gc += err;
        dLoss += -(Math.log(d + 1e-9));
      }
      for (let b = 0; b < B; b++) {
        const x = fakes[b % fakes.length];
        const d = D(x), err = d - 0;
        const f = [x, x * x, x ** 3, x ** 4];
        for (let i = 0; i < 4; i++) gv[i] += err * f[i];
        gc += err;
        dLoss += -(Math.log(1 - d + 1e-9));
      }
      for (let i = 0; i < 4; i++) v[i] -= lrD * gv[i] / B;
      c -= lrD * gc / B;
      dLoss /= 2 * B;

      /* --- 训练 G：最小化 -log D(G(z))，梯度穿过 D 传到 G --- */
      let gg = 0;
      const gw1 = new Array(6).fill(0), gb1 = new Array(6).fill(0), gw2 = new Array(6).fill(0);
      let gb2 = 0;
      for (let b = 0; b < B; b++) {
        const z = gauss();
        const [x0, h] = forwardG(z);
        const d = D(x0);
        gLoss += -Math.log(d + 1e-9);
        const dLdx = -1 / (d + 1e-9) * dDdx(x0);          // 链式法则：经 D 传到 G 的输出
        gb2 += dLdx;
        for (let j = 0; j < 6; j++) {
          gw2[j] += dLdx * h[j];
          const dh = dLdx * w2[j] * (1 - h[j] * h[j]);
          gw1[j] += dh * z; gb1[j] += dh;
        }
        gg++;
      }
      for (let j = 0; j < 6; j++) {
        w1[j] -= lrG * gw1[j] / B; b1[j] -= lrG * gb1[j] / B; w2[j] -= lrG * gw2[j] / B;
      }
      b2 -= lrG * gb2 / B;
      gLoss /= B;

      /* --- 刷新生成样本 --- */
      fakes = [];
      for (let b = 0; b < 26; b++) fakes.push(forwardG(gauss())[0]);
      iter++;
      fakes.forEach(x => { x = Math.max(XMIN, Math.min(XMAX, x)); });
    }

    /* ---------- 绘制 ---------- */
    function draw() {
      ctx.clearRect(0, 0, CW, CH);
      ctx.fillStyle = "#fffdf6"; ctx.fillRect(0, 0, CW, CH);
      // 轴
      const axisY = CH * 0.55;
      ctx.strokeStyle = "#d9cfb8"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, axisY); ctx.lineTo(CW, axisY); ctx.stroke();
      // 判别器曲线：D(x) 越高 = 越像“真”
      ctx.beginPath();
      for (let px = 0; px <= CW; px += 4) {
        const x = XMIN + px / CW * (XMAX - XMIN);
        const d = Math.max(0.02, Math.min(0.98, D(x)));
        const y = axisY - 10 - d * (CH * 0.42);
        px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
      }
      ctx.strokeStyle = "rgba(37,99,235,.85)"; ctx.lineWidth = 2.5; ctx.stroke();
      // 真实样本（橙）
      REAL.forEach(x => {
        const px = xToPx(Math.max(XMIN, Math.min(XMAX, x)));
        ctx.beginPath(); ctx.arc(px, axisY, 5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(245,158,11,.75)"; ctx.fill();
      });
      // 生成样本（蓝）
      fakes.forEach(x => {
        const xx = Math.max(XMIN, Math.min(XMAX, x));
        const px = xToPx(xx);
        ctx.beginPath(); ctx.arc(px, axisY, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#2563eb"; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = "#fff"; ctx.stroke();
      });
      // 图例
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#2456eb"; ctx.fillText("— D(x)：判别器认为「真」的概率", 12, 18);
      ctx.fillStyle = "#b45309"; ctx.fillText("● 真实数据（橙）  ● 生成数据（蓝）", 260, 18);
    }

    function updateStat() {
      $(".gn-stat").textContent =
        "迭代 " + iter + " | D 损失 " + dLoss.toFixed(3) + " | G 损失 " + gLoss.toFixed(3);
    }

    /* ---------- 训练循环 ---------- */
    let running = false, raf = 0;
    function loop() {
      if (!running) return;
      for (let s = 0; s < 3; s++) trainStep();
      draw(); updateStat();
      raf = setTimeout(loop, 50);
    }
    $(".gn-run").addEventListener("click", () => {
      running = !running;
      $(".gn-run").textContent = running ? "⏸ 暂停" : "▶ 继续训练";
      if (running) loop(); else clearTimeout(raf);
    });
    $(".gn-reset").addEventListener("click", () => {
      running = false; clearTimeout(raf);
      $(".gn-run").textContent = "▶ 开始训练";
      reset();
    });

    reset();

    return {
      destroy() { running = false; clearTimeout(raf); }
    };
  }

  window.DemoRegistry.register("gan-toy", factory);
})();
