import {useState} from 'react';
import {Button,Select,Tooltip} from 'antd';
import {ReloadOutlined} from '@ant-design/icons';
import dayjs from 'dayjs';
import {AdditionBarChart,BiasBarCharts} from './DyeOverviewCharts';
import type {MatchingRecord} from './matching-model';
import {dyeOverviewCards,dyeOverviewStats,dyeOverviewTeams} from './dye-matching-overview-model';
export default function DyeMatchingOverview({records,now,onRefresh}:{records:Record<string,MatchingRecord>;now:number;onRefresh:()=>void}){
 const [team,setTeam]=useState('全部班组');
 const {cards,demo}=dyeOverviewCards(records,now);
 const scope=cards.filter(card=>team==='全部班组'||card.team===team),stats=dyeOverviewStats(scope);
 return <div className="dye-matching-overview">
  <section className="foreman-panel progress-panel"><div className="foreman-section-title"><div><span className="section-mark"/><h2>班组对样进度</h2><Select aria-label="染色对样班组" value={team} onChange={setTeam} style={{width:112}} options={['全部班组',...dyeOverviewTeams].map(value=>({value,label:value}))}/></div><Tooltip title="刷新工作台数据"><Button aria-label="刷新工作台数据" icon={<ReloadOutlined/>} onClick={onRefresh}/></Tooltip></div>
   <div className="progress-table-wrap"><table className="progress-table"><thead><tr><th>班组</th><th>待对样</th><th>进行中</th><th>已完成</th></tr></thead><tbody>{['全部班组',...dyeOverviewTeams].filter(name=>team==='全部班组'||name==='全部班组'||name===team).map(name=><tr key={name} className={name==='全部班组'?'total-row':''}><th>{name==='全部班组'?<><i/>{team==='全部班组'?'全部班组':`${team}合计`}</>:<><span className="team-letter">{name[0]}</span>{name}</>}</th>{dyeOverviewStats(name==='全部班组'?scope:scope.filter(card=>card.team===name)).progress.map((value,index)=><td key={index} className={index===2?'success-value':''}><strong>{value}</strong></td>)}</tr>)}</tbody></table></div><div className="foreman-panel-note">{demo?'当前暂无当日加料记录，展示模拟统计。':'按流程卡统计当前对样状态。'}</div>
  </section>
  <section className="foreman-panel"><div className="foreman-section-title"><div><span className="section-mark teal"/><h2>加料统计</h2></div><span className="unit-label">{dayjs(now).format('M月D日')} · 流程卡数</span></div><AdditionBarChart values={stats.additions}/><div className="foreman-panel-note">按当日加料次数分组，每张流程卡只计一次。{stats.overFive>0&&`另有 ${stats.overFive} 张超过 5 次。`}</div></section>
  <section className="foreman-panel dye-bias-panel"><div className="foreman-section-title"><div><span className="section-mark coral"/><h2>颜色偏向统计</h2></div><span className="unit-label">当日加料流程卡</span></div><BiasBarCharts values={stats.bias}/><div className="foreman-panel-note">取流程卡当日最后一次加料记录；色相和深浅可同时出现，分别按流程卡统计。</div></section>
 </div>;
}
