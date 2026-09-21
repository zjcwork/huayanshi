import {type FormulaState,type Change} from './dye-formula-model.ts';
export const openingDemoCard='Y2606302145-1';
export const openingDemoUsage:Record<number,{card:string;weight:number;completed:boolean;currentProcess?:string}|null>={
 0:{card:'Y2606302145',weight:420,completed:true},
 1:null,
 2:{card:'Y2606302146',weight:450,completed:false,currentProcess:'染色'},
 3:{card:'Y2606302147',weight:480,completed:false,currentProcess:'上油定型'},
};
export function withOpeningFormulaDemo(state:FormulaState):FormulaState{
 if(state.card!==openingDemoCard||state.cards?.[openingDemoCard]||state.version!==0||state.changes.some(c=>c.card===openingDemoCard))return state;
 const v0=structuredClone(state.approved);
 const v1={...structuredClone(v0),bath:8};
 const v2={...structuredClone(v1),rows:v1.rows.map(r=>({...r,ratio:r.code==='B28'?0.615:r.code==='B10'?0.125:r.ratio}))};
 const v3={...structuredClone(v2),bath:7,rows:v2.rows.map(r=>({...r,...(r.code==='B28'?{process:'68',processName:'60°C*60′',ph:'10.5–11.2'}:{})}))};
 const formulas=[v0,v1,v2,v3];
 const reasons=['匹配排产缸容量，浴比由 1:9 调整为 1:8','修正色光','浴比调整为 1:7，延长保温至 60 分钟并调整 pH'];
 const changes:Change[]=reasons.map((reason,index)=>({id:`opening-demo-change-${index+1}`,card:openingDemoCard,order:'芹王AE',colorNo:'薄荷绿',source:'开卡审核模拟',before:formulas[index],after:formulas[index+1],version:index,reason,applicant:'水木',submittedAt:`2026-09-17T0${index+1}:00:00.000Z`,status:'已通过',reviewer:'水木',reviewedAt:`2026-09-17T0${index+1}:30:00.000Z`,formulaChoice:'requested'}));
 return {...state,version:3,approved:v3,changes:[...changes.reverse(),...state.changes]};
}

// Keep this demonstration's historical and current bath ratios consistent.
export function normalizeOpeningDemoBath(state:FormulaState):FormulaState{
 if(state.card!==openingDemoCard||!state.changes.some(c=>c.card===openingDemoCard&&c.source==='开卡审核模拟'))return state;
 const changes=state.changes.map(change=>change.card===openingDemoCard&&change.source==='开卡审核模拟'?{
  ...change,before:{...change.before,bath:7},after:{...change.after,bath:7},
  reason:change.version===0?'匹配排产缸容量':change.version===1?'修正色光':change.version===2?'延长保温至 60 分钟并调整 pH':change.reason,
 }:change);
 const next={...state,approved:{...state.approved,bath:7},changes,cards:state.cards?.[openingDemoCard]?{...state.cards,[openingDemoCard]:{...state.cards[openingDemoCard],approved:{...state.cards[openingDemoCard].approved,bath:7}}}:state.cards};
 return JSON.stringify(next)===JSON.stringify(state)?state:next;
}
