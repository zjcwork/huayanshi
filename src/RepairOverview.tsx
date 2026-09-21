import {Tooltip} from 'antd';
import dayjs from 'dayjs';

// Local demonstration totals; each team's repair count is part of its total process cards.
const monthlyDemo=[
 {team:'甲班',today:4,current:48,total:600,previous:40,previousTotal:400},
 {team:'乙班',today:2,current:32,total:400,previous:36,previousTotal:360},
 {team:'丙班',today:1,current:20,total:250,previous:14,previousTotal:200},
];
function Trend({current,previous}:{current:number;previous:number}){
 const difference=previous?(current-previous)/previous*100:0;
 const direction=difference>0?'上升':difference<0?'下降':'持平';
 return <span className={`repair-month-trend ${difference>0?'up':difference<0?'down':'flat'}`}>较上月 {difference>0?'↑':difference<0?'↓':''} {direction}{difference!==0?` ${Math.abs(difference).toFixed(1)}%`:''}</span>;
}
export default function RepairOverview({team,now}:{team:string;now:number}){
 const rows=monthlyDemo.filter(row=>team==='全部班组'||row.team===team);
 const sum=(field:'today'|'current'|'total'|'previous'|'previousTotal')=>rows.reduce((value,row)=>value+row[field],0);
 const current=sum('current'),previous=sum('previous'),rate=sum('total')?current/sum('total')*100:0,previousRate=sum('previousTotal')?previous/sum('previousTotal')*100:0;
 return <section className="foreman-panel cloth-panel repair-summary-panel">
  <div className="foreman-section-title"><div><span className="section-mark teal"/><h2>回修</h2></div><span className="unit-label">{dayjs(now).format('YYYY年M月')} · 模拟统计</span></div>
  <div className="repair-summary-metrics">
   <div className="repair-summary-metric"><span>当日回修数</span><strong>{sum('today')}<small>条</small></strong><span className="repair-summary-date">{dayjs(now).format('M月D日')}</span></div>
   <div className="repair-summary-metric"><span>本月累计</span><strong>{current}<small>条</small></strong><Trend current={current} previous={previous}/></div>
   <div className="repair-summary-metric"><Tooltip title="回修率＝回修流程卡数 ÷ 全部流程卡数；较上月百分比＝（本月回修率－上月回修率）÷上月回修率"><span>回修率</span></Tooltip><strong>{rate.toFixed(1)}<small>%</small></strong><Trend current={rate} previous={previousRate}/></div>
  </div>
 </section>;
}
