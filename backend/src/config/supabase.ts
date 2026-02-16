// src/config/supabase.ts

import { createClient } from "@supabase/supabase-js";
import { logger } from "../utils/logger";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error("Missing Supabase configuration");
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection
export async function testSupabaseConnection() {
  try {
    const { error } = await supabase.from("store_config").select("id").limit(1);
    if (error) throw error;
    logger.info("✅ Supabase connected");
    return true;
  } catch (err) {
    logger.error(`❌ Supabase connection failed: ${err}`);
    return false;
  }
}
