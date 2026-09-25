/* 演示⑪：RAG 检索增强生成（2020）
 * 以关键词重合度模拟检索打分；对比“裸模型”与“检索增强”的回答质量。 */
(function () {

  const KB = [
    { year: 1950, text: "1950 年，图灵在论文《计算机器与智能》中提出模仿游戏：如果机器的对话让人无法分辨它是机器还是人，就可以被视为有智能，这就是著名的图灵测试。" },
    { year: 1956, text: "1956 年的达特茅斯会议上，约翰·麦卡锡为这门学科创造了“人工智能”这个名字，会议持续了大约 8 周。" },
    { year: 1997, text: "1997 年，IBM 的深蓝拥有 480 颗专用棋类芯片，每秒评估约 2 亿个局面，以 3.5 比 2.5 击败国际象棋世界冠军卡斯帕罗夫。" },
    { year: 2016, text: "2016 年 3 月，AlphaGo 以 4 比 1 战胜李世石，第二局的第 37 手落在人类棋谱中几乎不存在的位置，被称为“神之一手”。" },
    { year: 2017, text: "2017 年，谷歌八位研究者发表 Transformer 论文《Attention Is All You Need》，用自注意力机制取代循环网络，使训练可以大规模并行。" },
    { year: 2022, text: "2022 年 11 月 30 日，OpenAI 发布 ChatGPT，基于 GPT-3.5 与人类反馈强化学习 RLHF，上线两个月月活跃用户突破一亿。" }
  ];

  const QUESTIONS = [
    { q: "AlphaGo 以多少比分战胜李世石？", halluc: "AlphaGo 在五番棋中以 3 比 2 险胜李世石，决胜局下到了超快棋。" },
    { q: "ChatGPT 是什么时候发布的？", halluc: "ChatGPT 由 OpenAI 于 2019 年 6 月发布，最初名为 ChatPT。" },
    { q: "“人工智能”这个名字是谁起的？", halluc: "“人工智能”一词最早由艾伦·图灵在 1948 年的一份备忘录中提出。" },
    { q: "深蓝每秒能评估多少个局面？", halluc: "深蓝每秒可以评估大约 5000 万个局面，是当时最快的商用计算机。" }
  ];

  function factory(root) {
    root.innerHTML =
      '<div class="demo">' +
        '<p class="demo-intro">回答同一个问题：左边是<b style="color:#e05c5c">裸大模型</b>（只知道训练时背下的内容），' +
        '右边是<b style="color:var(--green)">RAG</b>（先从知识库里检索相关段落再作答，绿色=按关键词重合度真实打分）。' +
        '选一个预设问题，或者自己输入，观察两种方式的差别。</p>' +
        '<div class="rag-q-row"></div>' +
        '<div class="rag-ask-row">' +
          '<input class="rag-input" type="text" placeholder="也可以自己输入问题试试检索……">' +
          '<button class="btn btn-primary rag-ask">🔍 提问</button>' +
        '</div>' +
        '<div class="rag-cols">' +
          '<div class="rag-col">' +
            '<div class="rag-col-title rag-bad-title">裸大模型（无检索）</div>' +
            '<div class="rag-ans rag-ans-bad"></div>' +
          '</div>' +
          '<div class="rag-col">' +
            '<div class="rag-col-title rag-ok-title">RAG（检索增强）</div>' +
            '<div class="rag-scores"></div>' +
            '<div class="rag-ans rag-ans-ok"></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    const $ = (s) => root.querySelector(s);
    const qRow = $(".rag-q-row"), scoresEl = $(".rag-scores");

    /* 检索打分：问题的字符 2-gram 在文档中出现的次数（真实计算） */
    function scoreDoc(query, doc) {
      const q = query.replace(/[？?，。、\s]/g, "");
      let score = 0;
      for (let i = 0; i < q.length - 1; i++) {
        const bi = q.substr(i, 2);
        let pos = -1;
        while ((pos = doc.text.indexOf(bi, pos + 1)) !== -1) score += 2;
        if (doc.text.indexOf(bi) !== -1) score += 1;
      }
      for (let i = 0; i < q.length; i++) {
        if (doc.text.indexOf(q[i]) !== -1) score += 0.2;
      }
      return score;
    }

    function answer(query) {
      const scored = KB.map(d => ({ d, s: scoreDoc(query, d) }));
      scored.sort((a, b) => b.s - a.s);
      const top = scored[0];

      /* 检索得分条 */
      scoresEl.innerHTML = scored.map(s =>
        '<div class="rag-score-row"><span class="rag-score-year">' + s.d.year + '</span>' +
        '<div class="rag-score-bar"><i style="width:' + Math.round(s.s / (top.s || 1) * 100) + '%"></i></div>' +
        '<span class="rag-score-num">' + s.s.toFixed(0) + "</span></div>").join("");

      const isKnown = top.s >= 6;
      const preset = QUESTIONS.find(q => q.q === query);

      /* 裸模型：预设问题给脚本幻觉答案；未知问题编一个貌似合理的回答 */
      let badAnswer;
      if (preset) badAnswer = preset.halluc;
      else if (isKnown) {
        badAnswer = "（模型开始凭参数里的记忆作答……）" + top.d.text.split("。")[0] + "——以上细节可能准确，也可能被张冠李戴。";
      } else {
        badAnswer = "（模型开始一本正经地编造……）这取决于具体的年份与厂商，一般认为大约在 2015 年前后就已实现商用。";
      }

      $(".rag-ans-bad").innerHTML =
        '<div class="rag-ans-text">' + esc(badAnswer) + "</div>" +
        '<div class="rag-verdict ' + (isKnown && !preset ? "rag-mid" : "rag-wrong") + '">' +
          (isKnown && !preset ? "⚠ 碰对了，但无法保证" : "✗ 事实错误：模型把没学过/记岔的内容说得煞有介事") +
        "</div>";

      /* RAG：展示 top1 段落并从中抽取答案 */
      if (isKnown) {
        const marked = esc(top.d.text).replace(
          new RegExp("(" + escKey(query.replace(/[？?，。、\s]/g, "").split("").slice(0, 4).join("")) + ")", "g"),
          "<mark>$1</mark>");
        $(".rag-ans-ok").innerHTML =
          '<div class="rag-src">📄 检索到 ' + top.d.year + " 年的资料（相关度 " + top.s.toFixed(0) + "）</div>" +
          '<div class="rag-ans-text">' + marked + "</div>" +
          '<div class="rag-verdict rag-right">✓ 回答完全基于检索到的资料，可溯源</div>';
      } else {
        $(".rag-ans-ok").innerHTML =
          '<div class="rag-src">📄 最高相关度仅 ' + top.s.toFixed(0) + "，低于阈值，拒绝作答</div>" +
          '<div class="rag-ans-text rag-refuse">知识库中没有与该问题相关的资料。作为 RAG 系统，我选择回答“不知道”，而不是编造。</div>' +
          '<div class="rag-verdict rag-right">✓ 检索不到就承认不知道——这正是 RAG 的价值</div>';
      }
    }
    function escKey(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
    function esc(s) {
      return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    }

    const input = $(".rag-input");
    function ask(q) {
      q = (q || input.value).trim();
      if (!q) return;
      answer(q);
    }
    QUESTIONS.forEach(q => {
      const chip = document.createElement("button");
      chip.className = "btn btn-ghost rag-chip";
      chip.textContent = q.q;
      chip.addEventListener("click", () => { answer(q.q); });
      qRow.appendChild(chip);
    });
    $(".rag-ask").addEventListener("click", () => ask());
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") ask(); });

    answer(QUESTIONS[0].q);

    return { destroy() {} };
  }

  window.DemoRegistry.register("rag-demo", factory);
})();
