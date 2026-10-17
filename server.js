const { createClient } = require('@supabase/supabase-js');
const http = require('http');

// 1. CHANNELS PORT LISTENER FOR RENDER HEALTH CHECKS
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Aviator Game Engine Running Live\n');
}).listen(PORT, () => {
    console.log(`📡 Health Check Server listening on port ${PORT}`);
});

// 2. LINK TO YOUR DATABASE
const SUPABASE_URL = "https://supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqeWt0Z3pib2puZW12eGd3dnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMjg4MTEsImV4cCI6MjEwNzgwNDgxMX0.VCPfCEVrLZHU8De9diQB0EYo9x9NXxHYdvdkXSITRJA";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("🚀 Aviator Loop Engine Active...");

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

            // Wait 5 seconds for players to place bets before take-off
            await new Promise(r => setTimeout(r, 5000));

            // Take off! Status active
            await supabase.from('game_rounds').update({ status: 'active' }).eq('id', round.id);

            let current = 1.00;
            let active = true;

            while (active) {
                await new Promise(r => setTimeout(r, 150)); // Tick every 150ms
                current = parseFloat((current + (current < 5 ? 0.05 : current < 20 ? 0.15 : 0.80)).toFixed(2));

                // Check Admin Override panel click
                const { data: check } = await supabase.from('game_rounds').select('is_force_crashed').eq('id', round.id).single();
                if (check?.is_force_crashed) { active = false; break; }

                // Check Natural Crash math point
                if (current >= crashPoint) { current = crashPoint; active = false; break; }

                // Stream real-time data tick forward to Supabase
                await supabase.from('game_rounds').update({ current_multiplier: current }).eq('id', round.id);
            }

            // Crash the plane state configuration
            await supabase.from('game_rounds').update({ status: 'crashed', current_multiplier: current, ended_at: new Date() }).eq('id', round.id);
            await new Promise(r => setTimeout(r, 4000)); // Break 4 seconds before auto looping next round

        } catch (e) {
            console.error(e.message);
            await new Promise(r => setTimeout(r, 3000));
        }
    }
}
runGame();
