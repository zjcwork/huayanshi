import {warehouseKey,type WarehouseLog} from './warehouse-model';
import {captureOpeningReview} from './formula-query-model';
import {useState} from 'react';
import {sameFormula,saveFormulaState,type Change} from './dye-formula-model';
import {App,Button,Empty,Input,Modal,Space,Table,Tag} from 'antd';
import {ReloadOutlined,FileTextOutlined} from '@ant-design/icons';
import {readScheduleJobs} from './schedule-model';
import {formulaVersions,unopenedPlan} from './card-opening-model';
import {items} from './CapacityDialog';
import {schedulingFormula} from './schedule-bath';
import {formulaNumber} from './formula-number';
import {planNumber} from './plan-number';
import {openingDemoCard,openingDemoUsage} from './opening-formula-demo';
import DyeFormulaTable from './DyeFormulaTable';
import OpeningProcessDetails from './OpeningProcessDetails';
import FormulaCardDetails from './FormulaCardDetails';
import './card-opening-review.css';

export default function CardOpeningReview({onWarehouse,planId,onApproved}:{onWarehouse:()=>void;planId?:string;onApproved?:()=>void}){
 const {message}=App.useApp();
 const [jobs,setJobs]=useState(readScheduleJobs),[query,setQuery]=useState(''),[selected,setSelected]=useState(''),[version,setVersion]=useState<number|null>(null);
 const [formulaDetail,setFormulaDetail]=useState<Change|null>(null);
 const plans=jobs.filter(job=>unopenedPlan(job)&&(!planId||job.id===planId)),visible=plans.filter(j=>`${planNumber(j)} ${j.card} ${j.order} ${j.color} ${j.vat}`.toLowerCase().includes(query.trim().toLowerCase()));
 const plan=visible.find(j=>j.id===selected)??visible[0];
 const item=items.find(i=>i.card===plan?.card);
 const state=plan?schedulingFormula(plan.card,item?.bath??'1:9'):null;
 const versions=state&&plan?formulaVersions(state,plan.card):[];
 const current=versions.find(v=>v.version===version)??versions[0];
 const formulaConfirmed=(()=>{
  if(!plan||!current)return false;
  try{
   const log:WarehouseLog=JSON.parse(localStorage.getItem(warehouseKey)||'{}');
   const number=formulaNumber(current.formula.bath,plan.card,current.version);
   const latest=Object.values(log).flat().filter(entry=>entry.formulaNo===number).sort((a,b)=>b.time.localeCompare(a.time))[0];
   return latest?.action==='确认';
  }catch{return false;}
 })();
 const plannedWeight=plan?.entryWeight??(plan?.card===openingDemoCard?openingDemoUsage[3]?.weight:undefined);
 const plannedWeightText=plannedWeight===undefined||plannedWeight===null||plannedWeight===''?'—':typeof plannedWeight==='number'?`${plannedWeight} kg`:plannedWeight;
 const refresh=()=>{setJobs(readScheduleJobs());setVersion(null)};
 const approve=()=>{
  if(!plan||!state||!current)return;
  try{
   const latest=readScheduleJobs(),job=latest.find(j=>j.id===plan.id);
   const fresh=schedulingFormula(plan.card,item?.bath??'1:9');
   if(!job||!unopenedPlan(job))throw new Error('该计划已开卡或排产已更新，请刷新');
   if(fresh.version!==state.version||JSON.stringify(fresh.approved)!==JSON.stringify(state.approved))throw new Error('配方已更新，请刷新后审核');
   const chosen=formulaVersions(fresh,plan.card).find(row=>row.version===current.version);
   if(!chosen||!sameFormula(chosen.formula,current.formula))throw new Error('所选配方已更新，请刷新后审核');
   if(!chosen.formula.bath||!chosen.formula.rows.length)throw new Error('配方未出，暂不能开卡');
   const openingReview=captureOpeningReview(fresh,plan.card,chosen.version,chosen.formula,'水木');
   saveFormulaState(fresh);
   const next=latest.map(j=>j.id===plan.id?{...j,converted:true,openingReview}:j);
   localStorage.setItem('lab-dye-schedule',JSON.stringify(next));setJobs(next);setVersion(null);message.success('审核通过，计划已开卡');onApproved?.();
  }catch(e){message.error((e as Error).message);refresh()}
 };
 return <div className={`opening-review${planId?' opening-review-embedded':''}`}>
  {!planId&&<aside className="opening-plans"><div className="opening-list-heading"><b>待开卡计划</b><Tag color="blue">{plans.length}</Tag><Button aria-label="刷新开卡计划" icon={<ReloadOutlined/>} onClick={refresh}/></div><Input.Search placeholder="搜索流水号 / 订字 / 色号 / 缸号" allowClear value={query} onChange={e=>setQuery(e.target.value)}/><div className="opening-plan-list">{visible.map(j=><button key={j.id} className={'opening-plan '+(j.id===plan?.id?'active':'')} onClick={()=>{setSelected(j.id);setVersion(null)}}><div><b><i style={{background:j.hex}}/>{j.order||'未填写订字'} · {j.color||'未填写色号'}</b>{j.urgent&&<Tag color="red">急</Tag>}</div><p className="opening-plan-number">{planNumber(j)}</p></button>)}{!visible.length&&<Empty description="暂无待开卡计划"/>}</div></aside>}
  <div className="opening-workspace">{plan&&state&&current?<><section className="opening-summary"><FormulaCardDetails plan={plan}/></section><div className="opening-formula-workspace">{!planId&&<section className="opening-versions"><div className="opening-plan-summary"><span>预排缸号：<b>{plan.vat||'—'}</b></span><span>预计进缸布重：<b>{plannedWeightText}</b></span><span>进缸浴比：<b>{state.approved.bath?`1:${state.approved.bath}`:'—'}</b></span></div><Table className="opening-version-table" size="small" bordered pagination={false} rowKey="version" dataSource={versions} tableLayout="fixed" rowClassName={v=>v.version===current.version?'selected-version':''} onRow={v=>({onClick:()=>{setVersion(v.version);message.success({key:'opening-formula-reference',content:`已引用配方 ${formulaNumber(v.formula.bath,plan.card,v.version)}`})},style:{cursor:'pointer'},tabIndex:0,'aria-label':`引用配方 ${formulaNumber(v.formula.bath,plan.card,v.version)}`,onKeyDown:event=>{if(event.target===event.currentTarget&&(event.key==='Enter'||event.key===' ')){event.preventDefault();setVersion(v.version);message.success({key:'opening-formula-reference',content:`已引用配方 ${formulaNumber(v.formula.bath,plan.card,v.version)}`})}}})} columns={[
   {title:'配方号',width:'17%',render:(_,v)=><a onClick={event=>{event.stopPropagation();const previous=versions.find(row=>row.version===v.version-1);setFormulaDetail({id:`${plan.card}-${v.version}`,card:plan.card,order:plan.order,colorNo:plan.color,version:v.version,before:previous?.formula??v.formula,after:v.formula,reason:v.reason,submittedAt:v.date,status:'已通过'});}}>{formulaNumber(v.formula.bath,plan.card,v.version)}</a>},
   {title:'流程卡号',width:'14%',render:(_,v)=>{
    const usage=plan.card===openingDemoCard&&v.version in openingDemoUsage?openingDemoUsage[v.version]:undefined;
    if(usage===null)return '未使用';
    const card=usage?.card??plan.card.replace(/-1$/, '');
    const completed=usage?.completed??plan.completed??false;
    const process=usage?.currentProcess??plan.currentProcess??'待开卡';
    return <div>{card}{!completed&&!(plan.card===openingDemoCard&&v.version===2)&&<div className="opening-current-process">当前工序：{process}</div>}</div>;
   }},
   {title:'布重',width:'7%',render:(_,v)=>plan.card===openingDemoCard&&v.version in openingDemoUsage?(openingDemoUsage[v.version]?`${openingDemoUsage[v.version]!.weight} kg`:'—'):plan.entryWeight===undefined||plan.entryWeight===null||plan.entryWeight===''?'—':typeof plan.entryWeight==='number'?`${plan.entryWeight} kg`:plan.entryWeight},
   {title:'染缸号',width:'7%',render:(_,v)=>plan.card==='Y2606302145-1'&&v.version===1?'—':plan.vat||'—'},
   {title:'浴比',width:'7%',render:(_,v)=>`1:${v.formula.bath??'—'}`},
   {title:'加料回修',width:'8%',render:(_,v)=>plan.card===openingDemoCard?(v.version===0?'加料3次':v.version===2?'加料2次':v.version===3?'加料1次':'—'):'—'},
   {title:'是否进仓确认',width:'7%',render:(_,v)=>plan.card===openingDemoCard?v.version===state.version?<button type="button" className="opening-warehouse-link" onClick={event=>{event.stopPropagation();onWarehouse()}}><Tag color="gold">未确认</Tag></button>:<Tag color="red">不可用</Tag>:<Tag color={v.version===state.version?'blue':undefined}>{v.version===state.version?'当前':'历史'}</Tag>},
  ]}/></section>}<section className="opening-formula-detail">{planId&&<div className="opening-plan-summary"><span>预排缸号：<b>{plan.vat||'—'}</b></span><span>预计进缸布重：<b>{plannedWeightText}</b></span><span>进缸浴比：<b>{state.approved.bath?`1:${state.approved.bath}`:'—'}</b></span><Tag color="blue">连缸加料：{plan.linkedAdditionInfo||'无'}</Tag><Tag color={plan.repairInfo&&plan.repairInfo!=='无回修'?'orange':undefined}>回修信息：{plan.repairInfo||'无回修'}</Tag></div>}{planId?<div className="opening-review-details"><section><div className="opening-section-heading"><h3><FileTextOutlined/> 配方详情</h3>{!formulaConfirmed&&<Tag color="red">未确认</Tag>}</div><div className="opening-formula-number">{formulaNumber(current.formula.bath,plan.card,current.version)}</div><DyeFormulaTable compact fitWidth hideProcessCode formula={current.formula}/></section><section><div className="opening-section-heading"><h3><FileTextOutlined/> 工艺详情</h3></div><div className="opening-formula-number">工艺号：{`${(plan.processNo||`G${plan.card.replace(/\D/g,'')}`).replace(/v\d+$/i,'')}v0`}</div><OpeningProcessDetails/></section></div>:<><div className="opening-section-heading"><h3><FileTextOutlined/> 配方详情</h3><Tag>v{current.version}</Tag>{version!==null&&<Tag color="blue">已引用</Tag>}</div><div className="opening-formula-number">{formulaNumber(current.formula.bath,plan.card,current.version)}</div><DyeFormulaTable compact fitWidth hideProcessCode formula={current.formula}/></>}<div className="opening-actions"><span>审核人：水木</span><Space><Button type="primary" disabled={!current.formula.bath||!current.formula.rows.length} onClick={approve}>确认并开卡</Button></Space></div></section></div></>:<div className="opening-empty"><Empty description="暂无待审核计划"/></div>}</div>
 <Modal title={`${formulaDetail?.order??''}　${formulaDetail?.colorNo??''}`} className="formula-change-modal opening-comparison-modal" open={!!formulaDetail} width="94vw" style={{top:20}} onCancel={()=>setFormulaDetail(null)} footer={null}>
  {formulaDetail&&<><h3>订单详情</h3><FormulaCardDetails change={formulaDetail} timeLabel="变更时间" compact/><div className="formula-compare-grid formula-application-grid"><section><h3>原配方 <small>{formulaNumber(formulaDetail.before.bath,formulaDetail.card,Math.max(0,formulaDetail.version-1))}</small></h3><DyeFormulaTable compact fitWidth formula={formulaDetail.before} ratioTitle="原比例"/></section><section><h3>变更后配方 <small>{formulaNumber(formulaDetail.after.bath,formulaDetail.card,formulaDetail.version)}</small></h3><DyeFormulaTable compact fitWidth formula={formulaDetail.after} original={formulaDetail.before} ratioTitle="申请比例"/></section></div></>}
 </Modal>

 </div>;
}
