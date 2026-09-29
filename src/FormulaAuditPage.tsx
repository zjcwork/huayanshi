import {useState,type ReactNode} from 'react';
import {Button,DatePicker,Input,Select,Table,Tabs} from 'antd';
import dayjs from 'dayjs';
import type {LabRecord} from './data';
import './formula-audit-page.css';

type Props={records:LabRecord[];onAudit:(row:LabRecord,pass:boolean)=>void;renderFormula:(row:LabRecord)=>ReactNode;onEdit:(row:LabRecord)=>void};

export default function FormulaAuditPage({records,onAudit}:Props){
 const [category,setCategory]=useState('sampling');
 const [orderQuery,setOrderQuery]=useState('');
 const [colorQuery,setColorQuery]=useState('');
 const [applied,setApplied]=useState({order:'',color:''});
 const [status,setStatus]=useState('待审核');
 const [dates,setDates]=useState<[dayjs.Dayjs|null,dayjs.Dayjs|null]|null>(null);
 const [selected,setSelected]=useState<React.Key[]>([]);
 const [preRecord,setPreRecord]=useState<LabRecord|undefined>(()=>records[0]?{...records[0],key:'audit-pre-demo',type:'预打样',status:'待审核'}:undefined);
 const groups=[
  {key:'sampling',label:'打样',rows:records.filter(r=>!['抄样','回修','预打样'].includes(r.type))},
  {key:'copy',label:'抄样',rows:records.filter(r=>r.type==='抄样')},
  {key:'repair',label:'回修',rows:records.filter(r=>r.type==='回修')},
  {key:'pre',label:'预打样',rows:records.some(r=>r.type==='预打样')?records.filter(r=>r.type==='预打样'):preRecord?[preRecord]:[]},
 ];
 const rows=(groups.find(group=>group.key===category)?.rows??[]).filter(row=>{
  const orderText=[row.order,row.formula,row.processCard??''].join(' ').toLowerCase();
  const colorText=row.colorNo.toLowerCase();
  return orderText.includes(applied.order.toLowerCase())&&colorText.includes(applied.color.toLowerCase())&&(status==='全部'||row.status===status)&&(!dates?.[0]||!dayjs(row.created).isBefore(dates[0].startOf('day')))&&(!dates?.[1]||!dayjs(row.created).isAfter(dates[1].endOf('day')));
 });
 const search=()=>setApplied({order:orderQuery.trim(),color:colorQuery.trim()});
 const reset=()=>{setOrderQuery('');setColorQuery('');setApplied({order:'',color:''});setStatus('待审核');setDates(null);setSelected([])};
 const decide=(row:LabRecord,pass:boolean)=>{
  if(row.key==='audit-pre-demo')setPreRecord({...row,status:pass?'已通过':'未通过'});
  else onAudit(row,pass);
 };
 const dateTime=(value:string)=>dayjs(value).isValid()?dayjs(value).format('YYYY-MM-DD HH:mm:ss'):value;
 return <section className="panel audit-table-page">
  <div className="audit-table-filters">
   <span>查询内容：</span>
   <Input aria-label="订字、流程卡号或配方号" placeholder="搜索订字/流程卡号/配方号" value={orderQuery} onChange={event=>setOrderQuery(event.target.value)} onPressEnter={search}/>
   <Input aria-label="色号或DM编号" placeholder="搜索色号/DM编号" value={colorQuery} onChange={event=>setColorQuery(event.target.value)} onPressEnter={search}/>
   <span>审核状态：</span>
   <Select aria-label="审核状态" value={status} onChange={setStatus} options={['全部','待审核','已通过','未通过'].map(value=>({value,label:value}))}/>
   <span>创建时间：</span>
   <DatePicker.RangePicker aria-label="创建时间范围" value={dates} onChange={setDates} format="YYYY-MM-DD" placeholder={['开始日期','结束日期']}/>
   <Button type="primary" onClick={search}>查询</Button>
   <Button onClick={reset}>重置</Button>
  </div>
  <div className="audit-table-tabs"><Tabs activeKey={category} onChange={key=>{setCategory(key);setSelected([])}} items={groups.map(group=>({key:group.key,label:`${group.label}(${group.rows.length})`}))}/></div>
  <Table<LabRecord>
   className="audit-record-table"
   bordered
   size="small"
   rowKey="key"
   tableLayout="fixed"
   dataSource={rows}
   rowSelection={{selectedRowKeys:selected,onChange:setSelected,columnWidth:34}}
   pagination={{defaultPageSize:20,pageSizeOptions:[20,50,100],showSizeChanger:true,showTotal:total=>`共 ${total} 条`,size:'small'}}
   scroll={{x:1880,y:'calc(100vh - 280px)'}}
   locale={{emptyText:'暂无符合条件的审核任务'}}
   columns={[
    {title:'序号',width:54,align:'center',render:(_,__,index)=>index+1},
    {title:'订字',dataIndex:'order',width:150,ellipsis:true},
    {title:'色号',dataIndex:'colorNo',width:150,ellipsis:true},
    {title:'配方号',dataIndex:'formula',width:145,ellipsis:true},
    {title:'配方类型',width:90,align:'center',render:()=> '正常'},
    {title:'品名',dataIndex:'product',width:170,ellipsis:true},
    {title:'染料类型',width:100,align:'center',render:(_,row)=>row.dyeCategory??(row.key==='1'?'混纺':'活性')},
    {title:'颜色',width:115,render:(_,row)=><span className="audit-color"><i style={{background:row.hex}}/>{row.color}</span>},
    {title:'对色光源',width:95,align:'center',render:(_,row)=>row.colorLight||'-'},
    {title:'分配时间',width:165,align:'center',render:(_,row)=>dateTime(dayjs(row.created).subtract(1,'day').format('YYYY-MM-DD HH:mm'))},
    {title:'打样完成时间',dataIndex:'created',width:165,align:'center',render:dateTime},
    {title:'打样员',dataIndex:'worker',width:95,align:'center',ellipsis:true},
    {title:'操作',fixed:'right',width:160,align:'center',render:(_,row)=><div className="audit-row-actions"><Button type="link" danger disabled={row.status!=='待审核'} onClick={()=>decide(row,false)}>未通过</Button><Button type="link" onClick={()=>window.print()}>打印</Button><Button type="link" disabled={row.status!=='待审核'} onClick={()=>decide(row,true)}>通过</Button></div>},
   ]}
  />
 </section>;
}
