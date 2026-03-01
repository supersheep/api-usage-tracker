import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let initialized = false;

async function initSchema() {
  if (initialized) return;
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        service VARCHAR(50) UNIQUE NOT NULL,
        key_value TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    initialized = true;
  } finally {
    client.release();
  }
}

export async function getApiKey(service: string): Promise<string | null> {
  await initSchema();
  const res = await pool.query(
    "SELECT key_value FROM api_keys WHERE service = $1",
    [service]
  );
  return res.rows[0]?.key_value ?? null;
}

export async function setApiKey(service: string, keyValue: string): Promise<void> {
  await initSchema();
  await pool.query(
    `INSERT INTO api_keys (service, key_value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (service) DO UPDATE SET key_value = $2, updated_at = NOW()`,
    [service, keyValue]
  );
}

export async function listApiKeys(): Promise<{ service: string; masked: string }[]> {
  await initSchema();
  const res = await pool.query(
    "SELECT service, key_value FROM api_keys"
  );
  return res.rows.map((r) => ({
    service: r.service,
    masked: maskKey(r.key_value),
  }));
}

function maskKey(key: string): string {
  if (key.length <= 8) return "***";
  return key.slice(0, 4) + "***" + key.slice(-4);
}
