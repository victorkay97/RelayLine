import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir:'./test/e2e',
  timeout:30_000,
  expect:{ timeout:8_000 },
  retries:process.env.CI?1:0,
  reporter:process.env.CI?'list':'line',
  use:{
    baseURL:'http://127.0.0.1:4174',
    trace:'retain-on-failure',
    screenshot:'only-on-failure',
    video:'retain-on-failure'
  },
  projects:[
    {name:'chromium-desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:900}}},
    {name:'chromium-mobile',use:{...devices['Desktop Chrome'],viewport:{width:375,height:812},isMobile:true,hasTouch:true}},
    {name:'chromium-compact',use:{...devices['Desktop Chrome'],viewport:{width:320,height:740},isMobile:true,hasTouch:true}}
  ],
  webServer:{
    command:'npm run dev -- --host 127.0.0.1 --port 4174 --strictPort',
    url:'http://127.0.0.1:4174/',
    reuseExistingServer:!process.env.CI,
    timeout:90_000
  }
});
