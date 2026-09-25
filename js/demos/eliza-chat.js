/* 演示⑦：ELIZA 对话（1966）
 * 真实可对话的 ELIZA：关键词匹配 + 模板改写 + 代词翻转。
 * 每条回复下方可透视“命中的规则”，亲手体会 ELIZA 效应。 */
(function () {

  function reflect(s) {
    return s
      .replace(/我们/g, "\u0001你们")
      .replace(/我的/g, "你的")
      .replace(/你/g, "\u0002")
      .replace(/我/g, "你")
      .replace(/\u0001/g, "你们")
      .replace(/\u0002/g, "我")
      .replace(/你们/g, "我们");
  }

  /* 规则按顺序匹配；out 中的 * 会被替换为 reflect 过的捕获组 */
  const RULES = [
    { re: /电脑|计算机|机器|程序|AI|人工智能/i, out: ["你觉得机器和人一样吗？", "你对机器的看法是从哪里来的？"],
      note: "关键词「机器/计算机」→ 反问你对机器的看法" },
    { re: /我想(.*)/, out: ["什么让你想*？", "你为什么想*？"], note: "关键词「我想」→ 模板「你为什么想 *？」" },
    { re: /我需要(.*)/, out: ["真的需要*吗？", "得到*对你意味着什么？"], note: "关键词「我需要」→ 模板追问" },
    { re: /我觉得(.*)|我认为(.*)/, out: ["你为什么觉得*？", "这种感觉从何而来？"], note: "关键词「我觉得」→ 模板「你为什么觉得 *？」" },
    { re: /我(?:爸|妈|哥|姐|弟|妹|儿子|女儿|朋友|同学|老师|同事)/, out: ["和我多说说你的家人或朋友吧。", "你的家人对你影响大吗？"], note: "关键词「家人/朋友」→ 引导展开话题" },
    { re: /因为(.*)/, out: ["还有别的原因吗？", "这个原因对你来说意味着什么？"], note: "关键词「因为」→ 追问原因" },
    { re: /难过|伤心|痛苦|烦|压力|焦虑/, out: ["把这些说出来，感觉如何？", "这种感觉持续多久了？"], note: "情绪关键词 → 共情模板" },
    { re: /开心|高兴|快乐|幸福/, out: ["什么事让你这么开心？", "这样的时刻多吗？"], note: "积极情绪关键词 → 展开模板" },
    { re: /是的?|对|没错|当然/, out: ["你能说得再具体一点吗？", "嗯，然后呢？"], note: "肯定词 → 追加细节" },
    { re: /不是|没有|别/, out: ["为什么不会呢？", "是什么让你这么确定？"], note: "否定词 → 追问原因" },
    { re: /(.*)(?:\?|？)$/, out: ["为什么这样问？", "你自己怎么看这个问题？"], note: "疑问句 → 把问题抛回给你" }
  ];
  const FALLBACK = ["请继续说。", "嗯，我明白了。", "这让你有什么感受？", "能举个例子吗？",
    "为什么你觉得是这样？", "还有别的吗？", "多和我聊聊这个。"];

  function factory(root) {
    root.innerHTML =
      '<div class="demo">' +
        '<p class="demo-intro">下面就是一个 1966 年的 ELIZA：它的全部本事只是<b>关键词匹配 + 模板改写 + 代词翻转</b>。' +
        '试着和它聊聊心事，再打开「透视规则」看看它每句话背后的把戏——你会亲身体会传说中的 <b>ELIZA 效应</b>。</p>' +
        '<div class="ez-toolbar">' +
          '<label class="ez-toggle"><input type="checkbox" class="ez-xray" checked> 透视规则（显示每条回复背后的模板）</label>' +
        '</div>' +
        '<div class="ez-list"></div>' +
        '<div class="ez-input-row">' +
          '<input class="ez-input" type="text" maxlength="80" placeholder="输入一句话，比如：我最近觉得压力很大，因为工作……">' +
          '<button class="btn btn-primary ez-send">发送</button>' +
        '</div>' +
        '<p class="demo-note ez-note">模拟演示：规则与模板忠实还原 1966 年 DOCTOR 脚本的思路。</p>' +
      '</div>';

    const list = root.querySelector(".ez-list");
    const input = root.querySelector(".ez-input");
    const xray = root.querySelector(".ez-xray");
    let fbIdx = 0;

    function addMsg(cls, text, note) {
      const row = document.createElement("div");
      row.className = "ez-msg " + cls;
      row.innerHTML = '<div class="ez-bubble">' + esc(text) + '</div>' +
        (note ? '<div class="ez-rule">' + esc(note) + '</div>' : "");
      list.appendChild(row);
      list.scrollTop = list.scrollHeight;
    }
    function esc(s) {
      return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    }

    function reply(text) {
      let matchedNote = null, answer = null;
      for (const r of RULES) {
        const m = text.match(r.re);
        if (m) {
          const cap = reflect(m[1] || m[0] || "");
          answer = r.out[fbIdx % r.out.length].replace(/\*/, cap);
          matchedNote = r.note;
          fbIdx++;
          break;
        }
      }
      if (!answer) {
        answer = FALLBACK[fbIdx % FALLBACK.length];
        matchedNote = "没有命中关键词 → 从兜底句池轮换";
        fbIdx++;
      }
      addMsg("ez-eliza", answer, xray.checked ? "⚙ " + matchedNote : null);
    }

    function send() {
      const v = input.value.trim();
      if (!v) return;
      addMsg("ez-user", v);
      input.value = "";
      setTimeout(() => reply(v), 420);
    }

    root.querySelector(".ez-send").addEventListener("click", send);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });

    addMsg("ez-eliza", "你好，我是 ELIZA。今天想聊些什么？", "⚙ 开场白 → DOCTOR 脚本固定问候");

    return { destroy() {} };
  }

  window.DemoRegistry.register("eliza-chat", factory);
})();
