import dayjs from 'dayjs';
import type {LabRecord} from './data';
import './formula-basic-info.css';

type FabricRecord=Partial<LabRecord>&{referenceOrder?:string;referenceColorNo?:string;warpComposition?:string;weftComposition?:string};
export default function FormulaBasicInfo({record}:{record:FabricRecord}){
 const light=record.colorLight||'—';
 return <section className="formula-basic-info" aria-label="配方基础信息">
  <div className="formula-basic-fabric">
   <dl className="formula-basic-facts">
    <div><dt>品名</dt><dd>{record.product||'—'}</dd></div>
    <div><dt>色号</dt><dd>{record.colorNo||'—'}</dd></div>
    <div><dt>白坯门幅</dt><dd>{record.greigeWidth||'—'}</dd></div>
    <div><dt>白坯克重</dt><dd>{record.greigeWeight||'—'}</dd></div>
    <div><dt>对色光源</dt><dd>{light}</dd></div>
   </dl>
   <div className="formula-basic-weave" aria-hidden="true"/>
   <div className="formula-basic-components"><div><span>↓ 经向成分</span><strong>{record.warpComposition||'—'}</strong></div><div><span>→ 纬向成分</span><strong>{record.weftComposition||'—'}</strong></div></div>
  </div>
  <dl className="formula-basic-requirements">
   <div><dt>参照订字色号</dt><dd>{[record.referenceOrder,record.referenceColorNo].filter(Boolean).join(' / ')||'—'}</dd></div>
   <div><dt>要求浴比</dt><dd>{record.ratio?`1:${record.ratio}`:'—'}</dd></div>
   <div><dt>对色光源</dt><dd>{light}</dd></div>
   <div><dt>颜色</dt><dd>{[record.depth,record.color].filter(Boolean).join(' | ')||'—'}</dd></div>
   <div className="formula-basic-processing"><dt>加工要求</dt><dd>{record.processingRequirements||'未记录'}</dd></div>
   <div><dt>下单时间</dt><dd>{record.created&&dayjs(record.created).isValid()?dayjs(record.created).format('YYYY-MM-DD HH:mm'):'—'}</dd></div>
  </dl>
 </section>;
}
