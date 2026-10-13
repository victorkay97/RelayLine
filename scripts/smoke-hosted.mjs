const targets=[
  {label:'publisher',url:'https://relayline-vkalu2266-3185s-projects.vercel.app/',expected:'RelayLine — Publisher Console'},
  {label:'independent reader',url:'https://relayline-reader-vkalu2266-3185s-projects.vercel.app/recover.html',expected:'RelayLine — Independent Recovery'}
];
for(const target of targets){
  let lastError='';
  let okay=false;
  for(let attempt=1;attempt<=4;attempt++){
    try{
      const response=await fetch(target.url,{cache:'no-store',redirect:'manual',
        signal:AbortSignal.timeout(10000)});
      const html=await response.text();
      if(response.status!==200)throw new Error('Expected HTTP 200, received '+response.status);
      if(!html.includes(target.expected))throw new Error('Expected page title absent; possible auth wall or wrong deployment');
      console.log(JSON.stringify({result:'PASS',surface:target.label,status:response.status,url:target.url,attempt,
        checkedAt:new Date().toISOString()},null,2));
      okay=true;break;
    }catch(error){
      lastError=error.message;
      if(attempt<4)await new Promise(resolve=>setTimeout(resolve,4000));
    }
  }
  if(!okay){
    console.error(JSON.stringify({result:'FAIL',surface:target.label,url:target.url,error:lastError},null,2));
    process.exitCode=1;
  }
}
