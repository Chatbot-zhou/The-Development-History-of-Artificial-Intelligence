/* 演示⑤：神经网络前向传播
 * 一个 2-4-4-2 的小网络（权重手工设计：区分“猫/狗”玩具任务）。
 * 拖动滑块改变输入，信号光点沿连线逐层流动，连线粗细=权重大小。 */
(function () {

  function factory(root) {
    root.innerHTML =
      '<div class="demo">' +
        '<p class="demo-intro">这是一个玩具分类网络：根据<b>体重</b>和<b>奔跑速度</b>判断动物是' +
        '<b style="color:var(--orange)">猫</b>还是<b style="color:var(--blue)">狗</b>。' +
        '拖动滑块或点击样本按钮，观察信号如何逐层流动、每层如何被“激活”——' +
        '连线越粗代表权重越大，神经元颜色越深代表激活越强。<b>点击任意神经元</b>可查看它的激活值。</p>' +
        '<div class="nn-controls">' +
          '<label>体重 <input type="range" class="nn-in0" min="1" max="80" value="8"> <b class="nn-v0">8kg</b></label>' +
          '<label>速度 <input type="range" class="nn-in1" min="1" max="60" value="30"> <b class="nn-v1">30km/h</b></label>' +
          '<button class="btn btn-ghost nn-cat">🐱 猫样本</button>' +
          '<button class="btn btn-ghost nn-dog">🐕 狗样本</button>' +
          '<button class="btn btn-primary nn-run">⚡ 前向传播</button>' +
        '</div>' +
        '<div class="nn-stage"></div>' +
        '<p class="demo-note nn-explain"></p>' +
      '</div>';

    const $ = (s) => root.querySelector(s);
    const stageEl = $(".nn-stage");
    const explainEl = $(".nn-explain");

    /* ---------- 网络定义 ---------- */
    const LAYERS = [2, 4, 4, 2];
    const NAMES = [["体重", "速度"], ["", "", "", ""], ["", "", "", ""], ["狗", "猫"]];
    const W1 = [[2.0, 2.0], [-2.0, -2.0], [2.5, -2.5], [-2.5, 2.5]];
    const B1 = [-1.0, 0.5, 0, 0];
    const W2 = [[1.5, 0, 0.8, 0], [0, 1.5, 0, 0.8], [0.8, 0, 0, 1.5], [0, 0.8, 1.5, 0]];
    const B2 = [0, 0, 0, 0];
    const W3 = [[3.0, -3.0, 1.0, -1.0], [-3.0, 3.0, -1.0, 1.0]];
    const B3 = [-0.5, 0.5];

    const tanh = Math.tanh;
    function forward(x1, x2) {
      const xin = [x1, x2];
      const a1 = W1.map((row, i) => tanh(row[0] * x1 + row[1] * x2 + B1[i]));
      const a2 = W2.map((row, i) => tanh(row[0] * a1[0] + row[1] * a1[1] + row[2] * a1[2] + row[3] * a1[3] + B2[i]));
      const z3 = W3.map((row, i) => row[0] * a2[0] + row[1] * a2[1] + row[2] * a2[2] + row[3] * a2[3] + B3[i]);
      const pDog = 1 / (1 + Math.exp(-(z3[0] - z3[1])));
      return [xin, a1, a2, [pDog, 1 - pDog]];
    }

    /* ---------- SVG 结构 ---------- */
    const W = 860, H = 330;
    const LX = [90, 340, 590, 790];
    let svg, neuronPos = [], acts = [];

    function buildSvg() {
      stageEl.innerHTML = '<svg class="nn-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet"></svg>';
      svg = stageEl.querySelector("svg");
      neuronPos = [];

      // 连线
      for (let l = 0; l < 3; l++) {
        const wMat = [W1, W2, W3][l];
        for (let i = 0; i < LAYERS[l]; i++) {
          for (let j = 0; j < LAYERS[l + 1]; j++) {
            const w = wMat[j][i];
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", LX[l]); line.setAttribute("y1", yOf(l, i, LAYERS[l]));
            line.setAttribute("x2", LX[l + 1]); line.setAttribute("y2", yOf(l + 1, j, LAYERS[l + 1]));
            line.setAttribute("stroke", w >= 0 ? "#2563eb" : "#f59e0b");
            line.setAttribute("stroke-width", 0.6 + Math.abs(w) * 1.1);
            line.setAttribute("stroke-opacity", 0.10 + Math.min(0.35, Math.abs(w) * 0.10));
            line.setAttribute("data-l", l); line.setAttribute("data-i", i); line.setAttribute("data-j", j);
            line.classList.add("nn-edge");
            svg.appendChild(line);
          }
        }
      }

      // 神经元
      for (let l = 0; l < 4; l++) {
        const col = [];
        for (let i = 0; i < LAYERS[l]; i++) {
          const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
          const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          c.setAttribute("cx", LX[l]); c.setAttribute("cy", yOf(l, i, LAYERS[l]));
          c.setAttribute("r", l === 0 || l === 3 ? 22 : 19);
          c.setAttribute("fill", "#fff"); c.setAttribute("stroke", "#e5ddcc");
          c.setAttribute("stroke-width", 2);
          c.classList.add("nn-neuron");
          c.addEventListener("click", () => showAct(l, i));
          const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
          t.setAttribute("x", LX[l]); t.setAttribute("y", yOf(l, i, LAYERS[l]) + 4.5);
          t.setAttribute("text-anchor", "middle");
          t.setAttribute("font-size", l === 0 || l === 3 ? 12 : 10);
          t.setAttribute("fill", "#374151");
          t.classList.add("nn-ntext");
          t.textContent = NAMES[l][i] || "";
          g.appendChild(c); g.appendChild(t);
          let vt = null;
          if (l === 3) { // 输出层：概率值放在圆圈右侧
            vt = document.createElementNS("http://www.w3.org/2000/svg", "text");
            vt.setAttribute("x", LX[l] + 32); vt.setAttribute("y", yOf(l, i, LAYERS[l]) + 4);
            vt.setAttribute("text-anchor", "start");
            vt.setAttribute("font-size", 12);
            vt.setAttribute("font-weight", 700);
            vt.setAttribute("fill", "#2563eb");
            vt.classList.add("nn-vtext");
            g.appendChild(vt);
          }
          svg.appendChild(g);
          col.push({ circle: c, text: t, valText: vt });
        }
        neuronPos.push(col);
      }

      // 层标签
      const labels = ["输入层", "隐藏层 1", "隐藏层 2", "输出层"];
      labels.forEach((lb, l) => {
        const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
        t.setAttribute("x", LX[l]); t.setAttribute("y", H - 10);
        t.setAttribute("text-anchor", "middle");
        t.setAttribute("font-size", 12); t.setAttribute("fill", "#9a8f74");
        t.textContent = lb;
        svg.appendChild(t);
      });
    }

    function yOf(l, i, n) {
      const span = 250;
      const top = (H - 30 - span) / 2 + 8;
      return n === 1 ? top + span / 2 : top + span * i / (n - 1);
    }

    function showAct(l, i) {
      explainEl.textContent = l === 0
        ? "输入层 · 第 " + (i + 1) + " 个输入 = " + acts[0][i].toFixed(2)
        : l === 3
          ? "输出层 · 【" + NAMES[3][i] + "】的概率 = " + (acts[3][i] * 100).toFixed(1) + "%"
          : "隐藏层 " + l + " · 神经元激活值 = " + acts[l][i].toFixed(3) + "（tanh，范围 -1 ~ 1）";
    }

    /* ---------- 绘制激活状态 ---------- */
    function paintActs() {
      for (let l = 0; l < 4; l++) {
        for (let i = 0; i < LAYERS[l]; i++) {
          const a = acts[l][i];
          const c = neuronPos[l][i].circle;
          if (a >= 0) c.setAttribute("fill", "rgba(37,99,235," + (0.10 + a * 0.8) + ")");
          else c.setAttribute("fill", "rgba(245,158,11," + (0.10 + (-a) * 0.8) + ")");
          neuronPos[l][i].text.textContent =
            l === 3 ? NAMES[l][i] : (NAMES[l][i] ? NAMES[l][i] + " " : "") + a.toFixed(2);
          if (neuronPos[l][i].valText) {
            neuronPos[l][i].valText.textContent = (a * 100).toFixed(1) + "%";
          }
        }
      }
      // 连线亮度随源激活变化
      svg.querySelectorAll(".nn-edge").forEach(line => {
        const l = +line.dataset.l, i = +line.dataset.i, j = +line.dataset.j;
        const wMat = [W1, W2, W3][l];
        const w = wMat[j][i], src = acts[l][i];
        const strength = Math.abs(w * src);
        line.setAttribute("stroke-opacity", 0.06 + Math.min(0.85, strength * 0.9));
        line.setAttribute("stroke-width", 0.6 + Math.min(7, strength * 4.5));
      });
    }

    /* ---------- 动画：逐层点亮 + 光点脉冲 ---------- */
    let timers = [], pulses = [];
    function clearPulses() {
      pulses.forEach(p => p.remove()); pulses = [];
    }

    function animate() {
      timers.forEach(clearTimeout); timers = [];
      clearPulses();
      acts = forward(inX(), inY());
      paintActs();

      // 先全部变暗，再逐层点亮
      const dimActs = [[acts[0][0], acts[0][1]], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0]];
      acts = dimActs; paintActs();

      const stepMs = 620;
      for (let l = 0; l < 3; l++) {
        timers.push(setTimeout(() => {
          const full = forward(inX(), inY());
          for (let k = 0; k <= l; k++) acts[k + 1] = full[k + 1];
          paintActs();
          spawnPulses(l);
        }, l * stepMs + 150));
      }
      timers.push(setTimeout(() => {
        acts = forward(inX(), inY());
        paintActs();
        const p = acts[3][0];
        explainEl.textContent = "前向传播完成 → 判断：这是" + (p > 0.5 ? "🐕 狗" : "🐱 猫") +
          "（置信度 " + (Math.max(p, 1 - p) * 100).toFixed(1) + "%）。换个样本再试试，观察网络路径的变化。";
      }, 3 * stepMs + 250));
    }

    function spawnPulses(l) {
      const wMat = [W1, W2, W3][l];
      for (let i = 0; i < LAYERS[l]; i++) {
        for (let j = 0; j < LAYERS[l + 1]; j++) {
          const w = wMat[j][i], src = acts[l][i];
          if (Math.abs(w * src) < 0.05) continue;
          const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          c.setAttribute("r", 4.5);
          c.setAttribute("fill", w >= 0 ? "#2563eb" : "#f59e0b");
          svg.appendChild(c);
          const x1 = LX[l], y1 = yOf(l, i, LAYERS[l]), x2 = LX[l + 1], y2 = yOf(l + 1, j, LAYERS[l + 1]);
          const t0 = performance.now(), dur = 520;
          pulses.push(c);
          (function move(now) {
            const t = Math.min(1, (now - t0) / dur);
            const e = t * (2 - t); // easeOut
            c.setAttribute("cx", x1 + (x2 - x1) * e);
            c.setAttribute("cy", y1 + (y2 - y1) * e);
            c.setAttribute("fill-opacity", 1 - t * 0.55);
            if (t < 1) requestAnimationFrame(move);
            else c.remove();
          })(t0);
        }
      }
    }

    /* ---------- 输入 ---------- */
    function inX() { return (+$(".nn-in0").value - 40) / 40; }   // -1 ~ 1
    function inY() { return (+$(".nn-in1").value - 30) / 30; }

    function syncLabels() {
      $(".nn-v0").textContent = $(".nn-in0").value + "kg";
      $(".nn-v1").textContent = $(".nn-in1").value + "km/h";
    }

    let debounce;
    function onInput() {
      syncLabels();
      clearTimeout(debounce);
      debounce = setTimeout(animate, 120);
    }
    root.querySelectorAll("input[type=range]").forEach(r => r.addEventListener("input", onInput));
    $(".nn-cat").addEventListener("click", () => { $(".nn-in0").value = 6; $(".nn-in1").value = 42; onInput(); });
    $(".nn-dog").addEventListener("click", () => { $(".nn-in0").value = 55; $(".nn-in1").value = 50; onInput(); });
    $(".nn-run").addEventListener("click", animate);

    /* ---------- 启动 ---------- */
    buildSvg();
    syncLabels();
    acts = forward(inX(), inY());
    paintActs();
    explainEl.textContent = "拖动滑块或点击样本按钮开始。猫：轻但快；狗：重且速度也不慢。";
    timers.push(setTimeout(animate, 400));

    return {
      destroy() { timers.forEach(clearTimeout); timers = []; clearPulses(); }
    };
  }

  window.DemoRegistry.register("neural-net", factory);
})();
