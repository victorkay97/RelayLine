const cases=[
  {label:'controlled primary online',url:'https://relayline-test-primary.vercel.app/',status:200,title:'RelayLine controlled primary'},
  {label:'controlled primary deliberately unavailable',url:'https://relayline-test-primary.vercel.app/offline',status:404},
  {label:'controlled fallback online',url:'https://relayline-test-fallback.vercel.app/',status:200,title:'RelayLine controlled fallback'}
];
let failures=0;
for (const target of cases) {
  try {
    const response=await fetch(target.url,{redirect:'manual',signal:AbortSignal.timeout(14000)});
    const page=await response.text();
    if (response.status !== target.status || (target.title&&!page.includes(target.title))) {
      throw new Error('Got HTTP '+response.status+'; expected '+target.status+' and title '+(target.title||'any'));
    }
    console.log(JSON.stringify({result:'PASS',label:target.label,status:response.status,url:target.url},null,2));
  } catch(error){
    failures++;
    console.error(JSON.stringify({result:'FAIL',label:target.label,error:error.message,url:target.url},null,2));
  }
}
if (failures) process.exitCode=1;
