import {copyFile, mkdir, readFile, rm, stat, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const output=join(root,'dist');
const speeds=[30,40,50,60,70,80];
// Only this explicit list is published. Never copy the project directory wholesale.
const files=[
 'index.html','motorcycle.html','model-viewer.js','simulation/project.css','THIRD_PARTY_NOTICES.md',
 'models/v2/kawasaki-z1000-2008-refined.glb',
 'models/v2/kawasaki-z1000-2008-refined.usdz',
 'models/v2/model-specifications-v2.json',
 'simulation/index.html','simulation/app.js','simulation/style.css',
 'simulation/scene-parameters.json','simulation/README.txt',
 'simulation/assets/riding.glb','simulation/z1000-two-riders.usdz',
 'simulation/assets/makehuman/LICENSE.ASSETS.md',
 'simulation/results/index.json',
 ...speeds.flatMap(speed=>['with','rack','without'].map(kind=>`simulation/results/${speed}_${kind}.json`)),
 ...['LICENSE','build/three.module.js','build/three.core.js',
     'examples/jsm/controls/OrbitControls.js','examples/jsm/loaders/GLTFLoader.js',
     'examples/jsm/utils/BufferGeometryUtils.js','examples/jsm/utils/SkeletonUtils.js']
    .map(file=>`simulation/node_modules/three/${file}`),
];
const index=JSON.parse(await readFile(join(root,'simulation/results/index.json'),'utf8'));
for(const speed of speeds)for(const kind of ['with','rack','without']){
 const key=`${speed}_${kind}`;
 if(index.scenarios[key]?.status!=='ready')throw Error(`Scenario ${key} is not ready`);
 const data=JSON.parse(await readFile(join(root,`simulation/results/${key}.json`),'utf8'));
 if(data.case!==key||!data.convergence.passed||!Number.isFinite(data.lumbar_mean_fraction))throw Error(`Invalid result: ${key}`);
}
let total=0;
for(const file of files){
 const info=await stat(join(root,file));
 if(!info.isFile())throw Error(`Expected file: ${file}`);
 if(info.size>=100*1024*1024)throw Error(`File exceeds GitHub limit: ${file}`);
 total+=info.size;
}
if(total>=1024**3)throw Error('Site exceeds the GitHub Pages 1 GiB limit');
await rm(output,{recursive:true,force:true});
for(const file of files){const target=join(output,file);await mkdir(dirname(target),{recursive:true});await copyFile(join(root,file),target);}
// Ready results are immutable for this publication; no local job bookkeeping is needed.
const publicIndex={model_revision:index.model_revision,scenarios:index.scenarios};
for(const scenario of Object.values(publicIndex.scenarios))scenario.file=scenario.file.replace(/^\/+/, '');
await writeFile(join(output,'simulation/results/index.json'),JSON.stringify(publicIndex,null,2)+'\n');
await writeFile(join(output,'.nojekyll'),'');
console.log(`Built ${files.length} files, ${(total/1024/1024).toFixed(1)} MiB, all 18 scenarios ready.`);
