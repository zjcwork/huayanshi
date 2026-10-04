import test from 'node:test';
import assert from 'node:assert/strict';
import {displayScheduleNumber,readScheduleJobs,vats} from '../src/schedule-model.ts';

test('后续待排计划显示 PD 排产号，其他状态保留流程卡号',()=>{
 assert.equal(displayScheduleNumber({state:'waiting',card:'Y2606308520'}),'PD2606308520');
 assert.equal(displayScheduleNumber({state:'waiting',card:'Y2606308520',planNo:'PD000123'}),'PD000123');
 assert.equal(displayScheduleNumber({state:'planned',card:'Y2606308520'}),'Y2606308520');
});

test('每台染缸末尾都有一张 PD 计划卡',()=>{
 const values=new Map(),previous=globalThis.localStorage;
 globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 try{
  const jobs=readScheduleJobs();
  for(const vat of vats){
   const vatJobs=jobs.filter(job=>job.vat===vat).sort((a,b)=>a.slot-b.slot);
   assert.equal(vatJobs.at(-1)?.state,'waiting');
   assert.match(displayScheduleNumber(vatJobs.at(-1)),/^PD/);
  }
 }finally{globalThis.localStorage=previous;}
});

test('J01# 的 06 位置有一张 PD 计划卡',()=>{
 const values=new Map(),previous=globalThis.localStorage;
 globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 try{
  const plan=readScheduleJobs().find(job=>job.vat==='J01#'&&job.slot===5);
  assert.equal(plan?.state,'waiting');
  assert.match(displayScheduleNumber(plan),/^PD/);
 }finally{globalThis.localStorage=previous;}
});
