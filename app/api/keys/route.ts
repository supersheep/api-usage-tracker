import { NextRequest, NextResponse } from "next/server";
import { getApiKey, setApiKey, listApiKeys } from "@/lib/db";

export async function GET() {
  try {
    const keys = await listApiKeys();
    return NextResponse.json(keys);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "数据库错误" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { service, key } = body;
    if (!service || typeof key !== "string") {
      return NextResponse.json(
        { error: "缺少 service 或 key" },
        { status: 400 }
      );
    }
    await setApiKey(service, key.trim());
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "数据库错误" },
      { status: 500 }
    );
  }
}
