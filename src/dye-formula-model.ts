import {formulaNumber} from './formula-number.ts';
import {dyeReviewCards} from './dye-review-cards.ts';
export type DyeRow={key:string;stage:number;code:string;name:string;ratio:number|null;process:string;processName:string;ph:string;algorithm?:string;unit?:string};
export type Formula={bath:number|null;rows:DyeRow[]};
export type Change={vat?:string;entryWeight?:number;category?:'change'|'addition';requestType?:'bath'|'auxiliary';changeTypes?:string[];source?:string;formulaChoice?:'original'|'requested';retry?:{requestedAt:string;operator:string;reason:string;formula:Formula;completedAt?:string};reviewedFormula?:Formula;applicant?:string;colorNo?:string;dmNo?:string;formulaNo?:string;id:string;card:string;order:string;before:Formula;after:Formula;version:number;reason:string;submittedAt:string;status:'待工段长审核'|'已通过'|'已退回';reviewer?:string;reviewReason?:string;reviewedAt?:string};
export type FormulaState={card?:string;cards?:Record<string,{version:number;approved:Formula}>;version:number;approved:Formula;changes:Change[]};
export const initialDyes:DyeRow[]=[{key:'1',stage:1,code:'CP1',name:'ER-1增白剂',ratio:1.455,process:'02',processName:'130°C*10′',ph:'3.4–5.6'},{key:'2',stage:1,code:'CP2',name:'增白剂CWS',ratio:0.97,process:'',processName:'',ph:''},{key:'3',stage:2,code:'B28',name:'艳蓝 KN-RHG',ratio:0.563,process:'67',processName:'60°C*50′',ph:'10.8–11.8'},{key:'4',stage:2,code:'B10',name:'3BSN红150%',ratio:0.138,process:'',processName:'',ph:''}];
export const formulaStorage='lab-dye-formula-changes';
export const initialFormulaState=():FormulaState=>({version:0,approved:{bath:9,rows:initialDyes},changes:[]});
const defaultCard='Y2606308404';
function scoped(state:FormulaState,card:string):FormulaState{
 const info=dyeReviewCards.find(c=>c.card===card),index=dyeReviewCards.findIndex(c=>c.card===card);
 const saved=state.cards?.[card];
 return {...state,card,version:saved?.version??(card===defaultCard?state.version:0),approved:saved?.approved??(card===defaultCard?state.approved:{bath:info?.bath??9,rows:initialDyes.map((r,i)=>({...r,ratio:Number(((r.ratio??0)*(1+index*.15)).toFixed(3)),algorithm:i<2?'布重':'水量',unit:i<2?'克/市斤':'克/升'}))})};
}
export const loadFormulaState=(card=defaultCard):FormulaState=>{
 const state:FormulaState=JSON.parse(localStorage.getItem(formulaStorage)||'null')??initialFormulaState();
 const changes=state.changes.map(change=>{
  if(change.source==='demo'&&change.reason.startsWith('【模拟】'))return {...change,reason:change.reason.replace(/^【模拟】/,'')};
  return change.card==='Y2606302145-1'&&change.reason==='引用 v2 调整'?{...change,reason:'手感调整'}:change;
 });
 if(changes.some((change,index)=>change!==state.changes[index])){state.changes=changes;localStorage.setItem(formulaStorage,JSON.stringify(state));}
 return scoped(state,card);
};
export const saveFormulaState=(state:FormulaState)=>{const card=state.card??defaultCard;const cards={...state.cards,[card]:{version:state.version,approved:state.approved}};const base=cards[defaultCard];localStorage.setItem(formulaStorage,JSON.stringify({...state,card:defaultCard,cards,version:base?.version??0,approved:base?.approved??initialFormulaState().approved}));};
export const sameFormula=(a:Formula,b:Formula)=>JSON.stringify(a)===JSON.stringify(b);
export function changeFormulaNumber(change:Change){
 const effective=change.status==='已通过'&&change.formulaChoice!=='original'?(change.reviewedFormula??change.after):change.before;
 const version=change.version+(change.status==='已通过'&&!sameFormula(change.before,effective)?1:0);
 return formulaNumber(effective.bath,change.card,version);
}
export function submitFormula(state:FormulaState,after:Formula,reason:string,version:number,applicant?:string,requestType?:'bath'|'auxiliary',changeTypes?:string[]):FormulaState{
 if(version!==state.version)throw new Error('原配方已更新，请刷新后重新编辑');
 if(state.changes.some(c=>c.card===(state.card??defaultCard)&&c.status==='待工段长审核'))throw new Error('已有配方变更待审核，请勿重复提交');
 if(!reason.trim())throw new Error('请填写变更原因');
 if(!after.bath||!Number.isFinite(after.bath)||after.bath<=0||!after.rows.length||after.rows.some(r=>!r.code.trim()||!Number.isInteger(r.stage)||r.stage<1||r.ratio===null||!Number.isFinite(r.ratio)||r.ratio<0)||!after.rows.some(r=>(r.ratio??0)>0))throw new Error('请填写有效浴比、阶段、染助剂及比例');
 if(!requestType&&sameFormula(state.approved,after))throw new Error('配方尚未修改');
 return {...state,changes:[{...(requestType?{requestType}:{}),...(changeTypes?.length?{changeTypes:[...changeTypes]}:{}),id:crypto.randomUUID(),card:state.card??defaultCard,order:dyeReviewCards.find(c=>c.card===(state.card??defaultCard))?.order??'阳光1978-1',before:structuredClone(state.approved),after:structuredClone(after),version,formulaNo:formulaNumber(state.approved.bath,state.card??defaultCard,version),applicant:applicant?.trim(),reason:reason.trim(),submittedAt:new Date().toISOString(),status:'待工段长审核'},...state.changes]};
}
export function reviewFormula(state:FormulaState,id:string,pass:boolean,reviewer:string,reason:string,choice:'original'|'requested'='requested'):FormulaState{
 const change=state.changes.find(c=>c.id===id);
 if(change&&change.card!==(state.card??defaultCard))state=scoped(state,change.card);
 if(!change||change.status!=='待工段长审核')throw new Error('记录已处理，请刷新');
 if(!reviewer.trim()||(!pass&&!reason.trim()))throw new Error('请填写工段长姓名，退回时需填写原因');
 if(pass&&choice!=='original'&&change.retry&&!change.retry.completedAt)throw new Error('请先完成配方重打');
 if(change.version!==state.version)throw new Error('原配方版本已变化，请重新提交');
 const effective=choice==='original'?change.before:change.reviewedFormula??change.after;
 const changed=pass&&!sameFormula(state.approved,effective);
 return {...state,version:changed?state.version+1:state.version,approved:pass?structuredClone(effective):state.approved,changes:state.changes.map(c=>c.id===id?{...c,formulaChoice:pass?choice:undefined,...(pass?{formulaNo:formulaNumber(effective.bath,change.card,state.version+(changed?1:0))}:{}),status:pass?'已通过':'已退回',reviewer:reviewer.trim(),reviewReason:reason.trim(),reviewedAt:new Date().toISOString()}:c)};
}

export function updateReviewFormula(state:FormulaState,id:string,formula:Formula):FormulaState{
 if(!formula.bath||!Number.isFinite(formula.bath)||formula.bath<=0||!formula.rows.length||formula.rows.some(r=>!r.code.trim()||!Number.isInteger(r.stage)||r.stage<1||r.ratio===null||!Number.isFinite(r.ratio)||r.ratio<0)||!formula.rows.some(r=>(r.ratio??0)>0))throw new Error('请填写有效浴比、阶段、染助剂及比例');
 const change=state.changes.find(c=>c.id===id);
 if(change&&change.card!==(state.card??defaultCard))state=scoped(state,change.card);
 if(!change||change.status!=='待工段长审核'||change.version!==state.version)throw new Error('记录已更新，请刷新');
 return {...state,changes:state.changes.map(c=>c.id===id?{...c,reviewedFormula:structuredClone(formula),formulaNo:formulaNumber(c.before.bath,c.card,c.version)}:c)};
}

export function requestFormulaRetry(state:FormulaState,id:string,operator:string,reason:string):FormulaState{
 const c=state.changes.find(c=>c.id===id);
 if(c&&c.card!==(state.card??defaultCard))state=scoped(state,c.card);
 if(!c||c.status!=='待工段长审核'||c.version!==state.version)throw new Error('记录已更新，请刷新');
 if(!operator.trim()||!reason.trim())throw new Error('请填写工段长姓名和重打原因');
 if(c.retry&&!c.retry.completedAt)throw new Error('配方重打任务已存在');
 return {...state,changes:state.changes.map(row=>row.id===id?{...row,retry:{requestedAt:new Date().toISOString(),operator:operator.trim(),reason:reason.trim(),formula:structuredClone(row.reviewedFormula??row.after)}}:row)};
}
export function completeFormulaRetry(state:FormulaState,id:string,formula:Formula):FormulaState{
 const c=state.changes.find(c=>c.id===id);
 if(c&&c.card!==(state.card??defaultCard))state=scoped(state,c.card);
 if(!c?.retry||c.retry.completedAt||c.status!=='待工段长审核')throw new Error('重打任务已处理，请刷新');
 const next=updateReviewFormula({...state,changes:state.changes.map(row=>row.id===id?{...row,retry:{...c.retry!,completedAt:new Date().toISOString()}}:row)},id,formula);
 return next;
}
