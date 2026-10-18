import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROOT = '0x1111111111111111111111111111111111111111';

test('publisher follows a guided setup with validation and no hidden signing', async ({page})=>{
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto('/');
  await expect(page.getByRole('heading',{name:/stay reachable/i})).toBeVisible();
  await expect(page.getByText('STEP 1 OF 3')).toBeVisible();
  await page.getByRole('button',{name:/continue/i}).click();
  await expect(page.locator('#service-error')).toBeVisible();
  await page.locator('#service-id').fill('my-community');
  await page.getByRole('button',{name:/continue/i}).click();
  await expect(page.getByText('STEP 2 OF 3')).toBeVisible();
  await page.getByRole('button',{name:/review setup/i}).click();
  await expect(page.locator('#primary-error')).toBeVisible();
  await page.locator('#primary-url').fill('https://example.org/');
  await page.locator('#fallback-url').fill('https://backup.example.org/');
  await page.getByRole('button',{name:/review setup/i}).click();
  await expect(page.getByText('STEP 3 OF 3')).toBeVisible();
  await expect(page.locator('#review-service')).toHaveText('my-community');
  await expect(page.locator('#review-fallback')).toContainText('backup.example.org');
  await expect(page.locator('#publish-manifest')).toBeDisabled();
  await page.getByRole('button',{name:/connect wallet/i}).click();
  await expect(page.locator('#publish-status')).toContainText(/install.*wallet/i);
  await expect(page.locator('#publish-manifest')).toBeDisabled();
  await expect(page.locator('#completion')).toBeHidden();
  expect(errors).toEqual([]);
});

test('recovery refuses an unpinned issuer then explicitly stores and resets trust',async ({page})=>{
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto('/recover.html');
  await expect(page.getByRole('heading',{name:/find the way back/i})).toBeVisible();
  await page.locator('#recovery-service').fill('my-community');
  await page.locator('#recovery-publisher').fill(ROOT);
  await page.getByRole('button',{name:/verify and find routes/i}).click();
  await expect(page.locator('#recovery-status')).toContainText(/pin the publisher/i);
  await expect(page.locator('#recovery-result')).toBeHidden();
  await page.getByRole('button',{name:/pin trusted publisher/i}).click();
  await expect(page.locator('dialog')).toBeVisible();
  await expect(page.locator('dialog')).toContainText(/independently|authentic/i);
  await page.getByRole('button',{name:/yes, pin this wallet/i}).click();
  await expect(page.locator('#pin-status')).toContainText(/trusted wallet on this device/i);
  await page.getByRole('button',{name:/reset trust/i}).click();
  await expect(page.locator('dialog')).toBeVisible();
  await expect(page.locator('dialog')).toContainText(/rollback protection/i);
  await page.getByRole('button',{name:/go back/i}).click();
  await expect(page.locator('#pin-status')).toContainText(/trusted wallet on this device/i);
  expect(errors).toEqual([]);
});

test('responsive layout never overflows horizontally and navigation stays available',async ({page})=>{
  await page.goto('/');
  await expect(page.locator('.primary-nav a[aria-current]')).toBeVisible();
  await expect(page.locator('.site-header')).toBeVisible();
  const a=await page.evaluate(()=>({actual:document.documentElement.scrollWidth,viewport:innerWidth}));
  expect(a.actual).toBeLessThanOrEqual(a.viewport+1);
  await page.goto('/recover.html');
  await expect(page.locator('.primary-nav a[aria-current]')).toBeVisible();
  const b=await page.evaluate(()=>({actual:document.documentElement.scrollWidth,viewport:innerWidth}));
  expect(b.actual).toBeLessThanOrEqual(b.viewport+1);
});

test('self-hosted typography and Lucide SVG icons render',async ({page})=>{
  await page.goto('/');
  const family=await page.locator('body').evaluate(x=>getComputedStyle(x).fontFamily);
  expect(family).toContain('Inter Variable');
  const heading=await page.locator('h1').evaluate(x=>getComputedStyle(x).fontFamily);
  expect(heading).toContain('Geist Variable');
  await expect(page.locator('.hero-actions .btn svg').first()).toBeVisible();
});

test('publisher and reader have no automated axe critical/serious WCAG failures',async ({page})=>{
  for(const route of ['/','/recover.html']){
    await page.goto(route);
    const results=await new AxeBuilder({page})
      .withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa'])
      .analyze();
    const meaningful=results.violations.filter(v=>v.impact==='critical'||v.impact==='serious');
    if(meaningful.length) console.log('A11Y_DETAILS',route,JSON.stringify(meaningful.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary})).slice(0,20)}))));
    expect(meaningful.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length}))).toEqual([]);
  }
});


test('wallet-led publisher workspace has clear disconnected state and no forced signing',async ({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/workspace.html');
  await expect(page.getByRole('heading',{name:/everything you've published/i})).toBeVisible();
  await expect(page.locator('#workspace-wallet-address')).toHaveText('Not connected');
  await expect(page.locator('#workspace-refresh')).toBeDisabled();
  await page.locator('#workspace-connect').click();
  await expect(page.locator('#workspace-status')).toContainText(/install an evm-compatible browser wallet/i);
  await expect(page.locator('#workspace-list')).toBeHidden();
  expect(errors).toEqual([]);
});

test('GitHub Pages navigation stays within site and workspace publishes inline',async({page})=>{
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 await page.goto('/');
 const find=page.locator('.primary-nav a').filter({hasText:'Find a service'});
 await expect(find).toHaveAttribute('href','./recover.html');
 await find.click();
 await expect(page).toHaveURL(/\/recover\.html$/);
 await expect(page.getByRole('heading',{name:/find the way back/i})).toBeVisible();
 await page.locator('.primary-nav a').filter({hasText:'Workspace'}).click();
 await expect(page).toHaveURL(/\/workspace\.html$/);
 await expect(page.locator('#setup')).toBeHidden();
 await page.getByRole('link',{name:/publish new service/i}).click();
 await expect(page.locator('#setup')).toBeVisible();
 await page.locator('#service-id').fill('qa-test-service');
 await page.locator('#next-one').click();
 await expect(page.locator('[data-step="2"]')).toBeVisible();
 await page.locator('#primary-url').fill('https://example.org/');
 await page.locator('#fallback-url').fill('https://backup.example.org/');
 await page.locator('#next-two').click();
 await expect(page.locator('[data-step="3"]')).toBeVisible();
 await expect(page.locator('#publish-manifest')).toBeDisabled();
 await page.locator('#connect-wallet').click();
 await expect(page.locator('#publish-status')).toContainText(/install an evm-compatible browser wallet/i);
 await page.locator('#workspace-publish-close').click();
 await expect(page.locator('#setup')).toBeHidden();
 await expect(page.locator('#workspace-list')).toBeHidden();
 expect(errors).toEqual([]);
});

test('on-site reader and publisher links remain coherent in mobile viewport',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 for(const path of ['/','/workspace.html','/recover.html']){
   await page.goto(path);
   const actual=await page.evaluate(()=>document.documentElement.scrollWidth);
   expect(actual).toBeLessThanOrEqual(391);
   for(const link of await page.locator('.primary-nav a').all()){
     const href=await link.getAttribute('href');
     if(href?.startsWith('https://'))expect(href).toMatch(/^https:\/\/github\.com\//);
   }
 }
});
