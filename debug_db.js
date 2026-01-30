const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  const versions = await prisma.datasetVersion.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      dataset: true,
      edaResults: true
    }
  });

  console.log(JSON.stringify(versions, null, 2));
  process.exit(0);
}

checkData();
