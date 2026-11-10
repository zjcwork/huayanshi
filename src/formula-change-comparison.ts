import type {DyeRow,Formula} from './dye-formula-model';

export type ComparisonRow={key:string;before?:DyeRow;requested?:DyeRow;confirmed?:DyeRow;changes:string[];confirmationChanges:string[]};
export function comparisonValue(row:DyeRow,field:keyof DyeRow):string|number|null{
 if(field==='algorithm')return row.algorithm??'布重';
 if(field==='unit')return row.unit??((row.algorithm??'布重')==='水量'?'克/升':'克/市斤');
 return row[field]??'';
}
export function rowChangeLabels(before?:DyeRow,after?:DyeRow):string[]{
 if(!before)return after?['新增']:[];
 if(!after)return ['删除'];
 const fields:[(keyof DyeRow)[],string][]=[
  [['stage'],'阶段调整'],[['code'],'助剂调整'],[['name'],'名称调整'],[['ratio'],'比例调整'],
  [['algorithm'],'算法调整'],[['unit'],'单位调整'],[['process','processName'],'工艺调整'],[['ph'],'pH调整']
 ];
 return fields.filter(([keys])=>keys.some(key=>comparisonValue(before,key)!==comparisonValue(after,key))).map(([,label])=>label);
}
export function buildFormulaComparison(before:Formula,requested:Formula,confirmed?:Formula|null):ComparisonRow[]{
 const old=new Map(before.rows.map(row=>[row.key,row])),next=new Map(requested.rows.map(row=>[row.key,row])),final=new Map(confirmed?.rows.map(row=>[row.key,row])??[]);
 const keys=new Set([...old.keys(),...next.keys(),...final.keys()]);
 return [...keys].map(key=>({key,before:old.get(key),requested:next.get(key),confirmed:final.get(key),changes:rowChangeLabels(old.get(key),next.get(key)),confirmationChanges:confirmed?rowChangeLabels(next.get(key),final.get(key)):[]}));
}
export function patchComparisonRow(formula:Formula,key:string,patch:Partial<DyeRow>):Formula{
 const values={...patch};
 if(patch.algorithm!==undefined&&patch.unit===undefined)values.unit=patch.algorithm==='水量'?'克/升':'克/市斤';
 return {...formula,rows:formula.rows.map(row=>row.key===key?{...row,...values}:row)};
}
export function includeComparisonRow(formula:Formula,row:DyeRow,included:boolean):Formula{
 return {...formula,rows:included?(formula.rows.some(item=>item.key===row.key)?formula.rows:[...formula.rows,structuredClone(row)]):formula.rows.filter(item=>item.key!==row.key)};
}
