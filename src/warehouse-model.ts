import {versionMatchingFormula,matchingFormula,type MatchingRecord,type DetailRow} from './matching-model.ts';
export type WarehouseEntry={snapshot:string;operator:string;time:string;reason:string;action:'调整'|'确认'|'重新打样'|'配方不可用';before?:string;formulaNo?:string;beforeFormulaNo?:string};
export type WarehouseLog=Record<string,WarehouseEntry[]>;
export const warehouseKey='lab-warehouse-confirmations';
export const completed=(r:MatchingRecord)=>r.result==='通过'||r.result==='通过并直送';
export const formulaSnapshot=(r:MatchingRecord)=>JSON.stringify({result:r.result,bath:r.bathRatio??(r.demo?8:9),rows:r.formula??matchingFormula,additions:r.additions});
export const warehouseConfirmed=(r:MatchingRecord,log:WarehouseEntry[]=[])=>completed(r)&&log.at(-1)?.action==='确认'&&log.at(-1)?.snapshot===formulaSnapshot(r);
export function adjustWarehouse(r:MatchingRecord,bath:number|null,rows:DetailRow[],operator:string,reason:string):MatchingRecord{
 if(!completed(r))throw new Error('该配方尚未完成对样，请刷新后重试');
 if(!operator.trim()||!reason.trim())throw new Error('请填写操作人和调整原因');
 if(!bath||!Number.isFinite(bath)||bath<=0)throw new Error('请输入有效浴比');
 if(!rows.length||rows.some(x=>!x.code.trim()||x.ratio===null||!Number.isFinite(x.ratio)||x.ratio<0||!Number.isInteger(x.stage)||x.stage<1||!['布重','水量'].includes(x.algorithm)||x.unit!==(x.algorithm==='布重'?'克/市斤':'克/升'))||!rows.some(x=>(x.ratio??0)>0))throw new Error('请检查染助剂、阶段和比例，至少一项比例大于 0');
 const next={...r,bathRatio:bath,formula:rows.map(x=>({...x,code:x.code.trim()}))};
 if(formulaSnapshot(next)===formulaSnapshot(r))throw new Error('配方未发生变化');
 return versionMatchingFormula(r,next);
}
