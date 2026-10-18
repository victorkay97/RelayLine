const targets=[
  {label:'canonical public home',url:'https://victorkay97.github.io/RelayLine/',expected:'RelayLine'},
  {label:'canonical public reader',url:'https://victorkay97.github.io/RelayLine/recover.html',expected:'RelayLine — Find a trusted recovery route'},
  {label:'canonical workspace',url:'https://victorkay97.github.io/RelayLine/workspace.html',expected:'RelayLine — Publisher workspace'}
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
