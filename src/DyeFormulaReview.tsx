import {useState} from 'react';
import {App,Button,Checkbox,Descriptions,Drawer,Input,InputNumber,Modal,Select,Space,Table,Tag,Tooltip} from 'antd';
import {DownOutlined,HistoryOutlined,InfoCircleOutlined,PlusOutlined} from '@ant-design/icons';
import type {DyeRow} from './dye-formula-model';
import './dye-formula-review.css';

type ReviewRow=DyeRow&{category:'染料'|'助剂'};

const chemicalOptions=[
 {code:'X2',name:'X-GL艳250%'},{code:'X1',name:'X-BL兰250%'},{code:'A4',name:'2BLN兰100%'},{code:'A14',name:'SE-R紫'},
 {code:'P2',name:'冰醋'},{code:'P103',name:'PEL高温匀染剂'},{code:'B28',name:'艳蓝 KN-RHG'},{code:'B2',name:'3RS黄150%'},
 {code:'B10',name:'3BSN红150%'},{code:'P13',name:'209皂洗剂'},{code:'P1',name:'元明粉'},
];

const initialRows:ReviewRow[]=[
 {key:'1',stage:1,category:'染料',code:'X2',name:'X-GL艳250%',ratio:1,algorithm:'布重',unit:'克/市斤',process:'04',processName:'130°C*20′',ph:'4.5-5.2'},
 {key:'2',stage:1,category:'染料',code:'X1',name:'X-BL兰250%',ratio:1,algorithm:'布重',unit:'克/市斤',process:'',processName:'',ph:''},
 {key:'3',stage:1,category:'染料',code:'A4',name:'2BLN兰100%',ratio:1,algorithm:'布重',unit:'克/市斤',process:'',processName:'',ph:''},
 {key:'4',stage:1,category:'染料',code:'A14',name:'SE-R紫',ratio:1,algorithm:'布重',unit:'克/市斤',process:'',processName:'',ph:''},
 {key:'5',stage:1,category:'助剂',code:'P2',name:'冰醋',ratio:.7,algorithm:'水量',unit:'克/升',process:'',processName:'',ph:''},
 {key:'6',stage:1,category:'助剂',code:'P103',name:'PEL高温匀染剂',ratio:1,algorithm:'水量',unit:'克/升',process:'',processName:'',ph:''},
 {key:'7',stage:2,category:'染料',code:'B28',name:'艳蓝 KN-RHG',ratio:1,algorithm:'布重',unit:'克/市斤',process:'16',processName:'60°C*60′',ph:'10.8-11.8'},
 {key:'8',stage:2,category:'染料',code:'B2',name:'3RS黄150%',ratio:1,algorithm:'布重',unit:'克/市斤',process:'',processName:'',ph:''},
 {key:'9',stage:2,category:'染料',code:'B10',name:'3BSN红150%',ratio:1,algorithm:'布重',unit:'克/市斤',process:'',processName:'',ph:''},
 {key:'10',stage:2,category:'助剂',code:'P2',name:'冰醋',ratio:.2,algorithm:'水量',unit:'克/升',process:'09',processName:'75°C*10′',ph:''},
 {key:'11',stage:2,category:'助剂',code:'P13',name:'209皂洗剂',ratio:.4,algorithm:'水量',unit:'克/升',process:'',processName:'',ph:''},
 {key:'12',stage:2,category:'助剂',code:'P1',name:'元明粉',ratio:24.68,algorithm:'水量',unit:'克/升',process:'',processName:'',ph:''},
];

const processOptions=[
 {value:'',label:'请选择工艺'},
 {value:'04',label:"04 - 130°C*20′",name:"130°C*20′",ph:'4.5-5.2'},
 {value:'16',label:"16 - 60°C*60′",name:"60°C*60′",ph:'10.8-11.8'},
 {value:'09',label:"09 - 75°C*10′",name:"75°C*10′",ph:''},
];

const historyRows=[
 {key:'h1',formula:'C260630005v2',card:'Y2606309503',bath:'1:7',operator:'沈锋',time:'2026-10-10 15:26',status:'已通过'},
 {key:'h2',formula:'C260630005v1',card:'Y2606309018',bath:'1:7',operator:'水木',time:'2026-10-08 09:41',status:'已通过'},
 {key:'h3',formula:'C260630005v0',card:'Y2606308511',bath:'1:8',operator:'钟伟祥',time:'2026-10-03 11:08',status:'已通过'},
];

const changeTypeOptions=['减量调整','预定调整','前处理调整','pH值调整','浴比调整','助剂调整','前道工艺调整','后整理工艺调整','上油温度调整','原料调整','染料调整','配方调整','客户品质调整','其他调整'];

const loadReviewRows=()=>{try{return JSON.parse(localStorage.getItem('lab-dye-formula-review')||'null')??initialRows}catch{return initialRows}};

export default function DyeFormulaReview(){
 const {message}=App.useApp();
 const [expanded,setExpanded]=useState(true);
 const [originalRows]=useState<ReviewRow[]>(loadReviewRows);
 const [rows,setRows]=useState<ReviewRow[]>(()=>structuredClone(originalRows));
 const [historyOpen,setHistoryOpen]=useState(false),[auditOpen,setAuditOpen]=useState(false),[changeOpen,setChangeOpen]=useState(false),[changeReason,setChangeReason]=useState(''),[changeTypes,setChangeTypes]=useState<string[]>(['配方调整']),[changeSubmitted,setChangeSubmitted]=useState(false),[reviewer,setReviewer]=useState('水木'),[comment,setComment]=useState('');
 const patch=(key:string,value:Partial<ReviewRow>)=>setRows(current=>current.map(row=>row.key===key?{...row,...value}:row));
 const changeChemical=(key:string,code:string)=>{const chemical=chemicalOptions.find(item=>item.code===code);if(chemical)patch(key,{code,name:chemical.name})};
 const addAfter=(source:ReviewRow)=>setRows(current=>{const index=current.findIndex(row=>row.key===source.key);const next=[...current];next.splice(index+1,0,{key:crypto.randomUUID(),stage:source.stage,category:'助剂',code:'P2',name:'冰醋',ratio:0,algorithm:'水量',unit:'克/升',process:'',processName:'',ph:''});return next});
 const remove=(key:string)=>setRows(current=>current.filter(row=>row.key!==key));
 const ratioChanges=rows.flatMap(row=>{const original=originalRows.find(item=>item.key===row.key);return original?.ratio===row.ratio?[]:[{key:row.key,code:row.code,name:row.name,before:original?.ratio??'新增',after:row.ratio??'—'}]}).concat(originalRows.filter(original=>!rows.some(row=>row.key===original.key)).map(original=>({key:`removed-${original.key}`,code:original.code,name:original.name,before:original.ratio??'—',after:'删除'})));
 const submitAudit=()=>{if(!reviewer.trim()){message.warning('请填写审核人');return}localStorage.setItem('lab-dye-formula-review',JSON.stringify(rows));setAuditOpen(false);message.success('染色配方审核通过，审核结果已保存')};
 const submitChange=()=>{if(!changeTypes.length){message.warning('请选择变更类型');return}if(!changeReason.trim()){message.warning('请填写变更原因');return}localStorage.setItem('lab-dye-formula-review-change',JSON.stringify({card:'Y2606309503',formula:'C260630005',applicant:'水木',types:changeTypes,reason:changeReason.trim(),changes:ratioChanges,submittedAt:new Date().toISOString(),status:'待确认',before:originalRows,after:rows}));setChangeOpen(false);setChangeSubmitted(true);message.success('配方变更申请已提交，等待确认')};

 return <section className="panel dye-formula-review">
  <div className="dye-formula-review-title" onClick={()=>setExpanded(value=>!value)}><div><b>染色配方审核</b><span>Y2606309503 | 阿杰沃康康 | 蓝色 | 正常转卡 | 实配12匹1440米 | C260630005 | 浴次:2 | 浴比:7 | J03# | 推荐浴比:7</span><Tag color="green">浴比匹配</Tag></div><DownOutlined rotate={expanded?0:180}/></div>
  {expanded&&<Descriptions className="dye-formula-review-meta" bordered size="small" column={6} items={[
   {key:'order',label:'订字',children:'阿杰沃康康'},{key:'product',label:'品名',children:'T/R四面弹'},{key:'colorNo',label:'色号',children:'蓝色'},
   {key:'depth',label:'颜色深浅',children:'中色'},{key:'card',label:'流程卡',children:'Y2606309503'},{key:'vat',label:'预排染缸',children:'J03#'},
  ]}/>} 
  <div className="dye-formula-review-toolbar"><h3>配方-染色</h3><span className="dye-formula-review-spacer"/><Button type="primary" icon={<HistoryOutlined/>} onClick={()=>setHistoryOpen(true)}>历史工艺</Button></div>
  <div className="dye-formula-review-table"><Table<ReviewRow> bordered size="small" rowKey="key" pagination={false} dataSource={rows} tableLayout="fixed" scroll={{x:1580,y:'calc(100vh - 300px)'}} columns={[
   {title:'阶段',width:70,render:(_,row)=><Select aria-label={`${row.key}阶段`} value={row.stage} onChange={stage=>patch(row.key,{stage})} options={[1,2,3].map(value=>({value,label:value}))}/>} ,
   {title:'类别',width:80,dataIndex:'category'},
   {title:'代码',width:100,render:(_,row)=><Select aria-label={`${row.key}染助剂代码`} showSearch optionFilterProp="label" value={row.code} onChange={code=>changeChemical(row.key,code)} options={chemicalOptions.map(item=>({value:item.code,label:item.code}))}/>},
   {title:'染助剂名称',width:155,dataIndex:'name',ellipsis:true},
   {title:'比例',width:180,render:(_,row)=><InputNumber aria-label={`${row.key}比例`} controls={false} min={0} value={row.ratio} onChange={ratio=>patch(row.key,{ratio})}/>},
   {title:'算法',width:160,render:(_,row)=><Select aria-label={`${row.key}算法`} value={row.algorithm} onChange={algorithm=>patch(row.key,{algorithm,unit:algorithm==='布重'?'克/市斤':'克/升'})} options={['布重','水量'].map(value=>({value,label:value}))}/>},
   {title:'单位',width:160,render:(_,row)=><Select aria-label={`${row.key}单位`} value={row.unit} onChange={unit=>patch(row.key,{unit})} options={['克/市斤','克/升'].map(value=>({value,label:value}))}/>},
   {title:'工艺代码',width:180,render:(_,row)=><Select aria-label={`${row.key}工艺代码`} value={row.process} onChange={process=>{const option=processOptions.find(item=>item.value===process);patch(row.key,{process,processName:option?.name??'',ph:option?.ph??''})}} options={processOptions}/>},
   {title:'工艺名',width:180,render:(_,row)=><Input aria-label={`${row.key}工艺名`} value={row.processName} onChange={event=>patch(row.key,{processName:event.target.value})}/>},
   {title:'pH值',width:170,render:(_,row)=><Input aria-label={`${row.key}pH值`} value={row.ph} onChange={event=>patch(row.key,{ph:event.target.value})}/>},
   {title:'操作',width:100,fixed:'right',render:(_,row)=><Space size={2}><Button type="link" icon={<PlusOutlined/>} onClick={()=>addAfter(row)}>新增</Button><Button type="link" danger disabled={rows.length===1} onClick={()=>remove(row.key)}>删除</Button></Space>},
  ]}/></div>
  <div className="dye-formula-review-source"><span>当前工艺配方来自于：<b>Y2606309503 | 阿杰沃康康 | 蓝色 | 正常转卡 | 进行中</b></span><Space><Button onClick={()=>message.info('已返回待审核流程卡列表')}>返 回</Button><Button type="primary" disabled={changeSubmitted} onClick={()=>ratioChanges.length?setChangeOpen(true):setAuditOpen(true)}>提交审核</Button></Space></div>

  <Drawer title="历史染色配方" open={historyOpen} width={760} onClose={()=>setHistoryOpen(false)} footer={<div className="drawer-footer"><Button onClick={()=>setHistoryOpen(false)}>关闭</Button></div>}><Table bordered size="small" pagination={false} dataSource={historyRows} columns={[{title:'配方号',dataIndex:'formula'},{title:'流程卡号',dataIndex:'card'},{title:'浴比',dataIndex:'bath',width:80},{title:'审核人',dataIndex:'operator',width:90},{title:'审核时间',dataIndex:'time',width:160},{title:'状态',dataIndex:'status',width:80,render:value=><Tag color="green">{value}</Tag>}]}/></Drawer>
  <Modal className="dye-formula-change-modal" width={720} title="提交配方变更申请" open={changeOpen} onCancel={()=>setChangeOpen(false)} onOk={submitChange} okText="提交变更申请" cancelText="取消" okButtonProps={{disabled:!changeTypes.length||!changeReason.trim()}}><div className="dye-formula-change-row"><label>变更类型</label><div className="dye-formula-change-types">{changeTypeOptions.map(type=><Checkbox key={type} checked={changeTypes.includes(type)} onChange={event=>setChangeTypes(current=>event.target.checked?[...current,type]:current.filter(item=>item!==type))}>{type}</Checkbox>)}<Tooltip title="可多选，按本次申请的实际变更内容勾选"><InfoCircleOutlined className="dye-formula-change-info"/></Tooltip></div></div><div className="dye-formula-change-row dye-formula-change-reason"><label><span className="dye-formula-required">*</span> 变更原因</label><Input.TextArea aria-label="配方变更原因" value={changeReason} onChange={event=>setChangeReason(event.target.value)} rows={3} maxLength={300} placeholder="请填写变更原因（必填）"/></div></Modal>
  <Modal title="确认染色配方审核" open={auditOpen} onCancel={()=>setAuditOpen(false)} onOk={submitAudit} okText="审核通过" cancelText="取消"><Descriptions column={1} bordered size="small" items={[{key:'card',label:'流程卡',children:'Y2606309503'},{key:'formula',label:'配方号',children:'C260630005'},{key:'bath',label:'审核浴比',children:'1:7'},{key:'rows',label:'配方明细',children:`${rows.length} 项`}]} /><div className="dye-formula-review-field"><label>审核人</label><Input value={reviewer} onChange={event=>setReviewer(event.target.value)} placeholder="请输入审核人"/></div><div className="dye-formula-review-field"><label>审核意见</label><Input.TextArea value={comment} onChange={event=>setComment(event.target.value)} rows={3} placeholder="可填写审核意见"/></div></Modal>
 </section>
}
