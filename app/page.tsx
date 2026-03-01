"use client";

import { useEffect, useState } from "react";

const inputStyle = {
  padding: "0.375rem 0.5rem",
  borderRadius: 6,
  border: "1px solid #27272a",
  background: "#0f0f12",
  color: "#e4e4e7",
  width: 280,
} as const;

const btnStyle = {
  padding: "0.375rem 0.75rem",
  borderRadius: 6,
  border: "none",
  background: "#3b82f6",
  color: "#fff",
  cursor: "pointer" as const,
  fontSize: "0.875rem",
};

type ServiceUsage = {
  name: string;
  usage: number;
  limit: number | null;
  unit: string;
  error?: string;
  source?: "api" | "manual";
};

function ProgressBar({ usage, limit, unit }: { usage: number; limit: number | null; unit: string }) {
  const pct = limit != null && limit > 0 ? Math.min(100, (usage / limit) * 100) : null;
  const display = limit != null ? `${usage.toFixed(2)} / ${limit.toFixed(2)} ${unit}` : `${usage.toFixed(2)} ${unit}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ height: 8, background: "#27272a", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: pct != null ? `${pct}%` : "0%",
            background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
            borderRadius: 4,
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <span style={{ fontSize: "0.8125rem", color: "#a1a1aa" }}>{display}</span>
    </div>
  );
}

export default function Home() {
  const [cursor, setCursor] = useState<ServiceUsage | null>(null);
  const [manualUsage, setManualUsage] = useState("");
  const [manualLimit, setManualLimit] = useState("");
  const [loading, setLoading] = useState(true);
  const [cursorKey, setCursorKey] = useState("");
  const [cursorKeyMasked, setCursorKeyMasked] = useState<string | null>(null);
  const [keySaved, setKeySaved] = useState(false);
  const [keySaving, setKeySaving] = useState(false);

  useEffect(() => {
    fetch("/api/cursor")
      .then((r) => r.json())
      .then((data) => {
        if (data.error && data.source === "api") {
          setCursor({
            name: "Cursor",
            usage: 0,
            limit: null,
            unit: "USD",
            error: data.error,
            source: "api",
          });
          return;
        }
        if (data.source === "manual" || data.error) {
          const stored = typeof window !== "undefined" ? localStorage.getItem("cursor_manual") : null;
          const parsed = stored ? JSON.parse(stored) : null;
          setCursor({
            name: "Cursor",
            usage: parsed?.usage ?? 0,
            limit: parsed?.limit ?? null,
            unit: "USD",
            error: data.error,
            source: "manual",
          });
          if (parsed) {
            setManualUsage(String(parsed.usage));
            setManualLimit(parsed.limit != null ? String(parsed.limit) : "");
          }
          return;
        }
        setCursor({
          name: "Cursor",
          usage: data.usage ?? 0,
          limit: data.limit ?? null,
          unit: data.unit ?? "USD",
          source: "api",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/keys")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const cursorEntry = data.find((k: { service: string }) => k.service === "cursor");
          if (cursorEntry?.masked) setCursorKeyMasked(cursorEntry.masked);
        }
      })
      .catch(() => {});
  }, [keySaved]);

  const saveKey = () => {
    const key = cursorKey.trim();
    if (!key) return;
    setKeySaving(true);
    fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service: "cursor", key }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setKeySaved(true);
          setKeySaving(false);
          setCursorKey("");
          setCursorKeyMasked(key.length > 8 ? key.slice(0, 4) + "***" + key.slice(-4) : "***");
          setTimeout(() => setKeySaved(false), 2000);
          fetch("/api/cursor").then((r) => r.json()).then((d) => {
            if (d.error && d.source === "api") {
              setCursor((c) => c ? { ...c, error: d.error } : null);
            } else if (!d.error) {
              setCursor((c) => c ? { ...c, usage: d.usage ?? 0, limit: d.limit ?? null, error: undefined, source: "api" } : null);
            }
          });
        }
      })
      .finally(() => setKeySaving(false));
  };

  const saveManual = () => {
    const u = parseFloat(manualUsage) || 0;
    const l = manualLimit ? parseFloat(manualLimit) : null;
    if (typeof window !== "undefined") {
      localStorage.setItem("cursor_manual", JSON.stringify({ usage: u, limit: l }));
    }
    setCursor({
      name: "Cursor",
      usage: u,
      limit: l,
      unit: "USD",
      source: "manual",
    });
  };

  return (
    <main style={{ padding: "2rem", maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>API 用量追踪</h1>
      <p style={{ color: "#71717a", fontSize: "0.875rem", marginBottom: "2rem" }}>
        本月各服务用量
      </p>

      {loading ? (
        <p style={{ color: "#71717a" }}>加载中…</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {cursor && (
            <section
              style={{
                background: "#18181b",
                borderRadius: 8,
                padding: "1rem 1.25rem",
                border: "1px solid #27272a",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={{ fontWeight: 600 }}>Cursor</span>
                {cursor.source === "manual" && (
                  <span style={{ fontSize: "0.75rem", color: "#71717a" }}>手动录入</span>
                )}
              </div>
              {cursor.error ? (
                <p style={{ color: "#f87171", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
                  {cursor.error}
                </p>
              ) : null}
              <ProgressBar usage={cursor.usage} limit={cursor.limit} unit={cursor.unit} />
              {(cursor.source === "manual" || cursor.error) && (
                <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <input
                    type="number"
                    placeholder="本月消费 (USD)"
                    value={manualUsage}
                    onChange={(e) => setManualUsage(e.target.value)}
                    step="0.01"
                    style={{
                      padding: "0.375rem 0.5rem",
                      borderRadius: 6,
                      border: "1px solid #27272a",
                      background: "#0f0f12",
                      color: "#e4e4e7",
                      width: 120,
                    }}
                  />
                  <input
                    type="number"
                    placeholder="限额 (USD，可选)"
                    value={manualLimit}
                    onChange={(e) => setManualLimit(e.target.value)}
                    step="0.01"
                    style={{
                      padding: "0.375rem 0.5rem",
                      borderRadius: 6,
                      border: "1px solid #27272a",
                      background: "#0f0f12",
                      color: "#e4e4e7",
                      width: 120,
                    }}
                  />
                  <button
                    onClick={saveManual}
                    style={{
                      padding: "0.375rem 0.75rem",
                      borderRadius: 6,
                      border: "none",
                      background: "#3b82f6",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    保存
                  </button>
                </div>
              )}
            </section>
          )}

          <section
            style={{
              background: "#18181b",
              borderRadius: 8,
              padding: "1rem 1.25rem",
              border: "1px solid #27272a",
            }}
          >
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "0.75rem" }}>
              API Key 设置
            </h3>
            <p style={{ color: "#71717a", fontSize: "0.8125rem", marginBottom: "0.75rem" }}>
              存储于本地 PostgreSQL，用于拉取各服务用量
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.8125rem", color: "#a1a1aa" }}>Cursor</label>
              {cursorKeyMasked && (
                <span style={{ fontSize: "0.75rem", color: "#71717a" }}>已配置: {cursorKeyMasked}</span>
              )}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="password"
                  placeholder={cursorKeyMasked ? "输入新 Key 可覆盖" : "key_xxx（Admin API Key）"}
                  value={cursorKey}
                  onChange={(e) => setCursorKey(e.target.value)}
                  style={inputStyle}
                  autoComplete="off"
                />
                <button onClick={saveKey} disabled={keySaving} style={btnStyle}>
                  {keySaving ? "保存中…" : keySaved ? "已保存" : "保存"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

    </main>
  );
}
