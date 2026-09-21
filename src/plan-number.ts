import type {Job} from './schedule-model';
// Keep the plan number stable when the list is filtered, reordered, or reviewed.
const storageKey='lab-plan-number-registry';
export function planNumber(plan:Job):string{
 const registry:Record<string,string>=JSON.parse(localStorage.getItem(storageKey)||'{}');
 if(registry[plan.id])return registry[plan.id];
 const now=new Date();
 const date=/^Y(\d{6})/.exec(plan.card)?.[1]??`${String(now.getFullYear()).slice(-2)}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
 const prefix=`PD${date}`;
 const sequence=Math.max(98,...Object.values(registry).filter(value=>value.startsWith(prefix)).map(value=>Number(value.slice(prefix.length))||0))+1;
 const number=`${prefix}${String(sequence).padStart(3,'0')}`;
 localStorage.setItem(storageKey,JSON.stringify({...registry,[plan.id]:number}));
 return number;
}
