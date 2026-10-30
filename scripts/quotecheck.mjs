import {resolve} from 'node:path';
import {createStore} from '../store.mjs';
import {createActions} from '../actions.mjs';
try{const r=await fetch('http://127.0.0.1:4364/api/health',{signal:AbortSignal.timeout(700)});if(r.ok)throw new Error('Close the local app before using the direct CLI; both share one database.');}catch(e){if(e.message.startsWith('Close'))throw e;}
const [name='compare-quotes',quoteId]=process.argv.slice(2);
if(!['compare-quotes','get-workspace','inspect-source'].includes(name))throw new Error('Use compare-quotes, get-workspace, or inspect-source <id>.');
const store=await createStore(resolve('.runtime/workspace'));
try{const {invoke}=createActions(store);console.log(JSON.stringify(await invoke(name,name==='inspect-source'?{quoteId}:{},'cli'),null,2));}finally{await store.close();}
