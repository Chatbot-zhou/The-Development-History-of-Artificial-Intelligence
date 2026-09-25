/* 时间线事件数据（window.TIMELINE_EVENTS）
 * type: milestone 里程碑 | theory 理论突破(含演示) | era 时代分界
 * demo: 对应 js/demos/ 中注册的演示模块 id
 */
(function () {
  window.TIMELINE_EVENTS = [
    {
      id: "turing-test",
      year: 1950,
      title: "图灵测试",
      tagline: "机器能思考吗？",
      type: "milestone",
      img: "assets/img/turing.jpg",
      imgCaption: "艾伦·图灵（1912–1954），图源：维基共享资源",
      desc: [
        "英国数学家艾伦·图灵发表论文《计算机器与智能》，提出了著名的“模仿游戏”——如果一台机器在对话中能让人类无法分辨它是机器还是人，那么它就可以被认为是“智能”的。",
        "图灵测试第一次把“机器能否思考”这个哲学问题，变成了一个可操作、可实验的判定标准，为整个领域埋下了第一颗种子。"
      ]
    },
    {
      id: "dartmouth",
      year: 1956,
      title: "达特茅斯会议",
      tagline: "“人工智能”正式命名",
      type: "milestone",
      img: "assets/img/dartmouth.jpg",
      imgCaption: "约翰·麦卡锡——“人工智能”命名者，图源：维基共享资源",
      desc: [
        "约翰·麦卡锡、马文·明斯基等学者在达特茅斯学院召开了为期两个月的夏季研讨会。麦卡锡为这个新兴领域取了一个响亮的名字——Artificial Intelligence（人工智能）。",
        "这次会议被公认为人工智能学科诞生的标志，与会的许多人日后成为了该领域数十年的领军人物。"
      ]
    },
    {
      id: "perceptron",
      year: 1957,
      title: "感知机与机器学习的起点",
      tagline: "让机器从数据中“学”出规则",
      type: "theory",
      demo: "ml-trainer",
      desc: [
        "弗兰克·罗森布拉特提出感知机（Perceptron）——一种可以根据样本自动调整权重的简单模型。它的核心思想影响至今：不再由人写下规则，而是让机器从数据中自己“学”出规则。",
        "这就是“机器学习”的开端。下面的演示可以让你亲手放置数据、启动训练，观察模型如何一步步学会分类。"
      ],
      theory: {
        title: "什么是“训练”？",
        text: "模型内部的参数（权重）一开始是随机的。每次用样本做预测并与正确答案对比，就产生一个“误差”；按照误差的方向微调权重，重复千万次，模型的表现就越来越好。点击右侧开始互动演示 →"
      }
    },
    {
      id: "eliza",
      year: 1966,
      title: "ELIZA 聊天机器人",
      tagline: "第一次与人“对话”的程序",
      type: "milestone",
      desc: [
        "约瑟夫·魏泽鲍姆在 MIT 开发了 ELIZA——它模仿心理治疗师的口吻，用关键词匹配和模板改写与用户对话。许多与它聊天的人竟真的产生了情感依赖，史称“ELIZA 效应”。",
        "ELIZA 虽然不懂语义，却让世界第一次意识到：人与机器的自然语言交互是可能的。"
      ]
    },
    {
      id: "winter-1",
      year: 1974,
      title: "第一次 AI 寒冬",
      tagline: "期望过高，资金撤离",
      type: "era",
      desc: [
        "由于早期的承诺远超实际能力，计算力与数据都很匮乏，各国政府大幅削减 AI 研究经费，整个领域进入长达数年的低谷。",
        "历史上共出现两次 AI 寒冬（1974–1980、1987–1993），它们提醒后人：技术的发展需要理论、算力与数据三者共同成熟。"
      ]
    },
    {
      id: "backprop",
      year: 1986,
      title: "反向传播算法",
      tagline: "深层网络得以训练的关键",
      type: "theory",
      demo: "gradient",
      desc: [
        "鲁梅尔哈特、欣顿等人推广了反向传播（Backpropagation）算法：把输出误差逐层“传回”网络，算出每个权重应调整的方向——即梯度，然后沿梯度的反方向小步更新。",
        "配合至今仍在使用的优化思想“梯度下降”，多层神经网络第一次变得可以训练。下面的演示会让你直观看到：学习率选多大，小球才能顺利“滚”到损失最低谷。"
      ],
      theory: {
        title: "梯度下降：下山比喻",
        text: "把损失函数想象成一片起伏的山地，模型参数是山上的一个位置，“损失”是海拔。训练就是不断沿着最陡的下坡方向迈一小步，直到走进谷底。步子（学习率）太大容易跨过谷底，太小则走得很慢。点击右侧开始互动演示 →"
      }
    },
    {
      id: "svm-era",
      year: 1995,
      title: "统计学习与“手工特征”时代",
      tagline: "特征工程决定模型上限",
      type: "theory",
      demo: "feature-eng",
      desc: [
        "在神经网络沉寂的年代，支持向量机（SVM）等统计学习方法成为主流。这一时期人们总结出一条铁律：模型的性能很大程度取决于喂给它的“特征”质量——即特征工程。",
        "工程师们手工设计各种变换（比例、平方、交叉组合……）把原始数据变得“更好分”。下面的演示用一道经典的螺旋数据，让你体会一次特征工程的魔力。"
      ],
      theory: {
        title: "特征工程为什么重要？",
        text: "原始特征往往不能直接线性分开，但经过恰当的变换（例如用 x²+y² 构造“到圆心的距离”），原本纠缠的数据在新空间里会变得泾渭分明。点击右侧开始互动演示 →"
      }
    },
    {
      id: "deep-blue",
      year: 1997,
      title: "深蓝击败国际象棋世界冠军",
      tagline: "机器第一次在智力游戏中称王",
      type: "milestone",
      img: "assets/img/deep-blue.jpg",
      imgCaption: "IBM 深蓝超级计算机，图源：维基共享资源",
      desc: [
        "IBM 的“深蓝”（Deep Blue）以 3.5:2.5 战胜国际象棋世界冠军卡斯帕罗夫。它依靠每秒约 2 亿次的暴力搜索与人工评估函数获胜。",
        "深蓝证明了专用算力的威力，但它仍是“人工规则”的胜利——真正会“自己学习”的棋手，要等近二十年后的 AlphaGo。"
      ]
    },
    {
      id: "lenet",
      year: 1998,
      title: "卷积神经网络 LeNet-5",
      tagline: "让机器“看懂”图像",
      type: "theory",
      demo: "neural-net",
      desc: [
        "杨立昆（Yann LeCun）设计的卷积神经网络 LeNet-5 成功用于银行手写数字识别。卷积、池化、多层堆叠——现代视觉网络的全部要素就此确立。",
        "下面的演示用一个小型神经网络展示信号如何逐层前向传播：点击任意一层，观察激活值如何流动并最终形成判断。"
      ],
      theory: {
        title: "前向传播",
        text: "数据从输入层进入，每个神经元把收到的信号加权求和、再经过激活函数“非线性的弯折”，传给下一层。层层变换之后，网络最后一层给出输出。点击右侧开始互动演示 →"
      }
    },
    {
      id: "deep-learning",
      year: 2006,
      title: "深度学习时代开启",
      tagline: "欣顿与深度信念网络",
      type: "milestone",
      desc: [
        "杰弗里·欣顿提出深度信念网络的逐层预训练方法，证明“深”的网络是可以有效训练的，“深度学习”一词逐渐流行。",
        "紧接着 GPU 被引入训练、ImageNet 大数据集出现，深度学习的三块拼图——算法、算力、数据——就此凑齐。"
      ]
    },
    {
      id: "alexnet",
      year: 2012,
      title: "AlexNet 横扫 ImageNet",
      tagline: "深度学习爆发元年",
      type: "milestone",
      desc: [
        "欣顿的学生亚历克斯·克里泽夫斯基等人用 GPU 训练的深层卷积网络 AlexNet，在 ImageNet 图像识别大赛中以远超第二名的成绩夺冠，把错误率从 26% 骤降到 15%。",
        "整个学界为之震动，深度学习从此一骑绝尘，成为 AI 的绝对主流。"
      ]
    },
    {
      id: "gan",
      year: 2014,
      title: "生成对抗网络 GAN",
      tagline: "生成器与判别器的左右互搏",
      type: "milestone",
      desc: [
        "伊恩·古德费尔德提出生成对抗网络：生成网络负责“造假”，判别网络负责“打假”，两者在持续对抗中共同变强。",
        "GAN 开启了生成式模型的时代，是人脸生成、风格迁移、文生图等技术的直系祖先。"
      ]
    },
    {
      id: "alphago",
      year: 2016,
      title: "AlphaGo 战胜李世石",
      tagline: "强化学习征服围棋",
      type: "theory",
      demo: "rl-qlearning",
      img: "assets/img/alphago.jpg",
      imgCaption: "围棋人机大战，图源：维基共享资源",
      desc: [
        "DeepMind 的 AlphaGo 以 4:1 战胜世界顶级棋手李世石。它结合深度神经网络与强化学习：先模仿人类棋谱，再通过自我对弈千万局不断精进。",
        "第二局第 37 手的“神之一手”让职业棋手集体沉默——那是一步人类棋谱中几乎不存在的落子。强化学习正是 AlphaGo 超越人类经验的关键。"
      ],
      theory: {
        title: "强化学习",
        text: "智能体通过“试错”学习：在环境中行动、获得奖励或惩罚，逐步调整策略使长期收益最大。下面的演示让一个 Q-learning 智能体从零开始学井字棋，亲眼看着它从乱下棋变成老练对手。点击右侧开始互动演示 →"
      }
    },
    {
      id: "transformer",
      year: 2017,
      title: "Transformer 与注意力机制",
      tagline: "“Attention Is All You Need”",
      type: "theory",
      demo: "attention",
      desc: [
        "谷歌团队发表论文《Attention Is All You Need》，提出完全基于自注意力机制的 Transformer 架构，抛弃了此前的循环网络，可以大规模并行训练。",
        "自注意力让序列中每个词都能“直接看到”其他所有词并按相关度加权取用信息——这成为当今所有大语言模型的地基。下面的演示让你点击任意一个词，亲眼看它的注意力如何流动。"
      ],
      theory: {
        title: "自注意力（Self-Attention）",
        text: "每个词的向量会分裂出三种角色：Query（我在找什么）、Key（我有什么特征）、Value（我携带的信息）。用 Query 与所有 Key 计算相似度并归一化成权重，再对所有 Value 加权求和，得到融合了上下文的新向量。点击右侧开始互动演示 →"
      }
    },
    {
      id: "pretrained",
      year: 2018,
      title: "BERT 与 GPT：预训练时代",
      tagline: "先博览群书，再上岗做事",
      type: "milestone",
      desc: [
        "谷歌的 BERT 与 OpenAI 的 GPT 相继证明：先在海量文本上“预训练”，再用少量数据“微调”，就能刷新几乎所有语言任务的成绩。",
        "“预训练 + 微调”成为新范式，模型从“一个任务一个模型”走向“一个通用底座服务所有任务”。"
      ]
    },
    {
      id: "gpt3",
      year: 2020,
      title: "GPT-3 与上下文学习",
      tagline: "1750 亿参数，看几个例子就会做",
      type: "milestone",
      desc: [
        "OpenAI 发布 GPT-3：不更新任何参数，只在提示里给几个示例，模型就能“现学现卖”，这种能力被称为上下文学习（In-Context Learning）。",
        "提示词从此正式成为一种“编程接口”，Prompt 工程开始进入大众视野。"
      ],
      theory: {
        title: "上下文学习（ICL）",
        text: "把任务示例直接写进输入，模型就能模仿着完成同类任务——参数一动不动，“学习”全靠上下文。这正是后来一切提示词技巧的原理基础。"
      }
    },
    {
      id: "rag",
      year: 2020,
      title: "检索增强生成 RAG",
      tagline: "给大模型外挂一个知识库",
      type: "milestone",
      desc: [
        "研究者提出 RAG：回答问题前，先从外部知识库里检索相关资料，再把资料放进提示让模型作答。",
        "它缓解了模型“一本正经地胡说八道”与知识过期两大痛点，成为企业落地大模型的第一块基石，也是上下文工程思想的开端。"
      ],
      theory: {
        title: "RAG = 检索 + 生成",
        text: "模型的记忆不可靠，但阅读能力很强。与其让它背下所有知识，不如在提问时把最相关的资料递到它眼前。"
      }
    },
    {
      id: "alphafold",
      year: 2020,
      title: "AlphaFold2 攻克蛋白质折叠",
      tagline: "AI for Science 的高光时刻",
      type: "milestone",
      desc: [
        "DeepMind 的 AlphaFold2 基本解决了困扰生物学界 50 年的蛋白质结构预测难题，预测精度媲美实验测量。",
        "2024 年，其缔造者哈萨比斯与江珀因此获得诺贝尔化学奖——AI 正式成为科学研究的基础工具。"
      ]
    },
    {
      id: "lora",
      year: 2021,
      title: "LoRA 低秩适配微调",
      tagline: "一张消费级显卡，养出自己的模型",
      type: "milestone",
      desc: [
        "微软提出 LoRA：冻结原模型的全部权重，只额外训练一对极小的低秩矩阵，微调成本降低几个数量级。",
        "它点燃了开源社区——成千上万个领域模型与风格模型被快速训练出来，大模型的“平民化时代”由此开启。"
      ]
    },
    {
      id: "cot",
      year: 2022,
      title: "思维链与提示工程",
      tagline: "“让我们一步一步思考”",
      type: "milestone",
      desc: [
        "谷歌研究者发现：在提示中给出带推理步骤的示例，或只是加一句“让我们一步一步思考”，模型就能解出原本做不出的数学与逻辑题。",
        "提示工程随之成为一门系统的手艺：角色设定、少样本示例、结构化输出、思维树……“提示词工程师”一度成为热门岗位。"
      ],
      theory: {
        title: "为什么思维链有效？",
        text: "把多步推理“写出来”，相当于给模型增加了中间计算寄存器：下一步以已有的推理为条件，长链条任务的出错率大幅下降。"
      }
    },
    {
      id: "diffusion",
      year: 2022,
      title: "扩散模型与文生图",
      tagline: "一句话，画出一张画",
      type: "milestone",
      desc: [
        "扩散模型通过“加噪—去噪”学会生成图像，DALL·E 2、Stable Diffusion 相继发布，后者完全开源，文生图走进每个人的创作。",
        "图像、视频、语音的生成式模型与语言模型并驾齐驱，AIGC 成为 AI 的另一条主线。"
      ]
    },
    {
      id: "chatgpt",
      year: 2022,
      title: "ChatGPT 发布",
      tagline: "大语言模型走进大众",
      type: "milestone",
      img: "assets/img/chatgpt.png",
      imgCaption: "ChatGPT 标识，图源：维基共享资源",
      desc: [
        "OpenAI 发布 ChatGPT，基于 GPT-3.5 大语言模型与人类反馈强化学习（RLHF）。上线仅两个月用户破亿，成为史上增长最快的消费级应用。",
        "生成式 AI 由此进入公众视野，写作、编程、翻译、创意……人与机器的协作方式被彻底改写。"
      ]
    },
    {
      id: "agent-wave",
      year: 2023,
      title: "AutoGPT 与智能体元年",
      tagline: "让模型自己给自己下指令",
      type: "milestone",
      desc: [
        "开源项目 AutoGPT 爆红：让 GPT-4 自主拆解目标、调用工具、循环执行并自我反思——虽然常常“跑偏”，却点燃了智能体浪潮。",
        "同年 OpenAI 推出函数调用（Function Calling），模型使用工具从此有了标准接口，Agent 从玩具走向工程。"
      ],
      theory: {
        title: "智能体的基本闭环",
        text: "规划 → 行动（调用工具）→ 观察 → 反思，循环往复直到达成目标：模型负责思考与决策，工具负责真正执行。"
      }
    },
    {
      id: "multimodal",
      year: 2024,
      title: "多模态大模型时代",
      tagline: "文字、图像、声音归于一体",
      type: "milestone",
      desc: [
        "GPT-4o、Gemini 等模型能够同时理解与生成文本、图像、音频，AI 开始以更接近人类的方式感知世界。",
        "从 1950 年的一篇论文到今天，人工智能走过了七十多年——而这个故事，才刚刚写到序章。"
      ]
    },
    {
      id: "o1",
      year: 2024,
      title: "推理模型与测试时计算",
      tagline: "想得越久，答得越好",
      type: "milestone",
      desc: [
        "OpenAI 发布 o1：用强化学习训练模型在回答前生成很长的内部思维链，让“思考时间”成为新的性能维度。",
        "Scaling Law 从“更大的训练量”扩展到“更多的推理算力”；2025 年 DeepSeek-R1 等开源推理模型跟进，深度思考能力走向平民化。"
      ]
    },
    {
      id: "mcp",
      year: 2024,
      title: "MCP 模型上下文协议",
      tagline: "AI 应用的 USB-C 接口",
      type: "milestone",
      desc: [
        "Anthropic 发布模型上下文协议（MCP）：把模型连接文件、数据库、API 与工具的方式标准化，一次接入、处处可用。",
        "MCP 迅速成为生态事实标准，被各大模型厂商与开发工具采纳——它正是智能体落地与上下文工程的地基。"
      ]
    },
    {
      id: "context-eng",
      year: 2025,
      title: "上下文工程 Context Engineering",
      tagline: "从写好一句提示词，到设计好整个信息流",
      type: "milestone",
      desc: [
        "随着智能体长时间运行，人们意识到：决定模型表现的不再是单条提示词，而是进入上下文窗口的一切——系统指令、检索结果、记忆、工具返回、历史压缩。",
        "上下文工程由提示工程自然演化而来：写什么、何时写、写多少、何时遗忘，成为一门为大模型“打理注意力”的系统工程。"
      ],
      theory: {
        title: "上下文工程管什么？",
        text: "上下文窗口是模型此刻唯一的世界。选择、压缩与编排进入窗口的每一条信息，就像为模型布置一间只放必需品的工作台。"
      }
    },
    {
      id: "harness",
      year: 2025,
      title: "智能体与 Harness 工程",
      tagline: "给强大的模型造一辆好车",
      type: "milestone",
      desc: [
        "Deep Research、Computer Use、编程智能体等产品展示了智能体的完整形态：模型是引擎，Harness（外壳）是底盘——主循环、工具集、权限控制、上下文管理、失败恢复。",
        "Harness 工程成为新的工程学科：同一个模型配上不同的 Harness，表现可以天差地别；编码智能体率先大规模落地。"
      ],
      theory: {
        title: "Harness 是什么？",
        text: "模型只会“接着上文继续生成”，它需要一个外壳来替它发起循环、递给它工具、拦住危险操作、管理上下文预算——这层外壳就是 Harness。"
      }
    },
    {
      id: "embodied",
      year: 2025,
      title: "具身智能与世界模型",
      tagline: "AI 走出屏幕，走进物理世界",
      type: "milestone",
      desc: [
        "视觉-语言-动作（VLA）模型让机器人听得懂指令、看得见环境、直接输出动作；人形机器人迎来爆发式发展。",
        "另一条路是“世界模型”：让视频生成模型学会物理规律，先在虚拟世界中预演，再迁移到现实——智能的下一个战场，正从语言转向空间。"
      ]
    }
  ];
/* 同一年份的多个事件合并为一个“年份组”（横向时间轴一个节点） */
window.TIMELINE_GROUPS = (function () {
  const groups = [];
  (window.TIMELINE_EVENTS || []).forEach((e) => {
    const last = groups[groups.length - 1];
    if (last && last.year === e.year) last.events.push(e);
    else groups.push({ year: e.year, events: [e] });
  });
  return groups;
})();
})();
