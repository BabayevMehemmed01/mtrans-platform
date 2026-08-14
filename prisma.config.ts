import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";
import * as path from "path";

// .env faylını əl ilə yüklə (Prisma CLI ts-node ilə işlədəndə process.env oxumur)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL mühit dəyişəni tapılmadı. .env faylını yoxlayın."
  );
}

// =============================================================================
// Prisma 7 Configuration
// =============================================================================
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
});
