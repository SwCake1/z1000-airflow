import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const canvas=document.getElementById('canvas'),loading=document.getElementById('loading');
const scene=new THREE.Scene();scene.background=new THREE.Color('#e7ebeb');
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.AgXToneMapping;renderer.toneMappingExposure=1.05;canvas.append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(34,1,.01,100);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=.5;controls.maxDistance=7;controls.maxPolarAngle=Math.PI*.53;controls.autoRotateSpeed=.7;
scene.add(new THREE.HemisphereLight(0xf5f8ff,0x929b93,2.4));
for(const [position,power] of [[[2,4,4],2.6],[[-3,3,-2],2]]){const light=new THREE.DirectionalLight(0xffffff,power);light.position.set(...position);scene.add(light);}
const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:0xe1e6e5,roughness:1}));floor.rotation.x=-Math.PI/2;scene.add(floor);
const views={overview:[3,1.9,4.2],left:[0,1.1,-4.5],right:[0,1.1,4.5],rear:[-4,1.7,1.2]};
let center=new THREE.Vector3(0,.65,0),model=null;
function setView(name){camera.position.copy(center).add(new THREE.Vector3(...views[name]));controls.target.copy(center);controls.update();document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));}
setView('overview');
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
document.getElementById('rotate').onchange=e=>{controls.autoRotate=e.target.checked;};
new GLTFLoader().load('./models/v2/kawasaki-z1000-2008-refined.glb?v=plate-blurred-v1',gltf=>{
 model=gltf.scene;scene.add(model);const bounds=new THREE.Box3().setFromObject(model);center=bounds.getCenter(new THREE.Vector3());floor.position.y=bounds.min.y-.01;setView('overview');loading.classList.add('hidden');
},event=>{if(event.total)loading.textContent=`Загружаю модель · ${Math.round(100*event.loaded/event.total)}%`;},error=>{loading.textContent='Не удалось загрузить модель. Попробуй обновить страницу.';console.error(error);});
new ResizeObserver(()=>{const {width,height}=canvas.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();}).observe(canvas);
let previous=performance.now();function frame(now){requestAnimationFrame(frame);controls.update(Math.min((now-previous)/1000,.1));previous=now;renderer.render(scene,camera);}requestAnimationFrame(frame);
window.motorcycleViewer={scene,controls,getState:()=>({loaded:!!model,autoRotate:controls.autoRotate})};
