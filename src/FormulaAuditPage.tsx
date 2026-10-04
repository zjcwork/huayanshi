import {useState,type ReactNode} from 'react';
import {App,Button,Descriptions,Input,Modal,Popconfirm,Select,Space,Tag} from 'antd';
import {BarcodeOutlined,EditOutlined,FileTextOutlined,PrinterOutlined,ScanOutlined} from '@ant-design/icons';
import dayjs from 'dayjs';
import type {LabRecord} from './data';
import './formula-audit-page.css';

type Props={records:LabRecord[];onAudit:(row:LabRecord,pass:boolean)=>void;renderFormula:(row:LabRecord)=>ReactNode;onEdit:(row:LabRecord)=>void};

const statusColor=(status:string)=>status==='已通过'?'green':status==='未通过'?'red':'orange';
const formulaType=(row:LabRecord)=>row.formulaType??(row.type==='回修'?'回修':'大样');

export default function FormulaAuditPage({records,onAudit,renderFormula,onEdit}:Props){
 const {message}=App.useApp();
 const [scanOpen,setScanOpen]=useState(false);
 const [scanValue,setScanValue]=useState('');
 const [activeKey,setActiveKey]=useState<string|null>(null);
 const active=records.find(row=>row.key===activeKey)??null;
 const options=records.map(row=>({value:row.processCard??'',label:`${row.processCard||'无流程卡号'} | ${row.order} | ${row.colorNo}`})).filter(option=>option.value);
 const begin=(requested?:string)=>{
  const value=(requested??scanValue).trim();
  if(!value){message.warning('请扫描或输入流程卡号');return;}
  const row=records.find(item=>item.processCard?.toLowerCase()===value.toLowerCase());
  if(!row){message.warning('未找到该流程卡，请核对后重试');return;}
  setActiveKey(row.key);setScanValue(row.processCard??value);setScanOpen(false);
 };
 const decide=(pass:boolean)=>{
  if(!active||active.status!=='待审核')return;
  onAudit(active,pass);setActiveKey(null);setScanValue('');
 };
 const closeReview=()=>{setActiveKey(null);setScanValue('')};
 const scanModal=<Modal title="扫描流程卡" open={scanOpen} onCancel={()=>setScanOpen(false)} onOk={()=>begin()} okText="开始审核" cancelText="取消" okButtonProps={{disabled:!scanValue.trim()}}><div className="formula-audit-scan-form"><p>请扫描条码或输入流程卡号</p><Input autoFocus aria-label="审核流程卡号" prefix={<BarcodeOutlined/>} placeholder="请输入流程卡号" value={scanValue} onChange={event=>setScanValue(event.target.value)} onPressEnter={()=>begin()}/><Select aria-label="选择待审核流程卡" showSearch optionFilterProp="label" placeholder="或选择待审核流程卡" value={scanValue||undefined} onChange={value=>begin(value)} options={options}/></div></Modal>;
 if(!active)return <section className="panel formula-audit-empty"><button className="scan-prompt" onClick={()=>setScanOpen(true)}><ScanOutlined/>请扫描流程卡开始审核</button>{scanModal}</section>;
 const pending=active.status==='待审核';
 return <section className="panel formula-audit-review">
  <div className="formula-audit-toolbar"><Select aria-label="切换审核流程卡" showSearch optionFilterProp="label" value={active.processCard} onChange={begin} options={options}/><Button icon={<ScanOutlined/>} onClick={()=>setScanOpen(true)}>重新扫码</Button></div>
  <div className="formula-audit-title"><div><span className="formula-audit-title-icon"><FileTextOutlined/></span><div><h2>配方审核</h2><p>{active.processCard} <b>|</b> {active.order} <b>|</b> {active.colorNo}</p></div></div><Tag color={statusColor(active.status)}>{active.status}</Tag></div>
  <Descriptions className="formula-audit-metadata" bordered size="small" column={6} items={[
   {key:'product',label:'品名',children:active.product},{key:'color',label:'颜色',children:<span className="audit-color"><i style={{background:active.hex}}/>{active.color}</span>},{key:'depth',label:'浅中深',children:active.depth},{key:'formulaType',label:'配方类型',children:formulaType(active)},{key:'dye',label:'染料类型',children:active.dyeCategory??(active.key==='1'?'混纺':'活性')},{key:'light',label:'对色光源',children:active.colorLight||'—'},
   {key:'bath',label:'订单浴比',children:`1:${active.ratio}`},{key:'formula',label:'配方号',children:active.formula,span:2},{key:'worker',label:'打样员',children:active.worker},{key:'completed',label:'打样完成时间',children:dayjs(active.created).format('YYYY-MM-DD HH:mm:ss'),span:2},
  ]}/>
  <div className="formula-audit-formula-heading"><div><h3>待审配方</h3><span>{active.formula}</span></div><Space><Button icon={<PrinterOutlined/>} onClick={()=>window.print()}>打印</Button><Button icon={<EditOutlined/>} disabled={!pending} onClick={()=>onEdit(active)}>编辑配方</Button></Space></div>
  <div className="formula-audit-formula">{renderFormula(active)}</div>
  <div className="formula-audit-actions"><span>审核人：水木</span><Space><Button onClick={closeReview}>返 回</Button><Popconfirm title="确认该配方未通过？" description="审核结果将记录为未通过。" okText="确认" cancelText="取消" onConfirm={()=>decide(false)}><Button danger disabled={!pending}>未通过</Button></Popconfirm><Button type="primary" disabled={!pending} onClick={()=>decide(true)}>审核通过</Button></Space></div>
  {scanModal}
 </section>;
}
