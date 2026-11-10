import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';

test('配方变更模拟覆盖本月四种状态，刷新保留已处理结果及原有记录',async()=>{
 const previous=globalThis.localStorage,values=new Map();
 globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 const server=await createServer({server:{middlewareMode:true},appType:'custom'});
 try{
  const {ensureFormulaChangeDemo}=await server.ssrLoadModule('/src/formula-change-demo.ts');
  const now=new Date(2026,10,10,12);
  const first=ensureFormulaChangeDemo(now);
  const recent=first.changes.filter(row=>row.id.startsWith('formula-change-workspace-demo-202611-'));
  assert.equal(recent.length,8);
  const classify=row=>row.status==='已通过'?'已确认':row.status==='已退回'?'待变更':row.reviewedFormula?'已变更':'待确认';
  for(const status of ['待变更','已变更','待确认','已确认'])assert.equal(recent.filter(row=>classify(row)===status).length,2);
  for(const row of recent){assert.ok(new Date(row.submittedAt)>=new Date(2026,10,1));assert.ok(new Date(row.submittedAt)<=now);assert.notDeepEqual(row.before,row.after);assert.ok(row.order&&row.card&&row.colorNo&&row.applicant);}
  const id=recent.find(row=>classify(row)==='待确认').id;
  const stored=JSON.parse(values.get('lab-dye-formula-changes'));
  const target=stored.changes.find(row=>row.id===id);target.status='已通过';target.reviewer='测试工段长';
  values.set('lab-dye-formula-changes',JSON.stringify(stored));
  const second=ensureFormulaChangeDemo(now);
  assert.equal(second.changes.length,first.changes.length);
  assert.equal(second.changes.find(row=>row.id===id).reviewer,'测试工段长');
  assert.deepEqual(second.changes.filter(row=>!row.id.startsWith('formula-change-workspace-demo-')),first.changes.filter(row=>!row.id.startsWith('formula-change-workspace-demo-')));
 }finally{await server.close();globalThis.localStorage=previous;}
});
