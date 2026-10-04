import {useState,useEffect} from 'react';
import {displayInspectionCard,workbenchTeams,pendingCloth,type WorkItem} from './workbench-model';
import {Button,Select,Tooltip} from 'antd';
import {ReloadOutlined} from '@ant-design/icons';
import dayjs from 'dayjs';
import {AdditionBarChart,BiasBarCharts} from './DyeOverviewCharts';
import type {MatchingRecord} from './matching-model';
import {dyeOverviewCards,dyeOverviewStats} from './dye-matching-overview-model';
export default function DyeMatchingOverview({records,items,now,onRefresh,currentTeam}:{items:WorkItem[];currentTeam:string;records:Record<string,MatchingRecord>;now:number;onRefresh:()=>void}){
 const [team,setTeam]=useState(currentTeam);
 useEffect(()=>setTeam(currentTeam),[currentTeam]);
 const {cards,demo}=dyeOverviewCards(records,now);
 const scope=cards.filter(card=>card.team===team),stats=dyeOverviewStats(scope);
 const unfinished=scope.filter(card=>card.status!=='已完成');
 const overdue=!demo&&unfinished.every(card=>Number.isFinite(Date.parse(records[card.card]?.dueAt??'')))?unfinished.filter(card=>Date.parse(records[card.card].dueAt!)<now).length:null;
 const inspectionOverdue=items.filter(item=>item.team===team&&item.processCard&&pendingCloth(item)&&Date.parse(item.clothDue)<now).sort((a,b)=>Date.parse(a.clothDue)-Date.parse(b.clothDue));
 const stages=[{name:'染色对样',pending:stats.progress[0],completed:stats.progress[2],overdue},{name:'半检对样',pending:null,completed:null,overdue:null},{name:'成品对样',pending:null,completed:null,overdue:null}];
 return <div className="dye-matching-overview">
  <section className="foreman-panel progress-panel"><div className="foreman-section-title"><div><span className="section-mark"/><h2>班组对样进度</h2><Select size="small" aria-label="对样统计班组" value={team} onChange={setTeam} style={{width:100}} options={workbenchTeams.map(value=>({value,label:value}))}/></div><Tooltip title="刷新工作台数据"><Button aria-label="刷新工作台数据" icon={<ReloadOutlined/>} onClick={onRefresh}/></Tooltip></div>
   <div className="matching-stage-table-wrap"><table className="matching-stage-table" aria-label="班组各环节对样进度"><thead><tr><th scope="col"><span className="matching-stage-sr-only">对样环节</span></th><th scope="col">待对样</th><th scope="col">已完成</th><th scope="col">超时</th></tr></thead><tbody>{stages.map(stage=><tr key={stage.name}><th scope="row">{stage.name}</th>{(['pending','completed','overdue'] as const).map(metric=><td key={metric} className={stage[metric]===null?'unavailable':metric}><strong>{stage[metric]??'—'}</strong></td>)}</tr>)}</tbody></table></div>
  </section>
  <section className="foreman-panel dye-inspection-overdue"><div className="foreman-section-title"><div><span className="section-mark coral"/><h2>半检超时</h2></div><span className="unit-label">共 <span className="repair-overdue-duration">{inspectionOverdue.length}</span> 条</span></div><div className="repair-overdue-wrap"><table className="repair-overdue-table" aria-label="半检超时流程卡"><thead><tr><th>流程卡号</th><th>订字</th><th>色号</th><th>超时时间</th></tr></thead><tbody>{inspectionOverdue.map(item=>{const minutes=Math.max(1,Math.floor((now-Date.parse(item.clothDue))/60000));return <tr key={item.id}><td>{displayInspectionCard(item.processCard!)}</td><td>{item.order}</td><td>{item.colorNo}</td><td className="repair-overdue-duration">{Math.floor(minutes/60)}小时{minutes%60}分钟</td></tr>})}</tbody></table>{!inspectionOverdue.length&&<div className="repair-overdue-empty">当前班组暂无半检超时</div>}</div></section>
  <section className="foreman-panel dye-statistics-panel"><div className="dye-addition-panel"><div className="foreman-section-title"><div><span className="section-mark teal"/><h2>加料统计</h2></div></div><AdditionBarChart compact values={stats.additions}/></div>
  <div className="dye-bias-panel"><div className="foreman-section-title"><div><span className="section-mark coral"/><h2>颜色偏向统计</h2></div></div><BiasBarCharts compact values={stats.bias}/></div></section>
 </div>;
}
