import {useState} from 'react';
import {App,Button,Descriptions,Form,Input,InputNumber,Modal,Select,Space,Table} from 'antd';
import type {LabRecord} from './data';
import './query-formula-editor.css';
export type QueryEditorRow={key:string;stage:number;code:string;ratio:number;algorithm:string;unit:string;process?:string;processName?:string;ph?:string};
export type QueryFormulaEdit={bath:number;rows:QueryEditorRow[];reason:string;updatedAt:string};
export default function QueryFormulaEditor({record,initial,onClose,onSave}:{record:LabRecord;initial:{bath:number;rows:QueryEditorRow[]};onClose:()=>void;onSave:(value:QueryFormulaEdit)=>void}){
 const {message}=App.useApp();
 const [rows,setRows]=useState(()=>initial.rows.map((r,i)=>({...r,process:r.process??(i===0?'04':''),processName:r.processName??(i===0?'130°C*20′':''),ph:r.ph??(i===0?'4.8–5.2':'')})));
 const [bath,setBath]=useState<number|null>(initial.bath),[reduction,setReduction]=useState<number|null>(0);
 const [form]=Form.useForm();
 const patch=(key:string,values:Partial<QueryEditorRow>)=>setRows(previous=>previous.map(r=>r.key===key?{...r,...values}:r));
 const add=(index:number,newStage=false)=>setRows(previous=>{const next=[...previous];next.splice(index+1,0,{key:crypto.randomUUID(),stage:newStage?Math.max(...previous.map(r=>r.stage))+1:previous[index]?.stage??1,code:'',ratio:0,algorithm:'布重',unit:'克/市斤',process:'',processName:'',ph:''});return next});
 const save=async()=>{
  try{const {reason}=await form.validateFields();
   if(!bath||!rows.length||rows.some(r=>!r.code.trim()||r.ratio<0||r.stage<1)||!rows.some(r=>r.ratio>0)){message.warning('请填写有效浴比、染助剂代码和比例');return}
   onSave({bath,rows:rows.map(r=>({...r,ratio:Number((r.ratio*(1-(reduction??0)/100)).toFixed(4))})),reason:reason.trim(),updatedAt:new Date().toISOString()});
  }catch{/* Field validation keeps the editor open. */}
 };
 const info={订字:record.order,色号:record.colorNo,品名:record.product,颜色深浅:record.depth,颜色:record.color,染料类别:'活性',客户:record.order,业务员:'赵玉琴',要求浴比:`1:${record.ratio}`,白坯克重:'200g',白坯门幅:'150cm',对色光源:'—',订单类型:'正常单',下单时间:record.created};
 return <Modal title="编辑配方" open width="96vw" style={{top:20}} onCancel={onClose} onOk={save} okText="保存配方" className="query-formula-editor">
  <Descriptions bordered size="small" column={7} items={[...Object.entries(info).map(([label,children])=>({key:label,label,children})),{key:'requirements',label:'加工要求',span:7,children:'成品手感：滑爽 | 成品光暗：一般 | 布面起皱风格：否 | 布面光洁：否 | 高牢度：否 | 预缩要求：否'}]}/>
  <div className="query-reduction">减量率 <InputNumber aria-label="减量率" min={0} max={99.99} value={reduction} onChange={setReduction} suffix="%"/></div>
  <Table<QueryEditorRow> bordered size="small" pagination={false} dataSource={rows} scroll={{x:1200}} columns={[
   {title:'操作',width:135,render:(_,r,index)=><Space size={8}><Button type="link" onClick={()=>add(index)}>增</Button>{index===rows.length-1&&<Button type="link" onClick={()=>add(index,true)}>增阶段</Button>}<Button type="link" danger onClick={()=>setRows(rows.filter(x=>x.key!==r.key))}>删</Button></Space>},
   {title:'浴比',width:65,onCell:(_,i)=>({rowSpan:i===0?rows.length:0}),render:()=> <InputNumber aria-label="浴比" min={0.01} value={bath} onChange={setBath}/>},
   {title:'阶段',width:75,render:(_,r)=><InputNumber aria-label={`${r.code}阶段`} min={1} precision={0} value={r.stage} onChange={v=>patch(r.key,{stage:v??1})}/>},
   {title:'染助剂代码',width:120,render:(_,r)=><Input aria-label="染助剂代码" value={r.code} onChange={e=>patch(r.key,{code:e.target.value})}/>},
   {title:'原比例',width:100,render:(_,r)=><InputNumber aria-label={`${r.code}原比例`} min={0} value={r.ratio} onChange={v=>patch(r.key,{ratio:v??0})}/>},
   {title:'减量率',width:90,render:(_,r)=>Number((r.ratio*(1-(reduction??0)/100)).toFixed(4))},
   {title:'算法',width:110,render:(_,r)=><Select value={r.algorithm} options={['布重','水量'].map(value=>({value}))} onChange={algorithm=>patch(r.key,{algorithm,unit:algorithm==='布重'?'克/市斤':'克/升'})}/>},
   {title:'单位',width:110,render:(_,r)=><Select value={r.unit} options={['克/市斤','克/升'].map(value=>({value}))} onChange={unit=>patch(r.key,{unit})}/>},
   {title:'工艺',width:280,render:(_,r)=><Space.Compact><Input aria-label={`${r.code}工艺代码`} value={r.process} placeholder="工艺代码" onChange={e=>patch(r.key,{process:e.target.value})}/><Input aria-label={`${r.code}工艺`} value={r.processName} onChange={e=>patch(r.key,{processName:e.target.value})}/></Space.Compact>},
   {title:'pH',width:110,render:(_,r)=><Input aria-label={`${r.code}pH`} value={r.ph} onChange={e=>patch(r.key,{ph:e.target.value})}/>},
  ]}/>
  {!rows.length&&<Button onClick={()=>add(-1)}>新增染助剂</Button>}
  <Form form={form} layout="vertical" style={{marginTop:20}}><Form.Item name="reason" label="变更原因" rules={[{required:true,whitespace:true,message:'请填写变更原因'}]}><Input.TextArea rows={3} maxLength={500} showCount placeholder="请填写本次配方变更原因"/></Form.Item></Form>
 </Modal>;
}
