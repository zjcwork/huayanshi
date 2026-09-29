import test from 'node:test';
import assert from 'node:assert/strict';
import {initialFormulaState,submitFormula,reviewFormula,saveFormulaState,loadFormulaState} from '../src/dye-formula-model.ts';
import {queryVersions,captureOpeningReview,formulaUsage} from '../src/formula-query-model.ts';

test('申请、审核、版本查询和开卡快照贯通，后续变更不覆盖使用记录',()=>{
 const previous=globalThis.localStorage,values=new Map();
 globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 try{
  const card='Y2606308404',initial={...initialFormulaState(),card};
  saveFormulaState(initial);
  const request=submitFormula(loadFormulaState(card),{...structuredClone(initial.approved),bath:8},'调整浴比',0,'申请人');
  saveFormulaState(request);
  assert.deepEqual(queryVersions(loadFormulaState(card),card).map(v=>v.version),[0]);
  assert.equal(queryVersions(loadFormulaState(card),card)[0].formula.bath,9);
  const approved=reviewFormula(loadFormulaState(card),request.changes[0].id,true,'审核人','同意');saveFormulaState(approved);
  const v1=queryVersions(loadFormulaState(card),card)[0];
  assert.equal(v1.version,1);assert.equal(v1.formula.bath,8);assert.equal(v1.applicant,'申请人');assert.equal(v1.reviewer,'审核人');
  const snapshot=captureOpeningReview(loadFormulaState(card),card,1,v1.formula,'开卡人');
  const jobs=[{id:'job1',card,vat:'J01#',converted:true,openingReview:snapshot}];
  const second=submitFormula(loadFormulaState(card),{...structuredClone(v1.formula),bath:7},'再次调整',1,'申请人');
  saveFormulaState(reviewFormula(second,second.changes[0].id,true,'审核人',''));
  assert.deepEqual(queryVersions(loadFormulaState(card),card).map(v=>v.version),[2,1,0]);
  const usage=formulaUsage(jobs,card)[0];assert.equal(usage.snapshot.version,1);assert.equal(usage.snapshot.formula.bath,8);assert.equal(usage.snapshot.formulaNo,v1.formulaNo);
  usage.snapshot.formula.bath=99;assert.equal(jobs[0].openingReview.formula.bath,8);
  const old=queryVersions(loadFormulaState(card),card).find(v=>v.version===0);
  assert.equal(captureOpeningReview(loadFormulaState(card),card,0,old.formula,'开卡人').formula.bath,9);
  assert.throws(()=>captureOpeningReview(loadFormulaState(card),card,4,old.formula,'开卡人'));
  assert.throws(()=>captureOpeningReview(loadFormulaState(card),card,1,old.formula,'开卡人'));
 }finally{globalThis.localStorage=previous;}
});
test('退回与使用原配方不生成版本，无开卡快照不推测所用版本',()=>{
 const card='Y2606308404',state={...initialFormulaState(),card};
 const requested=submitFormula(state,{...structuredClone(state.approved),bath:8},'调整',0,'申请人');
 for(const result of [reviewFormula(requested,requested.changes[0].id,false,'审核人','需重核'),reviewFormula(requested,requested.changes[0].id,true,'审核人','','original')]){
  assert.deepEqual(queryVersions(result,card).map(v=>v.version),[0]);
 }
 const rows=formulaUsage([{id:'1',card,converted:true},{id:'2',card,converted:false},{id:'3',card:'other',openingReview:{version:9}}],card);
 assert.equal(rows.length,2);assert.ok(rows.every(row=>row.snapshot===null));
});
