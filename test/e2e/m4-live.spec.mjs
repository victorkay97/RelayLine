import { test, expect } from '@playwright/test';

test('deployed independent reader retrieves authentic publisher record directly from Arkiv', async ({page})=>{
  test.skip(process.env.RELAYLINE_LIVE_M4!=='1','Use an explicit read-only live acceptance run; published entities expire.');
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('https://relayline-reader.vercel.app/',{waitUntil:'domcontentloaded'});
  await page.locator('#recovery-service').fill('relayline-demo-oct14');
  await page.locator('#recovery-publisher').fill('0x2d7cfff67d9e63e225e082371b205cb7518b5c24');
  await page.locator('#pin-publisher').click();
  const dialog=page.locator('dialog[open]');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/authentic channel|authentic/i);
  await dialog.getByRole('button',{name:/yes, pin this wallet/i}).click();
  await expect(page.locator('#pin-status')).toContainText(/trusted wallet on this device/i);
  await page.locator('#query-service').click();
  await expect(page.locator('#recovery-status')).toContainText('Authenticated recovery information loaded directly from Arkiv.',{timeout:45000});
  await expect(page.locator('#recovery-result')).toBeVisible();
  await expect(page.locator('#recovery-result')).toContainText('0x2389c184908191a0b751396e135f64c1ceb3e2d827cbc5849d1a2ff442a7d2fc');
  await expect(page.locator('#recovery-result')).toContainText('https://relayline-test-fallback.vercel.app/');
  expect(errors).toEqual([]);
});
