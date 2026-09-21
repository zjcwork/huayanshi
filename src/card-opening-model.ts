import {sameFormula,type Formula,type FormulaState} from './dye-formula-model.ts';
import type {Job} from './schedule-model.ts';
export const unopenedPlan=(job:Job)=>job.state!=='running'&&!job.converted;
export function formulaVersions(state:FormulaState,card:string){
 const versions=new Map<number,{version:number;formula:Formula;date:string;reason:string}>();
 for(const change of [...state.changes].reverse().filter(c=>c.card===card)){
  if(!versions.has(change.version))versions.set(change.version,{version:change.version,formula:change.before,date:'',reason:change.version===0?'初始配方':'历史配方'});
  if(change.status==='已通过'){
   const formula=change.formulaChoice==='original'?change.before:change.reviewedFormula??change.after;
   if(!sameFormula(change.before,formula))versions.set(change.version+1,{version:change.version+1,formula,date:change.reviewedAt??'',reason:change.reason});
  }
 }
 versions.set(state.version,{version:state.version,formula:state.approved,date:versions.get(state.version)?.date??'',reason:versions.get(state.version)?.reason??'初始配方'});
 return [...versions.values()].sort((a,b)=>b.version-a.version);
}
