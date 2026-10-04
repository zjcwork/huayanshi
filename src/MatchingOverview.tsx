import {useState} from 'react';
import {Button,Select,Tooltip} from 'antd';
import {ReloadOutlined} from '@ant-design/icons';
import {displayInspectionCard,pendingCloth,type WorkItem} from './workbench-model';
import type {MatchingRecord} from './matching-model';

export default function MatchingOverview({items,records,now,onRefresh}:{items:WorkItem[];records:Record<string,MatchingRecord>;now:number;onRefresh:()=>void}){
 const [team,setTeam]=useState('全部班组');
 const teams=['甲班','乙班','丙班'];
 const matching=Object.entries(records).map(([card,record])=>{
  const linked=items.find(item=>item.processCard===card);
  const demoIndex=Array.from(card).reduce((sum,char)=>sum+char.charCodeAt(0),0);
  return {...record,team:record.team??linked?.team??teams[demoIndex%3],dueAt:record.dueAt??linked?.due??`2026-09-19T${String(8+demoIndex%12).padStart(2,'0')}:00:00+08:00`};
 });
 const scoped=matching.filter(row=>team==='全部班组'||row.team===team);
 const matchingCounts=(rows:typeof matching)=>[rows.filter(r=>r.result==='待对样').length,rows.filter(r=>r.result==='未通过').length,rows.filter(r=>r.result==='通过'||r.result==='通过并直送').length,rows.filter(r=>(r.result==='待对样'||r.result==='未通过')&&new Date(r.dueAt).getTime()<now).length];
 const overdue=items.filter(r=>r.processCard&&pendingCloth(r)&&new Date(r.clothDue).getTime()<now).sort((a,b)=>new Date(a.clothDue).getTime()-new Date(b.clothDue).getTime());
 return <div className="foreman-top matching-overview">
  <section className="foreman-panel progress-panel"><div className="foreman-section-title"><div><span className="section-mark"/><h2>对样进度</h2><Select aria-label="对样班组" value={team} style={{width:112}} onChange={setTeam} options={['全部班组',...teams].map(value=>({value,label:value}))}/></div><Tooltip title="刷新工作台数据"><Button aria-label="刷新工作台数据" icon={<ReloadOutlined/>} onClick={onRefresh}/></Tooltip></div>
   <div className="progress-table-wrap"><table className="progress-table matching-progress-table"><thead><tr><th>班组</th><th>待对样</th><th>进行中</th><th>已完成</th><th>超时对样</th></tr></thead><tbody>{['全部班组',...teams].filter(name=>team==='全部班组'||name==='全部班组'||name===team).map(name=><tr key={name} className={name==='全部班组'?'total-row':''}><th>{name==='全部班组'?<><i/>{team==='全部班组'?'全部班组':`${team}合计`}</>:<><span className="team-letter">{name[0]}</span>{name}</>}</th>{matchingCounts(name==='全部班组'?scoped:matching.filter(row=>row.team===name)).map((value,index)=><td key={index} className={index===3?'danger-value':index===2?'success-value':''}><strong>{value}</strong></td>)}</tr>)}</tbody></table></div><div className="foreman-panel-note">超时对样统计已到期且未通过的任务；缺少班组、期限的记录使用模拟数据。</div>
  </section>
  <section className="foreman-panel matching-inspection-overdue"><div className="foreman-section-title"><div><span className="section-mark coral"/><h2>半检超时</h2></div><span className="unit-label">共 <span style={{color:'#ff4d4f'}}>{overdue.length}</span> 条</span></div><div className="repair-overdue-wrap"><table className="repair-overdue-table"><thead><tr><th>流程卡号</th><th>订字</th><th>色号</th><th>超时时间</th></tr></thead><tbody>{overdue.map(row=>{const minutes=Math.max(1,Math.floor((now-new Date(row.clothDue).getTime())/60000));return <tr key={row.id}><td>{displayInspectionCard(row.processCard!)}</td><td>{row.order}</td><td>{row.colorNo}</td><td className="repair-overdue-duration">{Math.floor(minutes/60)}小时{minutes%60}分钟</td></tr>})}</tbody></table>{!overdue.length&&<div className="repair-overdue-empty">暂无超时半检流程卡</div>}</div></section>
 </div>;
}
