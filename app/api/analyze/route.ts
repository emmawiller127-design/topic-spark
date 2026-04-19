import { NextRequest, NextResponse } from "next/server";

const MODEL = process.env.GITHUB_MODELS_MODEL_ANALYZE || "openai/gpt-4.1";
const ENDPOINT = "https://models.github.ai/inference/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "缺少 content" }, { status: 400 });
    }

    const token = process.env.GITHUB_MODELS_TOKEN?.trim();

    console.log("ANALYZE TOKEN EXISTS:", !!token);

    if (!token) {
      return NextResponse.json(
        { error: "未读取到 GITHUB_MODELS_TOKEN" },
        { status: 500 }
      );
    }

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
          {
            role: "system",
            content: `
你是一个选题识别助手。
请根据用户输入内容，输出一个 JSON 对象，包含：
- title：更短、更聚焦、更像选题标题
- category：从以下分类中选一个最合适的

分类候选：
美食饮品、职场成长、知识教育、文化娱乐、生活方式、情感生活、个人记录

要求：
1. 不要直接截断原文作为标题
2. 去掉口语噪音，例如：Hello、你好、你好呀、嗯、啊、然后、就是、那个
3. 标题尽量简洁自然，像可发布的选题标题
4. 只返回 JSON，不要返回解释文字
`,
          },
          {
            role: "user",
            content,
          },
        ],
        temperature: 0.2,
        max_tokens: 200,
        response_format: {
          type: "json_object",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("GitHub Models analyze 调用失败:", data);
      return NextResponse.json(
        { error: "GitHub Models 调用失败", detail: data },
        { status: response.status }
      );
    }

    const text = data?.choices?.[0]?.message?.content;

    console.log("ANALYZE RAW CONTENT:", text);

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
      console.error("ANALYZE JSON PARSE ERROR:", e);
      return NextResponse.json(
        { error: "模型返回内容不是合法 JSON", raw: text },
        { status: 500 }
      );
    }

    return NextResponse.json({
      title: parsed.title || "未命名选题",
      category: parsed.category || "个人记录",
    });
  } catch (error) {
    console.error("analyze route error:", error);
    return NextResponse.json({ error: "服务异常" }, { status: 500 });
  }
}