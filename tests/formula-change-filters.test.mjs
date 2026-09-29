import test from 'node:test';
import assert from 'node:assert/strict';
import dayjs from 'dayjs';
import {formulaChangeDefaultDates} from '../src/formula-change-filters.ts';

test('配方变更默认日期覆盖当月新提交记录',()=>{
 const now=dayjs('2026-09-28T16:30:00');
 const {start,end}=formulaChangeDefaultDates(now);
 const submittedAt=dayjs('2026-09-28T15:00:00');
 assert.equal(start.format('YYYY-MM-DD'),'2026-09-01');
 assert.equal(end.format('YYYY-MM-DD'),'2026-09-28');
 assert.equal(submittedAt.isBefore(start.startOf('day')),false);
 assert.equal(submittedAt.isAfter(end.endOf('day')),false);
});
