import type {ReactNode} from 'react';
import {Descriptions,Steps,Tag} from 'antd';
import dayjs from 'dayjs';
import type {LabRecord} from './data';
import './sampling-detail-content.css';

export function samplingProgressIndex(status:string,detailKind:string){
 if(detailKind==='审核')return 3;
 if(status.includes('完成')||status.includes('确认'))return 4;
 if(status==='进行中')return 2;
 if(status.includes('分配'))return 1;
 return 0;
}

const shown=(value:unknown)=>value===undefined||value===null||value===''?'—':String(value);

export default function SamplingDetailContent({record,detailKind,formulaActions,formulaTable}:{record:LabRecord;detailKind:string;formulaActions:ReactNode;formulaTable:ReactNode}){
 const current=samplingProgressIndex(record.status,detailKind);
 const created=dayjs(record.created);
 const time=(offset:number,available:boolean)=>available&&created.isValid()?created.add(offset,'minute').format('MM-DD HH:mm'):'—';
 const stepItems=[
  {title:'订单审核',description:time(0,true)},
  {title:'任务分配',description:time(4,current>=1)},
  {title:'打样完成',description:time(Math.max(1,record.round)*9,current>=2)},
  {title:'配方提交',description:time(Math.max(1,record.round)*9+8,current>=3)},
  {title:'配方完成',description:current>=4?shown(record.due):'—'},
 ];
 const information=[
  {key:'colorNo',label:'色号',children:shown(record.colorNo)},
  {key:'product',label:'品名',children:shown(record.product)},
  {key:'customer',label:'客户',children:shown(record.customer)},
  {key:'worker',label:'打样员',children:shown(record.worker)},
  {key:'color',label:'颜色',children:shown(record.color)},
  {key:'ratio',label:'推荐浴比',children:record.ratio?`1:${record.ratio}`:'—'},
  {key:'formula',label:'配方号',children:shown(record.formula)},
  {key:'status',label:'状态',children:<Tag color={record.status.includes('完成')?'green':record.status==='进行中'?'blue':'orange'}>{shown(record.status)}</Tag>},
 ];
 return <div className="sampling-detail-content" aria-label="详情信息">
  <section className="sampling-detail-section sampling-detail-summary" aria-label="基础信息">
   <div className="sampling-detail-section-heading">
    <div><span className="sampling-detail-section-mark"/><h2>订字：{shown(record.order)}</h2></div>
    <span>订单编号：<b>{shown(record.processCard??record.formula)}</b></span>
   </div>
   <Descriptions bordered size="small" column={{xs:1,sm:2,lg:4}} items={information}/>
  </section>
  <section className="sampling-detail-section" aria-label="打样进度">
   <div className="sampling-detail-section-heading"><div><span className="sampling-detail-section-mark"/><h2>打样进度</h2></div></div>
   <div className="sampling-detail-progress-scroll"><Steps current={current} responsive={false} items={stepItems}/></div>
  </section>
  <section className="sampling-detail-section sampling-detail-formula" aria-label="打样情况">
   <div className="sampling-detail-section-heading">
    <div><span className="sampling-detail-section-mark"/><h2>打样情况</h2></div>
    <div className="sampling-detail-formula-actions">{formulaActions}</div>
   </div>
   <div className="sampling-detail-formula-table">{formulaTable}</div>
  </section>
 </div>;
}
