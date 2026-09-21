export const displayProcessCard=(card:string)=>card.replace(/^DEMO-JC(\d{6})(\d{2})$/,(_,date,sequence)=>`Y${date}${sequence.padStart(4,'0')}`).replace(/^DEMO-(Y\d+)$/,'$1');
export type FormulaNumberRegistry={cards:Record<string,{date:string;serial:number}>;counters:Record<string,number>};
export const formulaNumberStorage='lab-formula-number-registry-v2';
const emptyRegistry=():FormulaNumberRegistry=>({cards:{},counters:{}});
// Non-browser callers (model tests) use an isolated in-memory registry.
let memoryRegistry=emptyRegistry();
const dateCode=(now:Date)=>`${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
export function allocateFormulaIdentity(registry:FormulaNumberRegistry,card:string,date:string):FormulaNumberRegistry{
 if(registry.cards[card])return registry;
 const highest=Math.max(registry.counters[date]??0,...Object.values(registry.cards).filter(r=>r.date===date).map(r=>r.serial));
 return {cards:{...registry.cards,[card]:{date,serial:highest+1}},counters:{...registry.counters,[date]:highest+1}};
}
export function formulaNumber(bath:number|null|undefined,card:string,version=0,now=new Date()){
 if(!bath||!Number.isFinite(bath)||bath<=0||!card)return '—';
 const registry:FormulaNumberRegistry=typeof localStorage==='undefined'?memoryRegistry:JSON.parse(localStorage.getItem(formulaNumberStorage)||'null')??emptyRegistry();
 const next=allocateFormulaIdentity(registry,card,dateCode(now));
 if(next!==registry){if(typeof localStorage==='undefined')memoryRegistry=next;else localStorage.setItem(formulaNumberStorage,JSON.stringify(next));}
 const identity=next.cards[card];
 const bathCode=String(bath).replace(/^\d+/,value=>value.padStart(2,'0'));
 return `C${bathCode}${identity.date.slice(-6)}${String(identity.serial).padStart(3,'0')}v${version}`;
}
