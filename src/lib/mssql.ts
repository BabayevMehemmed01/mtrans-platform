import sql from "mssql";

// =============================================================================
// MS SQL Server Bağlantısı — 1C-nin verilənlər bazasına birbaşa qoşulma (Pull)
// .env: DB_1C_HOST, DB_1C_PORT, DB_1C_NAME, DB_1C_USER, DB_1C_PASSWORD
// Hər çağırışda təzə bir ConnectionPool yaradılır ki, cron işi bitəndə
// (route.ts-də) pool.close() ilə bağlantı təhlükəsiz şəkildə bağlana bilsin.
// =============================================================================

function getMssqlConfig(): sql.config {
  const host = process.env.DB_1C_HOST;
  const port = process.env.DB_1C_PORT;
  const database = process.env.DB_1C_NAME;
  const user = process.env.DB_1C_USER;
  const password = process.env.DB_1C_PASSWORD;

  if (!host || !database || !user || !password) {
    throw new Error(
      "1C MS SQL bağlantısı üçün mühit dəyişənləri tam deyil: DB_1C_HOST, DB_1C_NAME, DB_1C_USER, DB_1C_PASSWORD tələb olunur"
    );
  }

  return {
    server: host,
    port: port ? Number(port) : 1433,
    database,
    user,
    password,
    options: {
      // 1C server-ləri adətən lokal şəbəkədədir və özünütəsdiqli sertifikat istifadə edir
      encrypt: false,
      trustServerCertificate: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    connectionTimeout: 15000,
    requestTimeout: 30000,
  };
}

/**
 * Hər çağırışda yeni bir ConnectionPool yaradıb qoşur və qaytarır.
 * İstifadəçi işini bitirdikdən sonra `pool.close()` çağırmalıdır.
 */
export async function getMssqlPool(): Promise<sql.ConnectionPool> {
  const pool = new sql.ConnectionPool(getMssqlConfig());
  return pool.connect();
}

export { sql };
