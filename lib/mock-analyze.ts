import { TOPIC_CATEGORIES, type TopicCategory } from "./categories";

const LEADING_NOISE_PATTERNS = [
  /^\s*(hello|hi|hey)+[，,、!！.。\s]*/i,
  /^\s*(你好呀|你好啊|你好|哈喽|嗨)+[，,、!！.。\s]*/,
  /^\s*(嗯嗯|嗯|啊啊|啊|呃|唉|欸|诶)+[，,、!！.。\s]*/,
  /^\s*(然后呢|然后|就是|那个|这个|其实|最近吧|最近呢|最近|我想说|我觉得|我发现|想聊聊|聊聊|说说)[，,、:：!！.。\s]*/,
];

const STOP_WORDS = new Set([
  "我们",
  "自己",
  "一些",
  "一个",
  "一种",
  "这个",
  "那个",
  "这样",
  "这种",
  "最近",
  "然后",
  "就是",
  "的话",
  "感觉",
  "可以",
  "准备",
  "一下",
  "东西",
  "内容",
  "记录",
]);

const TOPIC_PATTERNS: { regex: RegExp; label: string }[] = [
  { regex: /播客|podcast/i, label: "播客" },
  { regex: /朋友|线下|聊天|交流|对谈|访谈|talk/i, label: "朋友交流" },
  { regex: /聊天记录|记录整理|记录/, label: "聊天记录" },
  { regex: /感受|观察|体验|想法/, label: "感受观察" },
  { regex: /咖啡馆|咖啡店|咖啡|探店|评测/, label: "咖啡探店" },
  { regex: /工作|职场|成长|复盘|感悟/, label: "工作成长" },
  { regex: /产品|用户|体验|设计/, label: "产品体验" },
  { regex: /AI|人工智能|模型|科技/, label: "AI 观察" },
  { regex: /vlog|视频|剪辑|素材/i, label: "视频内容" },
  { regex: /美食|饮品|餐厅|吃吃/, label: "美食内容" },
  { regex: /旅行|户外|徒步/, label: "旅行户外" },
  { regex: /情感|关系|恋爱/, label: "情感关系" },
];

/**
 * Mock：提炼「选题标题」与分类——避免把原文截断当标题。
 * 替换为真实 AI：在 app/api/analyze/route.ts 中改为调用大模型。
 */
export function mockAnalyzeContent(raw: string): { title: string; category: TopicCategory } {
  const text = normalizeAnalyzeText(raw);
  if (!text) {
    return { title: "未命名选题", category: "知识教育" };
  }

  const scenario = matchCreatorScenario(text);
  if (scenario) {
    return scenario;
  }

  type Rule = { test: (s: string) => boolean; category: TopicCategory };

  const rules: Rule[] = [
    { test: (s) => /收藏|输出|输入/.test(s) && !/咖啡馆|咖啡店|咖啡/.test(s), category: "知识教育" },
    { test: (s) => /产品|用户|阻力|体验|设计/.test(s), category: "财经商业" },
    { test: (s) => /职场|焦虑|价值|展示|老板/.test(s), category: "职场成长" },
    { test: (s) => /AI|人工智能|浪潮|模型/.test(s), category: "数码科技" },
    { test: (s) => /旅行|户外|徒步/.test(s), category: "旅行户外" },
    { test: (s) => /美食|饮品|咖啡|餐厅|吃吃|探店|评测/.test(s), category: "美食饮品" },
    { test: (s) => /vlog|视频|剪辑|素材|播客|podcast/i.test(s), category: "文化娱乐" },
    { test: (s) => /护肤|美妆|妆容/.test(s), category: "美妆护肤" },
    { test: (s) => /穿搭|时尚|单品/.test(s), category: "时尚穿搭" },
    { test: (s) => /宠物|猫|狗|萌宠/.test(s), category: "萌宠动物" },
    { test: (s) => /健身|跑步|训练/.test(s), category: "运动健身" },
    { test: (s) => /家|装修|收纳/.test(s), category: "家居家装" },
    { test: (s) => /母婴|育儿|宝宝/.test(s), category: "母婴育儿" },
    { test: (s) => /车|自驾|出行/.test(s), category: "汽车出行" },
    { test: (s) => /情感|关系|恋爱/.test(s), category: "情感生活" },
    { test: (s) => /电影|音乐|综艺|文化/.test(s), category: "文化娱乐" },
    { test: (s) => /手工|绘画|DIY/.test(s), category: "手工艺术" },
    { test: (s) => /学习/.test(s), category: "知识教育" },
  ];

  let category: TopicCategory = "知识教育";
  for (const r of rules) {
    if (r.test(text)) {
      category = r.category;
      break;
    }
  }

  const title = deriveTopicTitle(text);

  if (!TOPIC_CATEGORIES.includes(category as TopicCategory)) {
    category = "知识教育";
  }

  return { title, category };
}

function normalizeAnalyzeText(raw: string): string {
  let text = raw.trim().replace(/\s+/g, " ");
  for (let i = 0; i < 8; i += 1) {
    const prev = text;
    for (const pattern of LEADING_NOISE_PATTERNS) {
      text = text.replace(pattern, "");
    }
    text = text.replace(/^[，,、:：!！.。\s]+/, "").trim();
    if (text === prev) break;
  }
  return text;
}

/**
 * 与内置示例一致的真实创作场景：优先匹配，保证演示自然。
 */
function matchCreatorScenario(text: string): { title: string; category: TopicCategory } | null {
  if (
    /上海/.test(text) &&
    /咖啡/.test(text) &&
    (/咖啡馆|咖啡店|自习|评测|探店/.test(text) || (/店/.test(text) && /评测/.test(text)))
  ) {
    return { title: "上海咖啡自习室评测", category: "美食饮品" };
  }

  if (/近几个月|最近几个月|这段时间/.test(text) && /工作/.test(text) && /成长|感悟/.test(text)) {
    return { title: "最近工作成长感悟", category: "职场成长" };
  }

  if (
    (/生活\s*vlog|生活vlog/i.test(text) && /美食|吃吃|图片|视频|过年|剪素材/.test(text)) ||
    (/吃吃吃|美食图片/.test(text) && /过年|剪素材|vlog/i.test(text))
  ) {
    return { title: "生活美食 Vlog 选题", category: "文化娱乐" };
  }

  if (/朋友/.test(text) && /交流|聊天|对谈|talk/i.test(text) && /播客|podcast/i.test(text)) {
    return { title: "朋友交流感受的播客选题", category: "文化娱乐" };
  }

  return null;
}

/** 主题提炼：短、聚焦，避免直接复制长句 */
function deriveTopicTitle(text: string): string {
  if (/工作/.test(text) && /成长|感悟|体会/.test(text) && /软技能|输出|沉淀|感悟/.test(text)) {
    return "工作成长中的体会";
  }
  if (/收藏/.test(text) && /输出/.test(text)) {
    return "从收藏到输出";
  }
  if (/产品/.test(text) && /阻力/.test(text)) {
    return "在关键时刻减少阻力";
  }
  if (/职场/.test(text) && /价值|展示/.test(text)) {
    return "职场中的价值感";
  }
  if (/AI|浪潮|人工智能/.test(text)) {
    return "AI 浪潮下的观察";
  }
  if (/朋友/.test(text) && /交流|聊天|对谈|talk/i.test(text) && /记录|感受/.test(text) && /播客|podcast/i.test(text)) {
    return "朋友交流感受的播客选题";
  }
  if (/聊天记录|记录/.test(text) && /播客|podcast/i.test(text)) {
    return "从聊天记录到播客内容准备";
  }
  if (/朋友/.test(text) && /深度交流|交流|聊天|对谈|talk/i.test(text)) {
    return "朋友间深度交流的内容灵感";
  }

  const matchedLabels = TOPIC_PATTERNS.filter((item) => item.regex.test(text)).map((item) => item.label);
  if (matchedLabels.length >= 2) {
    return `${matchedLabels[0]}的${matchedLabels[1]}选题`;
  }
  if (matchedLabels.length === 1) {
    return `${matchedLabels[0]}灵感`;
  }

  const summary = summarizeCorePhrase(text);
  if (summary) {
    return summary;
  }

  return "新选题";
}

function summarizeCorePhrase(text: string): string {
  const sentence = text.split(/[。！？!?\n]/)[0]?.trim() ?? text;
  const chunks = sentence
    .split(/[，,、；;：:]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => stripWeakWords(part));

  const goodChunk = chunks.find((part) => part.length >= 4 && part.length <= 14 && !looksLikeSpokenSentence(part));
  if (goodChunk) {
    return goodChunk;
  }

  const keywordTitle = extractKeywords(text);
  if (keywordTitle) {
    return keywordTitle;
  }

  const compressed = stripWeakWords(sentence).replace(/\s+/g, "").slice(0, 12);
  if (compressed && !looksLikeSpokenSentence(compressed)) {
    return compressed;
  }

  return "";
}

function stripWeakWords(input: string): string {
  return input
    .replace(/^(我们|自己|最近|想把|想做|准备把|准备做|可以把|可以做|想聊聊|想说说|记录下|记录一下)+/, "")
    .replace(/(一下|出来|下来|这种|这个|那个|就是|然后|的话|感受|内容)+$/g, "")
    .trim();
}

function looksLikeSpokenSentence(input: string): boolean {
  return /我|你|他|她|它|然后|就是|那个|我们|想要|准备|可以/.test(input) || input.length > 16;
}

function extractKeywords(text: string): string {
  const tokens = text.match(/[\u4e00-\u9fa5A-Za-z]{2,}/g) ?? [];
  const picked: string[] = [];

  for (const token of tokens) {
    const cleaned = stripWeakWords(token);
    if (!cleaned || cleaned.length < 2 || cleaned.length > 8) continue;
    if (STOP_WORDS.has(cleaned)) continue;
    if (picked.includes(cleaned)) continue;
    picked.push(cleaned);
    if (picked.length === 2) break;
  }

  if (picked.length === 2) {
    return `${picked[0]}与${picked[1]}`;
  }
  if (picked.length === 1) {
    return `${picked[0]}灵感`;
  }
  return "";
}
