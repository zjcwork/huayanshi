import {matchingFormula,readRecords,storageKey,type MatchingRecord,type AdditionBatch} from './matching-model';
import {formulaSnapshot,warehouseKey,type WarehouseLog} from './warehouse-model';
const marker='lab-warehouse-demo-v1';
export function readWarehouseRecords(){
 const records=readRecords();
 const identities=[{order:'芹王AE',colorNo:'薄荷绿'},{order:'国张711',colorNo:'测试826'},{order:'阳光1978-1',colorNo:'2#中灰'},{order:'JS-908078',colorNo:'浅蓝1#'},{order:'芹王TEST',colorNo:'暮蓝'}];
 let filled=false;
 identities.forEach((identity,index)=>{const id=`DEMO-Y2609150${index+1}`,record=records[id];if(record?.demo&&(!record.order||!record.colorNo)){records[id]={...record,order:record.order||identity.order,colorNo:record.colorNo||identity.colorNo};filled=true}});
 if(filled)localStorage.setItem(storageKey,JSON.stringify(records));
 if(localStorage.getItem(marker))return addDemoBatches(records);
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
 return addDemoBatches(records);
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
