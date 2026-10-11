// Script runner migrasi database (idempotent, server-only/dev).
// Menjalankan semua file di migrations/ secara berurutan.
// TIDAK mencetak DATABASE_URL atau kredensial apa pun ke stdout.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
  return env;
}

async function run() {
  const env = loadEnv(path.join(__dirname, "..", ".env.local"));
  const connectionString = env.DATABASE_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("ERROR: DATABASE_URL tidak ditemukan di .env.local atau environment.");
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Terhubung ke database.");

    await client.query(`
      create table if not exists _migrations (
        id text primary key,
        applied_at timestamptz not null default now()
      );
    `);

    const { rows: appliedRows } = await client.query("select id from _migrations");
    const applied = new Set(appliedRows.map((r) => r.id));

    const migrationsDir = path.join(__dirname, "..", "migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    console.log(`Menemukan ${files.length} file migrasi.`);

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`  [skip]  ${file} (sudah diterapkan)`);
        continue;
      }

      console.log(`  [apply] ${file} ...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("insert into _migrations (id) values ($1)", [file]);
        await client.query("COMMIT");
        console.log(`  [ok]    ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`  [FAIL]  ${file}: ${err.message}`);
        process.exit(1);
      }
    }

    console.log("\nSemua migrasi selesai diterapkan.");
  } finally {
    await client.end().catch(() => {});
  }
}

run().catch((err) => {
  console.error("Migration fatal error:", err.message);
  process.exit(1);
});
