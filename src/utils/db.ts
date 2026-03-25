// src/utils/db.ts
import mysql from "mysql2/promise";
import { log } from "./log";

const pool = mysql.createPool({
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT || 3306),

  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 200,

  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  connectTimeout: 15000,
});

export type QueryPayload = {
  query: string;
  params?: any[];
};

export type TxConfig = {
  transaction?: boolean;
};

export async function warmupDb() {
  const start = Date.now();
  await pool.query("SELECT 1");
  log(`MySQL warmup OK in ${Date.now() - start}ms`, "success");
}

export async function closeDb() {
  await pool.end();
  log("MySQL pool closed", "info");
}

export async function runQueries(payloads: QueryPayload[]): Promise<any> {
  const start = Date.now();
  try {
    const results: any[] = [];
    for (const p of payloads) {
      const [rows] = await pool.query(p.query, p.params ?? []);
      results.push(rows);
    }
    log(`DB non-tx success in ${Date.now() - start}ms`, "success");
    return results;
  } catch (err: any) {
    log(`DB non-tx failed: ${err?.message ?? String(err)}`, "error");
    throw err;
  }
}

export async function runQuery(payload: QueryPayload): Promise<any> {
  const [result] = await runQueries([payload]);
  return result;
}

export async function runQueriesTx(payloads: QueryPayload[]): Promise<any[]> {
  const start = Date.now();
  let conn: mysql.PoolConnection | null = null;

  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const results: any[] = [];
    for (const p of payloads) {
      const [rows] = await conn.query(p.query, p.params ?? []);
      results.push(rows);
    }

    await conn.commit();
    log(`DB tx commit OK in ${Date.now() - start}ms`, "success");
    return results;
  } catch (err: any) {
    if (conn) {
      try {
        await conn.rollback();
        log("DB tx rolled back", "error");
      } catch {
        // ignore rollback errors
      }
    }
    log(`DB tx failed: ${err?.message ?? String(err)}`, "error");
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

export async function runQueryTx(payload: QueryPayload): Promise<any> {
  const [result] = await runQueriesTx([payload]);
  return result;
}

export async function run(
  payloads: QueryPayload[],
  config: TxConfig = {}
): Promise<any[]> {
  if (config.transaction) return runQueriesTx(payloads);
  return runQueries(payloads);
}
