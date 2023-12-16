import { createClient } from "@supabase/supabase-js";
import { Database } from "../database.types";

const { SUPABASE_URL, SERVICE_ROLE_KEY } = process.env;

export const supabase = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);
