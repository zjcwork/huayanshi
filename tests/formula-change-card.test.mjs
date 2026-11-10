import test from 'node:test';
import assert from 'node:assert/strict';
import * as model from '../src/formula-change-card.ts';

test('流程卡精确匹配优先，回退仅接受同订字同色号',()=>{
 assert.equal(typeof model.findFormulaChangeCard,'function');
 const cards=[{card:'A',order:'同订字',colorNo:'红色',product:'红布'},{card:'B',order:'同订字',colorNo:'蓝色',product:'蓝布'}];
 assert.equal(model.findFormulaChangeCard({card:'B',order:'同订字',colorNo:'红色'},cards),cards[1]);
 assert.equal(model.findFormulaChangeCard({card:'demo',order:'同订字',colorNo:'蓝色'},cards),cards[1]);
 assert.equal(model.findFormulaChangeCard({card:'demo',order:'同订字',colorNo:'绿色'},cards),undefined);
 assert.equal(model.findFormulaChangeCard({card:'demo',order:'同订字'},cards),undefined);
 assert.equal(model.findFormulaChangeCard(null,cards),undefined);
});
