import {matchingFormulaNumber,matchingFormula,readRecords,storageKey,type MatchingRecord,type AdditionBatch} from './matching-model';
import {formulaSnapshot,warehouseKey,type WarehouseLog} from './warehouse-model';
const marker='lab-warehouse-demo-v1';
export function readWarehouseRecords(){
 const records=readRecords();
 const identities=[{order:'芹王AE',colorNo:'薄荷绿'},{order:'国张711',colorNo:'测试826'},{order:'阳光1978-1',colorNo:'2#中灰'},{order:'JS-908078',colorNo:'浅蓝1#'},{order:'芹王TEST',colorNo:'暮蓝'}];
 let filled=false;
 identities.forEach((identity,index)=>{const id=`DEMO-Y2609150${index+1}`,record=records[id];if(record?.demo&&(!record.order||!record.colorNo)){records[id]={...record,order:record.order||identity.order,colorNo:record.colorNo||identity.colorNo};filled=true}});
 if(filled)localStorage.setItem(storageKey,JSON.stringify(records));
 if(localStorage.getItem(marker))return addRepairDemos(updateChangedDemoRatios(addChangedDemos(addDemoBatches(records))));
 const log:WarehouseLog=JSON.parse(localStorage.getItem(warehouseKey)||'{}');
 const demos=[{order:'国张711',color:'测试826',bath:8},{order:'芹王AE',color:'薄荷绿',bath:6},{order:'阳光1978-1',color:'2#中灰',bath:9},{order:'项发666',color:'hong',bath:7},{order:'JS-908078',color:'浅蓝1#',bath:8},{order:'芹王TEST',color:'暮蓝',bath:10}];
 demos.forEach((d,i)=>{
  const card=`DEMO-JC2609170${i+1}`;
  if(records[card])return;
  const record:MatchingRecord={order:d.order,colorNo:d.color,demo:true,bathRatio:d.bath,linkedVat:'',result:i===2?'通过并直送':'通过',reason:'演示数据：对样已通过，等待进仓核对',additions:[],resamples:[],formula:matchingFormula.map((r,j)=>({...r,ratio:Number(((r.ratio??0)*(1+i*.12)).toFixed(3)),process:j===0?'02':j===2?'67':'',ph:j===0?'3.4–5.6':j===2?'10.8–11.8':''}))};
  records[card]=record;
  if(i>=4&&!log[card])log[card]=[{action:'确认',operator:i===4?'张工（演示）':'李工（演示）',time:new Date(Date.now()-(i+1)*3600000).toISOString(),reason:'演示记录：配方、浴比及色号核对一致',snapshot:formulaSnapshot(record)}];
 });
 localStorage.setItem(storageKey,JSON.stringify(records));
 localStorage.setItem(warehouseKey,JSON.stringify(log));
 localStorage.setItem(marker,'1');
 return addRepairDemos(updateChangedDemoRatios(addChangedDemos(addDemoBatches(records))));
}

function addDemoBatches(records:Record<string,MatchingRecord>){
 const key='lab-warehouse-additions-demo-v1';
 if(localStorage.getItem(key))return records;
 const history:WarehouseLog=JSON.parse(localStorage.getItem(warehouseKey)||'{}');
 for(let i=0;i<3;i++){
  const card=`DEMO-JC2609170${i+1}`,record=records[card];
  if(!record?.demo||record.additions.length||history[card]?.length)continue;
  const formula=record.formula??matchingFormula;
  const batches:AdditionBatch[]=Array.from({length:i+1},(_,j)=>{
   const material=formula.find(r=>r.code===(j===1?'CP2':'CP1'))??formula[0];
   const amount=[0.08,0.11,0.14][j];
   const process=j===0?'130°C 保温 10 分钟':'60°C 保温 20 分钟';
   return {code:material.code,amount,reason:j===1?'色光偏红，调整配比':'颜色偏浅，补充染料',time:new Date(Date.now()-(6-j)*3600000).toISOString(),mode:'正常加料',depth:'偏浅',direction:j===1?'偏红':'偏蓝',rows:[{...material,key:`warehouse-demo-${i}-${j}`,ratio:amount,amount,process}]};
  });
  records[card]={...record,additions:batches};
 }
 localStorage.setItem(storageKey,JSON.stringify(records));
 localStorage.setItem(key,'1');
 return records;
}

function addChangedDemos(records:Record<string,MatchingRecord>){
 const key='lab-warehouse-changed-demo-v1';
 if(localStorage.getItem(key))return records;
 const history:WarehouseLog=JSON.parse(localStorage.getItem(warehouseKey)||'{}');
 const cases=[{order:'国张711',colorNo:'测试826',code:'B28',ratio:0.635,reason:'色光偏浅，提高蓝色染料比例'},
  {order:'芹王AE',colorNo:'薄荷绿',code:'B10',ratio:0.112,reason:'色光偏红，降低红色染料比例'},
  {order:'阳光1978-1',colorNo:'2#中灰',code:'CP1',ratio:1.62,reason:'调整浴比及增白剂比例'}];
 cases.forEach((item,index)=>{
  const head=`DEMO-JC260921${11+index}`,card=`DEMO-JC260921${21+index}`;
  if(records[head]||records[card]||history[head]||history[card])return;
  const before:MatchingRecord={demo:true,productionKind:'头缸',order:item.order,colorNo:item.colorNo,bathRatio:8,formulaVersion:0,linkedVat:'',result:'通过',reason:'头缸配方已确认',additions:[],resamples:[],formula:matchingFormula.map((row,i)=>({...row,process:i===0?'02':i===2?'67':'',ph:i===0?'3.4–5.6':i===2?'10.8–11.8':''}))};
  const actual:MatchingRecord={...structuredClone(before),productionKind:'连缸',linkedVat:head,formulaVersion:1,bathRatio:index===2?9:8,reason:item.reason,formula:before.formula!.map(row=>({...row,ratio:row.code===item.code?item.ratio:row.ratio}))};
  const at=(hours:number)=>new Date(Date.now()-hours*3600000).toISOString();
  records[head]=before;records[card]=actual;
  history[head]=[{action:'确认',operator:'水木',time:at(24),reason:'头缸对样通过，配方确认',snapshot:formulaSnapshot(before),formulaNo:matchingFormulaNumber(head,before)}];
  history[card]=[{action:'调整',operator:'水木',time:at(index+1),reason:item.reason,before:formulaSnapshot(before),snapshot:formulaSnapshot(actual),beforeFormulaNo:matchingFormulaNumber(card,before),formulaNo:matchingFormulaNumber(card,actual)}];
 });
 localStorage.setItem(storageKey,JSON.stringify(records));localStorage.setItem(warehouseKey,JSON.stringify(history));localStorage.setItem(key,'1');
 return records;
}

function updateChangedDemoRatios(records:Record<string,MatchingRecord>){
 const key='lab-warehouse-changed-ratios-v1';
 if(localStorage.getItem(key))return records;
 const history:WarehouseLog=JSON.parse(localStorage.getItem(warehouseKey)||'{}');
 for(let index=0;index<3;index++){
  const card=`DEMO-JC2609170${index+1}`,record=records[card];
  // Only upgrade untouched example records; preserve saved user edits and reviews.
  if(!record?.demo||record.formulaVersion||history[card]?.length||record.decisions?.length||!record.formula||!['通过','通过并直送'].includes(record.result))continue;
  const before=structuredClone(record);
  const ratios=[{CP1:1.535,B28:0.615},{CP1:1.72,CP2:1.16,B10:0.142},{CP1:1.92,B28:0.735,B10:0.155}][index] as Record<string,number>;
  const actual:MatchingRecord={...record,productionKind:'连缸',formulaVersion:1,formula:record.formula.map(row=>({...row,ratio:ratios[row.code]??row.ratio}))};
  records[card]=actual;
  history[card]=[{action:'调整',operator:'水木',time:new Date().toISOString(),reason:'根据对样结果调整染助剂比例，复核后通过',before:formulaSnapshot(before),snapshot:formulaSnapshot(actual),beforeFormulaNo:matchingFormulaNumber(card,before),formulaNo:matchingFormulaNumber(card,actual)}];
 }
 localStorage.setItem(storageKey,JSON.stringify(records));localStorage.setItem(warehouseKey,JSON.stringify(history));localStorage.setItem(key,'1');
 return records;
}

function addRepairDemos(records:Record<string,MatchingRecord>){
 const key='lab-warehouse-repair-demo-v1';
 if(localStorage.getItem(key))return records;
 const history:WarehouseLog=JSON.parse(localStorage.getItem(warehouseKey)||'{}');
 const cases=[
  {order:'国张711',colorNo:'测试826',reason:'色光偏红，调整蓝红比例后回修对样通过',ratios:{B28:0.685,B10:0.105},bath:8},
  {order:'芹王AE',colorNo:'薄荷绿',reason:'颜色偏浅，补充增白剂并调整浴比，回修后对样通过',ratios:{CP1:1.68,CP2:1.08},bath:9},
  {order:'阳光1978-1',colorNo:'2#中灰',reason:'缸差回修，调整染料比例并延长保温，对样通过',ratios:{B28:0.625,B10:0.162},bath:8},
 ];
 cases.forEach((item,index)=>{
  const card=`Y26092100${31+index}H-1`;
  if(records[card]||history[card])return;
  const before:MatchingRecord={demo:true,productionKind:'回修',order:item.order,colorNo:item.colorNo,formulaVersion:0,bathRatio:8,linkedVat:'',result:'未通过',reason:item.reason,additions:[],resamples:[],formula:matchingFormula.map((row,i)=>({...row,process:i===0?'02':i===2?'67':'',ph:i===0?'3.4–5.6':i===2?'10.8–11.8':''}))};
  const ratios:Partial<Record<string,number>>=item.ratios;
  const actual:MatchingRecord={...structuredClone(before),formulaVersion:1,bathRatio:item.bath,result:'通过',formula:before.formula!.map(row=>({...row,ratio:ratios[row.code]??row.ratio,...(index===2&&row.code==='B28'?{process:'60°C*60′'}:{})}))};
  records[card]=actual;
  history[card]=[{action:'调整',operator:'水木',time:new Date(Date.now()-(index+1)*3600000).toISOString(),reason:item.reason,before:formulaSnapshot(before),snapshot:formulaSnapshot(actual),beforeFormulaNo:matchingFormulaNumber(card,before),formulaNo:matchingFormulaNumber(card,actual)}];
 });
 localStorage.setItem(storageKey,JSON.stringify(records));localStorage.setItem(warehouseKey,JSON.stringify(history));localStorage.setItem(key,'1');
 return records;
}
