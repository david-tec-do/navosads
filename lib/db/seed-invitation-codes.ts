import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { invitationCode } from "./schema";

config({
  path: ".env",
});

const runSeed = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is not defined");
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);

  console.log("⏳ Generating 100 invitation codes...");

  const codes: { code: string; createdAt: Date }[] = [];
  
  // Generate 100 unique codes
  for (let i = 0; i < 100; i++) {
    // Generate random 8-character code (uppercase letters and numbers)
    const code = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase()
      .padEnd(8, "0");
    
    codes.push({ code, createdAt: new Date() });
  }

  try {
    // Insert all codes
    await db.insert(invitationCode).values(codes);
    console.log("✅ Successfully generated 100 invitation codes!");
  } catch (error) {
    console.error("❌ Failed to generate invitation codes");
    console.error(error);
    throw error;
  }

  process.exit(0);
};

runSeed().catch((err) => {
  console.error("❌ Seed failed");
  console.error(err);
  process.exit(1);
});

