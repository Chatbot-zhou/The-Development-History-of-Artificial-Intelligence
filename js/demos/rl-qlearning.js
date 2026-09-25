/* 演示⑥：强化学习 Q-learning
 * 智能体从零开始学井字棋：ε-贪婪探索 + 时序差分更新。
 * 可视化：胜率曲线、探索率衰减、对弈时空格子上的 Q 值颜色。 */
(function () {

  function factory(root) {
    root.innerHTML =
      '<div class="demo">' +
        '<p class="demo-intro">这是一个对强化学习一无所知的智能体（Q 表全为 0）。' +
        '它通过<b>试错 + 奖励</b>学习：赢 +1，输 -1，平局 +0.4。' +
        '先<b style="color:var(--orange)">训练</b>它，再<b style="color:var(--blue)">与它对弈</b>——' +
        '对弈时空格子上的颜色就是它对每个落子点的“估值”（绿越深 = 它越想下这儿）。</p>' +
        '<div class="rl-layout">' +
          '<div class="rl-left">' +
            '<div class="rl-banner"></div>' +
            '<div class="rl-board"></div>' +
            '<p class="demo-note rl-board-note">你执 O（蓝圈），AI 执 X · 点击空格落子</p>' +
          '</div>' +
          '<div class="rl-side">' +
            '<div class="rl-btn-row">' +
              '<button class="btn btn-primary rl-train">▶ 训练 500 局</button>' +
              '<button class="btn btn-orange rl-play">🎮 与 AI 对弈</button>' +
              '<button class="btn btn-ghost rl-reset">🧠 清空大脑</button>' +
            '</div>' +
            '<div class="rl-stat">' +
              '<div>已训练 <b class="rl-games">0</b> 局</div>' +
              '<div>近 30 局得分率 <b class="rl-winrate">–</b></div>' +
              '<div>Q 表状态数 <b class="rl-qcount">0</b></div>' +
              '<div>探索率 ε <b class="rl-eps">0.35</b></div>' +
            '</div>' +
            '<div class="rl-chart-wrap">' +
              '<div class="demo-note">得分率曲线（含平局 0.4 折算）</div>' +
              '<canvas class="rl-chart" width="240" height="96"></canvas>' +
            '</div>' +
            '<p class="demo-note rl-tip">刚初始化的 AI 会乱走；训练 1000 局后它几乎不会再输。这就是强化学习的魅力：没有人工规则，只有奖励信号。</p>' +
          '</div>' +
        '</div>' +
      '</div>';

    const $ = (s) => root.querySelector(s);
    const boardEl = $(".rl-board"), bannerEl = $(".rl-banner");

    /* ---------- Q-learning 核心 ---------- */
    const ALPHA = 0.6, GAMMA = 0.95;
    let Q = {}, games = 0, results = [];

    const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const key = (b) => b.join("");
    const actionsOf = (b) => { const r = []; b.forEach((v, i) => { if (v === "-") r.push(i); }); return r; };

    function winner(b) {
      for (const [a, c, d] of LINES) {
        if (b[a] !== "-" && b[a] === b[c] && b[c] === b[d]) return b[a];
      }
      return actionsOf(b).length ? null : "draw";
    }
    function getQ(s, a) { return (Q[s] && Q[s][a] !== undefined) ? Q[s][a] : 0; }
    function setQ(s, a, v) { (Q[s] = Q[s] || {})[a] = v; }
    function maxQ(s) {
      const b = s.split(""), acts = actionsOf(b);
      if (!acts.length) return 0;
      return Math.max(...acts.map(a => getQ(s, a)));
    }

    function agentMove(b, eps) {
      const acts = actionsOf(b);
      if (Math.random() < eps) return acts[Math.floor(Math.random() * acts.length)];
      const s = key(b);
      let best = -Infinity, cand = [];
      acts.forEach(a => {
        const q = getQ(s, a);
        if (q > best + 1e-9) { best = q; cand = [a]; }
        else if (Math.abs(q - best) < 1e-9) cand.push(a);
      });
      return cand[Math.floor(Math.random() * cand.length)];
    }

    function trainGame() {
      const b = Array(9).fill("-");
      const history = [];
      let turn = "X";   // AI 执 X；偶尔让对手先手，学习防守
      if (Math.random() < 0.3) turn = "O";
      let r = 0;
      while (true) {
        if (turn === "X") {
          const s = key(b);
          const a = agentMove(b, eps());
          b[a] = "X";
          history.push({ s, a });
          const w = winner(b);
          if (w) { r = w === "X" ? 1 : w === "draw" ? 0.4 : -1; break; }
        } else {
          const acts = actionsOf(b);
          b[acts[Math.floor(Math.random() * acts.length)]] = "O";
          const w = winner(b);
          if (w) { r = w === "O" ? -1 : 0.4; break; }
        }
        turn = turn === "X" ? "O" : "X";
      }
      for (let i = history.length - 1; i >= 0; i--) {
        const { s, a } = history[i];
        const target = i === history.length - 1 ? r : GAMMA * maxQ(history[i + 1].s);
        setQ(s, a, getQ(s, a) + ALPHA * (target - getQ(s, a)));
      }
      games++;
      results.push(r);
      if (results.length > 400) results.shift();
    }

    function eps() { return Math.max(0.02, 0.35 * Math.pow(0.9985, games)); }

    /* ---------- 训练循环 ---------- */
    let training = false, raf = 0, trainTarget = 0;

    function trainLoop() {
      if (!training) return;
      for (let i = 0; i < 8 && games < trainTarget; i++) trainGame();
      updateStats(); paintChart(); paintBoardIdle();
      if (games >= trainTarget) {
        training = false;
        banner("训练完成！AI 已经历 " + games + " 局试错。点「与 AI 对弈」检验它的实力 🎮", "ok");
        return;
      }
      raf = setTimeout(trainLoop, 16);
    }

    function startTraining() {
      if (playing) endPlay();
      training = true;
      trainTarget = games + 500;
      banner("AI 正在与随机对手自我试错…（它每局都在更新 Q 表）", "run");
      trainLoop();
    }

    /* ---------- 对弈 ---------- */
    let playing = false, board = Array(9).fill("-"), userTurn = false, locked = false;
    let playTimers = [];

    function startPlay() {
      if (training) { training = false; clearTimeout(raf); }
      playing = true;
      board = Array(9).fill("-");
      banner("新对局开始：AI 先手（执 X）", "run");
      renderBoard();
      userTurn = false;
      locked = true;
      playTimers.push(setTimeout(() => aiTurn(), 500));
    }
    function endPlay() {
      playing = false; userTurn = false; locked = false;
      playTimers.forEach(clearTimeout); playTimers = [];
    }

    function aiTurn() {
      // 先把 Q 值显示在空格上（教学时刻）
      const acts = actionsOf(board);
      const s = key(board);
      const vals = acts.map(a => getQ(s, a));
      const mn = Math.min(...vals), mx = Math.max(...vals);
      renderBoard((cell, idx) => {
        if (!acts.includes(idx)) return null;
        const t = mx > mn ? (getQ(s, idx) - mn) / (mx - mn) : 0.5;
        return "rgba(16,185,129," + (0.10 + t * 0.55) + ")";
      });
      banner("AI 正在估值每个落子点…（绿越深越想下）", "run");
      playTimers.push(setTimeout(() => {
        const a = agentMove(board, 0);
        board[a] = "X";
        renderBoard(null, a);
        const w = winner(board);
        if (w) return finish(w);
        userTurn = true; locked = false;
        banner("轮到你了：点击空格落子（你执 O）", "run");
      }, 700));
    }

    boardEl.addEventListener("click", (e) => {
      const cell = e.target.closest(".rl-cell");
      if (!cell || locked || !playing || !userTurn) return;
      const idx = +cell.dataset.idx;
      if (board[idx] !== "-") return;
      board[idx] = "O";
      renderBoard(null, idx);
      userTurn = false; locked = true;
      const w = winner(board);
      if (w) return finish(w);
      playTimers.push(setTimeout(() => aiTurn(), 350));
    });

    function finish(w) {
      locked = false; userTurn = false;
      if (w === "draw") banner("🤝 平局！AI 没给你留下任何破绽。", "ok");
      else if (w === "O") banner("🎉 你赢了！这说明 AI 训练得还不够，再多训几轮试试。", "win");
      else banner("🤖 AI 获胜。它见过几千种局面，找到了你的弱点。", "lose");
      renderBoard();
    }

    /* ---------- 渲染 ---------- */
    function renderBoard(qColorFn, lastIdx) {
      boardEl.innerHTML = "";
      board.forEach((v, i) => {
        const cell = document.createElement("div");
        cell.dataset.idx = i;
        cell.className = "rl-cell" + (v === "-" ? " empty" : "") + (i === lastIdx ? " last" : "");
        const qc = qColorFn && qColorFn(cell, i);
        if (qc) cell.style.background = qc;
        if (v !== "-") {
          cell.innerHTML = '<span class="rl-mark ' + (v === "X" ? "x" : "o") + '">' + v + "</span>";
        }
        boardEl.appendChild(cell);
      });
    }
    function paintBoardIdle() {
      // 训练时展示一局演示局面
      if (!playing) {
        const demo = ["X", "O", "-", "-", "X", "O", "-", "-", "-"];
        boardEl.innerHTML = "";
        demo.forEach((v, i) => {
          const cell = document.createElement("div");
          cell.dataset.idx = i;
          cell.className = "rl-cell" + (v === "-" ? " empty" : "");
          if (v !== "-") cell.innerHTML = '<span class="rl-mark ' + (v === "X" ? "x" : "o") + '">' + v + "</span>";
          boardEl.appendChild(cell);
        });
      }
    }

    function banner(text, kind) {
      bannerEl.textContent = text;
      bannerEl.className = "rl-banner " + (kind || "");
    }

    function updateStats() {
      $(".rl-games").textContent = games;
      $(".rl-qcount").textContent = Object.keys(Q).length;
      $(".rl-eps").textContent = eps().toFixed(3);
      const last = results.slice(-30);
      $(".rl-winrate").textContent = last.length
        ? Math.round(last.reduce((a, b) => a + b, 0) / last.length * 100) + "%"
        : "–";
    }

    function paintChart() {
      const cv = $(".rl-chart"), c = cv.getContext("2d");
      const w = cv.width, h = cv.height;
      c.clearRect(0, 0, w, h);
      c.fillStyle = "#fffdf6"; c.fillRect(0, 0, w, h);
      if (results.length < 2) return;
      const win = 30;
      const pts = [];
      for (let i = win; i <= results.length; i++) {
        let s = 0;
        for (let j = i - win; j < i; j++) s += results[j];
        pts.push(s / win);
      }
      c.beginPath();
      pts.forEach((v, i) => {
        const x = i / (pts.length - 1) * (w - 10) + 5;
        const y = h - 8 - v * (h - 16);
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      });
      c.strokeStyle = "#10b981"; c.lineWidth = 2; c.stroke();
      // 0.5 参考线
      c.setLineDash([4, 4]);
      c.strokeStyle = "rgba(180,165,120,.5)";
      c.beginPath(); c.moveTo(5, h - 8 - 0.5 * (h - 16)); c.lineTo(w - 5, h - 8 - 0.5 * (h - 16)); c.stroke();
      c.setLineDash([]);
    }

    /* ---------- 交互 ---------- */
    $(".rl-train").addEventListener("click", () => {
      if (training) return;
      startTraining();
    });
    $(".rl-play").addEventListener("click", startPlay);
    $(".rl-reset").addEventListener("click", () => {
      training = false; clearTimeout(raf);
      endPlay();
      Q = {}; games = 0; results = [];
      banner("大脑已清空：AI 忘记了一切，回到了初始状态。", "");
      updateStats(); paintChart(); paintBoardIdle();
    });

    /* ---------- 启动 ---------- */
    banner("先点「训练 500 局」，看看一片空白的 AI 如何进化。", "");
    updateStats(); paintChart(); paintBoardIdle();

    return {
      destroy() {
        training = false; clearTimeout(raf);
        playTimers.forEach(clearTimeout);
      }
    };
  }

  window.DemoRegistry.register("rl-qlearning", factory);
})();
