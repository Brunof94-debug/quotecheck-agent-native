import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {initialBrief,sampleQuotes} from '../data/quotes.mjs';
import {digest} from '../store.mjs';
import {money} from '../domain.mjs';
const base='http://127.0.0.1:4364';
const session=await fetch(base+'/api/session');
const cookie=session.headers.get('set-cookie').split(';')[0],{token}=await session.json();
const response=await fetch(base+'/actions/get-workspace',{method:'POST',headers:{cookie,origin:base,'content-type':'application/json','x-quotecheck-token':token},body:'{}'});
if(!response.ok)throw new Error('Cannot capture local workspace.');
const state=await response.json();
if(digest(state.quotes.map(q=>q.text))!==digest(sampleQuotes.map(q=>q.text)))throw new Error('Capture the intended authored source set only.');
const release=JSON.parse(await readFile('.runtime/model-release.json','utf8'));
const runs=[];
for(const f of await readdir('.runtime/model-runs'))if(f.endsWith('.json'))runs.push({...JSON.parse(await readFile('.runtime/model-runs/'+f,'utf8')),file:f});
await mkdir('public/evidence',{recursive:true});await mkdir('evidence/model-runs',{recursive:true});
const scenarios=[];
for(const revision of [1,2,3]){
  const review=state.reviews.find(r=>r.revision===revision);
  if(!review)continue;
  const draft=runs.find(r=>{if(r.stage!=='draft')return false;const args=JSON.parse(r.response.choices[0].message.content);return args.revision===revision&&args.rationale===review.rationale&&Math.abs(Date.parse(r.finished)-Date.parse(review.createdAt))<5000;});
  if(!draft)throw new Error('No real request/response matches the saved draft.');
  const inspect=runs.find(r=>r.jobId===draft.jobId&&r.stage==='inspect');
  if(!inspect)throw new Error('The inspection request is missing.');
  for(const run of [inspect,draft]){const {file,...record}=run;await writeFile('evidence/model-runs/'+file,JSON.stringify(record,null,2)+'\n');}
  const brief={...initialBrief,...(revision===2?{deliveryBy:'2026-11-23'}:revision===3?{budgetCents:260000}:{})};
  const actualBrief=JSON.parse(draft.request.messages.at(-1).content).facts.brief;
  if(actualBrief.maximumTotal!==money(brief.budgetCents)||actualBrief.deliveryBy!==brief.deliveryBy||actualBrief.quantity!==brief.quantity||actualBrief.minimumRecycled!==brief.minimumRecycled||actualBrief.priority!==brief.priority)throw new Error('Recorded brief does not match the authored scenario.');
  const steps=state.log.filter(l=>l.actor==='agent'&&Date.parse(l.at)>=Date.parse(inspect.started)-1000&&Date.parse(l.at)<=Date.parse(review.createdAt)+1000).reverse().map(l=>({name:(l.kind==='model'?'model / ':'')+l.name,actor:l.kind==='model'?'local model':'agent',kind:l.kind,status:l.status,at:l.at}));
  if(revision===1&&steps.length<3){const earlier=JSON.parse(await readFile('public/evidence/recorded-review.json','utf8'));if(earlier.review.id!==review.id)throw new Error('Earlier log capture does not match this review.');steps.push(...earlier.steps);}
  scenarios.push({date:review.createdAt.slice(0,10),model:release.model,modelSha256:release.modelSha256,brief,quotes:state.quotes,review,steps,requestFiles:[inspect.file,draft.file],syntheticData:true,execution:'actual local model; not a fixture'});
}
if(!scenarios.length)throw new Error('No completed real scenario.');
await writeFile('public/evidence/recorded-review.json',JSON.stringify(scenarios[0],null,2)+'\n');
await writeFile('evidence/scenarios.json',JSON.stringify(scenarios,null,2)+'\n');
await writeFile('evidence/shared-actions.json',JSON.stringify({capturedAt:new Date().toISOString(),entries:state.log.filter(l=>l.kind==='action').reverse(),data:'fictional'},null,2)+'\n');
await writeFile('evidence/model-provenance.json',JSON.stringify(release,null,2)+'\n');
console.log(JSON.stringify({scenarios:scenarios.map(s=>({revision:s.review.revision,candidate:s.review.candidateId,rationale:s.review.rationale})),humanAndAgentComparison:state.log.some(l=>l.actor==='human'&&l.name==='compare-quotes')&&state.log.some(l=>l.actor==='agent'&&l.name==='compare-quotes')},null,2));
