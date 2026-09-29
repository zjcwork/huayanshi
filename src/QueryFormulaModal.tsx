import {Modal} from 'antd';
import type {LabRecord} from './data';
import FormulaCardDetails from './FormulaCardDetails';
import DyeFormulaTable from './DyeFormulaTable';
import {initialDyes,type Change,type Formula} from './dye-formula-model';

export const queryVersionReason=(version:number)=>['初始配方','修正色光，调整蓝色染料比例','调整红色染料比例','延长保温至 60 分钟并调整 pH'][version]??'配方调整';
export type QueryFormulaDetail={record:LabRecord;card:string};
export function queryFormulaSnapshot(bath:number,version:number):Formula{
 return {bath,rows:initialDyes.map(row=>({...row,
  ...(row.code==='B28'&&version>=1?{ratio:0.615}:{}),
  ...(row.code==='B10'&&version>=2?{ratio:0.125}:{}),
  ...(row.code==='B28'&&version>=3?{process:'68',processName:'60°C*60′',ph:'10.5–11.2'}:{}),
 }))};
}
export default function QueryFormulaModal({detail,onClose}:{detail:QueryFormulaDetail|null;onClose:()=>void}){
 const record=detail?.record;
 const version=Number(record?.formula.match(/v(\d+)$/)?.[1]??0);
 const before=queryFormulaSnapshot(record?.ratio??6,Math.max(0,version-1));
 const after=queryFormulaSnapshot(record?.ratio??6,version);
 const change:Change={id:record?.key??'',card:detail?.card??'',order:record?.order??'',colorNo:record?.colorNo,version,before,after,
  reason:queryVersionReason(version),
  submittedAt:(record?.created??'2026-08-11 15:17').replace(' ','T'),status:'已通过'};
 return <Modal title={`${record?.order??''}　${record?.colorNo??''}`} className="formula-change-modal opening-comparison-modal" open={!!detail} width="94vw" style={{top:20}} onCancel={onClose} footer={null}>
  {record&&<><h3>订单详情</h3><FormulaCardDetails change={change} details={record} timeLabel="变更时间" compact confirmedBy="水木"/>
   <div className="formula-compare-grid formula-application-grid">
    <section><h3>原配方 <small>{record.formula.replace(/v\d+$/,`v${Math.max(0,version-1)}`)}</small></h3><DyeFormulaTable compact fitWidth formula={before} ratioTitle="原比例"/></section>
    <section><h3>变更后配方 <small>{record.formula}</small></h3><DyeFormulaTable compact fitWidth formula={after} original={before} ratioTitle="申请比例"/></section>
   </div>
  </>}
 </Modal>;
}
