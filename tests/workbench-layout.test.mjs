import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';

function createStorage(){
 const values=new Map();
 return {
  getItem:key=>values.has(key)?values.get(key):null,
  setItem:(key,value)=>values.set(key,String(value)),
  removeItem:key=>values.delete(key),
  clear:()=>values.clear(),
 };
}

test('工作台单页同时显示打样和对样模块，并按进度与超时成对排列',async()=>{
 globalThis.localStorage=createStorage();
 const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'silent'});
 try{
  const {default:Workbench}=await server.ssrLoadModule('/src/Workbench.tsx');
  const html=renderToStaticMarkup(React.createElement(Workbench,{
   currentTeam:'甲班',
   formulaAuditCount:12,
   onNavigate:()=>{},
   onOpenPage:()=>{},
  }));

  assert.doesNotMatch(html,/ant-tabs-nav|role="tab"/);
  const headings=['打样进度','回修超时','班组对样进度','半检超时'];
  const positions=headings.map(heading=>html.indexOf(`>${heading}</h2>`));
  assert.ok(positions.every(position=>position>=0),`缺少业务模块：${headings.filter((_,index)=>positions[index]<0).join('、')}`);
  assert.deepEqual([...positions].sort((a,b)=>a-b),positions);
  assert.equal((html.match(/role="combobox"/g)??[]).length,1);
  assert.doesNotMatch(html,/aria-label="对样统计班组"/);
  assert.match(html,/aria-label="甲班班组各环节对样进度"/);
  assert.match(html,/aria-label="甲班半检超时流程卡"/);
 }finally{
  await server.close();
  delete globalThis.localStorage;
 }
});
