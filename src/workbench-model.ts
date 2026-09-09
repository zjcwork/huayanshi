export type Phase = '待审核' | '订单退回' | '待分配' | '已分配' | '进行中' | '待确认' | '已完成';
export type Team = '甲班' | '乙班' | '丙班';
export type Cloth = '无需带布' | '待带布' | '带布中' | '已完成';
export type Recipe = {code:string;name:string;ratio:number;unit:string};
export type WorkItem = {id:string;processCard?:string;additionCount?:number;order:string;kind:'大货'|'预打样'|'回修'|'复样';product:string;color:string;colorNo:string;swatch:string;depth:string;team:Team;phase:Phase;worker:string|null;due:string;created:string;urgent:boolean;returns:number;lastReason:string;cloth:Cloth;clothDue:string;clothOwner:string;formula:Recipe[];version:number;logs:{time:string;event:string;note:string}[]};
export const teamMembers:{name:string;team:Team;capacity:number}[]=[{name:'姜诗林',team:'甲班',capacity:8},{name:'钟伟祥',team:'甲班',capacity:6},{name:'沈锋',team:'甲班',capacity:8},{name:'章良军',team:'甲班',capacity:6},{name:'戚兴锋',team:'乙班',capacity:8},{name:'陈凯',team:'乙班',capacity:6},{name:'余海滨',team:'乙班',capacity:6},{name:'沈宇',team:'丙班',capacity:8},{name:'俞秋锋',team:'丙班',capacity:6}];
export const pendingCloth=(t:WorkItem)=>t.cloth==='待带布'||t.cloth==='带布中';
export const isAssigned=(t:WorkItem)=>!!t.worker&&['已分配','进行中','待确认'].includes(t.phase);
export const isOverdue=(t:WorkItem,now=Date.now())=>['待分配','已分配','进行中','待确认'].includes(t.phase)&&new Date(t.due).getTime()<now;
export const isRepeated=(t:WorkItem)=>t.returns>=2&&t.phase!=='已完成';
export function workCounts(rows:WorkItem[],now=Date.now()) {return {bulk:rows.filter(t=>t.phase==='待审核'&&t.kind==='大货').length,pre:rows.filter(t=>t.phase==='待审核'&&t.kind==='预打样').length,unassigned:rows.filter(t=>t.phase==='待分配').length,assigned:rows.filter(isAssigned).length,running:rows.filter(t=>t.phase==='进行中').length,confirm:rows.filter(t=>t.phase==='待确认').length,overdue:rows.filter(t=>isOverdue(t,now)).length,repeated:rows.filter(isRepeated).length,cloth:rows.filter(pendingCloth).length};}
export type WorkAction={type:'approve-order'}|{type:'reject-order';reason:string}|{type:'assign';worker:string}|{type:'start'}|{type:'submit';formula:Recipe[]}|{type:'confirm'}|{type:'return';reason:string}|{type:'cloth-done'}|{type:'urge'};
export function applyWorkAction(row:WorkItem,action:WorkAction,now=new Date().toISOString()):WorkItem{
 const next={...row,logs:[...row.logs]}; let event='',note='';
 const requirePhase=(...phases:Phase[])=>{if(!phases.includes(row.phase))throw new Error('当前状态不支持此操作，请刷新后重试')};
 switch(action.type){
 case 'approve-order':requirePhase('待审核');next.phase='待分配';event='订单审核通过';note='已自动生成待分配任务';break;
 case 'reject-order':requirePhase('待审核');if(!action.reason.trim())throw new Error('请填写退回原因');next.phase='订单退回';event='订单退回';note=action.reason.trim();next.lastReason=note;break;
 case 'assign':requirePhase('待分配','已分配');{const member=teamMembers.find(w=>w.name===action.worker);if(!member||member.team!==row.team)throw new Error('请选择任务所属班组的打样员');next.worker=member.name;next.phase='已分配';event='任务已分配';note=`分配给${member.name}`;}break;
 case 'start':requirePhase('已分配');next.phase='进行中';event='开始打样';note=`${row.worker}已开始处理`;break;
 case 'submit':requirePhase('进行中');if(!action.formula.length||action.formula.some(r=>!r.code||!Number.isFinite(r.ratio)||r.ratio<=0))throw new Error('请填写有效的染助剂和比例');next.formula=action.formula.map(r=>({...r}));next.phase='待确认';next.version+=1;event='配方已提交';note=`${row.worker}提交第${next.version}版配方`;break;
 case 'confirm':requirePhase('待确认');next.phase='已完成';event='配方确认通过';note=`第${row.version}版配方已确认${pendingCloth(row)?'，带布仍需继续跟进':''}`;break;
 case 'return':requirePhase('待确认');if(!action.reason.trim())throw new Error('请填写退回原因');next.phase='进行中';next.returns+=1;next.lastReason=action.reason.trim();event=`配方第${next.returns}次退回`;note=next.lastReason;break;
 case 'cloth-done':if(!pendingCloth(row))throw new Error('该任务当前无需完成带布');next.cloth='已完成';event='带布已完成';note=`带布负责人：${row.clothOwner}`;break;
 case 'urge':event='已记录催办';note=`跟进人：水木；责任人：${pendingCloth(row)?row.clothOwner:row.worker||row.team}`;break;
 }
 next.logs.unshift({time:now,event,note});return next;
}
export function seedWorkItems(now=Date.now()):WorkItem[]{
 const phases:Phase[]=[...Array(7).fill('待审核'),...Array(5).fill('待审核'),...Array(8).fill('待分配'),...Array(5).fill('已分配'),...Array(10).fill('进行中'),...Array(6).fill('待确认'),...Array(3).fill('已完成')];
 const names=['国张711','芹王AE','阳光1978-1','阿建91079','JS-905613','项阳CVC2602','BS7H-35','芹王TEST','项发666','张屹5955','平月1501','工荣成弹'];
 const colors=[['浅黄','测试826','#c1ac60','浅色'],['薄荷绿','薄荷绿','#9fbe9c','浅色'],['中灰','9#还固','#888b91','中色'],['浅红','1','#cc6b89','浅色'],['藏青','M26053-21','#39445c','深色'],['翠绿','hong','#92ba66','特殊色']];
 return phases.map((phase,i)=>{const team:Team=i%5===4?'丙班':i%3===2?'乙班':'甲班',members=teamMembers.filter(m=>m.team===team),worker=i>=20?members[i%members.length].name:null,c=colors[i%6],repeated=[26,28,32,35,38].includes(i),cloth=[23,25,26,28,30,33,35,37,40,41].includes(i),created=new Date(now-(48+i)*3600000).toISOString();return {id:`SY${new Date(now).getFullYear()}${String(9001+i)}`,processCard:i>=20?`Y260908${String(4001+i).padStart(4,'0')}`:undefined,additionCount:i>=20?([24,27,30,35,38].includes(i)?2:i===32?3:i%3===0?1:0):0,order:names[i%names.length],kind:i<7?'大货':i<12?'预打样':(['大货','预打样','回修','复样'] as const)[i%4],product:['T/C纬弹','短纤与棉','T/R四面弹'][i%3],color:c[0],colorNo:c[1],swatch:c[2],depth:c[3],team,phase,worker,due:new Date(now+(i>=12&&i<41&&i%3===0?-(i%12+2):i%16+3)*3600000).toISOString(),created,urgent:i%7===0,returns:repeated?(i%2===0?3:2):i===27?1:0,lastReason:repeated?['色光偏红，调整蓝料比例后复打','深浅与客样不符，需重新对色','牢度未达要求，需调整助剂'][i%3]:'',cloth:cloth?(i%2===0?'待带布':'带布中'):i>40?'已完成':'无需带布',clothDue:new Date(now+(i%2===0?-4:6)*3600000).toISOString(),clothOwner:['王杰','陈国道','董祖成'][i%3],formula:[{code:'A1',name:'分散黄',ratio:1.2,unit:'克/市斤'},{code:'A12',name:'分散红',ratio:0.85,unit:'克/市斤'},{code:'P103',name:'匀染剂',ratio:0.5,unit:'克/升'}],version:i>=35?repeated?3:1:0,logs:[...(repeated?[{time:new Date(now-6*3600000).toISOString(),event:'配方退回',note:['色光偏红，调整蓝料比例后复打','深浅与客样不符，需重新对色','牢度未达要求，需调整助剂'][i%3]}]:[]),{time:created,event:'订单创建',note:`${team} · ${phase}`}]};});
}

export const taskKinds:WorkItem['kind'][]=['大货','回修','复样','预打样'];
export function taskKindStats(rows:WorkItem[],now=Date.now()){
 return taskKinds.map(kind=>({kind,...workCounts(rows.filter(row=>row.kind===kind),now)}));
}
export function readWorkbenchItems():WorkItem[]{
 try {const stored=JSON.parse(localStorage.getItem('lab-workbench-v1')||'null');if(Array.isArray(stored)){const demo=seedWorkItems();const rows=stored.map((row:WorkItem)=>{const base=demo.find(t=>t.id===row.id);return {...row,processCard:row.processCard??base?.processCard,additionCount:row.additionCount??base?.additionCount??0}});localStorage.setItem('lab-workbench-v1',JSON.stringify(rows));return rows;}}catch{/* Fall back to the local demo dataset. */}
 const rows=seedWorkItems();localStorage.setItem('lab-workbench-v1',JSON.stringify(rows));return rows;
}

export const hasSecondAddition=(row:WorkItem)=>!!row.processCard&&(row.additionCount??0)>=2;
export function secondAdditionCards(rows:WorkItem[]){return rows.filter(hasSecondAddition).filter((row,i,all)=>all.findIndex(t=>t.processCard===row.processCard)===i);}
