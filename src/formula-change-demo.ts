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
 return loadFormulaState();
}
