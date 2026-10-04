import type {OpeningReview} from './formula-query-model.ts';
export type Job={planNo?:string;processNo?:string;linkedAdditionInfo?:string;repairInfo?:string;openingReview?:OpeningReview;id:string;vat:string;slot:number;card:string;order:string;color:string;depth:string;hex:string;state:'running'|'ready'|'planned'|'waiting';next:string;hours:number;urgent:boolean;pieces?:number;entryWeight?:string|number;head?:string;converted?:boolean;completed?:boolean;currentProcess?:string};
const toPlanNumber=(card:string)=>card.startsWith('PD')?card:card.startsWith('Y')?`PD${card.slice(1)}`:`PD${card}`;
export const displayScheduleNumber=(job:Pick<Job,'state'|'card'|'planNo'>)=>job.state==='waiting'?(job.planNo??toPlanNumber(job.card)):job.card;
export const vats=Array.from({length:16},(_,i)=>`J${String(i+1).padStart(2,'0')}#`);
const names=['芹王AE','芹王TEST','项阳CVC2602','阳光1978-1','如华12362A','国华900-6','明帅24021','隆BS精1','统帛411','平月230'];
const colors=['白银','紫灰','薄荷绿','驼色','中灰','浅蓝','灰色','深蓝'];
const seed:Job[]=vats.flatMap((vat,i)=>Array.from({length:i===0?8:i%5===0?5:3+i%2},(_,slot):Job=>({id:`${vat}-${slot}`,vat,slot,card:slot===0?['Y2608307405','Y2609010017','Y2609017005','Y2608300301'][i%4]:`Y260630${String(2108+i*113+slot*37).padStart(4,'0')}${slot===1?'-1':''}`,order:slot===0?'':names[(i+slot-1)%names.length],color:slot===0?'':colors[(i+slot-1)%colors.length],depth:slot===0?'':slot%3===0?'深色':i%3===0?'浅色':'中色',hex:slot===0?'#515962':['#f4ffff','#c55078','#98bf92','#434b4d','#051927','#24316f'][(i+slot-1)%6],state:slot===0?'running':slot===1||i>1&&slot<4?'ready':slot>5?'waiting':'planned',next:i%3===0?'减量':i%3===1?'中和':'白坯发货',hours:slot*6-6,urgent:slot===1&&i===7||slot===2&&i===8}))).filter(job=>job.slot!==5);
export const readScheduleJobs=():Job[]=>{let result:Job[];try{const x=JSON.parse(localStorage.getItem('lab-dye-schedule')||'null');result=Array.isArray(x)?[...x]:[...seed];const cleanupKey='lab-dye-schedule-slot-6-cleanup-v1';if(localStorage.getItem(cleanupKey)!=='1'){result=result.filter(job=>job.slot!==5);localStorage.setItem('lab-dye-schedule',JSON.stringify(result));localStorage.setItem(cleanupKey,'1')}}catch{result=[...seed]}const waitingId='j03-waiting-demo-v1';
 if(!result.some(job=>job.id===waitingId)){
  const slot=[3,4,6,7].find(slot=>!result.some(job=>job.vat==='J03#'&&job.slot===slot));
  if(slot!==undefined)result.push({id:waitingId,vat:'J03#',slot,card:'Y2606308520',order:'锦丰903',color:'中灰',depth:'中色',hex:'#90969c',state:'waiting',next:'染色',hours:slot*6,urgent:false,pieces:8,entryWeight:480,linkedAdditionInfo:'加料1次',repairInfo:'无回修'});
 }
 if(!result.some(job=>job.vat==='J01#'&&job.slot===5))result.push({id:'j01-slot-6-plan-demo-v1',vat:'J01#',slot:5,card:'Y261004001',planNo:'PD261004001',order:'统帛411',color:'白银',depth:'浅色',hex:'#a9d7bd',state:'waiting',next:'减量',hours:24,urgent:false,pieces:8,entryWeight:425,linkedAdditionInfo:'无加料',repairInfo:'无回修'});
 vats.forEach((vat,index)=>{
  if(result.some(job=>job.vat===vat&&job.state==='waiting'))return;
  const vatJobs=result.filter(job=>job.vat===vat),slot=Math.max(-1,...vatJobs.map(job=>job.slot))+1;
  if(slot>7)return;
  result.push({id:`${vat}-waiting-plan-demo-v1`,vat,slot,card:`Y261004${String(index+1).padStart(3,'0')}`,planNo:`PD261004${String(index+1).padStart(3,'0')}`,order:names[(index+4)%names.length],color:colors[(index+4)%colors.length],depth:index%3===0?'浅色':index%3===1?'中色':'深色',hex:['#a9d7bd','#7b8593','#263b69'][index%3],state:'waiting',next:index%3===0?'减量':index%3===1?'中和':'白坯发货',hours:slot*6,urgent:false,pieces:6+index%5,entryWeight:420+index*5,linkedAdditionInfo:'无加料',repairInfo:'无回修'});
 });
 result=result.map(job=>{const normalized=job.id===waitingId?{...job,processNo:job.processNo??'G260922004',linkedAdditionInfo:job.linkedAdditionInfo??'加料1次',repairInfo:job.repairInfo??'无回修'}:job;return normalized.state==='waiting'?{...normalized,planNo:normalized.planNo??toPlanNumber(normalized.card)}:normalized});
 try{localStorage.setItem('lab-dye-schedule',JSON.stringify(result))}catch{/* Keep the demo readable when browser storage is unavailable. */}
 return result;};
