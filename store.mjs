import {PGlite} from '@electric-sql/pglite';
import {randomUUID,createHash} from 'node:crypto';
import {initialBrief,sampleQuotes} from './data/quotes.mjs';
import {compareQuotes} from './domain.mjs';

export const digest=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
export async function createStore(directory) {
  const db=new PGlite(directory);
  await db.exec('CREATE TABLE IF NOT EXISTS qc_workspace(id integer PRIMARY KEY, revision integer NOT NULL, brief jsonb NOT NULL); CREATE TABLE IF NOT EXISTS qc_quotes(id text PRIMARY KEY, data jsonb NOT NULL); CREATE TABLE IF NOT EXISTS qc_reviews(id text PRIMARY KEY, revision integer NOT NULL, data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()); CREATE TABLE IF NOT EXISTS qc_log(id text PRIMARY KEY, at timestamptz NOT NULL DEFAULT now(), data jsonb NOT NULL);');
  const existing=await db.query('SELECT id FROM qc_workspace WHERE id=1');
  if(!existing.rows.length) {
    await db.query('INSERT INTO qc_workspace(id,revision,brief) VALUES(1,1,$1)',[initialBrief]);
    for(const q of sampleQuotes)await db.query('INSERT INTO qc_quotes(id,data) VALUES($1,$2)',[q.id,q]);
  }
  let listener=()=>{};
  const store={
    db,setListener(fn){listener=fn;},
    async emit(){listener(await store.snapshot());},
    async snapshot(){
      const w=(await db.query('SELECT revision,brief FROM qc_workspace WHERE id=1')).rows[0];
      const quotes=(await db.query('SELECT data FROM qc_quotes ORDER BY id')).rows.map(x=>x.data);
      const reviews=(await db.query('SELECT data FROM qc_reviews ORDER BY created_at DESC LIMIT 12')).rows.map(x=>x.data);
      const log=(await db.query('SELECT at,data FROM qc_log ORDER BY at DESC LIMIT 60')).rows.map(x=>({...x.data,at:new Date(x.at).toISOString()}));
      return {revision:w.revision,brief:w.brief,quotes,comparison:compareQuotes(quotes,w.brief),reviews,log,currency:'USD',fictionalData:true};
    },
    async updateBrief(brief,expectedRevision) {
      const result=await db.query('UPDATE qc_workspace SET revision=revision+1,brief=$1 WHERE id=1 AND revision=$2 RETURNING revision',[brief,expectedRevision]);
      if(!result.rows.length)throw new Error('The brief changed. Reload before saving.');
      return store.snapshot();
    },
    async updateQuote(id,text,expectedRevision) {
      return db.transaction(async tx=>{
        const result=await tx.query('UPDATE qc_workspace SET revision=revision+1 WHERE id=1 AND revision=$1 RETURNING revision',[expectedRevision]);
        if(!result.rows.length)throw new Error('The brief changed. Reload before saving.');
        const old=(await tx.query('SELECT data FROM qc_quotes WHERE id=$1',[id])).rows[0];
        if(!old)throw new Error('Unknown quote.');
        await tx.query('UPDATE qc_quotes SET data=$1 WHERE id=$2',[{...old.data,text},id]);
        return {revision:result.rows[0].revision};
      });
    },
    async saveReview(review) {
      return db.transaction(async tx=>{
        const w=(await tx.query('SELECT revision FROM qc_workspace WHERE id=1 FOR UPDATE')).rows[0];
        if(w.revision!==review.revision)throw new Error('The brief changed during this review. Run a fresh review.');
        const row={id:randomUUID(),createdAt:new Date().toISOString(),...review};
        await tx.query('INSERT INTO qc_reviews(id,revision,data) VALUES($1,$2,$3)',[row.id,row.revision,row]);
        return row;
      });
    },
    async log(entry) {
      await db.query('INSERT INTO qc_log(id,data) VALUES($1,$2)',[randomUUID(),entry]);
    },
    async close(){await db.close();}
  };
  return store;
}
