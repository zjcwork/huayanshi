import dayjs from 'dayjs';
import type {LabRecord} from './data';

export type QueryHistoryFilters={
 order:string;
 colorNo:string;
 processCard:string;
 formula:string;
 dmNo:string;
 formulaType:'大样'|'小样'|'全部';
 start?:string;
 end?:string;
};

const includes=(value:string|undefined,query:string)=>(value??'').toLowerCase().includes(query.trim().toLowerCase());

export function matchesQueryHistory(row:LabRecord,filters:QueryHistoryFilters){
 const formulaType=row.formulaType??(row.type==='回修'?'回修':'大样');
 return includes(row.order,filters.order)
  &&includes(row.colorNo,filters.colorNo)
  &&includes(row.processCard,filters.processCard)
  &&includes(row.formula,filters.formula)
  &&includes(row.dmNo,filters.dmNo)
  &&(filters.formulaType==='全部'||formulaType===filters.formulaType)
  &&(!filters.start||!dayjs(row.created).isBefore(dayjs(filters.start).startOf('day')))
  &&(!filters.end||!dayjs(row.created).isAfter(dayjs(filters.end).endOf('day')));
}
