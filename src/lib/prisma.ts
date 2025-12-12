import { PrismaClient } from "../generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const adapter = new PrismaPg(pool);

let prisma: PrismaClient;

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({ adapter });
} else {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient({ adapter });
  }
  prisma = global.prismaGlobal;
}

export default prisma;
