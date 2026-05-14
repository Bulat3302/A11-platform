import "dotenv/config";
import app from "./app";
import prisma from "./config/database";

const PORT = process.env.PORT || 4000;

async function main() {
  await prisma.$connect();
  console.log("? Database connected");
  app.listen(PORT, () => {
    console.log(`?? Server running at http://localhost:${PORT}`);
    console.log(`?? API docs at http://localhost:${PORT}/api/docs`);
  });
}

main().catch(err => { console.error("Failed to start server:", err); process.exit(1); });
