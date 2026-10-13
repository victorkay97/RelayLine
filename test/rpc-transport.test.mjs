import test from 'node:test';
import assert from 'node:assert/strict';
import {parseReadRpcUrls,makeReadTransport,DEFAULT_TIRAMISU_RPC} from '../src/rpc-transport.mjs';

test('defaults only to genuine, documented Tiramisu RPC',()=>{
 assert.deepEqual(parseReadRpcUrls(),[DEFAULT_TIRAMISU_RPC]);
 assert.equal(typeof makeReadTransport(),'function');
});
test('operator can configure multiple independent read-only RPCs',()=>{
 const urls=parseReadRpcUrls([DEFAULT_TIRAMISU_RPC,'https://rpc-other.example.net/']);
 assert.equal(urls.length,2);
 assert.equal(typeof makeReadTransport(urls),'function');
});
test('duplicate URLs do not create imaginary failover capacity',()=>{
 const urls=parseReadRpcUrls([DEFAULT_TIRAMISU_RPC,DEFAULT_TIRAMISU_RPC]);
 assert.equal(urls.length,1);
});
test('unsafe or secret-bearing RPC URLs are refused',()=>{
 for(const url of [
 'http://rpc.example.net/','https://u:p@rpc.example.net/',
 'https://rpc.example.net/?apiKey=secret','https://localhost/',
 'https://rpc.example.net/#secret'
 ])assert.throws(()=>parseReadRpcUrls(url),/RPC|Loopback/);
});
test('limit to four reviewed read RPCs',()=>{
 assert.throws(()=>parseReadRpcUrls(Array.from({length:5},(_,i)=>`https://rpc${i}.example.net/`)),/1–4/);
});
