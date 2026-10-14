import { test, expect } from '@playwright/test';

test('live hosted recovery reader rejects separate-wallet counterfeit while retaining authentic manifest', async ({page}) => {
  test.skip(process.env.RELAYLINE_LIVE_G3!=='1','Opt-in real signed testnet evidence; public entities eventually expire.');
  await page.goto('https://relayline-reader.vercel.app/',{waitUntil:'domcontentloaded'});
  await page.locator('#recovery-service').fill('relayline-demo-oct14');
  await page.locator('#recovery-publisher').fill('0x2d7cfff67d9e63e225e082371b205cb7518b5c24');
  await page.locator('#pin-publisher').click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.locator('dialog[open]').getByRole('button',{name:/yes, pin this wallet/i}).click();
  await page.locator('#query-service').click();
  await expect(page.locator('#recovery-status')).toContainText('Authenticated recovery information loaded directly from Arkiv.',{timeout:45000});
  const result=page.locator('#recovery-result');
  await expect(result).toContainText('0x2389c184908191a0b751396e135f64c1ceb3e2d827cbc5849d1a2ff442a7d2fc');
  await expect(result).toContainText('relayline-test-fallback.vercel.app');
  await expect(result.locator('.rejections')).toContainText('rejected records (1)',{ignoreCase:true});
  await result.locator('.rejections summary').click();
  await expect(result.locator('.rejections')).toContainText('untrusted_creator');
  await expect(result.locator('.rejections')).toContainText('0x2b47b2');
  const opened=result.locator('.endpoint-result a[href*="vercel.app"]');
  await expect(opened).toHaveCount(2);
  await expect(result.locator('.endpoint-result')).not.toContainText('relayline-test-primary.vercel.app/offline');
});
