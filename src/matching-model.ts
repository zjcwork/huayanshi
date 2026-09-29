import {formulaNumber} from './formula-number.ts';
export type AdditionRow={key:string;stage:number;code:string;ratio:number|null;algorithm:string;unit:string;amount:number|null;process:string;added?:boolean};
export type DetailRow={process?:string;ph?:string;key:string;stage:number;code:string;ratio:number|null;algorithm:string;unit:string;added?:boolean};
export type AdditionBatch={code:string;amount:number;reason:string;time:string;depth?:string;direction?:string;mode?:string;rows?:AdditionRow[]};
export type MatchingRecord={productionKind?:'头缸'|'连缸'|'回修';team?:'甲班'|'乙班'|'丙班';dueAt?:string;formulaVersion?:number;order?:string;colorNo?:string;bathRatio?:number;demo?:boolean;linkedVat:string;result:'待对样'|'未通过'|'通过'|'通过并直送';reason:string;additions:AdditionBatch[];resamples:{reason:string;time:string}[];formula?:DetailRow[];decisions?:Decision[]};
export const matchingFormula:DetailRow[]=[
 {key:'CP1',stage:1,code:'CP1',ratio:1.455,algorithm:'布重',unit:'克/市斤'},
 {key:'CP2',stage:1,code:'CP2',ratio:0.97,algorithm:'布重',unit:'克/市斤'},
 {key:'B28',stage:2,code:'B28',ratio:0.563,algorithm:'布重',unit:'克/市斤'},
 {key:'B10',stage:2,code:'B10',ratio:0.138,algorithm:'布重',unit:'克/市斤'},
 {key:'P13',stage:2,code:'P13',ratio:0.4,algorithm:'水量',unit:'克/升'},
 {key:'P2',stage:2,code:'P2',ratio:0.2,algorithm:'水量',unit:'克/升'},
 {key:'P1',stage:2,code:'P1',ratio:17.22,algorithm:'水量',unit:'克/升'},
 {key:'P7-1',stage:2,code:'P7-1',ratio:1.54,algorithm:'水量',unit:'克/升'}
];
export const matchingBath=(r:MatchingRecord)=>r.bathRatio??(r.demo?8:9);
export const matchingFormulaNumber=(card:string,r:MatchingRecord)=>formulaNumber(matchingBath(r),card,r.formulaVersion??0);
const recipeSignature=(r:MatchingRecord)=>JSON.stringify({bath:matchingBath(r),rows:(r.formula??matchingFormula).map(({key,...row})=>row)});
export function versionMatchingFormula(before:MatchingRecord,after:MatchingRecord):MatchingRecord{
 return {...after,formulaVersion:(before.formulaVersion??0)+(recipeSignature(before)!==recipeSignature(after)?1:0)};
}
export type Decision={kind:'重新打样'|'直接调整配方'|'无需变更';reason:string;operator:string;time:string;additionCount:number;before:DetailRow[];after?:DetailRow[];completedAt?:string;scope?:'card'|'order';beforeBath?:number;afterBath?:number};
export const storageKey='lab-matching-details';
export const isBadFormula=(record:MatchingRecord)=>record.additions.length>=3;
export const defectStatus=(record:MatchingRecord)=>{
 const last=record.decisions?.at(-1);
 if(!last)return '待工段长处理';
 if(last.kind==='重新打样'&&!last.completedAt)return '待重新打样';
 if(record.additions.length>last.additionCount)return '待工段长处理';
 return last.kind==='无需变更'?'无需变更':last.kind==='重新打样'?'已重新打样':'已调整配方';
};
export function readRecords():Record<string,MatchingRecord>{
 const saved:Record<string,MatchingRecord>=JSON.parse(localStorage.getItem(storageKey)||'{}');
 if(localStorage.getItem('lab-bad-formula-demo-v1'))return saved;
 const merged={...demoMatchingRecords(),...saved};
 localStorage.setItem(storageKey,JSON.stringify(merged));
 localStorage.setItem('lab-bad-formula-demo-v1','1');
 return merged;
}
export const emptyRecord=():MatchingRecord=>({linkedVat:'',result:'待对样',reason:'',additions:[],resamples:[]});
export const readRecord=(card:string):MatchingRecord=>readRecords()[card]??emptyRecord();
export function writeRecord(card:string,record:MatchingRecord){localStorage.setItem(storageKey,JSON.stringify({...readRecords(),[card]:record}));}
export function decide(record:MatchingRecord,kind:Decision['kind'],reason:string,operator:string,after?:DetailRow[],options?:{bathRatio:number;scope:'card'|'order'}):MatchingRecord{
 if(!isBadFormula(record)||defectStatus(record)!=='待工段长处理')throw new Error('该记录当前无需处理，请刷新后重试');
 if(!reason.trim()||!operator.trim())throw new Error('请填写工段长姓名和处理原因');
 if(kind==='直接调整配方'){if(options&&(!Number.isFinite(options.bathRatio)||options.bathRatio<=0))throw new Error('请填写大于 0 的浴比');validateFormula(after,record.formula??matchingFormula,!!options&&options.bathRatio!==(record.bathRatio??(record.demo?8:9)));}
 const decision:Decision={kind,reason:reason.trim(),operator:operator.trim(),time:new Date().toISOString(),additionCount:record.additions.length,before:record.formula??matchingFormula,after:kind==='直接调整配方'?after:undefined,...(kind==='直接调整配方'&&options?{scope:options.scope,beforeBath:record.bathRatio??(record.demo?8:9),afterBath:options.bathRatio}:{})};
 return versionMatchingFormula(record,{...record,...(kind==='直接调整配方'&&options?{bathRatio:options.bathRatio}:{}),result:kind==='无需变更'?record.result:'待对样',formula:kind==='直接调整配方'?after:record.formula,decisions:[...record.decisions??[],decision]});
}
export function validateFormula(rows:DetailRow[]|undefined,before:DetailRow[],bathChanged=false){
 if(!rows?.length||rows.some(r=>!r.code.trim()||r.ratio===null||!Number.isFinite(r.ratio)||r.ratio<0)||!rows.some(r=>(r.ratio??0)>0))throw new Error('请填写有效配方比例，至少一项大于 0');
 if(rows.some(r=>!Number.isInteger(r.stage)||r.stage<1||!['布重','水量'].includes(r.algorithm)||r.unit!==(r.algorithm==='布重'?'克/市斤':'克/升')))throw new Error('请检查阶段、算法和单位');
 if(!bathChanged&&JSON.stringify(rows)===JSON.stringify(before))throw new Error('请调整配方后再保存');
}
export function completeResample(record:MatchingRecord,rows:DetailRow[]):MatchingRecord{
 const last=record.decisions?.at(-1);
 if(!last||defectStatus(record)!=='待重新打样')throw new Error('打样任务状态已变化，请刷新');
 validateFormula(rows,record.formula??matchingFormula);
 return versionMatchingFormula(record,{...record,formula:rows,result:'待对样',decisions:[...record.decisions!.slice(0,-1),{...last,after:rows,completedAt:new Date().toISOString(),additionCount:record.additions.length}]});
}

// 固定演示流程卡，仅首次加载补入，已有记录和处理结果优先保留。
function demoMatchingRecords():Record<string,MatchingRecord>{
 const examples=[
  {card:'DEMO-Y26091501',count:3,direction:'偏红',depth:'偏浅',mode:'正常加料',reason:'连续加料后色光仍偏红，请工段长评估'},
  {card:'DEMO-Y26091502',count:4,direction:'偏蓝',depth:'偏深',mode:'出水加料',reason:'四次修色后仍有色差，需重新判断配方'},
  {card:'DEMO-Y26091503',count:3,direction:'偏黄',depth:'偏浅',mode:'保温',reason:'多次加料改善有限，安排重新打样验证'},
  {card:'DEMO-Y26091504',count:3,direction:'偏绿',depth:'偏浅',mode:'正常加料',reason:'确认染料比例偏低，直接调整后重新对样'},
  {card:'DEMO-Y26091505',count:3,direction:'偏红',depth:'偏深',mode:'回加分散',reason:'重新打样修正主染料比例，等待现场对样'}
 ];
 return Object.fromEntries(examples.map((example,index)=>{
  const at=(hour:number,minute=0)=>new Date(Date.UTC(2026,8,14, hour-8,minute+index*5)).toISOString();
  const record:MatchingRecord={...emptyRecord(),demo:true,linkedVat:`演示${index+1}号缸`,result:'未通过',reason:example.reason,
   additions:Array.from({length:example.count},(_,batch)=>{
    const material=matchingFormula[batch%2];
    const amount=Number((0.08+index*0.02+batch*0.03).toFixed(3));
    return {code:material.code,amount,reason:`${example.direction}；${example.depth}；${example.mode}`,time:at(8+batch),depth:example.depth,direction:example.direction,mode:example.mode,
     rows:[{...material,amount,process:batch===0?'130°C 保温 10 分钟':'60°C 保温 20 分钟'}]};
   })};
  if(index>=2){
   const after=matchingFormula.map((r,i)=>({...r,ratio:i===0?Number((r.ratio!+0.15+index*0.02).toFixed(3)):r.ratio}));
   const decision:Decision={kind:index===3?'直接调整配方':'重新打样',reason:example.reason,operator:index===3?'李工（演示）':'张工（演示）',time:at(13),additionCount:example.count,before:matchingFormula.map(r=>({...r}))};
   if(index>=3){decision.after=after;record.formula=after;record.result='待对样';record.reason='';}
   if(index===4)decision.completedAt=at(15);
   record.decisions=[decision];
  }
  return [example.card,record];
 }));
}

export const displayMatchingText=(value:string)=>value.replace(/^DEMO-/i,'').replace(/（演示）|演示/g,'');

// 每种染助剂展示其最近一次加料，保留不同阶段、算法及单位的独立记录。
export function additionMaterials(record:MatchingRecord){
 const materials=new Map<string,{code:string;ratio:number|null;amount:number|null}>();
 for(const batch of record.additions){
  if(batch.rows?.length){for(const row of batch.rows)materials.set(JSON.stringify([row.stage,row.code,row.algorithm,row.unit]),{code:row.code,ratio:row.ratio,amount:row.amount});}
  else materials.set(JSON.stringify(['legacy',batch.code]),{code:batch.code,ratio:null,amount:batch.amount});
 }
 return materials.size?[...materials.values()]:[{code:'—',ratio:null,amount:null}];
}

export function matchingGroup(card:string,record:MatchingRecord){
 const index=['DEMO-Y26091501','DEMO-Y26091502','DEMO-Y26091503','DEMO-Y26091504','DEMO-Y26091505'].indexOf(card);
 return record.order&&record.colorNo?{order:record.order,color:record.colorNo}:index>=0?{order:['统忠宏20031竹','如果167','卫州175沈-312','阳光1978-1','国张711'][index],color:['灰色','出水干净元外','特殊绿色','浅蓝','浅黄'][index]}:null;
}
export function changeFormulaScope(all:Record<string,MatchingRecord>,card:string,rows:DetailRow[],bathRatio:number,scope:'card'|'order',reason:string,operator:string){
 const current=all[card];if(!current)throw new Error('流程卡不存在');
 const group=matchingGroup(card,current);if(scope==='order'&&!group)throw new Error('流程卡缺少订字或色号，无法变更订单配方');
 const next=decide(current,'直接调整配方',reason,operator,rows,{bathRatio,scope});
 const result={...all,[card]:next};
 if(scope==='order')for(const [id,record] of Object.entries(all)){
  const other=matchingGroup(id,record);
  if(id!==card&&other&&other.order===group!.order&&other.color===group!.color){
   const decision={...next.decisions!.at(-1)!,before:record.formula??matchingFormula,beforeBath:record.bathRatio??(record.demo?8:9),additionCount:record.additions.length};
   result[id]=versionMatchingFormula(record,{...record,formula:rows,bathRatio,result:'待对样',decisions:[...record.decisions??[],decision]});
  }
 }
 return result;
}
export const formulaProcess=(r:DetailRow)=>r.process??(r.stage===1?"130°C*10′":"60°C*50′ / 75°C*10′");
export const formulaPh=(r:DetailRow)=>r.ph??(r.stage===1?'3.4–5.6':'10.8–11.8');
