import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {initialBrief,sampleQuotes} from '../data/quotes.mjs';
import {parseCents,compareQuotes,sourceById} from '../domain.mjs';
import {createStore} from '../store.mjs';
import {createActions} from '../actions.mjs';
import {modelEndpoint} from '../agent.mjs';
import {createReviewer} from '../agent.mjs';
import http from 'node:http';

test('complete cost uses exact cents and does not turn missing freight into zero',()=>{
  assert.equal(parseCents('0.29'),29);
  assert.equal(parseCents('240.1'),24010);
  assert.throws(()=>parseCents('2.999'));
  assert.throws(()=>parseCents('-1'));
  const c=compareQuotes(sampleQuotes,initialBrief),[a,n,p]=c.rows;
  assert.equal(a.total,261500);assert.equal(p.total,265000);
  assert.equal(n.subtotal,223000);assert.equal(n.total,null);assert.equal(n.status,'needs_answer');
  assert.deepEqual(c.eligibleIds,['alder','paperfield']);
  assert.equal(c.preferredId,'alder');
});
test('hard requirements and ranking react to changed brief',()=>{
  assert.deepEqual(compareQuotes(sampleQuotes,{...initialBrief,deliveryBy:'2026-11-23'}).eligibleIds,['paperfield']);
  assert.deepEqual(compareQuotes(sampleQuotes,{...initialBrief,budgetCents:260000}).eligibleIds,[]);
  assert.equal(compareQuotes(sampleQuotes,{...initialBrief,priority:'most_recycled'}).preferredId,'paperfield');
  assert.deepEqual(compareQuotes(sampleQuotes,{...initialBrief,quantity:999}).eligibleIds,[]);
  assert.deepEqual(compareQuotes(sampleQuotes,{...initialBrief,minimumRecycled:90}).eligibleIds,['paperfield']);
});
test('source references are exact, and unsupported fields stay unknown',()=>{
  assert.equal(sourceById(sampleQuotes,'northline:6').text,'Shipping: charged separately; amount to be confirmed');
  for(const bad of ['alder:4:9','alder:04','alder:0','fake:1','alder:400'])assert.throws(()=>sourceById(sampleQuotes,bad));
  const q={...sampleQuotes[0],text:sampleQuotes[0].text.replace('Delivery: 2026-11-24','Delivery: 2026-02-30').replace('Quantity: 1000','Quantity: '+'9'.repeat(300))};
  const c=compareQuotes([q],initialBrief);
  assert.equal(c.rows[0].facts.delivery.value,null);assert.equal(c.rows[0].facts.quantity.value,null);
  assert.equal(c.rows[0].total,null);assert.equal(c.eligibleIds.length,0);
});
test('shared native actions validate callers and schemas; stale reviews cannot commit; SQL persists',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'quotecheck-test-'));
  let store;
  try{
    store=await createStore(dir);const {invoke,actions}=createActions(store);
    assert.ok(actions['compare-quotes'].tool.parameters);
    await assert.rejects(actions['compare-quotes'].run({},{}),/session/);
    await assert.rejects(invoke('update-brief',{expectedRevision:1,brief:{...initialBrief,budgetCents:'280000'}},'human'));
    await assert.rejects(invoke('update-brief',{expectedRevision:1,brief:initialBrief},'agent'),/cannot change/);
    const human=await invoke('compare-quotes',{},'human'),agent=await invoke('compare-quotes',{},'agent');
    assert.deepEqual(agent,human);
    const draft={revision:1,candidateId:'alder',rationale:'Alder has the lowest complete total among the quotes meeting the brief.',sourceIds:['alder:4','alder:6'],question:{quoteId:'northline',sourceId:'northline:6',text:'Could you confirm the final freight amount for this quote?'}};
    await assert.rejects(invoke('propose-review',{...draft,sourceIds:['alder:999']},'agent'),/source/);
    const saved=await invoke('propose-review',draft,'agent');assert.equal(saved.needsHumanReview,true);
    await invoke('update-brief',{expectedRevision:1,brief:{...initialBrief,deliveryBy:'2026-11-23'}},'human');
    await assert.rejects(invoke('propose-review',draft,'agent'),/changed/);
    await assert.rejects(invoke('propose-review',{...draft,revision:2},'agent'),/does not meet/);
    await assert.rejects(invoke('update-source',{expectedRevision:1,quoteId:'northline',text:sampleQuotes[1].text},'human'),/changed/);
    await invoke('update-source',{expectedRevision:2,quoteId:'northline',text:sampleQuotes[1].text.replace('charged separately; amount to be confirmed','USD 50.00')},'human');
    const snapshot=await store.snapshot();assert.equal(snapshot.revision,3);assert.equal(snapshot.comparison.rows.find(q=>q.id==='northline').total,228000);
    assert.ok(snapshot.log.some(l=>l.actor==='human'&&l.name==='compare-quotes'&&l.status==='ok'));
    assert.ok(snapshot.log.some(l=>l.actor==='agent'&&l.name==='compare-quotes'&&l.status==='ok'));
    await store.close();store=await createStore(dir);assert.equal((await store.snapshot()).revision,3);
  }finally{if(store)await store.close();await rm(dir,{recursive:true,force:true});}
});
test('the local reviewer cannot be routed to a third-party model endpoint',()=>{
  assert.equal(modelEndpoint('http://127.0.0.1:4365'),'http://127.0.0.1:4365');
  for(const value of ['https://example.com','http://10.0.0.1:4365','http://user:pass@localhost:3','http://localhost:4365/path'])assert.throws(()=>modelEndpoint(value));
});
test('a provider failure is visible and cannot become a saved review (mock HTTP fixture)',async()=>{
  const fake=http.createServer((_req,res)=>{res.writeHead(503);res.end('fixture unavailable');});
  await new Promise(resolve=>fake.listen(0,'127.0.0.1',resolve));
  const store=await createStore(),updates=[];
  try{
    const native=createActions(store),reviewer=createReviewer({store,...native,endpoint:'http://127.0.0.1:'+fake.address().port,onProgress:j=>updates.push(j)});
    const {promise}=await reviewer.run('Failure fixture, not a real model execution');
    await assert.rejects(promise,/HTTP 503/);
    assert.equal(updates.at(-1).status,'error');
    assert.equal((await store.snapshot()).reviews.length,0);
    assert.ok((await store.snapshot()).log.some(l=>l.kind==='review-error'));
  }finally{await store.close();await new Promise(resolve=>fake.close(resolve));}
});
