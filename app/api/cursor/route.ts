import { NextResponse } from "next/server";
import { getApiKey } from "@/lib/db";

/**
 * Cursor Admin API: /teams/spend
 * 获取当前计费周期团队消费（Enterprise 需 API Key）
 * https://cursor.com/docs/account/teams/admin-api
 */
export async function GET() {
  const apiKey = process.env.CURSOR_API_KEY || (await getApiKey("cursor"));
  if (!apiKey) {
    return NextResponse.json(
      {
        source: "manual",
        error: "Cursor API Key 未配置，请在下方设置中填写",
      },
      { status: 200 }
    );
  }

  try {
    const res = await fetch("https://api.cursor.com/teams/spend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
      },
      body: JSON.stringify({ page: 1, pageSize: 100 }),
    });

    if (!res.ok) {
      const err = await res.text();
      if (res.status === 403) {
        return NextResponse.json({
          source: "api",
          error: "Enterprise 权限不足，请确认团队为 Enterprise 计划",
        });
      }
      throw new Error(`Cursor API ${res.status}: ${err}`);
    }

    const data = await res.json();
    const members = data.teamMemberSpend || [];
    const totalSpendCents = members.reduce((s: number, m: { spendCents?: number }) => s + (m.spendCents || 0), 0);
    const totalLimitCents = members.reduce((s: number, m: { monthlyLimitDollars?: number | null }) => {
      const limit = m.monthlyLimitDollars;
      return s + (limit != null ? limit * 100 : 0);
    }, 0);

    return NextResponse.json({
      source: "api",
      usage: totalSpendCents / 100,
      limit: totalLimitCents > 0 ? totalLimitCents / 100 : null,
      unit: "USD",
      cycleStart: data.subscriptionCycleStart,
      members: members.map((m: { email: string; spendCents: number; monthlyLimitDollars?: number | null }) => ({
        email: m.email,
        spendCents: m.spendCents,
        limitDollars: m.monthlyLimitDollars,
      })),
    });
  } catch (e) {
    return NextResponse.json(
      {
        source: "api",
        error: e instanceof Error ? e.message : "请求失败",
      },
      { status: 500 }
    );
  }
}
