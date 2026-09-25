/* 演示⑧：卷积核可视化（2012 AlexNet / CNN）
 * 手绘或使用内置图案 → 选择 3×3 卷积核 → 逐行扫描计算特征图 → 最大池化。
 * 全部为真实卷积计算。 */
(function () {

  const S = 160;              // 输入尺寸
  const KERNELS = {
    edge:  { name: "边缘检测", k: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], note: "Sobel 算子：亮度突变处响应强烈，勾出物体轮廓" },
    sharp: { name: "锐化",    k: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], note: "中心权重 5、邻域为负：放大细节与噪声" },
    blur:  { name: "模糊",    k: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], note: "全部 1/9：邻域平均，抹平细节" },
    emboss:{ name: "浮雕",    k: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]], note: "不对称权重：产生立体浮雕感" }
  };

  function factory(root) {
    root.innerHTML =
      '<div class="demo">' +
        '<p class="demo-intro">卷积是 CNN 的心脏：一个 <b>3×3 的卷积核</b>（就是一组权重）在图片上逐格滑动，' +
        '每次把盖住的 9 个像素与核内权重对应相乘再求和，得到特征图上的一个点。<b>不同的核，学到不同的特征。</b>' +
        '在输入画布上画点什么（或用内置图案），选一个核，看特征图如何生成。</p>' +
        '<div class="cv-row">' +
          '<div class="cv-panel">' +
            '<div class="cv-panel-title">输入图案（可用鼠标手绘）</div>' +
            '<canvas class="cv-in" width="' + S + '" height="' + S + '"></canvas>' +
            '<div class="cv-panel-btns">' +
              '<button class="btn btn-ghost cv-clear">🧽 清空重画</button>' +
              '<button class="btn btn-ghost cv-shape">⬡ 内置图案</button>' +
            '</div>' +
          '</div>' +
          '<div class="cv-arrow">→<div class="cv-kernel-note"></div></div>' +
          '<div class="cv-panel">' +
            '<div class="cv-panel-title">卷积特征图</div>' +
            '<canvas class="cv-out" width="' + S + '" height="' + S + '"></canvas>' +
          '</div>' +
          '<div class="cv-arrow">→<div class="cv-pool-note">2×2 最大池化</div></div>' +
          '<div class="cv-panel">' +
            '<div class="cv-panel-title">池化后（缩小一半）</div>' +
            '<canvas class="cv-pool" width="' + (S / 2) + '" height="' + (S / 2) + '"></canvas>' +
          '</div>' +
        '</div>' +
        '<div class="cv-controls">' +
          '<label>卷积核 <select class="cv-kernel"></select></label>' +
          '<span class="cv-kdisplay demo-note"></span>' +
        '</div>' +
      '</div>';

    const $ = (s) => root.querySelector(s);
    const inCv = $(".cv-in"), inCtx = inCv.getContext("2d");
    const outCv = $(".cv-out"), outCtx = outCv.getContext("2d");
    const poolCv = $(".cv-pool"), poolCtx = poolCv.getContext("2d");

    /* ---------- 输入画布：内置图案 + 手绘 ---------- */
    function drawDefault() {
      inCtx.fillStyle = "#111"; inCtx.fillRect(0, 0, S, S);
      inCtx.strokeStyle = "#fff"; inCtx.lineWidth = 5;
      inCtx.strokeRect(28, 28, 50, 50);
      inCtx.beginPath(); inCtx.arc(112, 60, 30, 0, Math.PI * 2); inCtx.stroke();
      inCtx.beginPath(); inCtx.moveTo(20, 130); inCtx.lineTo(80, 80); inCtx.lineTo(140, 130);
      inCtx.closePath(); inCtx.fillStyle = "#bbb"; inCtx.fill();
      inCtx.fillStyle = "#fff"; inCtx.font = "16px sans-serif";
      inCtx.fillText("AI", 66, 150);
      computeAll();
    }
    drawDefault();

    let drawing = false;
    function drawAt(e) {
      const r = inCv.getBoundingClientRect();
      const x = Math.round((e.clientX - r.left) / r.width * S);
      const y = Math.round((e.clientY - r.top) / r.height * S);
      inCtx.fillStyle = "#fff";
      inCtx.beginPath(); inCtx.arc(x, y, 6, 0, Math.PI * 2); inCtx.fill();
    }
    inCv.addEventListener("mousedown", (e) => { drawing = true; drawAt(e); });
    inCv.addEventListener("mousemove", (e) => { if (drawing) { drawAt(e); computeAll(); } });
    window.addEventListener("mouseup", () => { drawing = false; });
    inCv.addEventListener("mousedown", () => computeAll());
    $(".cv-clear").addEventListener("click", () => {
      inCtx.fillStyle = "#111"; inCtx.fillRect(0, 0, S, S); computeAll();
    });
    $(".cv-shape").addEventListener("click", drawDefault);

    /* ---------- 卷积核选择 ---------- */
    const sel = $(".cv-kernel");
    Object.keys(KERNELS).forEach(k => {
      const o = document.createElement("option");
      o.value = k; o.textContent = KERNELS[k].name;
      sel.appendChild(o);
    });
    function kernelNote() {
      const k = KERNELS[sel.value].k;
      $(".cv-kdisplay").textContent =
        "核 = [" + k.map(r => "[" + r.join(",") + "]").join(" ") + "] — " + KERNELS[sel.value].note;
    }
    sel.addEventListener("change", () => { kernelNote(); computeAll(); });
    kernelNote();

    /* ---------- 卷积（逐行扫描动画）+ 池化 ---------- */
    let scanRow = 0, raf = 0, running = false, inputSnapshot = null;
    function computeAll() {
      clearTimeout(raf);
      scanRow = 0;
      outCtx.fillStyle = "#000"; outCtx.fillRect(0, 0, S, S);
      inputSnapshot = inCtx.getImageData(0, 0, S, S);   // 快照：扫描带不再堆积污染输入画布
      running = true;
      scanRows();
    }
    function scanRows() {
      if (!running) return;
      const k = KERNELS[sel.value].k;
      const src = inputSnapshot.data;
      outCtx.fillStyle = "#000"; outCtx.fillRect(0, scanRow, S, 4);
      for (let r = scanRow; r < Math.min(scanRow + 5, S - 1); r++) {
        for (let c = 1; c < S - 1; c++) {
          let sum = 0;
          for (let ki = 0; ki < 3; ki++)
            for (let kj = 0; kj < 3; kj++) {
              const p = src[((r + ki - 1) * S + (c + kj - 1)) * 4];   // 灰度取 R 通道
              sum += p * k[ki][kj];
            }
          const v = Math.max(0, Math.min(255, Math.round(128 + sum / 2)));
          outCtx.fillStyle = "rgb(" + v + "," + v + "," + v + ")";
          outCtx.fillRect(c, r, 1, 1);
        }
      }
      scanRow += 5;
      // 扫描进度高亮：先恢复快照再画当前扫描带
      inCtx.putImageData(inputSnapshot, 0, 0);
      inCtx.save();
      inCtx.strokeStyle = "rgba(37,99,235,.9)"; inCtx.lineWidth = 3;
      inCtx.strokeRect(1, Math.max(1, scanRow - 6), S - 2, 6);
      inCtx.restore();
      if (scanRow < S - 1) { raf = setTimeout(scanRows, 16); }
      else { running = false; inCtx.putImageData(inputSnapshot, 0, 0); pool(); }
    }
    function pool() {
      const d = outCtx.getImageData(0, 0, S, S).data;
      const pw = S / 2;
      poolCtx.clearRect(0, 0, pw, pw);
      for (let r = 0; r < pw; r++)
        for (let c = 0; c < pw; c++) {
          let mx = 0;
          for (let dr = 0; dr < 2; dr++)
            for (let dc = 0; dc < 2; dc++) {
              const p = d[((r * 2 + dr) * S + (c * 2 + dc)) * 4];
              if (p > mx) mx = p;
            }
          poolCtx.fillStyle = "rgb(" + mx + "," + mx + "," + mx + ")";
          poolCtx.fillRect(c, r, 1, 1);
        }
    }

    computeAll();

    return {
      destroy() { cancelAnimationFrame(raf); running = false; }
    };
  }

  window.DemoRegistry.register("conv-demo", factory);
})();
