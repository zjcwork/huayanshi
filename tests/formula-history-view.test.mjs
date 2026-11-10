import test from 'node:test';
import assert from 'node:assert/strict';
import * as history from '../src/formula-history-view.ts';
const rows=[
 {formula:'C06v4',card:'Y1',isSample:false,available:false},
 {formula:'C06v3',card:'Y2',isSample:false,available:true},
 {formula:'C06v3',card:'Y3',isSample:false,available:true},
 {formula:'A06v0',card:'sample',isSample:true,available:false},
];
test('版本选择去重并优先默认可用版本',()=>{
 assert.equal(typeof history.historyVersions,'function');
 assert.deepEqual(history.historyVersions(rows).map(row=>row.formula),['C06v4','C06v3','A06v0']);
 assert.equal(history.selectHistoryUsage(rows,'失效版本')?.formula,'C06v3');
 assert.equal(history.selectHistoryUsage(rows,'A06v0')?.formula,'A06v0');
 assert.equal(history.selectHistoryUsage([],''),undefined);
});
test('使用记录仅关联所选版本，小样不显示生产流程卡',()=>{
 assert.equal(typeof history.historyProductionCards,'function');
 assert.deepEqual(history.historyProductionCards(rows,'C06v3').map(row=>row.card),['Y2','Y3']);
 assert.deepEqual(history.historyProductionCards(rows,'A06v0'),[]);
 assert.deepEqual(history.historyProductionCards(rows,'missing'),[]);
});
