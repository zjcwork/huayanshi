import {dyeReviewCards} from './dye-review-cards';
import {loadFormulaState,saveFormulaState,submitFormula} from './dye-formula-model';

// Stable IDs keep handled demo requests from being recreated on refresh.
export function ensureFormulaChangeDemo(){
 const reasons=['染缸装载量调整，浴比增加1，申请重新核定用量','对样颜色偏浅，艳蓝用量提高8%','色光偏红，红染料用量降低10%','手感偏硬，补充柔软剂改善手感','工艺优化，浴比降低1并微调增白剂比例'];
 dyeReviewCards.slice(0,5).forEach((card,index)=>{
  const state=loadFormulaState(card.card),id=`formula-change-demo-v1-${card.card}`;
  if(state.changes.some(change=>change.id===id||change.card===card.card&&change.status==='待工段长审核'))return;
  const after=structuredClone(state.approved);
  if(index===0)after.bath=(after.bath??9)+1;
  if(index===1){const row=after.rows.find(row=>row.code==='B28')??after.rows[0];row.ratio=Number(((row.ratio??0)*1.08+0.001).toFixed(3));}
  if(index===2){const row=after.rows.find(row=>row.code==='B10')??after.rows[0];row.ratio=Number(((row.ratio??0)*0.9).toFixed(3));if(row.ratio===0)after.bath=(after.bath??9)+1;}
  if(index===3)after.rows.push({key:`${id}-softener`,stage:3,code:'DEMO-SOFT',name:'柔软剂（模拟）',ratio:1.2,algorithm:'水量',unit:'克/升',process:'',processName:'',ph:'5.0–6.0'});
  if(index===4){after.bath=Math.max(1,(after.bath??8)-1);after.rows[0].ratio=Number(((after.rows[0].ratio??0)+0.05).toFixed(3));}
  const next=submitFormula(state,after,reasons[index],state.version,['张敏','李强','王芳','陈杰','刘洋'][index]);
  Object.assign(next.changes[0],{id,source:'demo',colorNo:card.colorNo,submittedAt:new Date(Date.now()-index*35*60*1000).toISOString()});
  saveFormulaState(next);
 });
 const additions=[
  {card:'Y2606308511',vat:'J01#',entryWeight:480,code:'B28',amount:0.08,reason:'首缸对色偏浅，申请补加艳蓝 KN-RHG 0.08 克/升',applicant:'张敏'},
  {card:'Y2606308512',vat:'J03#',entryWeight:360,code:'CP1',amount:0.12,reason:'白度不足，申请补加 ER-1增白剂 0.12 克/市斤',applicant:'李强'},
  {card:'Y2606308513',vat:'J05#',entryWeight:600,code:'B10',amount:0.05,reason:'色光偏绿，申请补加 3BSN红150% 0.05 克/升',applicant:'王芳'},
 ];
 additions.forEach((addition,index)=>{
  const card=dyeReviewCards.find(card=>card.card===addition.card)!;
  const state=loadFormulaState(card.card),id=`formula-addition-demo-v1-${card.card}`;
  const existing=state.changes.find(change=>change.id===id);
  if(existing){
   if(!existing.vat||existing.entryWeight==null){existing.vat??=addition.vat;existing.entryWeight??=addition.entryWeight;saveFormulaState(state);}
   return;
  }
  if(state.changes.some(change=>change.id===id||change.card===card.card&&change.status==='待工段长审核'))return;
  const after=structuredClone(state.approved);
  const row=after.rows.find(row=>row.code===addition.code)!;
  row.ratio=Number(((row.ratio??0)+addition.amount).toFixed(3));
  const next=submitFormula(state,after,addition.reason,state.version,addition.applicant);
  Object.assign(next.changes[0],{id,category:'addition',source:'demo',vat:addition.vat,entryWeight:addition.entryWeight,colorNo:card.colorNo,submittedAt:new Date(Date.now()-index*25*60*1000).toISOString()});
  saveFormulaState(next);
 });
 // Backfill vat/weight for the existing demonstration change requests as well.
 const state=loadFormulaState();
 const planInfo:Record<string,{vat:string;entryWeight:number}>={
  Y2606308404:{vat:'J02#',entryWeight:600},
  Y2606303701:{vat:'J01#',entryWeight:360},
  Y2606303704:{vat:'J04#',entryWeight:480},
  Y2606305746:{vat:'J05#',entryWeight:300},
  Y2606305709:{vat:'J03#',entryWeight:720},
 };
 let updated=false;
 state.changes=state.changes.map(change=>{
  const info=planInfo[change.card];
  if(!info||change.vat&&change.entryWeight!=null)return change;
  updated=true;
  return {...change,vat:change.vat||info.vat,entryWeight:change.entryWeight??info.entryWeight};
 });
 if(updated)saveFormulaState(state);
 return state;
}
