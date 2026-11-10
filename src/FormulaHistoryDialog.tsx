import {useEffect,useState} from 'react';
import {App,Button,Descriptions,Empty,Modal,Space,Table,Tabs,Tag} from 'antd';
import {EditOutlined,PrinterOutlined} from '@ant-design/icons';
import dayjs from 'dayjs';
import type {LabRecord} from './data';
import type {Formula} from './dye-formula-model';
import type {QueryFormulaEdit} from './QueryFormulaEditor';
import DyeFormulaTable from './DyeFormulaTable';
import FormulaBasicInfo from './FormulaBasicInfo';
import {historyProductionCards,historyVersions} from './formula-history-view';
import './formula-history-dialog.css';

export type HistoryUsage={
 key:string|number;formula:string;card:string;version:number;bath:number;isSample:boolean;
 available:boolean;confirmed:boolean;created:string;reason:string;addition:number;defect:string;
 halfDirection:string;halfDepth:string;finishedDirection:string;finishedDepth:string;
};
type Props={
 open:boolean;record:LabRecord;bath:number;baths:number[];usages:HistoryUsage[];selected:HistoryUsage;
 formula:Formula;readFormula:(number:string,version:number)=>Formula;edits:Record<string,QueryFormulaEdit>;
 editing:Formula|null;onEdit:()=>void;onDraft:(formula:Formula)=>void;onSave:()=>void;onCancelEdit:()=>void;
 onBath:(bath:number)=>void;onVersion:(formula:string)=>void;onClose:()=>void;onAccounting:(card:string)=>void;
};
const dateText=(value?:string)=>value&&dayjs(value).isValid()?dayjs(value).format('YYYY-MM-DD HH:mm'):'未记录';
function matchTags(direction:string,depth:string){
 return direction==='正常'&&depth==='正常'?<Tag color="green">正常</Tag>:<Space size={4} wrap><Tag color="orange">{direction}</Tag><Tag>{depth}</Tag></Space>;
}
export default function FormulaHistoryDialog(props:Props){
 const {open,record,bath,baths,usages,selected,formula,readFormula,edits,editing,onEdit,onDraft,onSave,onCancelEdit,onBath,onVersion,onClose,onAccounting}=props;
 const {message,modal}=App.useApp();
 const [tab,setTab]=useState('formula');
 const [card,setCard]=useState('');
 useEffect(()=>{if(open){setTab('formula');setCard('');document.body.classList.add('formula-history-open');}return()=>document.body.classList.remove('formula-history-open');},[open]);
 useEffect(()=>setCard(''),[selected.formula,bath]);
 const versions=historyVersions(usages);
 const cards=historyProductionCards(usages,selected.formula);
 const selectedCard=cards.find(item=>item.card===card);
 const saved=edits[selected.formula]??(selected.version===0?edits[record.key]:undefined);
 const previousNumber=selected.version>0?selected.formula.replace(/v\d+$/,`v${selected.version-1}`):undefined;
 const previous=previousNumber?readFormula(previousNumber,selected.version-1):undefined;
 const protect=(action:()=>void)=>{if(editing){message.warning('请先保存或取消配方编辑');return;}action();};
 const close=()=>{
  if(editing){modal.confirm({title:'放弃尚未保存的配方修改？',content:'关闭后，本次编辑内容将不会保存。',okText:'放弃修改',cancelText:'继续编辑',onOk:()=>{onCancelEdit();onClose();}});return;}
  onClose();
 };
 return <Modal className="formula-history-dialog" open={open} width="min(1440px, calc(100vw - 48px))" style={{top:24}} title={<div className="formula-history-title"><span>配方履历</span><strong>{record.order}</strong><span>色号：{record.colorNo}</span></div>} onCancel={close} maskClosable={false} footer={<Button onClick={close}>关闭</Button>}>

  <div className="formula-history-workspace">
   <section className="formula-history-sidebar" aria-label="配方版本列表">
    <Tabs className="formula-history-bath-tabs" aria-label="履历详情浴比" size="small" activeKey={String(bath)} onChange={value=>protect(()=>onBath(Number(value)))} items={baths.map(value=>({key:String(value),label:`浴比 1:${value}`,disabled:!!editing}))}/>
    <div className="formula-history-version-list">
     {versions.map(row=>{
      const metadata=edits[row.formula]??(row.version===0?edits[record.key]:undefined);
      return <button key={row.formula} type="button" className={`formula-history-version-item${row.formula===selected.formula?' is-selected':''}`} aria-pressed={row.formula===selected.formula} onClick={()=>protect(()=>onVersion(row.formula))}>
       <div className="formula-history-version-title"><strong>{row.formula}</strong>{row.isSample&&<Tag color="blue">小样</Tag>}<Tag color={row.confirmed?'green':'orange'}>{row.confirmed?'已确认':'待确认'}</Tag>{row.available&&<Tag color="blue">当前可用</Tag>}</div>
       <time>{dateText(metadata?.updatedAt??row.created)}</time>
       <span className="formula-history-version-reason">{metadata?.reason||row.reason||'未记录变更原因'}</span>
      </button>;
     })}
    </div>
   </section>
   <div className="formula-history-detail">
    <FormulaBasicInfo record={record}/>

  <Tabs activeKey={tab} onChange={value=>protect(()=>setTab(value))} items={[
   {key:'formula',label:'配方明细',children:<section className="formula-history-content">
    <div className="formula-history-section-heading"><h3>配方明细</h3><Space>{editing?<><Button onClick={onCancelEdit}>取消</Button><Button type="primary" onClick={onSave}>保存</Button></>:<><Button icon={<EditOutlined/>} onClick={onEdit}>编辑</Button><Button icon={<PrinterOutlined/>} onClick={()=>window.print()}>打印</Button></>}</Space></div>
    <div className="formula-history-formula-table"><DyeFormulaTable hideName showBath formula={editing??formula} editing={!!editing} onChange={onDraft}/></div>
   </section>},
   {key:'cards',label:`使用记录（${cards.length}）`,children:<section className="formula-history-content">
    <div className="formula-history-section-heading"><h3>使用流程卡</h3><span className="formula-history-number">{selected.formula}</span></div>
    <Table<HistoryUsage> bordered size="small" rowKey="card" dataSource={cards} pagination={false} scroll={{x:900}} locale={{emptyText:selected.isSample?'小样配方暂无生产流程卡':'该版本暂无使用记录'}} rowClassName={row=>row.card===card?'formula-history-card-selected':''} columns={[
     {title:'流程卡号',dataIndex:'card',width:170,render:(value)=><Button type="link" onClick={()=>setCard(value)}>{value}</Button>},
     {title:'使用时间',dataIndex:'created',width:160},
     {title:'加料次数',dataIndex:'addition',width:90,render:value=>`${value} 次`},
     {title:'不良',dataIndex:'defect',width:110},
     {title:'半检对样',width:160,render:(_,row)=>matchTags(row.halfDirection,row.halfDepth)},
     {title:'成品对样',width:160,render:(_,row)=>matchTags(row.finishedDirection,row.finishedDepth)},
     {title:'操作',width:100,render:(_,row)=><Button type="link" onClick={()=>onAccounting(row.card)}>核算配方</Button>}
    ]}/>
    {selectedCard&&<div className="formula-history-card-details"><div className="formula-history-section-heading"><h3>流程卡资料 · {selectedCard.card}</h3><Button type="text" onClick={()=>setCard('')}>关闭资料</Button></div><Descriptions bordered size="small" column={{xs:1,sm:2,lg:3}} items={[
     {key:'order',label:'订字',children:record.order},{key:'product',label:'品名',children:record.product},{key:'color',label:'色号',children:record.colorNo},
     {key:'customer',label:'客户',children:record.customer||'—'},{key:'salesperson',label:'业务员',children:record.salesperson||'—'},{key:'dyeCategory',label:'染料类别',children:record.dyeCategory||'—'},{key:'orderCategory',label:'订单类型',children:record.orderCategory||'—'},
     {key:'bath',label:'浴比',children:`1:${selectedCard.bath}`},{key:'formula',label:'使用配方',children:selectedCard.formula},{key:'time',label:'使用时间',children:dateText(selectedCard.created)},
     {key:'defect',label:'不良信息',children:selectedCard.defect||'—'},
     {key:'meters',label:'米数信息',children:'预配1匹 / 实配1匹 / 实配100米'},
     {key:'finished',label:'成品要求',children:'门幅无要求 / 克重无要求'},
     {key:'opening',label:'开卡信息',children:`${record.worker||'未记录'} / ${dateText(record.created)}`},
     {key:'light',label:'对色光源',children:record.colorLight||'—'},
     {key:'requirements',label:'加工要求',children:record.processingRequirements||'未记录',span:3}
    ]}/></div>}
   </section>},
   {key:'changes',label:'变更记录',children:<section className="formula-history-content">
    <Descriptions className="formula-history-change-meta" bordered size="small" column={{xs:1,sm:2,lg:3}} items={[
     {key:'applicant',label:'申请人',children:saved?.applicant||record.worker||'未记录'},
     {key:'time',label:'申请时间',children:dateText(saved?.updatedAt??selected.created)},
     {key:'confirmedBy',label:'确认人',children:selected.confirmed?saved?.confirmedBy||'未记录':'待确认'},
     {key:'confirmedAt',label:'确认时间',children:selected.confirmed?dateText(saved?.confirmedAt):'待确认'},
     {key:'reason',label:'变更原因',children:saved?.reason||selected.reason||'未记录',span:2}
    ]}/>
    {previous?<div className="formula-history-comparison"><section><h4>上一版本 · v{selected.version-1}</h4><DyeFormulaTable compact fitWidth hideName showBath formula={previous} original={formula}/></section><section><h4>所选版本 · v{selected.version}</h4><DyeFormulaTable compact fitWidth hideName showBath formula={formula} original={previous}/></section></div>:<><div className="formula-history-initial">初始版本，暂无上一版本可对比。</div><div className="formula-history-formula-table"><DyeFormulaTable hideName showBath formula={formula}/></div></>}
   </section>}
  ]}/>
   </div>
  </div>
 </Modal>;
}
