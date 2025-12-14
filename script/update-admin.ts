import { db } from "../server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function ensureAdmin() {
  const email = "admin@ayurvedicdoctor.lk";
  const password = "$Administrator123$";

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

  const passwordHash = await bcrypt.hash(password, 10);

  if (existing.length > 0) {
    const user = existing[0];
    await db
      .update(users)
      .set({
        password: passwordHash,
        role: "admin",
        isEmailVerified: true,
        isPhoneVerified: true,
      })
  .where(eq(users.id, user.id));

    console.log(`Updated admin user ${email}`);
  } else {
    await db.insert(users).values({
      email,
      password: passwordHash,
      fullName: "System Administrator",
      phone: "+94770000000",
      role: "admin",
      preferredLanguages: ["english"],
      isEmailVerified: true,
      isPhoneVerified: true,
    });

    console.log(`Created admin user ${email}`);
  }
}

ensureAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });