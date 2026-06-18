import User from '../models/User';

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const toPositiveNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
};

/**
 * Ensures an admin account exists.
 * - If an account with ADMIN_EMAIL exists and is not admin, it is promoted.
 * - If no account exists, it creates one with ADMIN_* settings.
 */
export const ensureAdminAccount = async (): Promise<void> => {
  const adminEmail = String(process.env.ADMIN_EMAIL || '').trim();
  const adminPassword = String(process.env.ADMIN_PASSWORD || '').trim();

  if (!adminEmail || !adminPassword) {
    console.log('ℹ️ Admin bootstrap skipped (set ADMIN_EMAIL and ADMIN_PASSWORD to enable)');
    return;
  }

  const normalizedEmail = normalizeEmail(adminEmail);
  const adminName = String(process.env.ADMIN_NAME || 'Platform Administrator').trim();
  const adminDepartment = String(process.env.ADMIN_DEPARTMENT || 'Administration').trim();
  const adminGraduationYear = toPositiveNumber(process.env.ADMIN_GRADUATION_YEAR, new Date().getFullYear());

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    if (existingUser.role !== 'admin') {
      existingUser.role = 'admin';
      await existingUser.save();
      console.log(`✅ Existing user promoted to admin: ${normalizedEmail}`);
      return;
    }

    console.log(`✅ Admin account already exists: ${normalizedEmail}`);
    return;
  }

  await User.create({
    name: adminName,
    email: normalizedEmail,
    password: adminPassword,
    role: 'admin',
    graduationYear: adminGraduationYear,
    department: adminDepartment
  });

  console.log(`✅ Admin account created: ${normalizedEmail}`);
};
