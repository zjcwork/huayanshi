import test from 'node:test';
import assert from 'node:assert/strict';
import {queryRecords} from '../src/data.ts';
import {matchesQueryHistory} from '../src/query-history-filters.ts';

const blank={order:'',colorNo:'',processCard:'',formula:'',dmNo:'',formulaType:'全部'};

test('配方履历支持按独立字段和日期组合查询',()=>{
 const row=queryRecords[0];
 assert.equal(matchesQueryHistory(row,{...blank,order:'芹王',colorNo:'薄荷',processCard:row.processCard.slice(0,8),formula:'C06',dmNo:'DM2607',formulaType:'大样',start:'2026-08-01',end:'2026-08-31'}),true);
 assert.equal(matchesQueryHistory(row,{...blank,formula:'不存在'}),false);
 assert.equal(matchesQueryHistory(row,{...blank,start:'2026-09-01'}),false);
});
