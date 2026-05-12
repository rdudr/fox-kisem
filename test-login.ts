import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { username: "Abhay" } });
  console.log("User found:", user);
  if (user) {
    const valid = await bcrypt.compare("IITGN1", user.passwordHash);
    console.log("Password valid:", valid);
  }
}
main();
