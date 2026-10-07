import {Descriptions,Modal,Table,Tabs} from 'antd';
import type {LabRecord} from './data';
import {formulaRows} from './data';

export default function CopyFormulaModal({record,onClose}:{record:LabRecord|null;onClose:()=>void}){
 const version=Number(record?.formula.split('v').at(-1)??0);
 const baseRows=formulaRows.map((row,index)=>({...row,ratio:index===2&&version>0?Number((row.ratio+version*.01).toFixed(3)):row.ratio,process:index===0?"130°C*20′":'',ph:index===0?'4.8-5.2':''}));
 const formulaTable=(kind:'original'|'large'|'accounting')=><Table className="copy-formula-view-table" bordered size="small" pagination={false} rowKey="key" dataSource={baseRows} columns={[
  {title:'阶段',dataIndex:'stage',width:58,onCell:(row,index)=>index===0?{rowSpan:baseRows.length}:{rowSpan:0}},
  {title:'染助剂代码',dataIndex:'code',width:88},
  {title:kind==='accounting'?'核算比例':'比例',dataIndex:'ratio',width:76,render:(value:number)=>kind==='original'?Number((value*.98).toFixed(3)):value},
  {title:'算法',dataIndex:'algorithm',width:68},{title:'单位',dataIndex:'unit',width:76},
  {title:'工艺',dataIndex:'process',width:92,onCell:(_,index)=>index===0?{rowSpan:baseRows.length}:{rowSpan:0},render:(value:string)=>value||'—'},
  {title:'PH值',dataIndex:'ph',width:74,onCell:(_,index)=>index===0?{rowSpan:baseRows.length}:{rowSpan:0},render:(value:string)=>value||'—'},
 ]}/>;
 const tabs=[{key:'original',label:'原配方',children:formulaTable('original')},{key:'large',label:'大货配方',children:formulaTable('large')},{key:'accounting',label:'核算配方',children:formulaTable('accounting')}];
 return <Modal className="copy-formula-modal" title="查看配方" open={!!record} width="calc(100vw - 32px)" style={{top:12}} onCancel={onClose} destroyOnHidden footer={null}>
  {record&&<><Descriptions className="copy-formula-view-meta" bordered size="small" column={5} items={[
   {key:'card',label:'流程卡号',children:record.processCard||`Y260630${record.key.replace(/\D/g,'').padStart(4,'0')}`},
   {key:'order',label:'订字',children:record.order},{key:'product',label:'品名',children:record.product},{key:'color',label:'色号',children:record.colorNo},{key:'dye',label:'染料类别',children:record.dyeCategory||'活性'},
   {key:'pieces',label:'实配米匹数',children:'-匹 / -米'},{key:'bath',label:'浴比',children:`1:${record.ratio}`},{key:'algorithm',label:'算法',children:'-kg'},{key:'weight',label:'白坯克重',children:record.greigeWeight||'200g/m²'},{key:'source',label:'原配方号',children:record.formula.replace(/v\d+$/,'')},
   {key:'requirements',label:'加工要求',span:5,children:record.processingRequirements||'成品手感：滑爽 | 成品光暗：一般 | 布面起皱风格：否 | 布面光洁：否 | 高牢度：否 | 预缩要求：否'},
  ]}/><div className="copy-formula-view-section"><strong>配方详情</strong><Tabs defaultActiveKey="large" items={tabs}/></div></>}
 </Modal>;
}
