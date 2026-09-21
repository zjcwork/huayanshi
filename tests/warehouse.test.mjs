import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyRecord,matchingFormula} from '../src/matching-model.ts';
import {adjustWarehouse,completed,formulaSnapshot,warehouseConfirmed} from '../src/warehouse-model.ts';
const record=()=>({...emptyRecord(),result:'通过',formula:structuredClone(matchingFormula),bathRatio:9});
test('只有对样通过的配方可以进入进仓确认',()=>{assert.equal(completed(emptyRecord()),false);assert.equal(completed(record()),true);assert.equal(completed({...record(),result:'通过并直送'}),true)});
test('确认绑定配方快照，浴比、配方、对样结果或加料变化使确认失效',()=>{const r=record(),log=[{action:'确认',snapshot:formulaSnapshot(r)}];assert.equal(warehouseConfirmed(r,log),true);for(const change of [{bathRatio:8},{result:'待对样'},{formula:[]},{additions:[{code:'A1',amount:1}]}])assert.equal(warehouseConfirmed({...r,...change},log),false)});
test('调整保留原配方，校验操作人原因和有效比例，保存后需再次确认',()=>{const r=record();const next=adjustWarehouse(r,8,r.formula,'张工','调整浴比');assert.equal(r.bathRatio,9);assert.equal(next.bathRatio,8);assert.equal(warehouseConfirmed(next,[{action:'调整',snapshot:formulaSnapshot(next)}]),false);assert.throws(()=>adjustWarehouse(r,8,r.formula,'','原因'));assert.throws(()=>adjustWarehouse(r,8,r.formula,'张工',''));assert.throws(()=>adjustWarehouse(r,0,r.formula,'张工','原因'));assert.throws(()=>adjustWarehouse(r,8,[],'张工','原因'));assert.throws(()=>adjustWarehouse(r,9,r.formula,'张工','原因'));assert.throws(()=>adjustWarehouse(emptyRecord(),8,r.formula,'张工','原因'))});
