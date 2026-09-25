/* 演示⑫：扩散模型加噪/去噪（2022）
 * 像素级真实计算：target*(1-t) + noise*t 的前向加噪，与逐帧回退的反向去噪。 */
(function () {

  const S = 160;

  function factory(root) {
    root.innerHTML =
      '<div class="demo">' +
        '<p class="demo-intro">扩散模型学会生成的原理只有一句话：<b>先把图片加噪声到面目全非，再学会把噪声一步步去掉</b>——' +
        '会去噪，就会生成。下面的图里是像素级真实的计算：前向过程就是 <b>像素 = 目标×(1−t) + 噪声×t</b>。</p>' +
        '<div class="df-canvas-row">' +
          '<div class="df-panel"><div class="df-panel-title">目标图案</div><canvas class="df-target" width="' + S + '" height="' + S + '"></canvas></div>' +
          '<div class="df-arrow">←</div>' +
          '<div class="df-panel"><div class="df-panel-title">当前状态（噪声 t = <b class="df-tval">1.00</b>）</div><canvas class="df-view" width="' + S + '" height="' + S + '"></canvas></div>' +
        '</div>' +
        '<div class="df-controls">' +
          '<button class="btn btn-primary df-play">▶ 反向去噪（生成）</button>' +
          '<button class="btn btn-ghost df-forward">↓ 正向加噪</button>' +
          '<button class="btn btn-ghost df-noise">🎲 换一批噪声</button>' +
          '<label>图案 <select class="df-pattern">' +
            '<option value="ai">AI 文字</option><option value="smile">笑脸</option><option value="star">星星</option>' +
          '</select></label>' +
        '</div>' +
        '<div class="df-trow"><span>纯噪声</span><input type="range" class="df-slider" min="0" max="100" value="100">' +
          '<span>清晰图案</span></div>' +
        '<p class="demo-note df-note"></p>' +
      '</div>';

    const $ = (s) => root.querySelector(s);
    const targetCv = $(".df-target"), targetCtx = targetCv.getContext("2d");
    const viewCv = $(".df-view"), viewCtx = viewCv.getContext("2d");
    let t = 1, playing = 0, noise = null, raf = 0, timers = [];

    /* ---------- 目标图案 ---------- */
    function drawPattern(kind) {
      targetCtx.fillStyle = "#14161c"; targetCtx.fillRect(0, 0, S, S);
      targetCtx.strokeStyle = targetCtx.fillStyle = "#f2f2f2";
      if (kind === "ai") {
        targetCtx.font = "900 96px sans-serif";
        targetCtx.textAlign = "center"; targetCtx.textBaseline = "middle";
        targetCtx.fillText("AI", S / 2, S / 2 + 6);
      } else if (kind === "smile") {
        targetCtx.lineWidth = 8;
        targetCtx.beginPath(); targetCtx.arc(S / 2, S / 2, 52, 0, Math.PI * 2); targetCtx.stroke();
        targetCtx.beginPath(); targetCtx.arc(S / 2 - 20, S / 2 - 16, 7, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.beginPath(); targetCtx.arc(S / 2 + 20, S / 2 - 16, 7, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.beginPath(); targetCtx.arc(S / 2, S / 2 + 8, 34, 0.2 * Math.PI, 0.8 * Math.PI); targetCtx.stroke();
      } else {
        targetCtx.lineWidth = 2; targetCtx.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + i * Math.PI / 5;
          const r = i % 2 ? 24 : 60;
          const px = S / 2 + Math.cos(a) * r, py = S / 2 + Math.sin(a) * r;
          i === 0 ? targetCtx.moveTo(px, py) : targetCtx.lineTo(px, py);
        }
        targetCtx.closePath(); targetCtx.fill();
      }
    }

    /* ---------- 噪声 ---------- */
    function makeNoise() {
      noise = viewCtx.createImageData(S, S);
      for (let i = 0; i < noise.data.length; i += 4) {
        const v = Math.floor(Math.random() * 256);
        noise.data[i] = noise.data[i + 1] = noise.data[i + 2] = v;
        noise.data[i + 3] = 255;
      }
    }

    /* ---------- 渲染当前状态 ---------- */
    function render() {
      const tgt = targetCtx.getImageData(0, 0, S, S);   // 每次重新取（图案可能被切换）
      const out = viewCtx.createImageData(S, S);
      const td = tgt.data, nd = noise.data, od = out.data;
      for (let i = 0; i < td.length; i += 4) {
        for (let ch = 0; ch < 3; ch++)
          od[i + ch] = Math.round(td[i + ch] * (1 - t) + nd[i + ch] * t);
        od[i + 3] = 255;
      }
      viewCtx.putImageData(out, 0, 0);
      $(".df-tval").textContent = t.toFixed(2);
      $(".df-slider").value = Math.round(t * 100);
      const p = Math.round((1 - t) * 100);
      $(".df-note").textContent = t > 0.95 ? "画面完全是随机噪声——扩散模型训练的起点。"
        : t > 0.6 ? "噪声中隐约透出结构——反向过程刚开始“看出”图案。"
        : t > 0.25 ? "轮廓越来越清晰，模型正在抹掉与图案无关的细节。"
        : "生成完成！真实扩散模型就是把这个“去噪”过程学习了几十亿次。";
    }

    /* ---------- 动画 ---------- */
    function animate(target, step, done) {
      cancelAnimationFrame(raf); timers.forEach(clearTimeout); timers = [];
      playing = target;
      function frame() {
        t += step;
        let finished = false;
        if (target === 0 && t <= 0) { t = 0; finished = true; }
        if (target === 1 && t >= 1) { t = 1; finished = true; }
        render();
        if (finished) { playing = 0; if (done) done(); return; }
        raf = requestAnimationFrame(frame);
      }
      frame();
    }

    $(".df-play").addEventListener("click", () => {
      if (t < 1) { makeNoise(); }
      animate(0, -0.012);
    });
    $(".df-forward").addEventListener("click", () => animate(1, 0.02));
    $(".df-noise").addEventListener("click", () => { makeNoise(); render(); });
    $(".df-pattern").addEventListener("change", (e) => {
      drawPattern(e.target.value); makeNoise(); t = 1; render();
    });
    $(".df-slider").addEventListener("input", (e) => {
      playing = 0; cancelAnimationFrame(raf);
      t = e.target.value / 100; render();
    });

    /* ---------- 启动 ---------- */
    drawPattern("ai");
    makeNoise();
    t = 1; render();
    // 开场自动演示一遍去噪
    timers.push(setTimeout(() => animate(0, -0.012), 600));

    return {
      destroy() { cancelAnimationFrame(raf); timers.forEach(clearTimeout); }
    };
  }

  window.DemoRegistry.register("diffusion-demo", factory);
})();
