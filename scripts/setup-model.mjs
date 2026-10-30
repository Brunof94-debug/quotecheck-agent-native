import {mkdir,readFile,writeFile,createReadStream,createWriteStream} from 'node:fs';
import {promisify} from 'node:util';
import {pipeline} from 'node:stream/promises';
import {Readable} from 'node:stream';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const mk=promisify(mkdir),read=promisify(readFile),write=promisify(writeFile);
const root=new URL('../.runtime/',import.meta.url);
await mk(root,{recursive:true});
async function sha(file){const h=createHash('sha256');for await(const chunk of createReadStream(file))h.update(chunk);return h.digest('hex');}
async function download(url,file,expected){
  try{if(await sha(file)===expected)return;}catch{}
  console.log('Downloading '+new URL(url).pathname.split('/').pop());
  const r=await fetch(url);if(!r.ok)throw new Error('Download HTTP '+r.status);
  await pipeline(Readable.fromWeb(r.body),createWriteStream(file));
  if(await sha(file)!==expected)throw new Error('Checksum mismatch for '+file);
}
const release=await fetch('https://api.github.com/repos/ggml-org/llama.cpp/releases/tags/b11960').then(r=>r.json());
const asset=release.assets.find(a=>a.name==='llama-b11960-bin-win-cpu-x64.zip');
if(!asset?.digest?.startsWith('sha256:'))throw new Error('Official release checksum unavailable.');
const revision='a06e946bb6b655725eafa393f4a9745d460374c9';
const modelRepo='unsloth/Qwen3-4B-Instruct-2507-GGUF';
const meta=await fetch('https://huggingface.co/api/models/'+modelRepo+'/revision/'+revision+'?blobs=true').then(r=>r.json());
const model=meta.siblings.find(s=>s.rfilename==='Qwen3-4B-Instruct-2507-Q4_K_M.gguf');
const modelUrl='https://huggingface.co/'+modelRepo+'/resolve/'+revision+'/'+model.rfilename;
const {fileURLToPath}=await import('node:url');
const zip=fileURLToPath(new URL('llama.zip',root)),modelPath=fileURLToPath(new URL(model.rfilename,root)),bin=fileURLToPath(new URL('llama',root));
await Promise.all([download(asset.browser_download_url,zip,asset.digest.slice(7)),download(modelUrl,modelPath,model.lfs.sha256)]);
execFileSync('powershell',['-NoProfile','-Command','Expand-Archive -LiteralPath "'+zip+'" -DestinationPath "'+bin+'" -Force'],{windowsHide:true});
await write(new URL('model-release.json',root),JSON.stringify({model:'Qwen3-4B-Instruct-2507-Q4_K_M',revision,modelUrl,modelSha256:model.lfs.sha256,serverRelease:release.tag_name,serverUrl:asset.browser_download_url,serverSha256:asset.digest.slice(7)},null,2)+'\n');
console.log('Local model ready. Checksums match official release metadata.');
