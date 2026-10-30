import {mkdir,readdir,copyFile,writeFile,unlink} from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';
const dest=resolve('docs');
const assetDir=resolve(dest,'assets');
await mkdir(assetDir,{recursive:true});
for(const entry of await readdir(assetDir,{withFileTypes:true})){
  const path=resolve(assetDir,entry.name);
  if(path.startsWith(assetDir+sep)&&entry.isFile()&&/^index-[\w-]+\.(css|js)$/.test(entry.name))await unlink(path);
}
async function copy(from,to){
  await mkdir(to,{recursive:true});
  for(const e of await readdir(from,{withFileTypes:true})){
    if(e.isDirectory())await copy(join(from,e.name),join(to,e.name));else await copyFile(join(from,e.name),join(to,e.name));
  }
}
await copy(resolve('dist'),dest);
await writeFile(join(dest,'.nojekyll'),'');
console.log('Static sample packaged in docs for GitHub Pages. Architecture and project documents preserved.');
