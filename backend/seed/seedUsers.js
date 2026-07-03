require("dotenv").config();
const getSupabase = require("../config/db");
const { hashPassword } = require("../utils/passwordHelper");

const defaultUsers = [
  {
    email: "admin@test.com",
    name: "System Administrator",
    role: "ADMIN",
    department: "ADMIN",
    password: "admin123",
    employee_id: "EMP-ADMIN-001",
  },
  {
    email: "inventory@test.com",
    name: "Inventory Manager",
    role: "INVENTORY_MANAGER",
    department: "INVENTORY",
    password: "inventory123",
    employee_id: "EMP-INV-001",
  },
  {
    email: "itmanager@test.com",
    name: "IT Department Manager",
    role: "IT_MANAGER",
    department: "IT",
    password: "itmanager123",
    employee_id: "EMP-IT-001",
  },
  {
    email: "auditor@test.com",
    name: "External Auditor",
    role: "AUDITOR",
    department: "ADMIN",
    password: "auditor123",
    employee_id: "EMP-AUD-001",
  },
  {
    email: "vendor@test.com",
    name: "Partner Vendor Representative",
    role: "VENDOR",
    department: "VENDOR",
    password: "vendor123",
    employee_id: "EMP-VND-001",
  },
];

async function seed() {
  try {
    const supabase = getSupabase();
    console.log("🚀 Starting database seeding...");

    for (const user of defaultUsers) {
      console.log(`Checking if user exists: ${user.email}...`);

      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error(
          `❌ Error checking user ${user.email}:`,
          fetchError.message,
        );
        continue;
      }

      if (existingUser) {
        console.log(`ℹ️ User ${user.email} already exists. Skipping.`);
        continue;
      }

      console.log(`Hashing password for ${user.email}...`);
      const hashedPassword = await hashPassword(user.password);

      const userData = {
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        password: hashedPassword,
        employee_id: user.employee_id,
        is_active: true,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };

      console.log(`Inserting user ${user.email}...`);
      const { data: inserted, error: insertError } = await supabase
        .from("users")
        .insert([userData])
        .select("id")
        .single();

      if (insertError) {
        console.error(
          `❌ Error inserting user ${user.email}:`,
          insertError.message,
        );
      } else {
        console.log(
          `✅ Successfully seeded user: ${user.email} (ID: ${inserted.id})`,
        );
      }
    }

    console.log("🎉 Seeding process completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Fatal error during seeding:", err.message);
    process.exit(1);
  }
}

seed();
//
