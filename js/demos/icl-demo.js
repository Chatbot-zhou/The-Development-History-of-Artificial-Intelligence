/* 演示⑩：上下文学习 ICL（2020 GPT-3）
 * 隐藏词典构成一个“外星语翻译任务”：提示里放几个示例，模型（模拟）就能完成任务；
 * 示例数量决定正确率——k=0 全错，k≥2 任务格式被识别后接近全对。 */
(function () {

  const DICT = [
    ["zynva", "星舰"], ["korath", "沙丘"], ["meluin", "森林"], ["taviq", "灯塔"],
    ["praska", "鲸鱼"], ["donvel", "火山"], ["ilume", "极光"], ["sarneth", "沙漠"],
    ["quorin", "冰川"], ["velsta", "橡树"]
  ];
  const WRONG_POOL = DICT.map(d => d[1]);

  function factory(root) {
    root.innerHTML =
      '<div class="demo">' +
        '<p class="demo-intro">GPT-3 最神奇的能力是<b>上下文学习（ICL）</b>：参数一动不动，' +
        '只要在提示里放几个示例，它就能“学会”一个从未训练过的任务。<b>下方词典就是本题的“标准答案”（默认隐藏）。</b>' +
        '试着增加示例数量，观察正确率如何随 k 变化——模型读的只是上下文，什么都没“训练”。</p>' +
        '<div class="icl-layout">' +
          '<div class="icl-left">' +
            '<div class="icl-prompt-title">提示词（模型唯一能看到的东西）</div>' +
            '<pre class="icl-prompt"></pre>' +
            '<div class="icl-btn-row">' +
              '<button class="btn btn-ghost icl-add">＋ 添加一个示例</button>' +
              '<button class="btn btn-ghost icl-clear">🗑 清空示例</button>' +
              '<button class="btn btn-ghost icl-reveal">👁 显示隐藏词典</button>' +
            '</div>' +
            '<div class="icl-dict demo-note"></div>' +
          '</div>' +
          '<div class="icl-right">' +
            '<div class="icl-test-row">' +
              '<span>测试词</span><b class="icl-word">——</b>' +
              '<button class="btn btn-ghost icl-reroll">🎲 换一个测试词</button>' +
            '</div>' +
            '<button class="btn btn-primary icl-run">⚡ 让模型回答</button>' +
            '<div class="icl-result"></div>' +
            '<div class="icl-stat">近 10 次正确率 <b class="icl-acc">–</b><div class="icl-accbar"><i></i></div></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    const $ = (s) => root.querySelector(s);
    const promptEl = $(".icl-prompt"), wordEl = $(".icl-word"), resultEl = $(".icl-result");
    const accEl = $(".icl-acc"), accBar = $(".icl-accbar i"), dictEl = $(".icl-dict");
    let k = 0, examples = [], testWord = null, revealed = false;
    let history = [];   // 最近 10 次对错

    function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

    function renderPrompt() {
      let p = "任务：把外星语单词翻译成中文。\n\n";
      examples.forEach(ex => { p += ex[0] + " → " + ex[1] + "\n"; });
      p += "\n测试：" + testWord + " →";
      promptEl.textContent = p;
    }
    function renderDict() {
      dictEl.innerHTML = revealed
        ? "隐藏词典：" + DICT.map(d => d[0] + "→" + d[1]).join("、")
        : "隐藏词典：已隐藏（点 👁 显示）";
    }
    function pickTest() {
      const pool = DICT.filter(d => !examples.some(ex => ex[0] === d[0]));
      testWord = (pool.length ? pool : DICT)[Math.floor(Math.random() * (pool.length ? pool.length : DICT.length))][0];
      wordEl.textContent = testWord;
      renderPrompt();
    }
    function updateAcc() {
      if (!history.length) { accEl.textContent = "–"; accBar.style.width = "0"; return; }
      const acc = Math.round(history.filter(h => h).length / history.length * 100);
      accEl.textContent = acc + "%";
      accBar.style.width = acc + "%";
      accBar.style.background = acc >= 80 ? "var(--green)" : acc >= 40 ? "var(--orange)" : "#e05c5c";
    }

    $(".icl-add").addEventListener("click", () => {
      if (examples.length >= DICT.length - 1) return;
      const pool = DICT.filter(d => d[0] !== testWord && !examples.some(ex => ex[0] === d[0]));
      examples.push(pool[Math.floor(Math.random() * pool.length)]);
      k = examples.length;
      renderPrompt(); renderDict(); pickTest();
    });
    $(".icl-clear").addEventListener("click", () => { examples = []; k = 0; renderPrompt(); renderDict(); pickTest(); });
    $(".icl-reveal").addEventListener("click", () => { revealed = !revealed; renderDict(); });
    $(".icl-reroll").addEventListener("click", () => { pickTest(); });

    $(".icl-run").addEventListener("click", () => {
      const truth = DICT.find(d => d[0] === testWord)[1];
      let ans, correct;
      if (k >= 2) {
        ans = truth; correct = true;           // 任务格式已被上下文“教会”
      } else if (k === 1) {
        correct = Math.random() < 0.5;         // 只有一个示例，任务格式不稳定
        ans = correct ? truth : WRONG_POOL.filter(w => w !== truth)[Math.floor(Math.random() * (WRONG_POOL.length - 1))];
      } else {
        correct = Math.random() < 0.2;         // 零示例：几乎只能瞎猜
        ans = correct ? truth : WRONG_POOL.filter(w => w !== truth)[Math.floor(Math.random() * (WRONG_POOL.length - 1))];
      }
      resultEl.innerHTML =
        '<span class="icl-ans">模拟回答：<b>' + esc(ans) + "</b></span>" +
        '<span class="' + (correct ? "icl-ok" : "icl-bad") + '">' + (correct ? "✓ 正确" : "✗ 错误") + "</span>" +
        '<div class="demo-note">' +
          (k >= 2 ? "k=" + k + "：上下文里已有足够示例，模型“认出了”任务格式。" :
            "k=" + k + "：示例不足，模型只能根据词形瞎猜。（模拟：按论文结论设定正确率）") +
        "</div>";
      history.push(correct);
      if (history.length > 10) history.shift();
      updateAcc();
    });
    function esc(s) {
      return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    }

    pickTest(); renderDict(); updateAcc();

    return { destroy() {} };
  }

  window.DemoRegistry.register("icl-demo", factory);
})();
