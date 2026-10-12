import test from 'node:test';
import assert from 'node:assert/strict';
import dayjs from 'dayjs';
import {formulaChangeDefaultDates,formulaRetryProgress} from '../src/formula-change-filters.ts';

test('配方变更默认日期覆盖当月新提交记录',()=>{
 const now=dayjs('2026-09-28T16:30:00');
 const {start,end}=formulaChangeDefaultDates(now);
 const submittedAt=dayjs('2026-09-28T15:00:00');
 assert.equal(start.format('YYYY-MM-DD'),'2026-09-01');
 assert.equal(end.format('YYYY-MM-DD'),'2026-09-28');
 assert.equal(submittedAt.isBefore(start.startOf('day')),false);
 assert.equal(submittedAt.isAfter(end.endOf('day')),false);
});

test('复样进度依次显示待分配、进行中和已完成',()=>{
 assert.equal(formulaRetryProgress({}),'待分配');
 assert.equal(formulaRetryProgress({retry:{requestedAt:'2026-10-07T09:00:00.000Z'}}),'进行中');
 assert.equal(formulaRetryProgress({retry:{requestedAt:'2026-10-07T09:00:00.000Z',completedAt:'2026-10-07T10:00:00.000Z'}}),'已完成');
});
