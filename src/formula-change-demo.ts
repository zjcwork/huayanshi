import {dyeReviewCards} from './dye-review-cards';
import {loadFormulaState,saveFormulaState,submitFormula,reviewFormula,updateReviewFormula} from './dye-formula-model';

// Stable IDs keep handled demo requests from being recreated on refresh.
export function ensureFormulaChangeDemo(now:Date=new Date()){
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
 return ensureCurrentMonthWorkspaceDemo(now);
}

// Dedicated demonstration cards do not alter the formulas on existing business cards.
function ensureCurrentMonthWorkspaceDemo(now:Date){
 const month=`${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}`;
 const monthStart=new Date(now.getFullYear(),now.getMonth(),1).getTime();
 const reasons=['染色后色光偏红，调整红染料比例','原申请需补充调整，降低助剂用量','已微调主染料，等待确认新配方','已调整浴比，等待确认实际用量','白度偏低，申请提高增白剂用量','手感偏硬，申请调整柔软处理','试缸色光稳定，确认修订配方','浴比复核完成，确认优化用量'];
 for(let index=0;index<8;index++){
  const id=`formula-change-workspace-demo-${month}-${index}`;
  if(loadFormulaState().changes.some(change=>change.id===id))continue;
  const card=`Y${month.slice(2)}9${String(index+1).padStart(3,'0')}`;
  const state=loadFormulaState(card),info=dyeReviewCards[index%dyeReviewCards.length];
  const after=structuredClone(state.approved);
  const bathChange=index%2===1;
  if(bathChange)after.bath=(after.bath??9)+1;
  else after.rows[0].ratio=Number(((after.rows[0].ratio??0)+0.08).toFixed(3));
  let next=submitFormula(state,after,reasons[index],state.version,['张敏','李强','王芳','陈杰'][index%4],bathChange?'bath':'auxiliary',[bathChange?'浴比调整':'助剂调整']);
  const requestId=next.changes[0].id;
  if(index<2)next=reviewFormula(next,requestId,false,'水木','请按复核结果重新调整配方');
  else if(index<4)next=updateReviewFormula(next,requestId,after);
  else if(index>=6)next=reviewFormula(next,requestId,true,'水木','试缸复核通过','requested');
  const submittedAt=new Date(Math.max(monthStart,now.getTime()-(index+1)*45*60*1000)).toISOString();
  const change=next.changes.find(change=>change.id===requestId)!;
  Object.assign(change,{id,source:'demo',category:'change',order:info.order,colorNo:info.colorNo,submittedAt});
  if(change.reviewedAt)change.reviewedAt=new Date(Math.min(now.getTime(),new Date(submittedAt).getTime()+20*60*1000)).toISOString();
  saveFormulaState(next);
 }
 return loadFormulaState();
}
