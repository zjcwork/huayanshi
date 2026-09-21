import test from 'node:test';
import assert from 'node:assert/strict';
import {dyeOverviewCards,dyeOverviewStats} from '../src/dye-matching-overview-model.ts';
test('染色对样按当日加料次数统计卡数，并取最后一次颜色偏向',()=>{
 const batch=(time,direction,depth)=>({code:'A1',amount:1,reason:'',time,direction,depth});
 const records={Y1:{team:'甲班',result:'未通过',additions:[batch('2026-09-19T11:00:00+08:00','偏蓝','偏浅'),batch('2026-09-18T10:00:00+08:00','偏黄','偏深'),batch('2026-09-19T09:00:00+08:00','偏红','偏深')]},Y2:{team:'乙班',result:'通过',additions:[batch('2026-09-19T08:00:00+08:00','偏黄','偏深')]}};
 const data=dyeOverviewCards(records,new Date('2026-09-19T12:00:00+08:00').getTime());
 assert.equal(data.demo,false);
 assert.deepEqual(dyeOverviewStats(data.cards).additions,[1,1,0,0,0]);
 assert.deepEqual(dyeOverviewStats(data.cards).bias,[0,1,1,1,1]);
 assert.deepEqual(dyeOverviewStats(data.cards).progress,[0,1,1]);
 assert.deepEqual(dyeOverviewStats(data.cards.filter(r=>r.team==='甲班')).additions,[0,1,0,0,0]);
});
test('无当日加料时展示明确标记的模拟数据',()=>{
 const data=dyeOverviewCards({},Date.now());assert.equal(data.demo,true);assert.equal(data.cards.length,30);
 const total=dyeOverviewStats(data.cards).progress.reduce((a,b)=>a+b,0);assert.equal(total,30);
});
