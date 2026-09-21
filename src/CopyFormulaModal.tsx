import {Modal} from 'antd';
import type {LabRecord} from './data';
import FormulaCardDetails from './FormulaCardDetails';
import DyeFormulaTable from './DyeFormulaTable';
import {initialDyes,type Change} from './dye-formula-model';

export default function CopyFormulaModal({record,onClose}:{record:LabRecord|null;onClose:()=>void}){
 const version=Number(record?.formula.split('v').at(-1)??0);
 const before={bath:8,rows:initialDyes.map(row=>({...row}))};
 const after={bath:8,rows:initialDyes.map(row=>({...row,ratio:row.code==='B28'&&version>0?Number((0.563+version*0.01).toFixed(3)):row.ratio}))};
 const change:Change={id:record?.key??'',card:`Y260630${3701+Number(record?.key.slice(1)??0)*3}`,order:record?.order??'',colorNo:record?.colorNo,version,before,after,reason:version?'修正色光，调整染料比例':'初始配方',submittedAt:(record?.created??'2026-08-11 15:17').replace(' ','T'),status:'已通过'};
 return <Modal className="formula-change-modal copy-formula-modal" title={`${record?.order??''}　${record?.colorNo??''}`} open={!!record} width="94vw" style={{top:20}} onCancel={onClose} footer={null}>
  {record&&<><h3>流程卡详情</h3><FormulaCardDetails change={change} details={record} timeLabel="变更时间"/>
  <div className="formula-compare-grid formula-application-grid">
   <section><h3>原配方 <small>{record.formula.replace(/v\d+$/,`v${Math.max(0,version-1)}`)}</small></h3><DyeFormulaTable compact fitWidth formula={before} ratioTitle="原比例"/></section>
   <section><h3>变更后配方 <small>{record.formula}</small></h3><DyeFormulaTable compact fitWidth formula={after} original={before} ratioTitle="申请比例"/></section>
  </div></>}
 </Modal>;
}
