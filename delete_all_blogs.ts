import { PrismaClient } from '../blog-ai/src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  await prisma.blog.deleteMany({});
  console.log("All blog posts deleted.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 