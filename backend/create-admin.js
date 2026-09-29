require("dotenv").config();
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin";

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.log("❌ Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file first.");
  process.exit(1);
}

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 4000,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
});

async function createAdmin() {
  const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);

  try {
    // Check if admin already exists
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [ADMIN_EMAIL]);

    if (existing.length > 0) {
      // Update existing user password
      await db.query("UPDATE users SET password = ?, name = ? WHERE email = ?", [hashedPassword, ADMIN_NAME, ADMIN_EMAIL]);
      console.log("✅ Admin user updated:", ADMIN_EMAIL);
    } else {
      // Insert new admin user
      await db.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [ADMIN_NAME, ADMIN_EMAIL, hashedPassword]);
      console.log("✅ Admin user created:", ADMIN_EMAIL);
    }
  } catch (err) {
    console.log("❌ Error:", err.message);
  } finally {
    process.exit(0);
  }
}

createAdmin();
