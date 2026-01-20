import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xjjowzrgqfyczoxazjg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqam93enJnZ3FmeWN6b3hhempnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NDg3NzksImV4cCI6MjA4NDUyNDc3OX0.HxsDbpxhQNi0aoGzljGjpkvyPtHA40AydDIvxCKr0Ug';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Testing connection to Supabase...');
    try {
        const { data, error } = await supabase.from('ingredients').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Error connecting to database:', error.message);
            if (error.code) console.error('Error Code:', error.code);
        } else {
            console.log('✅ Connection Successful!');
            console.log('Table "ingredients" is accessible.');
        }

        const { data: data2, error: error2 } = await supabase.from('consumption_logs').select('count', { count: 'exact', head: true });
        if (error2) {
            console.error('❌ Error checking consumption_logs:', error2.message);
        } else {
            console.log('✅ Table "consumption_logs" is accessible.');
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

testConnection();
