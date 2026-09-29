import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyRecord,matchingFormula} from '../src/matching-model.ts';
import {adjustWarehouse,completed,formulaSnapshot,warehouseConfirmed} from '../src/warehouse-model.ts';
const record=()=>({...emptyRecord(),result:'通过',formula:structuredClone(matchingFormula),bathRatio:9});
test('只有对样通过的配方可以进入进仓确认',()=>{assert.equal(completed(emptyRecord()),false);assert.equal(completed(record()),true);assert.equal(completed({...record(),result:'通过并直送'}),true)});
test('确认绑定配方快照，浴比、配方、对样结果或加料变化使确认失效',()=>{const r=record(),log=[{action:'确认',snapshot:formulaSnapshot(r)}];assert.equal(warehouseConfirmed(r,log),true);for(const change of [{bathRatio:8},{result:'待对样'},{formula:[]},{additions:[{code:'A1',amount:1}]}])assert.equal(warehouseConfirmed({...r,...change},log),false)});
test('调整保留原配方，校验操作人原因和有效比例，保存后需再次确认',()=>{const r=record();const next=adjustWarehouse(r,8,r.formula,'张工','调整浴比');assert.equal(r.bathRatio,9);assert.equal(next.bathRatio,8);assert.equal(warehouseConfirmed(next,[{action:'调整',snapshot:formulaSnapshot(next)}]),false);assert.throws(()=>adjustWarehouse(r,8,r.formula,'','原因'));assert.throws(()=>adjustWarehouse(r,8,r.formula,'张工',''));assert.throws(()=>adjustWarehouse(r,0,r.formula,'张工','原因'));assert.throws(()=>adjustWarehouse(r,8,[],'张工','原因'));assert.throws(()=>adjustWarehouse(r,9,r.formula,'张工','原因'));assert.throws(()=>adjustWarehouse(emptyRecord(),8,r.formula,'张工','原因'))});

test('进仓按头缸、连缸变更、回修分类，排除未通过和原配方复用',async()=>{
 const {warehouseCategory}=await import('../src/warehouse-model.ts');
 const first={result:'通过',order:'订单A',colorNo:'蓝色',bathRatio:8,linkedVat:'',formula:[{key:'a',stage:1,code:'B',ratio:1,algorithm:'布重',unit:'克/市斤'}],additions:[],resamples:[]};
 assert.equal(warehouseCategory('A',first,{A:first},{}),'first');
 assert.equal(warehouseCategory('AH-1',first,{},{}),'repair');
 assert.equal(warehouseCategory('B',{...first,productionKind:'回修'}, {}, {}),'repair');
 assert.equal(warehouseCategory('A',{...first,result:'未通过'}, {}, {}),null);
 const log={A:[{action:'确认',snapshot:formulaSnapshot(first),time:'2026-09-20'}]};
 assert.equal(warehouseCategory('A',first,{A:first},log),null);
 assert.equal(warehouseCategory('B',{...first,result:'通过并直送',formula:[{...first.formula[0],key:'other'}]},{A:first},log),null);
 assert.equal(warehouseCategory('B',{...first,bathRatio:9},{A:first},log),'changed');
 assert.equal(warehouseCategory('B',{...first,colorNo:'红色'},{A:first},log),'first');
});

test('变更前配方取最近历史快照，不以现有版本冒充历史',async()=>{
 const {warehouseBeforeFormula}=await import('../src/warehouse-model.ts');
 const record={formulaVersion:2,bathRatio:9,formula:[],decisions:[{kind:'直接调整配方',time:'2026-09-19',beforeBath:7,before:[],after:[]}]};
 const history=[{action:'调整',time:'2026-09-20',before:JSON.stringify({bath:8,rows:[]}),beforeFormulaNo:'v1'}];
 assert.equal(warehouseBeforeFormula(record,history).bath,8);
 assert.equal(warehouseBeforeFormula(record,history).formulaNo,'v1');
 assert.equal(warehouseBeforeFormula({...record,decisions:[]},[]),null);
 assert.equal(warehouseBeforeFormula({...record,formulaVersion:0,decisions:[]},[]).bath,9);
});

test('历史切换提供各次独立前后快照，按时间倒序且忽略确认与损坏记录',async()=>{
 const {warehouseFormulaHistory}=await import('../src/warehouse-model.ts');
 const snapshot=bath=>JSON.stringify({bath,rows:[{key:'a',stage:1,code:'CP1',ratio:bath}],additions:[]});
 const history=[{action:'调整',time:'2026-09-20',reason:'第一次',operator:'甲',before:snapshot(8),snapshot:snapshot(9)},{action:'确认',time:'2026-09-21',snapshot:snapshot(9)},{action:'调整',time:'2026-09-22',reason:'第二次',operator:'乙',before:snapshot(9),snapshot:snapshot(10)},{action:'调整',time:'2026-09-23',before:'bad',snapshot:snapshot(11)}];
 const result=warehouseFormulaHistory({decisions:[]},history);
 assert.equal(result.length,2);assert.deepEqual(result.map(r=>[r.before.bath,r.after.bath]),[[9,10],[8,9]]);assert.equal(result[0].operator,'乙');
 result[0].after.rows[0].ratio=99;
 assert.equal(warehouseFormulaHistory({decisions:[]},history)[0].after.rows[0].ratio,10);
});
