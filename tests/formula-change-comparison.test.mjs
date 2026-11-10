import test from 'node:test';
import assert from 'node:assert/strict';
import * as model from '../src/formula-change-comparison.ts';
const row=(key,patch={})=>({key,stage:1,code:'CP1',name:'助剂',ratio:1,algorithm:'布重',unit:'克/市斤',process:'02',processName:'130°C*10′',ph:'4–5',...patch});

test('联合新增删除与确认新增行，保留同代码不同阶段和零比例',()=>{
 assert.equal(typeof model.buildFormulaComparison,'function');
 const before={bath:9,rows:[row('a'),row('b',{stage:2}),row('deleted')]};
 const after={bath:10,rows:[row('a'),row('b',{stage:2}),row('added',{code:'P2',ratio:0})]};
 const confirmed={bath:10,rows:[row('a'),row('b',{stage:2}),row('custom',{code:'P3'})]};
 const copy=structuredClone({before,after,confirmed});
 const result=model.buildFormulaComparison(before,after,confirmed);
 assert.deepEqual(result.map(item=>item.key),['a','b','deleted','added','custom']);
 assert.equal(result.find(item=>item.key==='b').before.stage,2);
 assert.deepEqual(result.find(item=>item.key==='deleted').changes,['删除']);
 assert.deepEqual(result.find(item=>item.key==='added').changes,['新增']);
 assert.equal(result.find(item=>item.key==='added').requested.ratio,0);
 assert.deepEqual(result.find(item=>item.key==='custom').confirmationChanges,['新增']);
 assert.deepEqual({before,after,confirmed},copy);
});
test('同一助剂同时修改算法单位比例工艺和pH都被识别',()=>{
 assert.equal(typeof model.rowChangeLabels,'function');
 assert.deepEqual(model.rowChangeLabels(row('a'),row('a',{algorithm:'水量',unit:'克/升',ratio:2,stage:2,process:'67',processName:'60°C*50′',ph:'10–11'})),['阶段调整','比例调整','算法调整','单位调整','工艺调整','pH调整']);
 assert.deepEqual(model.rowChangeLabels(row('a',{algorithm:undefined,unit:undefined}),row('a')),[]);
 assert.deepEqual(model.rowChangeLabels(row('a'),row('a',{ratio:0})),['比例调整']);
 assert.deepEqual(model.buildFormulaComparison({bath:9,rows:[row('a')]},{bath:9,rows:[row('a')]} )[0].confirmationChanges,[]);
});
test('编辑算法联动单位且不改变其他行，恢复行不重复',()=>{
 assert.equal(typeof model.patchComparisonRow,'function');
 const formula={bath:9,rows:[row('a'),row('b')]};
 const changed=model.patchComparisonRow(formula,'a',{algorithm:'水量'});
 assert.equal(changed.rows[0].unit,'克/升');assert.equal(changed.rows[1].unit,'克/市斤');
 assert.equal(formula.rows[0].algorithm,'布重');
 const removed=model.includeComparisonRow(changed,row('b'),false);
 assert.deepEqual(removed.rows.map(item=>item.key),['a']);
 const restored=model.includeComparisonRow(removed,row('b'),true);
 assert.equal(model.includeComparisonRow(restored,row('b'),true).rows.length,2);
});
