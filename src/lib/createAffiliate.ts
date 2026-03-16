import pool from "@/lib/db";

export async function createAffiliateProfile(name: string, email: string) {
  try {
    // Verify if an affiliate with this email already exists
    const [existing] = await pool.query("SELECT id FROM affiliates WHERE email = ?", [email]);
    if ((existing as any[]).length > 0) return;

    // Generate a unique referral code
    const baseCode = (name.split(' ')[0] || "usr").toUpperCase().replace(/[^A-Z]/g, '');
    let isUnique = false;
    let uniqueCode = "";

    for (let attempts = 0; attempts < 5; attempts++) {
      uniqueCode = `${baseCode}${Math.floor(Math.random() * 90000) + 10000}`;
      const [check] = await pool.query("SELECT id FROM affiliates WHERE referral_code = ?", [uniqueCode]);
      if ((check as any[]).length === 0) {
        isUnique = true;
        break;
      }
    }

    if (isUnique) {
      // Default 5% commission, active account
      await pool.query(
        "INSERT INTO affiliates (name, email, referral_code, commission_rate_pct, active) VALUES (?, ?, ?, ?, ?)",
        [name, email, uniqueCode, 5.00, true]
      );
    }
  } catch (error) {
    console.error("Failed to auto-create affiliate profile for", email, error);
  }
}
