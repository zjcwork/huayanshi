import {useMemo,useState} from 'react';
import {Button,DatePicker,Input,Modal,Table} from 'antd';
import dayjs,{type Dayjs} from 'dayjs';
import './reduction-rate-reference-modal.css';

export type ReductionRateReference={key:string;processCard:string;connectedVat:string;order:string;product:string;colorNo:string;formula:string;route:string;beforeWeight:number;afterWeight:number;rate:number|null;temperature:string;duration:string;concentration:string;result:'OK'|'NG';quality:string};
type Props={open:boolean;onClose:()=>void;onReference:(record:ReductionRateReference)=>void};
type RangeValue=[Dayjs|null,Dayjs|null]|null;
type FormulaDetail={key:string;stage:number;category:string;code:string;name:string;ratio:number;algorithm:string;unit:string;processCode:string;processName:string;ph:string};

const sourceRows:ReductionRateReference[]=[
 {key:'1',processCard:'Y2504076507',connectedVat:'',order:'亚华2088兴弹',product:'T/R纬弹',colorNo:'还原宝兰',formula:'磷退浆→预定型→白坯烧毛→平烧→减量',route:'磷退浆→预定型→白坯烧毛→平烧→减量',beforeWeight:16.4,afterWeight:16.11,rate:1.77,temperature:'',duration:'',concentration:'',result:'OK',quality:'来源初始'},
 {key:'2',processCard:'Y250426020',connectedVat:'',order:'东华泰81143',product:'T/R纬弹',colorNo:'1灰',formula:'磷退浆→预定型→白坯烧毛→减量',route:'磷退浆→预定型→白坯烧毛→减量',beforeWeight:10.02,afterWeight:9.99,rate:.3,temperature:'',duration:'',concentration:'',result:'OK',quality:'来源初始'},
 {key:'3',processCard:'Y2504267000',connectedVat:'',order:'美超2K6438',product:'阳粘纬弹',colorNo:'3#深蓝',formula:'平蒸→预定型→白坯烧毛→减量',route:'平蒸→预定型→白坯烧毛→减量',beforeWeight:13.64,afterWeight:12.16,rate:10.85,temperature:'',duration:'',concentration:'',result:'OK',quality:'来源初始'},
 {key:'4',processCard:'Y250427042',connectedVat:'',order:'高诺2k2431-8',product:'T/R四面弹',colorNo:'带布',formula:'平蒸→机缸预缩→预定型→白坯烧毛→减量',route:'平蒸→机缸预缩→预定型→白坯烧毛→减量',beforeWeight:21.13,afterWeight:20.11,rate:4.83,temperature:'',duration:'',concentration:'',result:'OK',quality:'来源初始'},
 {key:'5',processCard:'Y250503036',connectedVat:'',order:'HA200586',product:'T/R裤料',colorNo:'带布',formula:'生坯定型→白坯烧毛→减量',route:'生坯定型→白坯烧毛→减量',beforeWeight:14.02,afterWeight:13.14,rate:6.28,temperature:'',duration:'',concentration:'',result:'OK',quality:'来源初始'},
 {key:'6',processCard:'Y250504006',connectedVat:'',order:'明烨250307',product:'阳粘纬弹',colorNo:'1#',formula:'',route:'',beforeWeight:13.62,afterWeight:13.09,rate:3.89,temperature:'',duration:'',concentration:'',result:'OK',quality:'来源初始'},
 {key:'7',processCard:'Y250504408',connectedVat:'颜色头缸',order:'8-702',product:'T/R',colorNo:'1*',formula:'磷退浆→预定型→白坯烧毛→减量',route:'磷退浆→预定型→白坯烧毛→减量',beforeWeight:10.96,afterWeight:9.8,rate:10.58,temperature:'',duration:'',concentration:'',result:'OK',quality:'来源初始'},
 {key:'8',processCard:'Y250507038',connectedVat:'',order:'东华泰9474',product:'阳粘纬弹',colorNo:'带布',formula:'平蒸→预定型→白坯烧毛→减量',route:'平蒸→预定型→白坯烧毛→减量',beforeWeight:11.93,afterWeight:11.8,rate:1.09,temperature:'',duration:'',concentration:'',result:'OK',quality:'来源初始'},
 {key:'9',processCard:'Y250507039',connectedVat:'',order:'东华泰9476',product:'阳粘纬弹',colorNo:'带布',formula:'平蒸→预定型→白坯烧毛→减量',route:'平蒸→预定型→白坯烧毛→减量',beforeWeight:11.14,afterWeight:10.96,rate:1.62,temperature:'',duration:'',concentration:'',result:'OK',quality:'来源初始'},
 {key:'10',processCard:'Y2505077409',connectedVat:'',order:'于平232653',product:'T/R纬弹',colorNo:'漂白',formula:'磷退浆→预定型→白坯烧毛→减量',route:'磷退浆→预定型→白坯烧毛→减量',beforeWeight:10.6,afterWeight:10.6,rate:null,temperature:'',duration:'',concentration:'',result:'OK',quality:'来源初始'},
];

const formulaDetails:FormulaDetail[]=[
 {key:'1',stage:1,category:'助剂',code:'P26',name:'浴中宝',ratio:2,algorithm:'净重',unit:'千克/缸',processCode:'N',processName:'注意极光印克重250...',ph:'-'},
 {key:'2',stage:1,category:'助剂',code:'P3',name:'液碱',ratio:90,algorithm:'水重',unit:'克/升',processCode:'19',processName:'130°C*30′.366',ph:'-'},
 {key:'3',stage:1,category:'助剂',code:'P5',name:'浓缩去油灵101',ratio:.7,algorithm:'净重',unit:'千克/缸',processCode:'N',processName:'05942--藏青特黑100',ph:'-'},
];

export default function ReductionRateReferenceModal({open,onClose,onReference}:Props){
 const [order,setOrder]=useState(''),[color,setColor]=useState('');
 const [dates,setDates]=useState<RangeValue>([dayjs('2025-02-03'),dayjs('2026-05-03')]);
 const [applied,setApplied]=useState({order:'',color:''});
 const [detailRecord,setDetailRecord]=useState<ReductionRateReference|null>(null);
 const rows=useMemo(()=>sourceRows.filter(row=>(!applied.order||row.order.includes(applied.order))&&(!applied.color||row.colorNo.includes(applied.color))),[applied]);
 const search=()=>setApplied({order:order.trim(),color:color.trim()});
 const reset=()=>{setOrder('');setColor('');setDates([dayjs('2025-02-03'),dayjs('2026-05-03')]);setApplied({order:'',color:''})};
 return <Modal rootClassName="reduction-reference-modal" title="引用减量率" open={open} onCancel={onClose} footer={null} width="calc(100vw - 48px)" style={{top:14}} destroyOnHidden>
  <div className="reduction-reference-filters">
   <Input aria-label="引用减量率订字" placeholder="请输入订字" value={order} onChange={event=>setOrder(event.target.value)} onPressEnter={search}/>
   <Input aria-label="引用减量率色号" placeholder="请输入色号" value={color} onChange={event=>setColor(event.target.value)} onPressEnter={search}/>
   <label className="reduction-reference-date"><span>开卡时间：</span><DatePicker.RangePicker value={dates} onChange={value=>setDates(value as RangeValue)} format="YYYY-MM-DD"/></label>
   <Button type="primary" onClick={search}>查 询</Button><Button onClick={reset}>重 置</Button>
  </div>
  <Table<ReductionRateReference> className="reduction-reference-table" rowKey="key" bordered size="small" tableLayout="fixed" scroll={{x:1540,y:'calc(100vh - 250px)'}} dataSource={rows} pagination={{current:1,pageSize:10,total:1324,showSizeChanger:true,pageSizeOptions:[10,20,50],showQuickJumper:true,showTotal:total=>`共 ${total} 条`,size:'small'}} columns={[
   {title:'流程卡号',dataIndex:'processCard',width:115,ellipsis:true},{title:'连缸号',dataIndex:'connectedVat',width:150,ellipsis:true},{title:'订字',dataIndex:'order',width:150,align:'center'},{title:'品名',dataIndex:'product',width:150,align:'center'},{title:'色号',dataIndex:'colorNo',width:150,align:'center'},
   {title:'减量配方',dataIndex:'formula',width:110,align:'center',render:(value,record)=>value?<Button type="link" onClick={()=>setDetailRecord(record)}>查看</Button>:'—'},
   {title:'减量配方工艺',dataIndex:'formula',key:'formulaProcess',width:120,align:'center',render:value=>value?"130°C*30'":'—'},
   {title:'设定工艺',dataIndex:'formula',key:'plannedProcess',width:110,align:'center',render:value=>value?"130°C*30'":'—'},
   {title:'实际工艺',dataIndex:'formula',key:'actualProcess',width:110,align:'center',render:value=>value?"130°C*30'":'—'},
   {title:'工艺路线',dataIndex:'route',width:240,align:'center',render:value=>value?<a>{value}</a>:'—'},
   {title:'操作',fixed:'right',width:80,align:'center',render:(_,row)=><Button type="link" disabled={row.rate==null} onClick={()=>onReference(row)}>引用</Button>},
  ]}/>
  <Modal rootClassName="reduction-formula-detail-modal" title={<span>减量配方与工艺 <small>{detailRecord?.processCard}</small></span>} open={!!detailRecord} onCancel={()=>setDetailRecord(null)} width={900} style={{maxWidth:'calc(100vw - 32px)'}} footer={<Button onClick={()=>setDetailRecord(null)}>关闭</Button>}>
   <Table<FormulaDetail> bordered size="small" tableLayout="fixed" pagination={false} rowKey="key" dataSource={formulaDetails} columns={[
    {title:'阶段',dataIndex:'stage',width:'8%',align:'center'},{title:'类别',dataIndex:'category',width:'10%',align:'center'},{title:'代码',dataIndex:'code',width:'8%',align:'center'},{title:'染助剂名称',dataIndex:'name',width:'14%',align:'center',ellipsis:true},{title:'比例',dataIndex:'ratio',width:'8%',align:'center'},{title:'算法',dataIndex:'algorithm',width:'8%',align:'center'},{title:'单位',dataIndex:'unit',width:'9%',align:'center'},{title:'工艺代码',dataIndex:'processCode',width:'9%',align:'center'},{title:'工艺名',dataIndex:'processName',width:'18%',align:'center',ellipsis:true},{title:'pH值',dataIndex:'ph',width:'8%',align:'center'},
   ]}/>
  </Modal>
 </Modal>;
}
