import dayjs,{type Dayjs} from 'dayjs';

export function formulaChangeDefaultDates(now:Dayjs=dayjs()){
 return {start:now.startOf('month'),end:now};
}
