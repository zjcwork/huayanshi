import type {Job} from './schedule-model';
export const capacityDevices=['平蒸机','酶退-退煮机','冷堆机','精炼机','磨毛机','丝光机','烧毛机','染缸','脱水机','开幅机','定型机','烘干机','轧光机','缩绒机','预缩机','蒸呢机','空拉机','喷布机','装箱机','打卷机'];
const demoHours=[17.65,16.55,8.16,0,0.92,0,13.93,20.6,10.33,14.5,25.09,6.3,12.76,11.16,7.19,11.12,15.26,12.14,10.75,13.25];
// Explicit local demo routes. Saved operations remain stable when another plan is cancelled.
export function attachDemoDeviceOperations(jobs:Job[]):Job[]{
 const routes=jobs.map((job,index)=>job.deviceOperations?.map(operation=>operation.device)??[index%7,7,8,9,10,11+index%9]);
 return jobs.map((job,index)=>job.deviceOperations?job:{...job,deviceOperations:routes[index].map(device=>{
  const members=routes.flatMap((route,i)=>route.includes(device)?[i]:[]);
  const total=Math.round(demoHours[device]*100),share=Math.floor(total/members.length),remainder=total%members.length;
  return {device,hours:(share+(members.indexOf(index)<remainder?1:0))/100};
 })});
}
export function deviceTotals(jobs:Job[],inProgress=false){return capacityDevices.map((_,device)=>Math.round(jobs.filter(job=>!inProgress||job.state==='running').reduce((sum,job)=>sum+(job.deviceOperations?.find(operation=>operation.device===device)?.hours??0),0)*100)/100)}
