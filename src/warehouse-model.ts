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

export type WarehouseCategory='first'|'changed'|'repair';
export const warehouseCategories:{key:WarehouseCategory;label:string}[]=[{key:'first',label:'头缸'},{key:'changed',label:'连缸变更'},{key:'repair',label:'回修'}];
// Compare recipe content, not row IDs, timestamps or the wording of the pass result.
function recipeContent(snapshot:string){
 try{const value=JSON.parse(snapshot);return JSON.stringify({bath:value.bath,rows:value.rows.map(({key,added,...row}:DetailRow)=>row),additions:(value.additions??[]).map((batch:{code:string;amount:number;rows?:unknown[]})=>({code:batch.code,amount:batch.amount,rows:batch.rows?.map((row:any)=>{const {key,added,...content}=row;return content})}))});}catch{return null;}
}
export function warehouseCategory(id:string,record:MatchingRecord,records:Record<string,MatchingRecord>,log:WarehouseLog):WarehouseCategory|null{
 if(!completed(record)||warehouseConfirmed(record,log[id])||log[id]?.at(-1)?.action==='配方不可用')return null;
 if(record.productionKind==='回修'||/H(?:-\d+)?$/i.test(id))return 'repair';
 const confirmations=Object.entries(log).flatMap(([card,entries])=>{
  const other=records[card];
  const related=card===id||!!record.order?.trim()&&!!record.colorNo?.trim()&&other?.order===record.order&&other?.colorNo===record.colorNo&&other.productionKind!=='回修'&&!/H(?:-\d+)?$/i.test(card);
  return related?entries.filter(entry=>entry.action==='确认'):[];
 }).sort((a,b)=>b.time.localeCompare(a.time));
 if(!confirmations.length)return 'first';
 const current=recipeContent(formulaSnapshot(record)),previous=recipeContent(confirmations[0].snapshot);
 return current!==null&&previous!==null&&current===previous?null:'changed';
}

export function warehouseBeforeFormula(record:MatchingRecord,history:WarehouseEntry[]=[]){
 const candidates:{time:string;reason:string;operator:string;bath:number|null;rows:DetailRow[];formulaNo?:string}[]=[];
 for(const entry of history){
  if(entry.action!=='调整'||!entry.before)continue;
  try{const value=JSON.parse(entry.before);if(Array.isArray(value.rows))candidates.push({time:entry.time,reason:entry.reason,operator:entry.operator,bath:value.bath??null,rows:value.rows,formulaNo:entry.beforeFormulaNo});}catch{/* Skip unreadable historical snapshots. */}
 }
 for(const decision of record.decisions??[]){
  if(!decision.after||decision.kind==='无需变更')continue;
  candidates.push({time:decision.completedAt??decision.time,reason:decision.reason,operator:decision.operator,bath:decision.beforeBath??null,rows:decision.before});
 }
 candidates.sort((a,b)=>b.time.localeCompare(a.time));
 if(candidates[0])return {...candidates[0],note:'最近一次变更前快照'};
 if((record.formulaVersion??0)>0)return null;
 return {bath:record.bathRatio??(record.demo?8:9),rows:record.formula??matchingFormula,formulaNo:undefined,time:undefined,reason:undefined,operator:undefined,note:'尚无配方变更，显示当前基础配方'};
}

export function warehouseFormulaHistory(record:MatchingRecord,history:WarehouseEntry[]=[]){
 type Snapshot={bath:number|null;rows:DetailRow[];additions:MatchingRecord['additions']};
 const parse=(value:string):Snapshot|null=>{try{const data=JSON.parse(value);return Array.isArray(data.rows)?{bath:data.bath??null,rows:data.rows,additions:data.additions??[]}:null;}catch{return null;}};
 const changes:{id:string;time:string;reason:string;operator:string;before:Snapshot;after:Snapshot;beforeFormulaNo?:string;formulaNo?:string}[]=[];
 history.forEach((entry,index)=>{
  if(entry.action!=='调整'||!entry.before)return;
  const before=parse(entry.before),after=parse(entry.snapshot);
  if(before&&after)changes.push({id:`warehouse-${index}`,time:entry.time,reason:entry.reason,operator:entry.operator,before,after,beforeFormulaNo:entry.beforeFormulaNo,formulaNo:entry.formulaNo});
 });
 (record.decisions??[]).forEach((decision,index)=>{
  if(!decision.after||decision.kind==='无需变更')return;
  changes.push({id:`decision-${index}`,time:decision.completedAt??decision.time,reason:decision.reason,operator:decision.operator,before:{bath:decision.beforeBath??null,rows:decision.before,additions:[]},after:{bath:decision.afterBath??decision.beforeBath??null,rows:decision.after,additions:[]}});
 });
 return changes.sort((a,b)=>b.time.localeCompare(a.time));
}
