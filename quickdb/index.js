'use strict';
const fs=require('fs'),path=require('path');
const DB_PATH=path.join(process.cwd(),'quickdb.json');
let _cache=null;
function load(){if(_cache!==null)return _cache;try{_cache=JSON.parse(fs.readFileSync(DB_PATH,'utf8'));}catch{_cache={};}return _cache;}
function save(d){_cache=d;fs.writeFileSync(DB_PATH,JSON.stringify(d,null,2),'utf8');}
function getPath(obj,kp){const keys=String(kp).split('.');let c=obj;for(const k of keys){if(c===null||c===undefined)return null;c=c[k];}return c===undefined?null:c;}
function setPath(obj,kp,v){const keys=String(kp).split('.');let c=obj;for(let i=0;i<keys.length-1;i++){const k=keys[i];if(c[k]===null||c[k]===undefined||typeof c[k]!=='object')c[k]={};c=c[k];}c[keys[keys.length-1]]=v;}
function delPath(obj,kp){const keys=String(kp).split('.');let c=obj;for(let i=0;i<keys.length-1;i++){if(!c[keys[i]])return;c=c[keys[i]];}delete c[keys[keys.length-1]];}
const db={
  get(k){return getPath(load(),k);},
  set(k,v){const d=load();setPath(d,k,v);save(d);return v;},
  delete(k){const d=load();delPath(d,k);save(d);},
  push(k,v){const d=load();let a=getPath(d,k);if(!Array.isArray(a))a=[];a.push(v);setPath(d,k,a);save(d);return a;},
  has(k){return getPath(load(),k)!==null;},
  all(){return load();},
};
module.exports=db;
