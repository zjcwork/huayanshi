import {withOpeningFormulaDemo,normalizeOpeningDemoBath} from './opening-formula-demo.ts';
import {loadFormulaState,saveFormulaState,initialDyes,type FormulaState} from './dye-formula-model.ts';
export const vatBathRange=(_vat:string)=>({min:5,max:9});
export const bathFits=(bath:number,vat:string)=>{const r=vatBathRange(vat);return Number.isFinite(bath)&&bath>=r.min&&bath<=r.max;};
export function schedulingFormula(card:string,bath:string):FormulaState{
 const loaded=loadFormulaState(card);
 const state=normalizeOpeningDemoBath(loaded);
 if(state!==loaded)saveFormulaState(state);
 if(state.cards?.[card])return state;
 const base={...state,approved:{bath:Number(bath.split(':')[1])||null,rows:structuredClone(initialDyes)}};
 const next=normalizeOpeningDemoBath(withOpeningFormulaDemo(base));
 if(next!==base)saveFormulaState(next);
 return next;
}
