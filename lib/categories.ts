/** 平台主题分类（与产品需求一致） */
export const TOPIC_CATEGORIES = [
  "美妆护肤",
  "时尚穿搭",
  "美食饮品",
  "家居家装",
  "母婴育儿",
  "旅行户外",
  "萌宠动物",
  "运动健身",
  "数码科技",
  "汽车出行",
  "知识教育",
  "职场成长",
  "情感生活",
  "文化娱乐",
  "财经商业",
  "手工艺术",
] as const;

export type TopicCategory = (typeof TOPIC_CATEGORIES)[number];
