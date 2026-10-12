import dayjs,{type Dayjs} from 'dayjs';
import type {Change} from './dye-formula-model';

export function formulaChangeDefaultDates(now:Dayjs=dayjs()){
 return {start:now.startOf('month'),end:now};
}

export type FormulaRetryProgress='待分配'|'进行中'|'已完成';

export function formulaRetryProgress(change:Pick<Change,'retry'>):FormulaRetryProgress{
 if(change.retry?.completedAt)return '已完成';
 return change.retry?'进行中':'待分配';
}
