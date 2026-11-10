import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';

const record={
 key:'p3',order:'项发666',colorNo:'hong',product:'短纤与棉',color:'浅红',hex:'#ca567d',depth:'浅色',ratio:6,
 created:'2026-10-28 15:55',due:'2026-11-09 16:46',worker:'沈锋',formula:'',status:'进行中',round:2,type:'大货',
};

test('打样详情以单页顺序展示基础信息、进度和配方内容',async()=>{
 const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'silent'});
 try{
  const {default:SamplingDetailContent}=await server.ssrLoadModule('/src/SamplingDetailContent.tsx');
  const html=renderToStaticMarkup(React.createElement(SamplingDetailContent,{
   record,
   detailKind:'进度',
   formulaActions:React.createElement('button',null,'编辑配方'),
   formulaTable:React.createElement('div',{'data-formula-table':true},'配方表格内容'),
  }));

  for(const label of ['详情信息','订字：项发666','基础信息','打样进度','打样情况','订单审核','任务分配','打样完成','配方提交','配方完成','编辑配方','配方表格内容']){
   assert.match(html,new RegExp(label));
  }
  assert.match(html,/配方号[\s\S]*?—/);
  assert.doesNotMatch(html,/role="tab"|大样配方|打样过程/);
 }finally{
  await server.close();
 }
});

test('打样状态映射到稳定的进度节点',async()=>{
 const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'silent'});
 try{
  const {samplingProgressIndex}=await server.ssrLoadModule('/src/SamplingDetailContent.tsx');
  assert.equal(samplingProgressIndex('待审核','进度'),0);
  assert.equal(samplingProgressIndex('进行中','进度'),2);
  assert.equal(samplingProgressIndex('已完成','进度'),4);
  assert.equal(samplingProgressIndex('待审核','审核'),3);
 }finally{
  await server.close();
 }
});
