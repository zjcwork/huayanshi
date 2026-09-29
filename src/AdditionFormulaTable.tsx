import {Table} from 'antd';
import type {ColumnsType} from 'antd/es/table';
import type {Change,DyeRow} from './dye-formula-model';

// Demo additions are split into two rounds; their sum equals the requested increase.
export default function AdditionFormulaTable({change}:{change:Change}){
 const effective=change.reviewedFormula??change.after;
 const rows=[...change.before.rows,...effective.rows.filter(row=>!change.before.rows.some(old=>old.key===row.key))].sort((a,b)=>a.stage-b.stage);
 const stages=[...new Set(rows.map(row=>row.stage))];
 const stageCell=(row:DyeRow,index?:number)=>{
  const first=rows.findIndex(item=>item.stage===row.stage);
  return {rowSpan:index===first?rows.filter(item=>item.stage===row.stage).length:0,className:stages.indexOf(row.stage)%2===0?'addition-stage-highlight':''};
 };
 const additions=(row:DyeRow)=>{
  const before=change.before.rows.find(item=>item.key===row.key)?.ratio??0;
  const after=effective.rows.find(item=>item.key===row.key)?.ratio??before;
  const total=Math.max(0,Number((after-before).toFixed(3)));
  const first=change.source==='demo'?Number((total*0.6).toFixed(3)):total;
  return [first,Number((total-first).toFixed(3))];
 };
 const stageValues=(row:DyeRow,field:'processName'|'ph')=>[...new Set(rows.filter(item=>item.stage===row.stage).map(item=>item[field]).filter(Boolean))].join('\n')||'—';
 const columns:ColumnsType<DyeRow>=[
  {title:'阶段',dataIndex:'stage',width:55,onCell:stageCell},
  {title:'染助剂代码',dataIndex:'code',width:100},
  {title:'比例',width:85,render:(_,row)=>change.before.rows.find(item=>item.key===row.key)?.ratio??''},
  {title:'算法',width:75,render:(_,row)=>row.algorithm??'布重'},
  {title:'单位',width:85,render:(_,row)=>row.unit??'克/市斤'},
  {title:'工艺',width:115,onCell:stageCell,render:(_,row)=>stageValues(row,'processName')},
  {title:'PH值',width:95,onCell:stageCell,render:(_,row)=>stageValues(row,'ph')},
  ...[0,1].flatMap(round=>[
   {title:<div>加料{round+1}<small>正常加料</small><small>{change.reason.split('，')[0]}</small></div>,key:`addition-${round}`,width:110,render:(_:unknown,row:DyeRow)=>additions(row)[round]||''},
   {title:`加料${round+1}工艺`,key:`process-${round}`,width:110,onCell:stageCell,render:(_:unknown,row:DyeRow)=>{
    const hasAddition=rows.some(item=>item.stage===row.stage&&additions(item)[round]>0);
    return hasAddition?stageValues(row,'processName'):'';
   }}
  ])
 ];
 return <Table<DyeRow> className="addition-formula-table" bordered size="small" rowKey="key" pagination={false} tableLayout="fixed" scroll={{x:1045}} dataSource={rows} columns={columns}/>;
}
