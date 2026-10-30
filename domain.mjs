export const money = cents => cents === null || cents === undefined ? 'Not quoted' :
  new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);

export function parseCents(text) {
  const m=/^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(String(text).trim());
  if(!m) throw new Error('Use a non-negative amount with at most two decimal places.');
  const result=Number(m[1])*100+Number((m[2]??'').padEnd(2,'0'));
  if(!Number.isSafeInteger(result)) throw new Error('Amount is too large.');
  return result;
}

export function parseQuote(quote) {
  const lines=quote.text.split(/\r?\n/).map((text,index)=>({id:quote.id+':'+(index+1),number:index+1,text}));
  const field=(label,pattern,convert=x=>x)=> {
    const line=lines.find(x=>x.text.toLowerCase().startsWith(label.toLowerCase()+':'));
    const match=line?.text.match(pattern);
    let value=null;
    if(match) try{value=convert(match[1]);}catch{}
    return {value,sourceId:line?.id??null,quoteId:quote.id};
  };
  return {
    ...quote,lines,
    facts:{
      quantity:field('Quantity',/^Quantity:\s*(\d+)$/i,x=>{const n=Number(x);if(!Number.isSafeInteger(n)||n<1||n>100000)throw new Error('Invalid quantity');return n;}),
      unit:field('Unit price',/^Unit price:\s*USD\s+(\d+(?:\.\d{1,2})?)$/i,parseCents),
      setup:field('Setup',/^Setup:\s*USD\s+(\d+(?:\.\d{1,2})?)$/i,parseCents),
      shipping:field('Shipping',/^Shipping:\s*USD\s+(\d+(?:\.\d{1,2})?)$/i,parseCents),
      tax:field('Tax',/^Tax:\s*(included)$/i,()=>true),
      delivery:field('Delivery',/^Delivery:\s*(\d{4}-\d{2}-\d{2})$/i,x=>{
        if(new Date(x+'T00:00:00Z').toISOString().slice(0,10)!==x)throw new Error('Invalid date');
        return x;
      }),
      recycled:field('Recycled content',/^Recycled content:\s*(\d{1,3})%$/i,x=>{
        const n=Number(x);if(n>100)throw new Error('Invalid percentage');return n;
      })
    }
  };
}

export function compareQuotes(quotes,brief) {
  const rows=quotes.map(raw=>{
    const q=parseQuote(raw),f=q.facts;
    const unknown=Object.entries(f).filter(([,v])=>v.value===null).map(([k])=>k);
    const product=f.unit.value!==null&&f.quantity.value!==null?f.unit.value*f.quantity.value:null;
    const subtotal=product!==null&&f.setup.value!==null?product+f.setup.value:null;
    const total=subtotal!==null&&f.shipping.value!==null&&f.tax.value===true?subtotal+f.shipping.value:null;
    const failures=[];
    if(f.quantity.value!==null&&f.quantity.value!==brief.quantity)failures.push('quantity');
    if(f.delivery.value!==null&&f.delivery.value>brief.deliveryBy)failures.push('delivery');
    if(total!==null&&total>brief.budgetCents)failures.push('budget');
    if(f.recycled.value!==null&&f.recycled.value<brief.minimumRecycled)failures.push('recycled');
    const complete=unknown.length===0;
    return {...q,subtotal,total,unknown,failures,eligible:complete&&failures.length===0,
      status:failures.length?'outside_brief':complete?'meets_brief':'needs_answer',
      totalSources:[f.quantity.sourceId,f.unit.sourceId,f.setup.sourceId,f.shipping.sourceId,f.tax.sourceId].filter(Boolean)};
  });
  const eligible=rows.filter(x=>x.eligible).sort((a,b)=>{
    if(brief.priority==='earliest_delivery')return a.facts.delivery.value.localeCompare(b.facts.delivery.value)||a.total-b.total;
    if(brief.priority==='most_recycled')return b.facts.recycled.value-a.facts.recycled.value||a.total-b.total;
    return a.total-b.total;
  });
  return {currency:'USD',rows,eligibleIds:eligible.map(x=>x.id),preferredId:eligible[0]?.id??null,
    missingCount:rows.reduce((n,x)=>n+x.unknown.length,0)};
}

export function sourceById(quotes,id) {
  if(!/^[a-z]+:[1-9]\d*$/.test(id))throw new Error('Unknown source reference.');
  const [quoteId,lineText]=id.split(':');
  const quote=quotes.find(x=>x.id===quoteId);
  const number=Number(lineText);
  if(!quote||!Number.isInteger(number)||number<1)throw new Error('Unknown source reference.');
  const text=quote.text.split(/\r?\n/)[number-1];
  if(text===undefined)throw new Error('Unknown source reference.');
  return {id,quoteId,number,text,quoteName:quote.name};
}
