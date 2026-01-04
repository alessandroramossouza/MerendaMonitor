
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env parser since we can't rely on dotenv being installed (and node doesn't read it by default)
const parseEnv = () => {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) return {};
        const content = fs.readFileSync(envPath, 'utf-8');
        const env = {};
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // remove quotes
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        return {};
    }
};

const env = parseEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

console.log('--- DB Connection Test ---');
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Environment variables VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY are missing in .env.local');
    process.exit(1);
}
console.log(`Checking connection to: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection Failed:', error.message);
            // Hints for common errors
            if (error.code === 'PGRST301') console.error('  -> Check if Row Level Security (RLS) is blocking access.');
            if (error.message.includes('fetch')) console.error('  -> Network error or invalid URL.');
            if (error.message.includes('apikey')) console.error('  -> Invalid Anon Key.');
        } else {
            console.log('✅ Connection Successful!');
            console.log(`   Database returned check successfully. (HTTP 200)`);
        }
    } catch (err) {
        console.error('❌ Unexpected Error:', err);
    }
}

testConnection();
