import { NextResponse } from "next/server";
import type { ContentFormat } from "@/lib/types";

const MODEL = process.env.GITHUB_MODELS_MODEL_OUTLINE || "openai/gpt-4.1";
const ENDPOINT = "https://models.github.ai/inference/chat/completions";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const rawContent = typeof body?.rawContent === "string" ? body.rawContent : "";
    const title = typeof body?.title === "string" ? body.title : "";
    const category = typeof body?.category === "string" ? body.category : "";
    const format = body?.format as ContentFormat;

    if (!title.trim()) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }

    if (format !== "note" && format !== "video") {
      return NextResponse.json({ error: "内容形式无效" }, { status: 400 });
    }

    const token = process.env.GITHUB_MODELS_TOKEN?.trim();

    console.log("OUTLINE TOKEN EXISTS:", !!token);

    if (!token) {
      return NextResponse.json(
        { error: "未读取到 GITHUB_MODELS_TOKEN" },
        { status: 500 }
      );
    }

    const systemPrompt = `
你是一个“选题创作助手”。
请根据用户提供的标题、分类、原始内容，生成结构化创作大纲。

要求：
1. 只输出骨架，不要过度指导
2. 不要出现“埋钩子、关注收藏、增强可信度、引导评论、下期预告”等运营话术
3. 输出风格简洁、中性、可编辑
4. 内容结构要自然，贴合原始内容，不要空泛模板化

如果 format = note，请输出 JSON：
{
  "type": "note",
  "title": "标题",
  "category": "分类",
  "intro": "开头部分",
  "sections": [
    {
      "heading": "主体内容1",
      "bullets": ["要点1", "要点2"]
    }
  ],
  "closing": "结尾部分"
}

如果 format = video，请输出 JSON：
{
  "type": "video",
  "videoTitle": "视频标题",
  "category": "分类",
  "opening": "开场部分",
  "segments": [
    {
      "title": "分段1",
      "content": "这一段讲什么"
    }
  ],
  "ending": "结尾部分"
}

只返回 JSON，不要返回解释文字。
`;

    const userPrompt = `
title: ${title.trim()}
category: ${category.trim() || "知识教育"}
format: ${format}
rawContent: ${rawContent.trim() || title.trim()}
`;

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 700,
        response_format: {
          type: "json_object",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("GitHub Models generate-outline 调用失败:", data);
      return NextResponse.json(
        { error: "GitHub Models 调用失败", detail: data },
        { status: response.status }
      );
    }

    const text = data?.choices?.[0]?.message?.content;

    console.log("OUTLINE RAW CONTENT:", text);

    if (!text) {
      return NextResponse.json(
        { error: "模型没有返回内容", detail: data },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error("OUTLINE JSON PARSE ERROR:", e);
      return NextResponse.json(
        { error: "模型返回内容不是合法 JSON", raw: text },
        { status: 500 }
      );
    }

    if (format === "note") {
      return NextResponse.json({
        type: "note",
        title: parsed.title || title.trim(),
        category: parsed.category || category.trim() || "知识教育",
        intro: parsed.intro || "",
        sections: Array.isArray(parsed.sections) ? parsed.sections : [],
        closing: parsed.closing || "",
      });
    }

    return NextResponse.json({
      type: "video",
      videoTitle: parsed.videoTitle || title.trim(),
      category: parsed.category || category.trim() || "知识教育",
      opening: parsed.opening || "",
      segments: Array.isArray(parsed.segments) ? parsed.segments : [],
      ending: parsed.ending || "",
    });
  } catch (error) {
    console.error("generate-outline route error:", error);
    return NextResponse.json({ error: "生成大纲失败，请稍后重试" }, { status: 500 });
  }
}