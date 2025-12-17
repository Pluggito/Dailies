import { PrismaClient } from "../generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 50, // Reduced from 50 for serverless
  min: 10, // Reduced from 10 for serverless
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 20000,
  allowExitOnIdle: true,
});

// Handle pool errors
pool.on("error", (err) => {
  console.error("💥 Unexpected database pool error:", err);
  process.exit(-1);
});

pool.on("connect", (client) => {
  console.log("🔗 New database connection established");
});

pool.on("remove", (client) => {
  console.log("🔌 Database connection removed");
});

const adapter = new PrismaPg(pool);

let prisma: PrismaClient;

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });
} else {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient({
      adapter,
      log: process.env.DEBUG ? ["query", "error", "warn"] : ["error", "warn"],
    });
  }
  prisma = global.prismaGlobal;
}

export default prisma;
