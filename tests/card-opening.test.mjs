import test from 'node:test';
import assert from 'node:assert/strict';
import {formulaVersions,unopenedPlan} from '../src/card-opening-model.ts';
const before={bath:9,rows:[]},after={bath:8,rows:[]};
test('开卡列表排除生产中和已转卡计划',()=>{
 assert.equal(unopenedPlan({state:'running'}),false);
 assert.equal(unopenedPlan({state:'planned',converted:true}),false);
 assert.equal(unopenedPlan({state:'planned'}),true);
 assert.equal(unopenedPlan({state:'ready'}),true);
});
test('未确认和退回的配方不生成新版本，隔离其他流程卡',()=>{
 const state={version:0,approved:before,changes:[{card:'a',version:0,before,after,status:'待工段长审核'},{card:'a',version:0,before,after,status:'已退回'},{card:'b',version:3,before,after,status:'已通过'}]};
 assert.deepEqual(formulaVersions(state,'a').map(v=>v.version),[0]);
});
test('保留已确认历史版本及对应配方',()=>{
 const state={version:1,approved:after,changes:[{card:'a',version:0,before,after,status:'已通过',reason:'浴比调整'}]};
 const result=formulaVersions(state,'a');assert.deepEqual(result.map(v=>v.version),[1,0]);
 assert.deepEqual(result.map(v=>v.formula.bath),[8,9]);
});
test('选择原配方通过审核不会新增版本',()=>{
 const state={version:0,approved:before,changes:[{card:'a',version:0,before,after,status:'已通过',formulaChoice:'original'}]};
 assert.deepEqual(formulaVersions(state,'a').map(v=>v.version),[0]);
});

test('多次变更模拟保留四个版本及各次调整，已有数据不覆盖',async()=>{
 const {withOpeningFormulaDemo,openingDemoCard}=await import('../src/opening-formula-demo.ts');
 const {initialFormulaState}=await import('../src/dye-formula-model.ts');
 const base={...initialFormulaState(),card:openingDemoCard};
 const demo=withOpeningFormulaDemo(base);
 const versions=formulaVersions(demo,openingDemoCard);
 assert.deepEqual(versions.map(v=>v.version),[3,2,1,0]);
 assert.deepEqual(versions.map(v=>v.formula.bath),[7,8,8,9]);
 assert.equal(versions[1].formula.rows.find(r=>r.code==='B28').ratio,0.615);
 assert.match(versions[2].reason,/容量/);
 assert.equal(withOpeningFormulaDemo(demo),demo);
 const saved={...base,cards:{[openingDemoCard]:{version:0,approved:base.approved}}};
 assert.equal(withOpeningFormulaDemo(saved),saved);
});
