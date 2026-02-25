import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UsageLog {
  menu_type: string;
  category: string;
  difficulty: string;
  language: string;
}

export async function logUsage(data: UsageLog) {
  try {
    const { error } = await supabase
      .from('usage_logs')
      .insert([{
        menu_type: data.menu_type,
        category: data.category,
        difficulty: data.difficulty,
        language: data.language,
      }]);

    if (error) {
      console.error('Error logging usage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error logging usage:', error);
    return false;
  }
}
