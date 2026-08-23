import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import { seedOrganization } from "../src/lib/org-seed";
import { DEMO_PASSWORD } from "../src/lib/org-structure";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Təşkilati struktur seed başlayır...\n");
  const result = await seedOrganization(prisma);
  console.log("\n🎉 Seed tamamlandı!");
  console.log("━".repeat(50));
  console.log(`Şöbə: ${result.departmentCount} | İşçi: ${result.userCount}`);
  console.log(`Şifrə (bütün demo hesablar): ${DEMO_PASSWORD}`);
  console.log("  Təsisçi:     founder@mtrans.com");
  console.log("  Super Admin: admin@demo.com");
  console.log("  CEO:         m.babayev@m-trans.az");
  console.log("━".repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ Seed xətası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
