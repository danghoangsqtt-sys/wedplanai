import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'tests/e2e',
  timeout:30000,
  workers:1,
  reporter:'list',
  use:{baseURL:'http://127.0.0.1:3017',headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||undefined,trace:'retain-on-failure'},
  webServer:{
    command:'npm run dev -- --host 127.0.0.1 --port 3017 --strictPort',
    url:'http://127.0.0.1:3017',reuseExistingServer:false,
    env:{VITE_SUPABASE_URL:'https://audit.supabase.co',VITE_SUPABASE_ANON_KEY:'audit-public-key',VITE_OWNER_UID:'e8a57bf1-58c2-45ae-b1ab-65c1e6921ad9'},
  },
});
