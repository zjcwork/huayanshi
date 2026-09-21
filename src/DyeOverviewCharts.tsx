const biasLabels=['偏红','偏黄','偏蓝','偏深','偏浅'];
export function AdditionBarChart({values}:{values:number[]}){
 const step=Math.max(1,Math.ceil(Math.max(...values,0)/4));
 const maximum=step*4;
 const baseline=188,height=152;
 return <div className="addition-chart"><svg viewBox="0 0 500 230" role="img" aria-label={`当日加料流程卡数量：${values.map((value,index)=>`${index+1}次 ${value}张`).join('，')}`}>
  <text x="14" y="17" className="chart-axis-label">流程卡数（张）</text>
  {[0,1,2,3,4].map(tick=>{const y=baseline-tick*height/4;return <g key={tick}><line x1="42" x2="485" y1={y} y2={y} className={tick===0?'chart-baseline':'chart-gridline'}/><text x="32" y={y+4} textAnchor="end" className="chart-axis-label">{step*tick}</text></g>})}
  {values.map((value,index)=>{const x=64+index*87;const barHeight=value/maximum*height;return <g key={index}><title>{`加料 ${index+1} 次：${value} 张流程卡`}</title><rect x={x} y={baseline-barHeight} width="44" height={barHeight} rx="4" fill="#5b87d4"/><text x={x+22} y={baseline-barHeight-8} textAnchor="middle" className="chart-count">{value}</text><text x={x+22} y="211" textAnchor="middle" className="chart-axis-label">{index+1} 次</text></g>})}
 </svg></div>;
}
export function BiasBarCharts({values}:{values:number[]}){
 const step=Math.max(1,Math.ceil(Math.max(...values,0)/4)),maximum=step*4;
 const colors=['#ce6573','#bc9146','#5278b5','#59647c','#8a9caf'];
 return <div className="addition-chart bias-column-chart"><svg viewBox="0 0 500 230" role="img" aria-label={`颜色偏向流程卡数量：${values.map((value,index)=>`${biasLabels[index]} ${value}张`).join('，')}`}>
  <text x="14" y="17" className="chart-axis-label">流程卡数（张）</text>
  {[0,1,2,3,4].map(tick=>{const y=188-tick*38;return <g key={tick}><line x1="42" x2="485" y1={y} y2={y} className={tick===0?'chart-baseline':'chart-gridline'}/><text x="32" y={y+4} textAnchor="end" className="chart-axis-label">{step*tick}</text></g>})}
  {values.map((value,index)=>{const x=64+index*87,barHeight=value/maximum*152;return <g key={index}><title>{`${biasLabels[index]}：${value} 张流程卡`}</title><rect x={x} y={188-barHeight} width="44" height={barHeight} rx="4" fill={colors[index]}/><text x={x+22} y={180-barHeight} textAnchor="middle" className="chart-count">{value}</text><text x={x+22} y="211" textAnchor="middle" className="chart-axis-label">{biasLabels[index]}</text></g>})}
 </svg></div>;
}
