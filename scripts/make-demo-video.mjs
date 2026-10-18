/**
 * Generate an honest MP4 storyboard using SCREENSHOTS captured from real browser
 * renders and public evidence that was independently checked on Arkiv Tiramisu.
 * No wallet keys, seed phrases, simulated transactions, or fabricated 200/404s.
 * Never auto-submit this video: the user must review and upload it themselves.
 */
import { chromium } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root=resolve('demo-video');
const frames=resolve(root,'frames');
await mkdir(frames,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1, colorScheme:'dark'});
const shots={};
const saveImage=async(path,name)=>{
  try{
    await page.goto(path,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForTimeout(1300);
    shots[name]=(await page.screenshot({animations:'disabled'})).toString('base64');
    console.log('REAL_UI_CAPTURE',name,path);
  }catch(error){console.log('CAPTURE_UNAVAILABLE',name,error.message);}
};
await saveImage('http://127.0.0.1:4173/','publisher');
await saveImage('http://127.0.0.1:4173/workspace.html','workspace');
try{
  await page.goto('https://relayline-reader.vercel.app/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#recovery-service').fill('relayline-demo-oct14');
  await page.locator('#recovery-publisher').fill('0x2d7cfff67d9e63e225e082371b205cb7518b5c24');
  await page.locator('#pin-publisher').click();
  await page.locator('dialog[open]').getByRole('button',{name:/yes, pin this wallet/i}).click();
  await page.locator('#query-service').click();
  await page.locator('#recovery-status').getByText(/Authenticated recovery information loaded directly from Arkiv/i).waitFor({timeout:40000});
  shots.reader=(await page.screenshot({animations:'disabled'})).toString('base64');
  console.log('REAL_UI_CAPTURE','reader','live independently hosted read-only reader');
}catch(error){console.log('READER_QUERY_CAPTURE_UNAVAILABLE',error.message);}
await browser.close();

const slides=[
  {time:11,kicker:'RELAYLINE / AN ARKIV PROJECT',title:'When a service disappears,\nits trusted recovery route should not.',body:'An open protocol for independently discovering publisher-authorized fallback destinations.',image:'publisher'},
  {time:14,kicker:'THE PROBLEM',title:'One outage should not\nend discovery.',body:'An unavailable website can strand users and make forged recovery announcements more believable. RelayLine authenticates a published alternative through Arkiv.'},
  {time:16,kicker:'THE PUBLISHER',title:'Publish once.\nVerify from anywhere.',body:'The actual publisher signs public HTTPS destinations on Arkiv Tiramisu. No RelayLine-operated database decides which wallet created them.',image:'publisher'},
  {time:14,kicker:'THE WORKSPACE / NEW FEATURE',title:'See the services\nyour wallet published.',body:'Wallet-linked, read-only Arkiv discovery. New, updated and rotated records are evaluated under the existing trust policy.',image:'workspace'},
  {time:17,kicker:'INDEPENDENT READER',title:'Recovery does not\nneed our publisher app.',body:'A second deployment independently queries signed records. Readers pin an identity obtained through a separately authenticated source.',image:'reader'},
  {time:17,kicker:'REAL TIRAMISU M4',title:'A live publisher.\nA real impersonator rejected.',body:'Publisher 0x2d7c…5c24 signed entity 0x2389…2d7fc. A separate wallet published a claimed record; the reader rejected its immutable creator. Testnet transactions independently verified.'},
  {time:16,kicker:'CONTROLLED OUTAGE / ARCHIVED TEST',title:'Primary HTTP 404.\nAuthorized fallback HTTP 200.',body:'A controlled test on 14 October verified Arkiv-backed recovery while the primary test fixture was unavailable. The primary was restored afterwards.'},
  {time:17,kicker:'REAL TIRAMISU M5',title:'Two trusted monitors.\nOne honest verdict.',body:'At Arkiv block 735175, Wallet B and Wallet C both held valid signed observations. The direct reader evaluated 2-of-2 reachable. These observations have since expired.'},
  {time:18,kicker:'REAL TIRAMISU M6',title:'Rotate authority.\nRevoke safely.',body:'Root Wallet B authorized Wallet C’s revision 2; later Wallet C revoked it. Reader returned latest_manifest_revoked and selected=null at block 736262.'},
  {time:14,kicker:'OPEN AND REPRODUCIBLE',title:'Read the code.\nCheck the receipts.',body:'GitHub: victorkay97/RelayLine · docs/ONCHAIN_EVIDENCE.md · arkiv/schema.md · arkiv/friction.md · MIT licensed.'},
  {time:11,kicker:'RELAYLINE',title:'Stay discoverable.\nEven when your service isn’t.',body:'Real signed testnet records. Open-source verification. No claims of universal censorship resistance.'}
];
const css=`
*{box-sizing:border-box}html,body{margin:0;width:1280px;height:720px;overflow:hidden;background:#101126;color:#F7F5FF;font-family:Arial,sans-serif}body{background:radial-gradient(ellipse at 80% 10%,rgba(111,89,205,.2),transparent 48%),#101126}.outer{position:absolute;inset:0;padding:48px 62px;display:flex;flex-direction:column;justify-content:center}.top{position:absolute;left:62px;top:34px;right:62px;display:flex;align-items:center;justify-content:space-between;font-size:12px;letter-spacing:2.3px;color:#FFAA8E;font-weight:800}.logo{font-size:22px;letter-spacing:-1px;color:#F7F5FF}.logo b{color:#FFAA8E}.graphic{position:absolute;right:49px;top:118px;width:590px;height:415px;border-radius:17px;overflow:hidden;border:2px solid #65618A;box-shadow:0 25px 60px #04061699;background:#212341}.graphic img{width:100%;height:100%;object-fit:cover;object-position:top}.hasimage .content{width:525px}.content{position:relative;z-index:2;max-width:1090px}.kicker{font-size:12px;color:#FFAA8E;letter-spacing:3px;font-weight:800;margin-bottom:22px}.headline{font-size:59px;line-height:1.08;white-space:pre-line;font-weight:750;letter-spacing:-2.2px;max-width:1050px;margin:0 0 24px}.hasimage .headline{font-size:52px}.body{max-width:890px;font-size:21px;line-height:1.45;color:#D1CAE9}.hasimage .body{font-size:18px;max-width:520px}.rule{position:absolute;bottom:40px;left:62px;right:62px;height:1px;background:#3B3D62}.bottom{position:absolute;bottom:16px;right:62px;font-size:11px;color:#A4A1BF;letter-spacing:1.5px}
`;
let htmlPage=await chromium.launch({headless:true,args:['--no-sandbox']});
const slidePage=await htmlPage.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
let list='ffconcat version 1.0\n';
for(let i=0;i<slides.length;i++){
  const s=slides[i];
  const image=s.image&&shots[s.image]?`<div class="graphic"><img src="data:image/png;base64,${shots[s.image]}" alt="Real browser screenshot"></div>`:'';
  const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  await slidePage.setContent(`<!doctype html><style>${css}</style><div class="outer ${image?'hasimage':''}"><div class="top"><div class="logo">relayline<b>.</b></div><span>ARKIV TIRAMISU · VERIFIED EVIDENCE</span></div>${image}<div class="content"><div class="kicker">${esc(s.kicker)}</div><h1 class="headline">${esc(s.title)}</h1><div class="body">${esc(s.body)}</div></div><div class="rule"></div><div class="bottom">RELAYLINE · REAL TESTNET EVIDENCE · OCT 2026</div></div>`);
  const filename=String(i).padStart(2,'0')+'.png';
  await slidePage.screenshot({path:resolve(frames,filename)});
  list+=`file 'frames/${filename}'\nduration ${s.time}\n`;
}
list+=`file 'frames/${String(slides.length-1).padStart(2,'0')}.png'\n`;
await htmlPage.close();
await writeFile(resolve(root,'timeline.ffconcat'),list);
const duration=slides.reduce((s,x)=>s+x.time,0);
console.log('DEMO_LENGTH_SECONDS',duration);
if(duration>180)throw Error('Demo exceeds 180-second submission maximum');
const args=['-hide_banner','-loglevel','error','-y','-safe','0','-f','concat','-i',resolve(root,'timeline.ffconcat'),'-vf','fps=12,format=yuv420p','-c:v','libx264','-preset','veryfast','-crf','25','-movflags','+faststart','-an',resolve(root,'RelayLine-demo-draft.mp4')];
const ffmpeg=spawnSync('ffmpeg',args,{stdio:'inherit',timeout:170000});
if(ffmpeg.status!==0)throw Error('ffmpeg video encoder failed (status '+ffmpeg.status+')');
console.log('CREATED',resolve(root,'RelayLine-demo-draft.mp4'),'seconds',duration);
