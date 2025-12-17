import { PrismaClient } from "../generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Create connection string
const connectionString = process.env.DATABASE_URL!;

// CRITICAL: Serverless-optimized pool settings
const poolConfig = {
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  // Serverless needs MINIMAL connections
  max: process.env.NODE_ENV === "production" ? 1 : 5,
  min: 0, // No minimum connections in serverless
  idleTimeoutMillis: 10000, // Reduced idle timeout
  connectionTimeoutMillis: 5000, // Faster timeout for serverless
  allowExitOnIdle: true,
};

// Create pool singleton
const globalForPool = globalThis as unknown as {
  pool: Pool | undefined;
};

const pool = globalForPool.pool ?? new Pool(poolConfig);

if (process.env.NODE_ENV !== "production") {
  globalForPool.pool = pool;
}

// Handle pool errors gracefully (don't crash in serverless!)
pool.on("error", (err) => {
  console.error("⚠️ Database pool error:", err);
  // Removed process.exit() - let serverless handle it
});

// Only log connections in development
if (process.env.NODE_ENV !== "production") {
  pool.on("connect", () => {
    console.log("🔗 Database connection established");
  });

  pool.on("remove", () => {
    console.log("🔌 Database connection removed");
  });
}

// Create adapter
const adapter = new PrismaPg(pool);

// Prisma Client singleton
const prismaClientSingleton = () => {
  return new PrismaClient({
    adapter,
    // Only log errors and warnings, not every query
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export default prisma;

// Cleanup on shutdown (important for serverless)
if (typeof window === "undefined") {
  const cleanup = async () => {
    try {
      await prisma.$disconnect();
      await pool.end();
    } catch (err) {
      console.error("Cleanup error:", err);
    }
  };

  process.on("beforeExit", cleanup);
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}
