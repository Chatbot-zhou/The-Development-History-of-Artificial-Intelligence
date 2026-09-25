/* 演示①：Transformer 自注意力
 * 点击任一 token → 动画展示 Q/K/V 分裂、注意力连线、加权求和的完整流程。
 * 注意力权重由前端真实计算（固定种子的小向量 + softmax），非假动画。 */
(function () {

  /* ---------- 确定性伪随机 ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  const DIM = 6;

  function buildModel(tokens) {
    const seed = hashStr(tokens.join("|"));
    const rnd = mulberry32(seed);
    const rndT = (i) => mulberry32(seed + i * 7919);

    // 词向量
    const E = tokens.map((_, i) => {
      const r = rndT(i), v = [];
      for (let d = 0; d < DIM; d++) v.push(Math.round((r() * 2 - 1) * 100) / 100);
      return v;
    });
    // 三个投影矩阵
    const mkMat = (salt) => {
      const r = mulberry32(seed ^ salt), m = [];
      for (let i = 0; i < DIM; i++) {
        const row = [];
        for (let j = 0; j < DIM; j++) row.push(r() * 2 - 1);
        m.push(row);
      }
      return m;
    };
    const WQ = mkMat(0x51ed), WK = mkMat(0x2ba7), WV = mkMat(0x93c1);
    const proj = (W, e) => {
      const out = new Array(DIM).fill(0);
      for (let i = 0; i < DIM; i++)
        for (let j = 0; j < DIM; j++) out[i] += W[i][j] * e[j];
      return out.map(v => Math.round(v * 100) / 100);
    };
    const Q = E.map(e => proj(WQ, e));
    const K = E.map(e => proj(WK, e));
    const V = E.map(e => proj(WV, e));

    // 注意力矩阵：softmax(QK^T / sqrt(d))
    const A = tokens.map((_, i) => {
      const scores = tokens.map((_, j) => {
        let s = 0;
        for (let d = 0; d < DIM; d++) s += Q[i][d] * K[j][d];
        return s / Math.sqrt(DIM);
      });
      const mx = Math.max(...scores);
      const exps = scores.map(s => Math.exp(s - mx));
      const sum = exps.reduce((a, b) => a + b, 0);
      return exps.map(v => Math.round(v / sum * 1000) / 1000);
    });
    // 输出向量 = A 行 × V
    const O = A.map(row => {
      const out = new Array(DIM).fill(0);
      row.forEach((w, j) => { for (let d = 0; d < DIM; d++) out[d] += w * V[j][d]; });
      return out.map(v => Math.round(v * 100) / 100);
    });
    return { E, Q, K, V, A, O };
  }

  /* ---------- 颜色工具 ---------- */
  function vecColor(v) { // -1..1 -> 蓝(-) 白(0) 橙(+)
    const t = Math.max(-1, Math.min(1, v));
    if (t >= 0) return "rgba(245, 158, 11," + (0.12 + t * 0.8) + ")";
    return "rgba(37, 99, 235," + (0.12 + (-t) * 0.8) + ")";
  }
  function attColor(w) { // 0..1 -> 米白 到 亮蓝
    const t = Math.max(0, Math.min(1, w));
    const r = Math.round(250 + (37 - 250) * t);
    const g = Math.round(247 + (99 - 247) * t);
    const b = Math.round(240 + (235 - 240) * t);
    return "rgb(" + r + "," + g + "," + b + ")";
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

  const SENTENCES = [
    { label: "英文：The cat sat on the mat", tokens: ["The", "cat", "sat", "on", "the", "mat"] },
    { label: "中文：猫 坐 在 柔软 的 垫子 上", tokens: ["猫", "坐", "在", "柔软", "的", "垫子", "上"] }
  ];

  /* ---------- 模块工厂 ---------- */
  function factory(root) {
    let tokens = SENTENCES[0].tokens.slice();
    let model = buildModel(tokens);
    let selected = 1;
    let timers = [];

    root.innerHTML =
      '<div class="demo">' +
        '<p class="demo-intro">每个词的向量会分裂出 <b style="color:var(--blue)">Query（我在找什么）</b>、' +
        '<b style="color:var(--orange)">Key（我的特征）</b> 和 <b style="color:var(--green)">Value（我的信息）</b> 三份拷贝。' +
        '<b>点击下方任意一个词</b>，看它与句中所有词的注意力如何计算、流动、汇聚。</p>' +
        '<div class="att-toolbar">' +
          '<label>示例句子 <select class="att-sent"></select></label>' +
          '<button class="btn btn-ghost att-replay">▶ 重播当前流程</button>' +
        '</div>' +
        '<div class="att-tokens"></div>' +
        '<div class="att-stage"></div>' +
        '<p class="att-explain demo-note"></p>' +
        '<div class="att-hm-wrap">' +
          '<div class="att-hm-title">注意力热力图 <span class="demo-note">行 = 当前词（Query），列 = 被关注的词（Key），颜色越深注意力权重越大；点击行首可选中该词</span></div>' +
          '<div class="att-hm"></div>' +
        '</div>' +
      '</div>';

    const $ = (sel) => root.querySelector(sel);
    const tokensEl = $(".att-tokens");
    const stageEl = $(".att-stage");
    const explainEl = $(".att-explain");
    const hmEl = $(".att-hm");

    /* ---------- 句子选择 ---------- */
    const sentSel = $(".att-sent");
    SENTENCES.forEach((s, i) => {
      const opt = document.createElement("option");
      opt.value = i; opt.textContent = s.label;
      sentSel.appendChild(opt);
    });
    sentSel.addEventListener("change", () => {
      tokens = SENTENCES[+sentSel.value].tokens.slice();
      model = buildModel(tokens);
      selected = Math.min(1, tokens.length - 1);
      renderTokens(); renderHeatmap(); play();
    });
    $(".att-replay").addEventListener("click", play);

    /* ---------- token 行 ---------- */
    function renderTokens() {
      tokensEl.innerHTML = "";
      tokens.forEach((tk, i) => {
        const chip = document.createElement("div");
        chip.className = "tok" + (i === selected ? " active" : "");
        const strip = model.E[i].map(v =>
          '<i style="background:' + vecColor(v) + '"></i>').join("");
        chip.innerHTML = '<span class="tok-txt">' + esc(tk) + '</span><span class="tok-vec">' + strip + '</span>';
        chip.addEventListener("click", () => { selected = i; renderTokens(); renderHeatmap(); play(); });
        tokensEl.appendChild(chip);
      });
    }

    /* ---------- SVG 流程动画 ---------- */
    const W = 880, H = 340;
    function svgInit() {
      stageEl.innerHTML =
        '<svg class="att-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet"></svg>';
      return stageEl.querySelector("svg");
    }
    function el(name, attrs, parent) {
      const n = document.createElementNS("http://www.w3.org/2000/svg", name);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      (parent || null) && parent.appendChild(n);
      return n;
    }

    function tokenX(i, n, pad) {
      pad = pad || 90;
      return pad + (W - pad * 2) * (n === 1 ? 0.5 : i / (n - 1));
    }

    function play() {
      timers.forEach(clearTimeout); timers = [];
      const svg = svgInit();
      const n = tokens.length;
      const A = model.A, Qv = model.Q[selected], Kv = model.K[selected], Ov = model.O[selected];
      const selX = tokenX(selected, n);
      const later = (fn, t) => timers.push(setTimeout(fn, t));

      /* 第0帧：输入行 token */
      explainEl.textContent = "第 1 步 · 每个词的向量各自分裂出 Query / Key / Value 三种角色。";
      const rowG = el("g", {}, svg);
      tokens.forEach((tk, i) => {
        const x = tokenX(i, n);
        el("rect", { x: x - 34, y: 18, width: 68, height: 34, rx: 8,
          fill: i === selected ? "#2563eb" : "#ffffff", stroke: "#e5ddcc" }, rowG);
        el("text", { x: x, y: 40, "text-anchor": "middle", "font-size": 15,
          fill: i === selected ? "#fff" : "#1f2937", "font-weight": 600 }, rowG).textContent = tk;
      });

      /* 第1步：Q/K/V 分裂 */
      later(() => {
        explainEl.textContent = "第 1 步 · 选中的词【" + tokens[selected] + "】分裂出三个角色：Query（查询）、Key（键）、Value（值）。";
        const qkv = [["Q", "#2563eb"], ["K", "#f59e0b"], ["V", "#10b981"]];
        qkv.forEach(([nm, color], k) => {
          const x = selX + (k - 1) * 90, y = 100;
          el("line", { x1: selX, y1: 52, x2: x, y2: y - 16, stroke: color, "stroke-width": 2,
            "stroke-dasharray": "4 4", class: "att-anim-line" }, svg);
          el("rect", { x: x - 26, y: y, width: 52, height: 36, rx: 8, fill: color }, svg);
          el("text", { x: x, y: y + 24, "text-anchor": "middle", "font-size": 16, fill: "#fff", "font-weight": 700 }, svg).textContent = nm;
        });
      }, 900);

      /* 第2步：Q 与所有 K 计算相似度 */
      later(() => {
        explainEl.textContent = "第 2 步 · 用 Query 与每个词的 Key 计算相似度：越相关的词，连线越亮越粗（已按 softmax 归一化，总和为 1）。";
        tokens.forEach((tk, j) => {
          const x = tokenX(j, n);
          const w = A[selected][j];
          const yq = 118;
          el("line", { x1: selX, y1: yq, x2: x, y2: 170, stroke: "#2563eb",
            "stroke-width": 1 + w * 9, "stroke-opacity": 0.15 + w * 0.85,
            "stroke-linecap": "round", class: "att-anim-line" }, svg);
          el("text", { x: x, y: 188, "text-anchor": "middle", "font-size": 11,
            fill: "#2563eb", "font-weight": 700 }, svg).textContent = Math.round(w * 100) + "%";
          el("rect", { x: x - 34, y: 196, width: 68, height: 30, rx: 7,
            fill: attColor(w), stroke: "#e5ddcc" }, svg);
          el("text", { x: x, y: 216, "text-anchor": "middle", "font-size": 12,
            fill: w > 0.55 ? "#fff" : "#1f2937" }, svg).textContent = tk;
        });
      }, 2100);

      /* 第3步：按权重加权求和所有 V */
      later(() => {
        explainEl.textContent = "第 3 步 · 按注意力权重把每个词的 Value 加权求和——重要的词贡献更多自己的信息。";
        tokens.forEach((tk, j) => {
          const x = tokenX(j, n);
          const w = A[selected][j];
          el("line", { x1: x, y1: 226, x2: selX, y2: 278, stroke: "#10b981",
            "stroke-width": 1 + w * 8, "stroke-opacity": 0.15 + w * 0.85,
            "stroke-linecap": "round", class: "att-anim-line" }, svg);
        });
        el("circle", { cx: selX, cy: 292, r: 15, fill: "#10b981", class: "att-pulse" }, svg);
        el("text", { x: selX + 26, y: 297, "font-size": 12, fill: "#047857", "font-weight": 600 }, svg).textContent = "加权求和 Σ";
      }, 3300);

      /* 第4步：输出新向量 */
      later(() => {
        explainEl.textContent = "完成！【" + tokens[selected] + "】的新向量已融合整句语境。" +
          "每个词都同时做这件事（并行），一层注意力后整句信息互相关联。试试点击别的词。";
        const strip = Ov.map(v => '<i style="background:' + vecColor(v) + '"></i>').join("");
        // 叠加 HTML 标签展示输出向量
        const outTag = document.createElement("div");
        outTag.className = "att-outvec";
        outTag.style.left = "calc(50% - 60px)";
        outTag.innerHTML = '<span>输出向量</span><span class="tok-vec">' + strip + "</span>";
        stageEl.appendChild(outTag);
      }, 4500);
    }

    /* ---------- 热力图 ---------- */
    function renderHeatmap() {
      hmEl.innerHTML = "";
      const n = tokens.length;
      const A = model.A;
      const grid = document.createElement("div");
      grid.className = "hm-grid";
      grid.style.gridTemplateColumns = "64px repeat(" + n + ", 1fr)";

      grid.appendChild(document.createElement("span")); // 左上空格
      tokens.forEach(tk => {
        const c = document.createElement("span");
        c.className = "hm-head hm-col"; c.textContent = tk;
        grid.appendChild(c);
      });

      tokens.forEach((tkRow, i) => {
        const rh = document.createElement("span");
        rh.className = "hm-head hm-row" + (i === selected ? " sel" : "");
        rh.textContent = tkRow;
        rh.addEventListener("click", () => { selected = i; renderTokens(); renderHeatmap(); play(); });
        grid.appendChild(rh);

        tokens.forEach((_, j) => {
          const c = document.createElement("span");
          const w = A[i][j];
          c.className = "hm-cell";
          c.style.background = attColor(w);
          if (w > 0.55) c.style.color = "#fff";
          c.textContent = w.toFixed(2);
          c.addEventListener("mouseenter", () => {
            tokensEl.querySelectorAll(".tok").forEach((t, k) => {
              t.classList.toggle("hl-q", k === i);
              t.classList.toggle("hl-k", k === j);
            });
          });
          c.addEventListener("mouseleave", () => {
            tokensEl.querySelectorAll(".tok").forEach(t => t.classList.remove("hl-q", "hl-k"));
          });
          grid.appendChild(c);
        });
      });
      hmEl.appendChild(grid);
    }

    /* ---------- 启动 ---------- */
    renderTokens();
    renderHeatmap();
    play();

    return {
      destroy() { timers.forEach(clearTimeout); timers = []; }
    };
  }

  window.DemoRegistry.register("attention", factory);
})();
