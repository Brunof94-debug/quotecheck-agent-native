import http from 'node:http';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {mkdir,readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createStore} from './store.mjs';
import {createActions} from './actions.mjs';
import {createReviewer} from './agent.mjs';
const port=Number(process.env.PORT??4364),host='127.0.0.1',origin='http://'+host+':'+port;
const dbPath=resolve('.runtime/workspace');
await mkdir(resolve('.runtime'),{recursive:true});
const store=await createStore(dbPath);
const native=createActions(store);
const sessions=new Map(),streams=new Set();
let job=null;
function broadcast(type,value){for(const res of streams)res.write('event: '+type+'\ndata: '+JSON.stringify(value)+'\n\n');}
store.setListener(s=>broadcast('state',s));
const reviewer=createReviewer({store,...native,endpoint:process.env.MODEL_URL,onProgress:j=>{job=j;broadcast('job',j);}});
const json=(res,status,value)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(value));};
const cookie=req=>(req.headers.cookie??'').split(';').map(x=>x.trim()).find(x=>x.startsWith('qc_session='))?.slice(11);
const getSession=req=>sessions.get(cookie(req));
function protect(req){
  if(req.headers.origin!==origin)throw new Error('Open QuoteCheck from its local address before making changes.');
  const session=getSession(req),supplied=req.headers['x-quotecheck-token'];
  if(!session||typeof supplied!=='string'||supplied.length!==session.token.length||!timingSafeEqual(Buffer.from(supplied),Buffer.from(session.token)))throw new Error('Your local session expired. Reload the page.');
}
async function body(req){let data='';for await(const chunk of req){data+=chunk;if(Buffer.byteLength(data)>24000)throw new Error('Request is too large.');}try{return JSON.parse(data||'{}');}catch{throw new Error('Invalid JSON.');}}
let vite=null;
const server=http.createServer(async(req,res)=>{
  try{
    if(req.headers.host!==host+':'+port){res.writeHead(403);return res.end('Use '+origin);}
    const url=new URL(req.url,origin);
    if(url.pathname==='/api/health')return json(res,200,{ok:true,mode:'local',framework:'@agent-native/core',version:'0.222.2'});
    if(url.pathname==='/api/session'&&req.method==='GET'){
      let s=getSession(req);
      if(!s){const id=randomBytes(24).toString('hex');s={token:randomBytes(24).toString('hex')};sessions.set(id,s);res.setHeader('set-cookie','qc_session='+id+'; HttpOnly; SameSite=Strict; Path=/');}
      return json(res,200,{token:s.token,mode:'local'});
    }
    if(url.pathname==='/api/events'&&req.method==='GET'){
      if(!getSession(req))return json(res,403,{error:'Reload to start a local session.'});
      res.writeHead(200,{'content-type':'text/event-stream','cache-control':'no-store','connection':'keep-alive','x-accel-buffering':'no'});
      streams.add(res);res.write('event: state\ndata: '+JSON.stringify(await store.snapshot())+'\n\n');
      if(job)res.write('event: job\ndata: '+JSON.stringify(job)+'\n\n');
      req.on('close',()=>streams.delete(res));return;
    }
    if(url.pathname==='/api/agent'&&req.method==='POST'){
      protect(req);const input=await body(req);
      if(typeof input.focus!=='string'||input.focus.length>300)throw new Error('Keep your review focus under 300 characters.');
      const result=await reviewer.run(input.focus);
      return json(res,202,result.job);
    }
    if(url.pathname.startsWith('/actions/')&&req.method==='POST'){
      protect(req);return json(res,200,await native.invoke(decodeURIComponent(url.pathname.slice(9)),await body(req),'human'));
    }
    if(url.pathname==='/api/model-health'){
      if(!getSession(req))return json(res,403,{error:'Reload to start a local session.'});
      try{const r=await fetch((process.env.MODEL_URL??'http://127.0.0.1:4365')+'/health',{signal:AbortSignal.timeout(2000)});return json(res,200,{ready:r.ok});}catch{return json(res,200,{ready:false});}
    }
    if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/actions/'))return json(res,404,{error:'Unknown operation.'});
    if(vite)return vite.middlewares(req,res,()=>{res.writeHead(404);res.end('Not found');});
    const file=resolve('dist','.'+decodeURIComponent(url.pathname));
    const root=resolve('dist')+sep;
    const chosen=url.pathname==='/'?resolve('dist/index.html'):file;
    if(!chosen.startsWith(root))throw new Error('Invalid path.');
    const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
    res.writeHead(200,{'content-type':mime[extname(chosen)]??'application/octet-stream'});res.end(await readFile(chosen));
  }catch(error){if(!res.headersSent)json(res,400,{error:String(error.message).slice(0,500)});else res.end();}
});
if(process.env.NODE_ENV!=='production'){
  const {createServer}=await import('vite');
  vite=await createServer({server:{middlewareMode:true,hmr:{server}},appType:'spa'});
}
server.listen(port,host,()=>console.log('QuoteCheck ready: '+origin));
async function shutdown(){for(const r of streams)r.end();await vite?.close();server.close();await store.close();process.exit(0);}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
