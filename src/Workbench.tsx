import {useEffect,useMemo,useState} from 'react';
import {Button,DatePicker,Modal,Select,Space,Tooltip} from 'antd';
import {ArrowRightOutlined,ExperimentOutlined,FileTextOutlined,ReloadOutlined,TeamOutlined} from '@ant-design/icons';
import dayjs from 'dayjs';
import {isOverdue,readWorkbenchItems,workCounts,workbenchTeams} from './workbench-model';
import type {WorkbenchTarget} from './workbench-navigation';
import './workbench-overview.css';
import DyeMatchingOverview from './DyeMatchingOverview';
import {readRecords} from './matching-model';
import {dyeOverviewCards,dyeOverviewStats} from './dye-matching-overview-model';
import {AdditionBarChart,BiasBarCharts} from './DyeOverviewCharts';

function RepairComboChart({values}:{values:number[]}){
 const maximum=Math.max(1,...values);
 const labels=['染色对样','配方调整','小样与复样'];
 return <div className="repair-combo-chart"><svg viewBox="0 0 440 178" role="img" aria-label={`配方不良统计：${labels.map((label,index)=>`${label}${values[index]}项`).join('，')}`}>
  {[0,1,2,3,4].map(tick=>{const y=140-tick*25;return <g key={tick}><line x1="36" x2="426" y1={y} y2={y} className={tick===0?'chart-baseline':'chart-gridline'}/><text x="28" y={y+4} textAnchor="end" className="chart-axis-label">{Math.round(maximum*tick/4)}</text></g>})}
  {values.map((value,index)=>{const x=86+index*118,height=value/maximum*100;return <g key={labels[index]}><rect x={x} y={140-height} width="34" height={height} fill="#3478f6"/><text x={x+17} y={134-height} textAnchor="middle" className="chart-count">{value}</text><text x={x+17} y="161" textAnchor="middle" className="chart-axis-label">{labels[index]}</text></g>})}
 </svg></div>;
}
export default function Workbench({onNavigate,currentTeam,formulaAuditCount}:{currentTeam:string;onNavigate:(target:WorkbenchTarget)=>void;onOpenPage:(page:string)=>void;formulaAuditCount:number}){
 const [shiftStarts,setShiftStarts]=useState<Record<string,string>>(()=>{let saved:Record<string,string>={};try{saved=JSON.parse(localStorage.getItem('lab-team-shift-starts')||'{}')??{}}catch{}if(!saved[currentTeam]){saved={...saved,[currentTeam]:dayjs().subtract(2,'day').format('YYYY-MM-DD')};localStorage.setItem('lab-team-shift-starts',JSON.stringify(saved))}return saved});
 useEffect(()=>{if(shiftStarts[currentTeam])return;const next={...shiftStarts,[currentTeam]:dayjs().subtract(2,'day').format('YYYY-MM-DD')};localStorage.setItem('lab-team-shift-starts',JSON.stringify(next));setShiftStarts(next)},[currentTeam,shiftStarts]);
 const [shiftDateOpen,setShiftDateOpen]=useState(false),[shiftDate,setShiftDate]=useState<string|null>(null);

 const [matchingRecords,setMatchingRecords]=useState(readRecords);
 const [items,setItems]=useState(readWorkbenchItems),[team,setTeam]=useState(currentTeam),[now,setNow]=useState(Date.now());
 const refresh=()=>{setItems(readWorkbenchItems());setMatchingRecords(readRecords());setNow(Date.now())};
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),60000);window.addEventListener('storage',refresh);return()=>{clearInterval(timer);window.removeEventListener('storage',refresh)}},[]);
 useEffect(()=>setTeam(currentTeam),[currentTeam]);
 const scope=useMemo(()=>items.filter(r=>team==='全部班组'||r.team===team),[items,team]);
 const counts=workCounts(scope,now);
 const dyeCards=useMemo(()=>{const cards=dyeOverviewCards(matchingRecords,now).cards;return team==='全部班组'?cards:cards.filter(card=>card.team===team)},[matchingRecords,now,team]);
 const dyeStats=dyeOverviewStats(dyeCards);
 const finishedDyeStats=dyeOverviewStats(dyeCards.filter(card=>card.status==='已完成'));
 const repairRows=scope.filter(row=>row.kind==='回修');
 const workbenchStatistics=[
  {key:'repair',title:'化验室回修',values:[['待分配',repairRows.filter(row=>row.phase==='待分配').length],['进行中',repairRows.filter(row=>row.phase==='进行中').length],['已完成',repairRows.filter(row=>row.phase==='已完成').length],['超时',repairRows.filter(row=>isOverdue(row,now)).length]]},
  {key:'addition',title:'染色加料',values:[['1次',dyeStats.additions[0]],['2次',dyeStats.additions[1]],['3次',dyeStats.additions[2]],['4次及以上',dyeStats.additions[3]+dyeStats.additions[4]+dyeStats.overFive]]},
  {key:'dye-color',title:'染色对样颜色判断',values:[['正常',dyeCards.filter(card=>card.additions>0&&card.direction.includes('正常')).length],['偏红',dyeStats.bias[0]],['偏黄',dyeStats.bias[1]],['偏蓝',dyeStats.bias[2]]]},
  {key:'finished-color',title:'成品对样颜色判断',values:[['正常',dyeCards.filter(card=>card.status==='已完成').length],['偏深',dyeStats.bias[3]],['偏浅',dyeStats.bias[4]],['待判断',dyeCards.filter(card=>card.status!=='已完成').length]]},
 ] as const;
 const shiftStart=shiftStarts[team];
 const shiftDay=shiftStart&&dayjs(shiftStart).isValid()&&dayjs(shiftStart).startOf('day').valueOf()<=dayjs(now).startOf('day').valueOf()?dayjs(now).startOf('day').diff(dayjs(shiftStart).startOf('day'),'day')+1:null;

 const overdueRepairs=scope.filter(row=>row.kind==='回修'&&row.processCard&&isOverdue(row,now)).sort((a,b)=>new Date(a.due).getTime()-new Date(b.due).getTime());
 const overdueDuration=(due:string)=>{const minutes=Math.max(1,Math.floor((now-new Date(due).getTime())/60000));const hours=Math.floor(minutes/60);return `${hours}小时${minutes%60}分钟`};
 const go=(target:WorkbenchTarget)=>onNavigate({...target,team});
 const changeTodos=[{title:'配方变更',count:counts.confirm,page:'配方变更',queue:'confirm'},{title:'配方确认',count:counts.confirm,page:'配方确认',queue:'confirm'}] as const;
 const todos=[{title:'大货订单审核',count:counts.bulk,note:'待审核订单',page:'大货订单审核',queue:'bulk',icon:<FileTextOutlined/>},{title:'预打样订单审核',count:counts.pre,note:'待审核订单',page:'预打样订单审核',queue:'pre',icon:<ExperimentOutlined/>},{title:'待分配大货',count:scope.filter(r=>r.phase==='待分配'&&r.kind==='大货').length,note:'等待分配打样员',page:'任务分配',queue:'assign',kind:'大货',icon:<TeamOutlined/>},{title:'待分配回修',count:scope.filter(r=>r.phase==='待分配'&&r.kind==='回修').length,note:'等待分配打样员',page:'任务分配',queue:'assign',kind:'回修',icon:<TeamOutlined/>},{title:'待分配预打样',count:scope.filter(r=>r.phase==='待分配'&&r.kind==='预打样').length,note:'等待分配打样员',page:'任务分配',queue:'assign',kind:'预打样',icon:<TeamOutlined/>},{title:'待分配复样',count:scope.filter(r=>r.phase==='待分配'&&r.kind==='复样').length,note:'等待分配打样员',page:'任务分配',queue:'assign',kind:'复样',icon:<TeamOutlined/>},{title:'配方审核',count:formulaAuditCount,note:'待审核配方',page:'配方审核',queue:'audit',icon:<FileTextOutlined/>}] as const;
 return <div className="foreman-workbench">
  <div className="workbench-action-row"><section className="foreman-panel change-panel"><div className="foreman-section-title"><div><span className="section-mark"/><h2>变更</h2></div></div><div className="foreman-todos change-todos">{changeTodos.map(item=><button className="foreman-todo tone-3" key={item.title} onClick={()=>go({page:item.page,queue:item.queue})}><div className="todo-top"><span>{item.title}</span></div><div className="todo-bottom"><strong>{item.count}<small>项</small></strong></div></button>)}</div></section><section className="foreman-panel todo-panel"><div className="foreman-section-title"><div><span className="section-mark"/><h2>待办事项</h2></div></div><div className="foreman-todos">{todos.map((t,index)=><button key={`${t.title}-${index}`} className={`foreman-todo tone-${t.queue==='assign'?2:t.queue==='audit'?1:0}`} onClick={()=>go({page:t.page,queue:t.queue,kind:'kind' in t?t.kind:undefined})}><div className="todo-top"><span>{t.title}</span></div><div className="todo-bottom"><strong>{t.count}<small>项</small></strong></div></button>)}</div></section></div>
  <div className="workbench-operations-grid">
   <section className="foreman-panel progress-panel"><div className="foreman-section-title"><div><span className="section-mark"/><h2>打样进度</h2><Select size="small" aria-label="打样统计班组" value={team} onChange={setTeam} style={{width:100}} options={workbenchTeams.map(value=>({value,label:value}))}/><Button type="text" size="small" className="shift-day-label" title="设置本轮当班开始日期" onClick={()=>{setShiftDate(shiftStart??null);setShiftDateOpen(true)}}>{shiftDay===null?'当班天数待设置':`当班第 ${shiftDay} 天`}</Button></div><Space size={8}><Button type="link" onClick={()=>go({page:'试样任务跟踪',queue:'all'})}>查看任务 <ArrowRightOutlined/></Button><Tooltip title="刷新工作台数据"><Button aria-label="刷新工作台数据" icon={<ReloadOutlined/>} onClick={refresh}/></Tooltip></Space></div>
   <div className="progress-table-wrap"><table className="progress-table sampling-kind-progress" aria-label="当前班组打样进度"><thead><tr><th><span className="matching-stage-sr-only">打样类型</span></th><th>已分配</th><th>已完成</th><th>超时</th></tr></thead><tbody>{(['预打样','大货','回修','复样'] as const).map(kind=>{const rows=scope.filter(row=>row.kind===kind),c=workCounts(rows,now);const values=[c.assigned,rows.filter(row=>row.phase==='已完成').length,c.overdue];return <tr key={kind}><th scope="row">{kind}</th>{values.map((value,index)=><td key={index} className={index===2?'danger-value':index===1?'success-value':''}>{index===1?<strong>{value}</strong>:<button aria-label={`${team} ${kind} ${['已分配','已完成','超时'][index]} ${value} 项`} onClick={()=>go({page:'试样任务跟踪',kind,queue:(['assigned','all','all'] as const)[index],risk:index===2?'overdue':undefined})}>{value}</button>}</td>)}</tr>})}</tbody></table></div></section>
   <section className="foreman-panel repair-overdue-panel"><div className="foreman-section-title"><div><span className="section-mark coral"/><h2>回修超时</h2></div><span className="unit-label">共 <span style={{color:'#ff4d4f'}}>{overdueRepairs.length}</span> 条</span></div>
    <div className="repair-overdue-wrap"><table className="repair-overdue-table"><thead><tr><th>流程卡号</th><th>订字</th><th>色号</th><th>超时时间</th></tr></thead><tbody>{overdueRepairs.map(row=><tr key={row.id}><td>{row.processCard?.endsWith('H-1')?row.processCard:`${row.processCard}H-1`}</td><td>{row.order}</td><td>{row.colorNo}</td><td className="repair-overdue-duration">{overdueDuration(row.due)}</td></tr>)}</tbody></table>{!overdueRepairs.length&&<div className="repair-overdue-empty">当前班组暂无超时回修流程卡</div>}</div>
   </section>
   <DyeMatchingOverview items={items} team={team} records={matchingRecords} now={now}/>
  </div>
  <section className="workbench-statistics-grid" aria-label="化验室与染色统计">{workbenchStatistics.map(group=><article className={`foreman-panel workbench-stat-card ${group.key}`} key={group.key}>{group.key==='repair'?<><div className="workbench-stat-heading"><span className="section-mark"/><div><h2>配方不良</h2></div></div><RepairComboChart values={[repairRows.filter(row=>row.phase!=='已完成').length,repairRows.filter(row=>row.phase==='进行中').length,repairRows.filter(row=>row.phase==='已完成').length]}/></>:<><div className="workbench-stat-heading"><span className="section-mark"/><div><h2>{group.title}</h2></div></div>{group.key==='addition'?<AdditionBarChart compact values={dyeStats.additions}/>:group.key==='dye-color'?<BiasBarCharts compact values={dyeStats.bias}/>:group.key==='finished-color'?<BiasBarCharts compact values={finishedDyeStats.bias}/>:null}</>}</article>)}</section>
  <footer className="foreman-footer"><span><i/>{team} · 本地演示数据</span><span>更新于 {dayjs(now).format('HH:mm')} · 部分业务入口尚未接入</span></footer>
  <Modal title={`${team} · 本轮当班开始日期`} open={shiftDateOpen} onCancel={()=>setShiftDateOpen(false)} okText="保存" cancelText="取消" okButtonProps={{disabled:!shiftDate}} onOk={()=>{if(!shiftDate)return;const next={...shiftStarts,[team]:shiftDate};localStorage.setItem('lab-team-shift-starts',JSON.stringify(next));setShiftStarts(next);setShiftDateOpen(false)}}><p>开始当天为第 1 天，按自然日计算；新一轮当班时更新开始日期。</p><DatePicker aria-label="本轮当班开始日期" value={shiftDate?dayjs(shiftDate):null} allowClear onChange={value=>setShiftDate(value?value.format('YYYY-MM-DD'):null)} disabledDate={date=>date.startOf('day').valueOf()>dayjs(now).startOf('day').valueOf()}/></Modal>
 </div>
}
