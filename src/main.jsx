import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {initialBrief,sampleQuotes} from '../data/quotes.mjs';
import {compareQuotes,money,parseCents} from '../domain.mjs';
import './style.css';

const labels={quantity:'Quantity',unit:'Unit price',setup:'Setup',shipping:'Freight',tax:'Tax',delivery:'Delivery',recycled:'Recycled content',budget:'Budget'};
const statusText={meets_brief:'Meets brief',needs_answer:'Needs an answer',outside_brief:'Outside brief'};
const date=x=>new Date(x+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
const Icon=({name,size=20})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{({
  check:<path d="m5 12 4 4 10-10"/>,compare:<><path d="M4 5h16v14H4zM10 5v14M16 5v14M4 10h16"/></>,
  source:<><path d="M7 3h8l4 4v14H5V3h2M14 3v5h5M9 12h6M9 16h6"/></>,
  history:<><path d="M4 5v5h5M4 10a8 8 0 1 1 1 8M12 7v5l3 2"/></>,
  arrow:<path d="M5 12h14m-5-5 5 5-5 5"/>,close:<path d="m6 6 12 12M18 6 6 18"/>,
  download:<><path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4"/></>,
  spark:<><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/></>,
  link:<><path d="m10 13 4-4M8 15l-2 2a3 3 0 0 1-4-4l5-5a3 3 0 0 1 4 0M13 9l2-2a3 3 0 0 1 4 4l-5 5a3 3 0 0 1-4 0"/></>,
  edit:<><path d="m14 5 5 5M4 20l4-1L20 7a2 2 0 0 0-5-3L4 16z"/></>,
  info:<><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.1"/></>
})[name]}</svg>;
const initialState=()=>({revision:1,brief:{...initialBrief},quotes:sampleQuotes,comparison:compareQuotes(sampleQuotes,initialBrief),reviews:[],log:[],fictionalData:true,currency:'USD'});

function App(){
  const [state,setState]=useState(initialState),[mode,setMode]=useState('loading'),[token,setToken]=useState(''),[tab,setTab]=useState('compare');
  const [brief,setBrief]=useState(initialBrief),[budget,setBudget]=useState('2800.00'),[briefOpen,setBriefOpen]=useState(false);
  const [source,setSource]=useState(null),[sourceEdit,setSourceEdit]=useState(false),[sourceText,setSourceText]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[job,setJob]=useState(null),[focus,setFocus]=useState('');
  const [modelReady,setModelReady]=useState(false),[recorded,setRecorded]=useState(null),[example,setExample]=useState(false);
  const stream=useRef(null),closeRef=useRef(null);
  useEffect(()=>{if(mode==='local')document.title='QuoteCheck LOCAL DEMO — Live review';else if(mode==='sample')document.title='QuoteCheck — Interactive sample';},[mode]);
  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      try{
        if(!['127.0.0.1','localhost'].includes(location.hostname))throw new Error('sample');
        const health=await fetch('/api/health',{signal:AbortSignal.timeout(2500)});if(!health.ok)throw new Error('sample');
        const session=await fetch('/api/session').then(r=>r.json());if(cancelled)return;setToken(session.token);setMode('local');
        const r=await fetch('/actions/get-workspace',{method:'POST',headers:{'content-type':'application/json','x-quotecheck-token':session.token},body:'{}'}).then(r=>r.json());
        if(r.error)throw new Error(r.error);if(cancelled)return;setState(r);
        await fetch('/actions/compare-quotes',{method:'POST',headers:{'content-type':'application/json','x-quotecheck-token':session.token},body:'{}'});
        const events=new EventSource('/api/events');stream.current=events;
        events.addEventListener('state',e=>{if(!cancelled)setState(JSON.parse(e.data));});
        events.addEventListener('job',e=>{if(!cancelled)setJob(JSON.parse(e.data));});
        events.onerror=()=>{if(!cancelled)setNotice('Reconnecting to the local workspace…');};
        events.onopen=()=>{if(!cancelled)setNotice('');};
        const m=await fetch('/api/model-health').then(r=>r.json());if(!cancelled)setModelReady(m.ready);
      }catch(e){if(!cancelled){setMode('sample');if(e.message!=='sample')setNotice('The local server is unavailable. You can explore the sample workspace.');}}
      try{const r=await fetch('./evidence/recorded-review.json');if(r.ok){const x=await r.json();if(!cancelled)setRecorded(x);}}catch{}
    })();
    return()=>{cancelled=true;stream.current?.close();};
  },[]);
  useEffect(()=>{if(source||briefOpen||example){const previous=document.activeElement;closeRef.current?.focus();const key=e=>{if(e.key==='Escape'){setSource(null);setBriefOpen(false);setExample(false);}if(e.key==='Tab'){const dialog=document.querySelector('[role="dialog"]'),items=[...dialog.querySelectorAll('button:not(:disabled),a[href],input,textarea,select')],first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);previous?.focus();};}},[source,briefOpen,example]);
  async function action(name,input){
    setError('');
    if(mode==='local'){
      const r=await fetch('/actions/'+name,{method:'POST',headers:{'content-type':'application/json','x-quotecheck-token':token},body:JSON.stringify(input)});
      const data=await r.json();if(!r.ok)throw new Error(data.error??'Could not save.');
      if(name==='update-brief'||name==='update-source'){
        await fetch('/actions/compare-quotes',{method:'POST',headers:{'content-type':'application/json','x-quotecheck-token':token},body:'{}'});
      }
      return data;
    }
    if(name==='update-brief'){
      setState(s=>({...s,revision:s.revision+1,brief:input.brief,comparison:compareQuotes(s.quotes,input.brief)}));return;
    }
    if(name==='update-source'){
      setState(s=>{const quotes=s.quotes.map(q=>q.id===input.quoteId?{...q,text:input.text}:q);return {...s,revision:s.revision+1,quotes,comparison:compareQuotes(quotes,s.brief)};});return;
    }
    return state.comparison;
  }
  function openBrief(){setBrief({...state.brief});setBudget((state.brief.budgetCents/100).toFixed(2));setBriefOpen(true);setError('');}
  async function saveBrief(e){e.preventDefault();setBusy(true);try{const b={...brief,budgetCents:parseCents(budget)};await action('update-brief',{expectedRevision:state.revision,brief:b});setBriefOpen(false);setNotice('Brief updated. Previous reviews stay in the history with their original revision.');}catch(e){setError(e.message);}finally{setBusy(false);}}
  async function quickBrief(kind){
    setBusy(true);try{const b={...state.brief,deliveryBy:kind==='earlier'?'2026-11-23':'2026-11-28',budgetCents:kind==='tight'?260000:280000};await action('update-brief',{expectedRevision:state.revision,brief:b});setNotice('Scenario applied. The comparison now uses your revised brief.');}catch(e){setError(e.message);}finally{setBusy(false);}
  }
  async function openSource(id,lineId,archive=false){setError('');try{if(!archive&&mode==='local')await action('inspect-source',{quoteId:id});setSource({id,lineId,archive});setSourceEdit(false);setSourceText((archive?recorded.quotes:state.quotes).find(q=>q.id===id).text);}catch(e){setError(e.message);}}
  async function saveSource(e){e.preventDefault();setBusy(true);try{await action('update-source',{expectedRevision:state.revision,quoteId:source.id,text:sourceText});setSourceEdit(false);setNotice('Source saved. Costs and eligibility have been recalculated.');}catch(e){setError(e.message);}finally{setBusy(false);}}
  async function runReview(){
    setError('');setBusy(true);
    try{const r=await fetch('/api/agent',{method:'POST',headers:{'content-type':'application/json','x-quotecheck-token':token},body:JSON.stringify({focus})});const j=await r.json();if(!r.ok)throw new Error(j.error);setJob(j);setFocus('');}catch(e){setError(e.message);}finally{setBusy(false);}
  }
  function exportMemo(){
    const current=state.reviews.find(r=>r.revision===state.revision),rows=state.comparison.rows;
    const text=['QUOTECHECK — PLANNING MEMO','Fictional sample data · USD · revision '+state.revision,'','BRIEF',state.brief.quantity+' units; max '+money(state.brief.budgetCents)+'; delivery by '+state.brief.deliveryBy+'; recycled content ≥ '+state.brief.minimumRecycled+'%.','','SOURCE-BACKED COMPARISON',...rows.map(q=>q.name+': '+(q.total===null?'Total not quoted; known subtotal '+money(q.subtotal):money(q.total))+'; '+statusText[q.status]+(q.failures.length?' ('+q.failures.map(f=>labels[f]).join(', ')+')':'')),...(current?['','ASSISTANT DRAFT — REVIEW WORDING AGAINST SOURCES',current.rationale,'Citations: '+current.sourceIds.join(', '),current.question?'Unsent question: '+current.question.text:'']:[]),'','This memo does not approve an order or contact a supplier.','Source lines',...rows.flatMap(q=>['',q.name,...q.lines.map(l=>l.id+' '+l.text)])].join('\n');
    const u=URL.createObjectURL(new Blob([text],{type:'text/plain'})),a=document.createElement('a');a.href=u;a.download='quotecheck-revision-'+state.revision+'.txt';a.click();URL.revokeObjectURL(u);setNotice('Planning memo downloaded.');
  }
  const c=state.comparison,review=state.reviews.find(r=>r.revision===state.revision),running=job?.status==='running';
  const pending=c.rows.filter(q=>q.unknown.length);
  const missingNote=pending.length?pending.map(q=>q.name+' still needs '+q.unknown.map(k=>labels[k].toLowerCase()).join(', ')+' confirmed.').join(' ')+' An incomplete offer cannot be ranked as a complete match.':'Every proposal now includes all required source fields. Check the brief before deciding.';
  const selected=source?(source.archive?compareQuotes(recorded.quotes,recorded.brief).rows:c.rows).find(q=>q.id===source.id):null;
  const citation=(q,field)=><button className="cite" title={'Read '+q.name+' source for '+labels[field]} onClick={()=>openSource(q.id,q.facts[field].sourceId)}>L{q.facts[field].sourceId?.split(':')[1]??'—'}<Icon name="link" size={10}/></button>;
  const cell=(q,field)=>{
    const v=q.facts[field].value;
    return <td key={q.id} className={q.failures.includes(field)?'failed':''}><span>{v===null?<span className="unknown">Not quoted</span>:field==='delivery'?date(v):field==='recycled'?v+'%':field==='quantity'?v.toLocaleString('en-US'):field==='tax'?'Included':money(v)}</span>{citation(q,field)}</td>;
  };
  return <div className="app">
    <aside className="sidebar">
      <a href="#compare" className="brand" onClick={()=>setTab('compare')}><span className="brandmark"><Icon name="check" size={23}/></span>QuoteCheck<span className="branddot">.</span></a>
      <div className="workspace-label">YOUR WORKSPACE</div><div className="workspace"><span className="workspace-icon">L</span><div><strong>{state.brief.title}</strong><small>Sample purchasing brief</small></div></div>
      <nav aria-label="Workspace"><button className={tab==='compare'?'active':''} onClick={()=>setTab('compare')}><Icon name="compare"/>Compare quotes<span>3</span></button><button className={tab==='sources'?'active':''} onClick={()=>setTab('sources')}><Icon name="source"/>Source documents<span>3</span></button><button className={tab==='history'?'active':''} onClick={()=>setTab('history')}><Icon name="history"/>Review history</button></nav>
      <div className="sidebar-bottom"><div className="sample-tag"><span/>Fictional workspace</div><p>Explore a buying decision.<br/>No orders. No suppliers contacted.</p><a href="https://github.com/Brunof94-debug/quotecheck-agent-native" target="_blank" rel="noreferrer">About this project <Icon name="arrow" size={13}/></a></div>
    </aside>
    <div className="body">
      <header className="topbar"><div><span className="breadcrumb">Workspace</span><span className="slash">/</span><strong>{state.brief.title}</strong></div><span className="mode"><span className={'dot '+(mode==='local'?'online':'')}/>{mode==='local'?'Local workspace':mode==='loading'?'Connecting…':'Interactive sample'}</span></header>
      {mode==='sample'&&<div className="sample-banner"><Icon name="info" size={16}/><span>Explore the comparison with fictional quotes. Live assistant reviews run in the local app.</span>{recorded&&<button onClick={()=>setExample(true)}>See a real review <Icon name="arrow" size={13}/></button>}</div>}
      <main>
        <div className="page-heading"><div><div className="eyebrow">A CLEARER BUYING DECISION</div><h1>{tab==='compare'?'See the whole quote.':tab==='sources'?'Every number has a source.':'Keep the reasoning in view.'}</h1><p>{tab==='compare'?'Three proposals. The full cost. The questions worth asking.':tab==='sources'?'Read the original lines behind the comparison.':"Revisit each draft with the brief it was based on."}</p></div><button className="button subtle export" onClick={exportMemo}><Icon name="download" size={17}/>Export memo</button></div>
        {(error||notice)&&<div role={error?'alert':'status'} className={'notice '+(error?'error':'')}><span>{error||notice}</span><button aria-label="Dismiss message" onClick={()=>{setError('');setNotice('');}}><Icon name="close" size={15}/></button></div>}
        <div className="content-grid">
          <section className="workspace-main">
            <div className="brief-card"><div className="brief-top"><span className="section-label"><span className="tiny-square"/>THE PURCHASE BRIEF</span><button onClick={openBrief}><Icon name="edit" size={14}/>Edit brief</button></div><div className="brief-values"><div><small>QUANTITY</small><strong>{state.brief.quantity.toLocaleString('en-US')} <span>boxes</span></strong></div><div><small>MAX. TOTAL</small><strong>{money(state.brief.budgetCents)}</strong></div><div><small>NEEDED BY</small><strong>{date(state.brief.deliveryBy)}<span>, 2026</span></strong></div><div><small>RECYCLED</small><strong>≥ {state.brief.minimumRecycled}%</strong></div></div><div className="brief-footer"><span>Priority: <strong>{{lowest_total:'lowest complete total',earliest_delivery:'earliest delivery',most_recycled:'most recycled content'}[state.brief.priority]}</strong></span><span className="revision">Revision {state.revision}</span></div></div>
            {tab==='compare'&&<>
              <div className="comparison-heading"><h2>Quote comparison <span>03</span></h2><span>All amounts in USD</span></div>
              <div className="table-wrap"><table className="comparison"><thead><tr><th scope="col"><span className="matrix-label">COMPARE WHAT<br/>MATTERS.</span></th>{c.rows.map(q=><th key={q.id} scope="col"><div className={'supplier-mark '+q.accent}>{q.short}</div><strong>{q.name}</strong><small>{q.reference}</small><span className={'status '+q.status}><span/>{statusText[q.status]}</span></th>)}</tr></thead><tbody>
                <tr><th scope="row">Quantity</th>{c.rows.map(q=>cell(q,'quantity'))}</tr>
                <tr><th scope="row">Unit price</th>{c.rows.map(q=>cell(q,'unit'))}</tr>
                <tr><th scope="row">Setup</th>{c.rows.map(q=>cell(q,'setup'))}</tr>
                <tr className="freight"><th scope="row">Freight <span className="row-note">The detail that changes the total.</span></th>{c.rows.map(q=>cell(q,'shipping'))}</tr>
                <tr><th scope="row">Tax</th>{c.rows.map(q=>cell(q,'tax'))}</tr>
                <tr className="total-row"><th scope="row">Complete total <small>Quantity × unit + setup + freight</small></th>{c.rows.map(q=><td key={q.id}><strong className={q.total===null?'unknown':''}>{q.total===null?'Incomplete':money(q.total)}</strong><small>{q.total===null?money(q.subtotal)+' before freight':q.total>state.brief.budgetCents?money(q.total-state.brief.budgetCents)+' over budget':money(state.brief.budgetCents-q.total)+' within budget'}</small></td>)}</tr>
                <tr><th scope="row">Delivery</th>{c.rows.map(q=>cell(q,'delivery'))}</tr>
                <tr><th scope="row">Recycled content</th>{c.rows.map(q=>cell(q,'recycled'))}</tr>
                <tr className="source-row"><th scope="row">Original proposal</th>{c.rows.map(q=><td key={q.id}><button onClick={()=>openSource(q.id)}><Icon name="source" size={14}/>Read source <Icon name="arrow" size={13}/></button></td>)}</tr>
              </tbody></table></div>
              <div className="finding"><span className="finding-symbol">!</span><div><strong>{c.missingCount?'A low unit price is only part of the picture.':'The complete costs are ready to compare.'}</strong><p>{missingNote}</p></div></div>
              <div className="try-card"><div><span className="eyebrow">WHAT IF THE BRIEF CHANGES?</span><p>Try a tighter deadline or a smaller budget.</p></div><div className="scenario-buttons"><button disabled={busy} onClick={()=>quickBrief('earlier')}>Need it by Nov 23</button><button disabled={busy} onClick={()=>quickBrief('tight')}>Budget: $2,600</button><button disabled={busy} className="reset" onClick={()=>quickBrief('reset')}>Reset</button></div></div>
              <div className="method-note"><Icon name="check" size={14}/><span>Calculated in integer cents. Missing charges stay unknown. Source text is never an instruction to the assistant.</span></div>
            </>}
            {tab==='sources'&&<div className="sources-grid">{c.rows.map(q=><article className="source-card" key={q.id}><div className={'supplier-mark '+q.accent}>{q.short}</div><h2>{q.name}</h2><span className={'status '+q.status}>{statusText[q.status]}</span><p>{q.lines.length} source lines · {q.reference}</p><pre>{q.lines.slice(0,6).map(l=>l.text).join('\n')}…</pre><button className="button" onClick={()=>openSource(q.id)}>Open source <Icon name="arrow" size={16}/></button></article>)}</div>}
            {tab==='history'&&<div className="history-list">{state.reviews.length?state.reviews.map(r=><article className="history-card" key={r.id}><div className="history-meta"><span className={'status '+(r.revision===state.revision?'meets_brief':'needs_answer')}>{r.revision===state.revision?'Current brief':'Earlier brief'}</span><small>Revision {r.revision} · {new Date(r.createdAt).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</small></div><h2>{r.candidateId?state.quotes.find(q=>q.id===r.candidateId)?.name:'No complete match'}</h2><p>{r.rationale}</p><div className="source-chips">{r.sourceIds.map(id=><span key={id}>{id}</span>)}</div><small className="draft-label">Assistant draft · wording requires human review</small></article>):<div className="empty-state"><Icon name="history" size={32}/><h2>Your decisions deserve a trail.</h2><p>Run a review to keep its recommendation, source references and brief revision here.</p>{mode==='sample'&&recorded&&<button className="button" onClick={()=>setExample(true)}>See a real recorded review</button>}</div>}
              <div className="activity"><h2>Shared action log</h2><p>Human interface and assistant use the same validated actions in the local app.</p>{state.log.length?<div>{state.log.slice(0,16).map((l,i)=><div className="activity-row" key={i}><span className={'actor '+l.actor}>{l.actor}</span><code>{l.name}</code><span className={l.status==='error'?'log-error':''}>{l.status}</span><small>{l.durationMs??0} ms</small></div>)}</div>:<p className="muted">The public sample runs in your browser. Live action logs are available in the local app and recorded evidence.</p>}</div>
            </div>}
          </section>
          <aside className="assistant">
            <div className="assistant-head"><span className="assistant-mark"><Icon name="spark" size={18}/></span><div><h2>A second look.</h2><span>YOUR REVIEW ASSISTANT</span></div><span className={'dot '+(mode==='local'&&modelReady?'online':'')}/></div>
            <div className="assistant-intro"><p>Check the whole offer before choosing the lowest number.</p><div className="check-list"><span><Icon name="check" size={14}/>Compare complete costs</span><span><Icon name="check" size={14}/>Check every requirement</span><span><Icon name="check" size={14}/>Draft a source-cited next step</span></div></div>
            {running&&<div role="status" className="job"><span className="spinner"/><strong>{job.message}</strong><small>Reading revision {job.revision??state.revision}. You can keep exploring.</small></div>}
            {job?.status==='error'&&<div role="alert" className="review-error">{job.message}<span>Nothing was approved or sent.</span></div>}
            {review?<Review review={review} quotes={c.rows} onSource={openSource}/>:!running&&<div className="assistant-empty"><span className="mini-label">READY WHEN YOU ARE</span><h3>{c.eligibleIds.length?c.eligibleIds.length+' complete '+(c.eligibleIds.length===1?'match':'matches'):'No complete match'}</h3><p>{state.reviews.length?'Your brief has changed. Run a fresh review for this revision.':'The comparison is ready. Ask for a draft recommendation and the question to resolve missing costs.'}</p></div>}
            <div className="assistant-input">{mode==='local'?<><label htmlFor="focus">Anything to focus on? <span>Optional</span></label><textarea id="focus" maxLength={300} value={focus} onChange={e=>setFocus(e.target.value)} placeholder="e.g. Explain the trade-off in plain English." rows="3"/><button className="button primary" disabled={running||busy} onClick={runReview}><Icon name="spark" size={16}/>{running?'Reviewing…':review?'Run a fresh review':'Review these quotes'}{!running&&<Icon name="arrow" size={17}/>}</button><small className="model-state"><span className={'dot '+(modelReady?'online':'')}/>{modelReady?'Local model connected':'Local model may be offline — failures are shown here'}</small></>:<><span className="mini-label">SEE THE ASSISTANT IN ACTION</span><p>The public sample includes live calculations. Run the local app for new model-generated reviews.</p>{recorded?<button className="button primary" onClick={()=>setExample(true)}>Open a real recorded review <Icon name="arrow" size={16}/></button>:<a className="button primary" href="https://github.com/Brunof94-debug/quotecheck-agent-native#run-locally" target="_blank" rel="noreferrer">Run the local app <Icon name="arrow" size={16}/></a>}</>}</div>
            <div className="human-note"><Icon name="info" size={14}/><p>You make the decision. Draft wording needs review. QuoteCheck never places orders or contacts suppliers.</p></div>
          </aside>
        </div>
        <footer><span>QuoteCheck <b>·</b> See the whole quote.</span><span>Original Agent-Native Hackathon project · 2026</span></footer>
      </main>
    </div>
    {source&&selected&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setSource(null);}}><section className="drawer" role="dialog" aria-modal="true" aria-labelledby="source-title"><div className="dialog-heading"><div><span className="eyebrow">ORIGINAL PROPOSAL</span><h2 id="source-title">{selected.name}</h2></div><button ref={closeRef} className="icon-button" aria-label="Close source" onClick={()=>setSource(null)}><Icon name="close"/></button></div><div className="source-meta"><span>{selected.reference} · Fictional sample</span><span>{source.archive?"Recorded revision "+recorded.review.revision:"Revision "+state.revision}</span></div><p className="source-explainer">The comparison reads the labeled fields below. Select a line reference in the table to find the original value.</p>{sourceEdit?<form onSubmit={saveSource}><label htmlFor="source-text">Edit source text</label><textarea className="source-editor" id="source-text" value={sourceText} onChange={e=>setSourceText(e.target.value)} rows="16" maxLength={12000}/><p className="muted">Keep the labeled format. An unsupported or missing value becomes “Not quoted”. Save changes only to this sample workspace.</p>{error&&<p className="inline-error" role="alert">{error}</p>}<div className="dialog-actions"><button type="button" className="button" onClick={()=>setSourceEdit(false)}>Cancel</button><button className="button primary" disabled={busy}>Save source</button></div></form>:<><ol className="source-lines">{selected.lines.map(l=><li key={l.id} className={source.lineId===l.id?'highlight':''}><span>{l.number}</span><code>{l.text}</code></li>)}</ol><div className="source-tip"><Icon name="info" size={16}/><p>Freight is only included in the complete total when an amount is explicitly quoted. An unknown amount stays unknown.</p></div>{!source.archive&&<button className="button" onClick={()=>setSourceEdit(true)}><Icon name="edit" size={15}/>Edit sample source</button>}</>}</section></div>}
    {briefOpen&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setBriefOpen(false);}}><section className="brief-dialog" role="dialog" aria-modal="true" aria-labelledby="brief-title"><div className="dialog-heading"><div><span className="eyebrow">THE PURCHASE BRIEF</span><h2 id="brief-title">What does a good fit look like?</h2></div><button ref={closeRef} className="icon-button" aria-label="Close brief" onClick={()=>setBriefOpen(false)}><Icon name="close"/></button></div><form onSubmit={saveBrief}><label htmlFor="title">Project</label><input id="title" required value={brief.title} maxLength={80} onChange={e=>setBrief({...brief,title:e.target.value})}/><div className="form-grid"><div><label htmlFor="quantity">Quantity</label><input id="quantity" type="number" min="1" max="100000" required value={brief.quantity} onChange={e=>setBrief({...brief,quantity:Number(e.target.value)})}/></div><div><label htmlFor="budget">Maximum total (USD)</label><input id="budget" inputMode="decimal" required value={budget} onChange={e=>setBudget(e.target.value)}/></div><div><label htmlFor="delivery">Delivery by</label><input id="delivery" type="date" required value={brief.deliveryBy} onChange={e=>setBrief({...brief,deliveryBy:e.target.value})}/></div><div><label htmlFor="recycled">Minimum recycled content (%)</label><input id="recycled" type="number" min="0" max="100" required value={brief.minimumRecycled} onChange={e=>setBrief({...brief,minimumRecycled:Number(e.target.value)})}/></div></div><label htmlFor="priority">Among complete matches, prefer</label><select id="priority" value={brief.priority} onChange={e=>setBrief({...brief,priority:e.target.value})}><option value="lowest_total">Lowest complete total</option><option value="earliest_delivery">Earliest delivery</option><option value="most_recycled">Most recycled content</option></select><p className="muted">All requirements must be met. A missing cost never counts as zero. Saving creates a new revision and leaves earlier reviews in the history.</p>{error&&<p className="inline-error" role="alert">{error}</p>}<div className="dialog-actions"><button type="button" className="button" onClick={()=>setBriefOpen(false)}>Cancel</button><button className="button primary" disabled={busy}>Update comparison <Icon name="arrow" size={16}/></button></div></form></section></div>}
    {example&&recorded&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setExample(false);}}><section className="brief-dialog recorded-dialog" role="dialog" aria-modal="true" aria-labelledby="recorded-title"><div className="dialog-heading"><div><span className="eyebrow">ACTUAL LOCAL MODEL EXECUTION</span><h2 id="recorded-title">A real review, kept in context.</h2></div><button ref={closeRef} className="icon-button" aria-label="Close recorded review" onClick={()=>setExample(false)}><Icon name="close"/></button></div><p className="muted">Recorded with fictional sample quotes on {recorded.date}. This is saved evidence, not a new response to your current brief.</p><div className="recorded-brief">{recorded.brief.quantity.toLocaleString('en-US')} units · {money(recorded.brief.budgetCents)} budget · delivery by {date(recorded.brief.deliveryBy)}</div><Review review={recorded.review} quotes={recorded.quotes} onSource={(id,line)=>{setExample(false);openSource(id,line,true);}}/><div className="recorded-trace">{recorded.steps.map((s,i)=><div key={i}><span>{String(i+1).padStart(2,'0')}</span><code>{s.name}</code><small>{s.actor}</small></div>)}</div><p className="muted">Model: {recorded.model}. The same Agent-Native actions validate both human and assistant operations. No fixture or fallback recommendation was used.</p><a href="./evidence/recorded-review.json" target="_blank" rel="noreferrer" className="button">Open the evidence JSON <Icon name="arrow" size={15}/></a></section></div>}
  </div>;
}

function Review({review,quotes,onSource}){
  const selected=quotes.find(q=>q.id===review.candidateId);
  return <div className="review-result"><span className="mini-label">DRAFT · REVISION {review.revision}</span><h3>{selected?'A closer look at '+selected.name:'No complete match yet.'}</h3><p>{review.rationale}</p><div className="source-chips">{review.sourceIds.map(id=><button key={id} onClick={()=>onSource(id.split(':')[0],id)}>{id.split(':')[0]} · L{id.split(':')[1]}</button>)}</div>{review.question&&<div className="question-draft"><span>QUESTION TO ASK <small>NOT SENT</small></span><p>{review.question.text}</p><button onClick={()=>onSource(review.question.quoteId,review.question.sourceId)}>View the missing detail <Icon name="arrow" size={13}/></button></div>}<small className="draft-label">Source-linked draft. Review the wording before using it.</small></div>;
}

createRoot(document.getElementById('root')).render(<App/>);

