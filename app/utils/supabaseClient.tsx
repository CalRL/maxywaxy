import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseURL: string = process.env.SUPABASE_URL!;
const supabaseKey: string = process.env.SUPABASE_API_KEY!;

export const supabase = createClient(supabaseURL, supabaseKey);
