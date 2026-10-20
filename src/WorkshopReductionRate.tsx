import {useMemo,useState} from 'react';
import {App,Button,DatePicker,Input,InputNumber,Select,Space,Table,Tabs,Tag} from 'antd';
import dayjs from 'dayjs';
import './workshop-reduction-rate.css';

type FormulaRecord={key:string;formulaNo:string;category:string;order:string;colorNo:string;headVat:string;formulaType:string;customer:string;product:string;style:string;spec:string;orderDate:string;created:string;status:'待判定'|'已通过'|'未通过';vats:number;pieces:number;meters:number;reduction:number;referenceCard:string;sizingRate:number};
type DetailRow={key:string;stage:number;code:string;name:string;ratio:number;reduction:number;algorithm:'布重'|'水量';unit:string;ph:string;process:string;requirement:string};

const records:FormulaRecord[]=[
 {key:'1',formulaNo:'C261014082',category:'大样',order:'美超2W0975',colorNo:'BF39#灰色',headVat:'--',formulaType:'回修',customer:'美超',product:'阳粘纬弹',style:'--',spec:'--',orderDate:'2026-09-15 19:24',created:'2026-10-14 07:22',status:'待判定',vats:1,pieces:5,meters:0,reduction:10,referenceCard:'Y2609084031',sizingRate:5},
 {key:'2',formulaNo:'C261014080',category:'大样',order:'统鑫LMP1405',colorNo:'BF1气巴才',headVat:'--',formulaType:'正常',customer:'统鑫',product:'T/R四面弹',style:'--',spec:'--',orderDate:'2026-10-08 19:52',created:'2026-10-14 07:08',status:'待判定',vats:2,pieces:0,meters:3500,reduction:8,referenceCard:'Y2609084023',sizingRate:4.5},
 {key:'3',formulaNo:'C261014078',category:'大样',order:'龙百3740毛',colorNo:'18',headVat:'--',formulaType:'正常',customer:'龙百',product:'T/R毛经弹',style:'--',spec:'--',orderDate:'2026-10-06 20:38',created:'2026-10-14 06:56',status:'待判定',vats:1,pieces:0.5,meters:0,reduction:12,referenceCard:'Y2609084028',sizingRate:6.5},
 {key:'4',formulaNo:'C261014076',category:'大样',order:'龙百3740毛',colorNo:'17',headVat:'--',formulaType:'正常',customer:'龙百',product:'T/R毛经弹',style:'--',spec:'--',orderDate:'2026-10-06 20:38',created:'2026-10-14 06:52',status:'待判定',vats:1,pieces:0.5,meters:0,reduction:10,referenceCard:'Y2609084027',sizingRate:6},
 {key:'5',formulaNo:'C261014074',category:'大样',order:'龙百3740毛',colorNo:'16',headVat:'--',formulaType:'正常',customer:'龙百',product:'T/R毛经弹',style:'--',spec:'--',orderDate:'2026-10-06 20:38',created:'2026-10-14 06:50',status:'待判定',vats:1,pieces:0.5,meters:0,reduction:6,referenceCard:'Y2609084026',sizingRate:5.8},
];

const initialDetails:DetailRow[]=[
 {key:'1',stage:1,code:'C05',name:'X-GRL红250%',ratio:0.023,reduction:0,algorithm:'布重',unit:'克/市斤',ph:'3.9-4.2',process:"02-130°C*30′",requirement:"130°C*20′"},
 {key:'2',stage:1,code:'C06',name:'X-GL金黄250%',ratio:0.013,reduction:0,algorithm:'布重',unit:'克/市斤',ph:'',process:'',requirement:''},
 {key:'3',stage:1,code:'C07',name:'X-BL兰250%',ratio:0.016,reduction:0,algorithm:'布重',unit:'克/市斤',ph:'',process:'',requirement:''},
 {key:'4',stage:1,code:'Z065',name:'助剂C',ratio:2,reduction:0,algorithm:'水量',unit:'克/升',ph:'',process:'',requirement:''},
 {key:'5',stage:1,code:'Z004',name:'冰醋',ratio:1,reduction:0,algorithm:'水量',unit:'克/升',ph:'',process:'',requirement:''},
];

export default function WorkshopReductionRate(){
 const {message}=App.useApp();
 const [tab,setTab]=useState('large'),[rows,setRows]=useState(records),[selected,setSelected]=useState('1'),[details,setDetails]=useState(initialDetails),[reductionRate,setReductionRate]=useState(0);
 const [order,setOrder]=useState(''),[color,setColor]=useState(''),[formula,setFormula]=useState(''),[status,setStatus]=useState('待判定'),[applied,setApplied]=useState({order:'',color:'',formula:'',status:'待判定'});
 const active=rows.find(row=>row.key===selected)??rows[0];
 const referenceCard=(active?.referenceCard??records.find(row=>row.key===active?.key)?.referenceCard??'—').replace(/H-1$/i,'');
 const shown=useMemo(()=>rows.filter(row=>(tab==='large'?row.category==='大样':row.category==='预打样')&&(!applied.order||row.order.includes(applied.order))&&(!applied.color||row.colorNo.includes(applied.color))&&(!applied.formula||row.formulaNo.includes(applied.formula))&&(applied.status==='全部'||row.status===applied.status)),[rows,tab,applied]);
 const patch=(key:string,value:Partial<DetailRow>)=>setDetails(current=>current.map(row=>row.key===key?{...row,...value}:row));
 const applyReduction=()=>{if(reductionRate<=0||reductionRate>=100){message.warning('请输入大于 0 且小于 100 的扣减比例');return}setDetails(current=>current.map(row=>({...row,ratio:Number((row.ratio*(1-reductionRate/100)).toFixed(3)),reduction:0})));message.success(`已从原始比例中扣减 ${reductionRate}%`)};
 const audit=(next:FormulaRecord['status'])=>{setRows(current=>current.map(row=>row.key===selected?{...row,status:next}:row));message.success(next==='已通过'?'减量率审核已通过':'减量率申请已退回')};
 const add=()=>setDetails(current=>[...current,{key:crypto.randomUUID(),stage:1,code:'',name:'',ratio:0,reduction:0,algorithm:'布重',unit:'克/市斤',ph:'',process:'',requirement:''}]);
 return <section className="reduction-rate-page panel">
  <div className="reduction-rate-heading"><h3>三车间减量率</h3><span>配方减量审核与明细维护</span></div>
  <Tabs activeKey={tab} onChange={setTab} items={[{key:'large',label:'大样配方'},{key:'sample',label:'预打样配方'}]}/>
  <div className="reduction-rate-filters">
   <label>订字：<Input aria-label="减量率订字" placeholder="请输入" value={order} onChange={event=>setOrder(event.target.value)}/></label>
   <label>色号：<Input aria-label="减量率色号" placeholder="请输入" value={color} onChange={event=>setColor(event.target.value)}/></label>
   <label>配方号：<Input aria-label="减量率配方号" placeholder="请输入" value={formula} onChange={event=>setFormula(event.target.value)}/></label>
   <label className="reduction-rate-date">日期：<DatePicker.RangePicker defaultValue={[dayjs('2026-10-07'),dayjs('2026-10-14')]} showTime/></label>
   <label>配方类型：<Select defaultValue="全部" options={['全部','正常','回修'].map(value=>({value,label:value}))}/></label>
   <label>审核状态：<Select value={status} onChange={setStatus} options={['全部','待判定','已通过','未通过'].map(value=>({value,label:value}))}/></label>
   <Space size={6}><Button type="primary" onClick={()=>setApplied({order,color,formula,status})}>查询</Button><Button onClick={()=>{setOrder('');setColor('');setFormula('');setStatus('待判定');setApplied({order:'',color:'',formula:'',status:'待判定'})}}>重置</Button><Button disabled={!selected} onClick={()=>audit('已通过')}>审核通过</Button><Button disabled={!selected} danger onClick={()=>audit('未通过')}>未通过重打</Button><Button onClick={()=>window.print()}>打印</Button></Space>
  </div>
  <Table<FormulaRecord> className="reduction-rate-orders" rowKey="key" bordered size="small" pagination={false} scroll={{x:1620,y:220}} dataSource={shown} rowSelection={{type:'radio',selectedRowKeys:[selected],onChange:keys=>setSelected(String(keys[0]??''))}} onRow={row=>({onClick:()=>setSelected(row.key)})} rowClassName={row=>row.key===selected?'active-row':''} columns={[
   {title:'配方状态',dataIndex:'status',width:85,render:value=><Tag color={value==='已通过'?'green':value==='未通过'?'red':'default'}>{value}</Tag>},{title:'配方号',dataIndex:'formulaNo',width:110},{title:'配方类别',dataIndex:'category',width:90},{title:'订字',dataIndex:'order',width:130},{title:'色号',dataIndex:'colorNo',width:125},{title:'头缸',dataIndex:'headVat',width:70},{title:'配方类型',dataIndex:'formulaType',width:90},{title:'客户',dataIndex:'customer',width:85},{title:'品名',dataIndex:'product',width:120},{title:'品名风格',dataIndex:'style',width:90},{title:'规格',dataIndex:'spec',width:80},{title:'下单日期',dataIndex:'orderDate',width:145},{title:'创建日期',dataIndex:'created',width:145},{title:'审核状态',dataIndex:'status',width:90},{title:'订单缸数',dataIndex:'vats',width:80},{title:'订单匹数',dataIndex:'pieces',width:80},{title:'订单米数',dataIndex:'meters',width:90},{title:'减量率',dataIndex:'reduction',width:80,render:value=><b className="reduction-rate-value">{value}%</b>}
  ]}/>
  <div className="reduction-rate-detail-heading"><div><b>配方明细</b><span>{active?.formulaNo} · {active?.order} · {active?.colorNo}</span></div><Space size={6}>{active?.referenceCard&&active.reduction!=null&&<div className="reduction-rate-inline-result"><span>参照流程卡</span><b>{referenceCard}</b><span>减量率</span><b>{active.reduction}%</b></div>}{active?.sizingRate!=null&&<div className="reduction-rate-inline-result"><span>含浆率</span><b>{active.sizingRate}%</b></div>}<div className="reduction-rate-deduction"><span>扣减比例</span><InputNumber aria-label="原始比例扣减值" min={0} max={99.99} precision={2} addonAfter="%" placeholder="请输入" value={reductionRate} onChange={value=>setReductionRate(value??0)}/><Button type="primary" disabled={reductionRate<=0||reductionRate>=100} onClick={applyReduction}>确认扣减</Button></div><Button type="primary" onClick={()=>setDetails(current=>current.map(row=>({...row,reduction:active?.reduction??10})))}>元明粉加{active?.reduction??10}%</Button><Button type="primary" onClick={()=>message.success('配方明细已保存')}>保存</Button><Button type="primary" danger onClick={()=>{setDetails(initialDetails);setReductionRate(0);message.info('已恢复初始配方明细')}}>放弃</Button></Space></div>
  <Table<DetailRow> className="reduction-rate-details" rowKey="key" bordered size="small" pagination={false} scroll={{x:1450,y:310}} dataSource={details} columns={[
   {title:'操作',width:115,fixed:'left',render:(_,row)=><Space size={8}><Button type="link" onClick={add}>新增</Button><Button type="link" danger onClick={()=>setDetails(current=>current.filter(item=>item.key!==row.key))}>删除</Button></Space>},
   {title:'阶段',width:90,render:(_,row)=><InputNumber min={1} value={row.stage} onChange={value=>patch(row.key,{stage:value??1})}/>},{title:'染助剂',width:150,render:(_,row)=><Select value={row.code} onChange={value=>patch(row.key,{code:value})} options={['C05','C06','C07','Z065','Z004'].map(value=>({value,label:value}))}/>},{title:'染助剂名称',dataIndex:'name',width:180},{title:'比例',width:120,render:(_,row)=><InputNumber min={0} precision={3} value={row.ratio} onChange={value=>patch(row.key,{ratio:value??0})}/>},{title:'算法',width:120,render:(_,row)=><Select value={row.algorithm} onChange={value=>patch(row.key,{algorithm:value,unit:value==='布重'?'克/市斤':'克/升'})} options={['布重','水量'].map(value=>({value,label:value}))}/>},{title:'单位',width:120,render:(_,row)=><Select value={row.unit} onChange={value=>patch(row.key,{unit:value})} options={['克/市斤','克/升'].map(value=>({value,label:value}))}/>},{title:'PH值',width:130,render:(_,row)=><Input value={row.ph} onChange={event=>patch(row.key,{ph:event.target.value})}/>},{title:'工艺号',width:150,render:(_,row)=><Input value={row.process} onChange={event=>patch(row.key,{process:event.target.value})}/>},{title:'工艺要求',width:160,render:(_,row)=><Input value={row.requirement} onChange={event=>patch(row.key,{requirement:event.target.value})}/>} 
  ]}/>
 </section>;
}
