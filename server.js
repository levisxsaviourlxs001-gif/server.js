const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://supabase.co";
// Your fully verified admin authentication key string
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqeWt0Z3pib2puZW12eGd3dnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMjg4MTEsImV4cCI6MjEwNzgwNDgxMX0.VCPfCEVrLZHU8De9diQB0EYo9x9NXxHYdvdkXSITRJA";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("🚀 Aviator Engine Active...");

function generateCrashPoint() {
    if (Math.random() < 0.03) return 1.00; // 3% instant crash
    return parseFloat((1.01 + 0.99 / (Math.random() + 0.01)).toFixed(2));
}

async function runGame() {
    while (true) {
        try {
            const crashPoint = generateCrashPoint();
            console.log(`New round crash point: ${crashPoint}x`);

            const { data: round, error } = await supabase
                .from('game_rounds')
                .insert([{ status: 'pending', current_multiplier: 1.00, crash_point: crashPoint, is_force_crashed: false, started_at: new Date() }])
                .select().single();

            if (error) throw error;

            // Wait 5 seconds for players to place bets
            await new Promise(r => setTimeout(r, 5000));

            // Takeoff status active
            await supabase.from('game_rounds').update({ status: 'active' }).eq('id', round.id);

            let current = 1.00;
            let active = true;

            while (active) {
                await new Promise(r => setTimeout(r, 100)); // Tick every 100ms
                current = parseFloat((current + (current < 5 ? 0.05 : current < 20 ? 0.15 : 0.80)).toFixed(2));

                // Check Admin Control Room Override panel click
                const { data: check } = await supabase.from('game_rounds').select('is_force_crashed').eq('id', round.id).single();
                if (check?.is_force_crashed) { active = false; break; }

                // Check Natural Crash math point
                if (current >= crashPoint) { current = crashPoint; active = false; break; }

                // Stream real-time tick steps to database
                await supabase.from('game_rounds').update({ current_multiplier: current }).eq('id', round.id);
            }

            // Crash the plane state configuration
            await supabase.from('game_rounds').update({ status: 'crashed', current_multiplier: current, ended_at: new Date() }).eq('id', round.id);
            await new Promise(r => setTimeout(r, 4000)); // Break before next round automatically loops

        } catch (e) {
            console.error(e.message);
            await new Promise(r => setTimeout(r, 3000));
        }
    }
}
runGame();
