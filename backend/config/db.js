const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

let supabaseClient = null;

const initSupabase = () => {
  try {
    console.log("🚀 Initializing Supabase connection...");

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

    // Validate environment variables
    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL is not defined in environment variables");
    }
    if (!supabaseKey) {
      throw new Error(
        "SUPABASE_SECRET_KEY or SUPABASE_PUBLISHABLE_KEY is not defined in environment variables",
      );
    }

    console.log(
      "Supabase URL:",
      supabaseUrl ? "Set (" + supabaseUrl.substring(0, 30) + "...)" : "Not Set",
    );
    console.log(
      "Supabase Key:",
      supabaseKey ? "Set (length: " + supabaseKey.length + ")" : "Not Set",
    );

    // Create Supabase client with optimized configuration
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false, // Server doesn't need persistent sessions
        detectSessionInUrl: false,
      },
      db: {
        schema: "public",
      },
      global: {
        headers: {
          "X-Client-Info": "dsr-backend",
        },
      },
    });

    console.log("✅ Supabase client initialized successfully");
    console.log("📊 Database: PostgreSQL via Supabase");

    return supabaseClient;
  } catch (error) {
    console.error("❌ Supabase initialization failed:", error.message);
    console.error("\n🔧 Troubleshooting steps:");
    console.error("1. Check if SUPABASE_URL is set in .env file");
    console.error(
      "2. Check if SUPABASE_SECRET_KEY or SUPABASE_PUBLISHABLE_KEY is set in .env file",
    );
    console.error("3. Verify credentials from Supabase dashboard");
    console.error("4. Ensure Supabase project is active\n");

    throw error;
  }
};

// Get Supabase client instance (singleton pattern)
const getSupabase = () => {
  if (!supabaseClient) {
    return initSupabase();
  }
  return supabaseClient;
};

// Test database connection
const testConnection = async () => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (error) {
      console.error("❌ Database connection test failed:", error.message);
      return false;
    }

    console.log("✅ Database connection test successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection test error:", error.message);
    return false;
  }
};

module.exports = getSupabase;
module.exports.initSupabase = initSupabase;
module.exports.testConnection = testConnection;
