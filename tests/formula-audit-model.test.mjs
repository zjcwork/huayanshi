import test from 'node:test';
import assert from 'node:assert/strict';
import {filterFormulaAuditRows,formulaAuditCategory} from '../src/formula-audit-model.ts';

const row=(key,overrides={})=>({key,order:`订字${key}`,colorNo:`色号${key}`,product:'T/R',color:'中灰',hex:'#777',depth:'中色',ratio:6,created:'2026-10-09 08:00',due:'10-10',worker:'水木',formula:`C${key}`,status:'待审核',round:0,type:'大货',processCard:`Y${key}`,...overrides});

test('配方审核按打样、抄样、回修和预打样分类',()=>{
 assert.equal(formulaAuditCategory(row('1')),'sample');
 assert.equal(formulaAuditCategory(row('2',{formulaType:'小样'})),'copy');
 assert.equal(formulaAuditCategory(row('3',{type:'回修'})),'repair');
 assert.equal(formulaAuditCategory(row('4',{type:'预打样'})),'pre');
});

test('配方审核支持关键字、色号、状态和日期组合查询',()=>{
 const rows=[row('1',{order:'如华010',colorNo:'81深咖',dmNo:'DM001'}),row('2',{status:'已通过',created:'2026-10-01 09:00'})];
 assert.deepEqual(filterFormulaAuditRows(rows,'sample',{query:'如华',color:'DM001',status:'待审核',start:'2026-10-08',end:'2026-10-09'}).map(item=>item.key),['1']);
 assert.equal(filterFormulaAuditRows(rows,'sample',{query:'',color:'',status:'已通过'}).length,1);
});
