import {useEffect,useRef} from 'react';
import {Button,Input,InputNumber,Select,Space,Table,Tag} from 'antd';
import type {DyeRow,Formula} from './dye-formula-model';
import {buildFormulaComparison,comparisonValue,includeComparisonRow,patchComparisonRow,type ComparisonRow} from './formula-change-comparison';
import './formula-change-comparison.css';

type Props={before:Formula;requested:Formula;confirmed:Formula|null;editing:boolean;onChange:(formula:Formula)=>void};
export default function FormulaChangeComparison({before,requested,confirmed,editing,onChange}:Props){
 const removedRows=useRef(new Map<string,DyeRow>());
 useEffect(()=>{removedRows.current.clear();},[editing]);
 const data=buildFormulaComparison(before,requested,confirmed);
 const patch=(row:DyeRow,values:Partial<DyeRow>)=>{if(confirmed)onChange(patchComparisonRow(confirmed,row.key,values));};
 const add=()=>{if(!confirmed)return;onChange({...confirmed,rows:[...confirmed.rows,{key:crypto.randomUUID(),stage:confirmed.rows.at(-1)?.stage??1,code:'',name:'',ratio:null,algorithm:'布重',unit:'克/市斤',process:'',processName:'',ph:''}]});};
 const config=(item:ComparisonRow,side:'before'|'requested'|'confirmed')=>{
  const row=item[side],baseline=side==='requested'?item.before:side==='confirmed'?item.requested:undefined;
  const editable=side==='confirmed'&&editing;
  if(!row)return <div className="change-config-missing"><span>{side==='before'?'原配方未添加':side==='requested'?(item.before?'申请删除此助剂':'申请未添加'):'未采用此助剂'}</span>{editable&&confirmed&&(removedRows.current.get(item.key)??item.requested??item.before)&&<Button type="link" size="small" onClick={()=>onChange(includeComparisonRow(confirmed,(removedRows.current.get(item.key)??item.requested??item.before)!,true))}>恢复此助剂</Button>}</div>;
  const changed=(field:keyof DyeRow)=>side!=='before'&&(!baseline||comparisonValue(row,field)!==comparisonValue(baseline,field));
  const value=(field:keyof DyeRow)=> <span className={changed(field)?'change-config-value is-changed':'change-config-value'}>{comparisonValue(row,field)===''||comparisonValue(row,field)===null?'—':String(comparisonValue(row,field))}</span>;
  const textInput=(field:'code'|'name'|'process'|'processName'|'ph',label:string)=><Input size="small" aria-label={`${row.key}确认${label}`} value={row[field]} onChange={event=>patch(row,{[field]:event.target.value})}/>;
  return <div className="change-config">
   {editable&&<div className="change-config-edit-identity"><label>阶段<InputNumber size="small" aria-label={`${row.key}确认阶段`} min={1} precision={0} value={row.stage} onChange={stage=>patch(row,{stage:stage??0})}/></label><label>助剂代码{textInput('code','助剂代码')}</label><Button type="link" danger size="small" onClick={()=>{if(!confirmed)return;removedRows.current.set(row.key,structuredClone(row));onChange(includeComparisonRow(confirmed,row,false));}}>移除</Button></div>}
   {!editable&&baseline&&(row.stage!==baseline.stage||row.code!==baseline.code||row.name!==baseline.name)&&<div className="change-config-identity"><span>阶段 {value('stage')}</span><span>{value('code')}</span>{row.name&&value('name')}</div>}
   <div className="change-config-values">
    <label><small>比例</small>{editable?<InputNumber size="small" aria-label={`${row.key}确认比例`} min={0} controls={false} value={row.ratio} onChange={ratio=>patch(row,{ratio})}/>:value('ratio')}</label>
    <label><small>算法</small>{editable?<Select size="small" aria-label={`${row.key}确认算法`} value={String(comparisonValue(row,'algorithm'))} options={['布重','水量'].map(value=>({value,label:value}))} onChange={algorithm=>patch(row,{algorithm})}/>:value('algorithm')}</label>
    <label><small>单位</small>{value('unit')}</label>
   </div>
   {editable?<div className="change-config-edit-process"><label>名称{textInput('name','名称')}</label><label>工艺代码{textInput('process','工艺代码')}</label><label>工艺名{textInput('processName','工艺名')}</label><label>pH{textInput('ph','pH')}</label></div>:<>
    <div className="change-config-line"><small>工艺</small><span>{value('process')} / {value('processName')}</span></div>
    <div className="change-config-line"><small>pH</small>{value('ph')}</div>
   </>}
  </div>;
 };
 return <div className="formula-change-comparison">
  <div className="change-bath-comparison"><span>浴比</span><span>原配方 <b>1:{before.bath??'—'}</b></span><span className={before.bath!==requested.bath?'is-changed':''}>申请配方 <b>1:{requested.bath??'—'}</b></span>{confirmed&&<span>确认配方 {editing?<InputNumber size="small" aria-label="确认配方浴比" min={0.01} controls={false} value={confirmed.bath} onChange={bath=>onChange({...confirmed,bath})}/>:<b className={confirmed.bath!==requested.bath?'is-changed':''}>1:{confirmed.bath??'—'}</b>}</span>}{editing&&<Button size="small" onClick={add}>新增助剂</Button>}</div>
  <Table<ComparisonRow> bordered size="small" rowKey="key" tableLayout="fixed" pagination={false} dataSource={data} scroll={{x:confirmed?1160:900}} columns={[
   {title:'阶段 / 染助剂',width:145,render:(_,item)=>{const row=item.before??item.requested??item.confirmed!;return <div className="change-row-identity"><small>阶段 {row.stage}</small><strong>{row.code||'待填写代码'}</strong>{row.name&&<span>{row.name}</span>}</div>;}},
   {title:'变更内容',width:135,render:(_,item)=><Space size={[3,5]} wrap>{item.changes.length?item.changes.map(label=><Tag key={label} color={label==='新增'?'green':label==='删除'?'red':'orange'}>{label}</Tag>):<span className="change-unchanged">申请未变更</span>}{item.confirmationChanges.length>0&&<Tag color="blue">{!item.before&&!item.requested?'确认新增':'确认调整'}</Tag>}</Space>},
   {title:'变更前配方',width:260,render:(_,item)=>config(item,'before')},
   {title:'申请配方',width:260,render:(_,item)=>config(item,'requested')},
   ...(confirmed?[{title:'确认配方',width:360,render:(_:unknown,item:ComparisonRow)=>config(item,'confirmed')}]:[])
  ]}/>
 </div>;
}
