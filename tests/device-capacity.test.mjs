import test from 'node:test';
import assert from 'node:assert/strict';
import {attachDemoDeviceOperations,deviceTotals} from '../src/device-capacity.ts';
const jobs=Array.from({length:30},(_,i)=>({id:String(i),card:`Y${i}`,state:i===0?'running':'planned'}));
test('设备列表与汇总工时一致，取消任务只减少其关联设备工时',()=>{
 const initial=attachDemoDeviceOperations(jobs),before=deviceTotals(initial),removed=initial[1];
 const remaining=attachDemoDeviceOperations(initial.filter(job=>job.id!==removed.id));
 const after=deviceTotals(remaining);
 assert.equal(before[10],25.09);
 for(let device=0;device<before.length;device++){
  const hours=removed.deviceOperations.find(operation=>operation.device===device)?.hours??0;
  assert.equal(after[device],Math.round((before[device]-hours)*100)/100);
 }
 assert.deepEqual(remaining[0].deviceOperations,initial[0].deviceOperations);
 assert.equal(deviceTotals(initial,true)[10],initial[0].deviceOperations.find(operation=>operation.device===10).hours);
});
test('设备工时和取消结果刷新后保留，不补回已取消演示任务',async()=>{
 const store=new Map();globalThis.localStorage={getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)};
 const {readScheduleJobs}=await import('../src/schedule-model.ts');
 const initial=readScheduleJobs(),target=initial.find(job=>job.id==='j03-waiting-demo-v1');
 assert.ok(target);
 localStorage.setItem('lab-dye-schedule',JSON.stringify(initial.filter(job=>job.id!==target.id)));
 localStorage.setItem('lab-cancelled-schedule-ids',JSON.stringify([target.id]));
 assert.equal(readScheduleJobs().some(job=>job.id===target.id),false);
 delete globalThis.localStorage;
});
