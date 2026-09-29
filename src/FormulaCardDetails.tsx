import {Descriptions,Tag} from 'antd';
import type {Job} from './schedule-model';
import './formula-change-review.css';
import type {Change} from './dye-formula-model';
import {dyeReviewCards} from './dye-review-cards';
import {items} from './CapacityDialog';

const processing=[['前道要求','烧毛','轻烧毛','酶油'],['后整理要求','轧光','罐蒸','罐头'],['包装要求','打长卷'],['手感要求','手感按标样','软'],['检测要求','缩水率(纬向) 1','六样纤维牢度 1','做还原清洗','水洗牢度(棉-级) 1','拉开强力(经-N) 1','纬斜 1']];
const production=[['成品手感','滑爽'],['成品光暗','一般'],['布面起皱风格','否'],['布面光洁','否'],['高牢度','否'],['预缩要求','否']];
function Requirements({groups}:{groups:string[][]}){
 return <div className="formula-requirement-groups">{groups.map(([label,...values])=><span className="formula-requirement-group" key={label}><span>{label}：</span>{values.map(value=><Tag key={value}>{value}</Tag>)}</span>)}</div>;
}
export default function FormulaCardDetails({change,plan,details,timeLabel='申请时间',compact=false,warehouseStyle=false,hideContext=false,confirmedBy,confirmedAt}:{change?:Change;plan?:Job;details?:{product:string;color:string;depth:string};timeLabel?:string;compact?:boolean;warehouseStyle?:boolean;hideContext?:boolean;confirmedBy?:string;confirmedAt?:string}){
 const cardId=change?.card??plan?.card;
 const card=dyeReviewCards.find(c=>c.card===cardId),order=items.find(c=>c.card===cardId);
 if(compact&&change){
  const fields=warehouseStyle?[
   ['基础信息',`${change.card.replace(/-1$/, '')} | ${change.order} | ${details?.product??card?.product??order?.product??'短纤与棉'}`],
   ['颜色信息',`${change.colorNo??card?.colorNo??'—'} | ${details?.color??card?.color??'浅绿'} | ${details?.depth??card?.depth??'浅色'}`],
   ['白坯信息',`门幅${order?.width??'166cm'} | 克重${order?.weight??'355g'}`],
   ['不良信息','— | — | —'],
   ['米数信息',`预配${order?.pieces??1}匹 | 实配${card?.pieces??14}匹 | 实配${card?.meters??1680}米`],
   ['成品要求','门幅146全幅 | 克重290克/平方米'],
   ['加工要求','打长卷 | 成品手感：滑爽 | 成品光暗：一般 | 布面起皱风格：否 | 布面光洁：否 | 高牢度：否 | 预缩要求：否'],
   ['开卡信息','SuperAdmin | 2026-09-17 13:06:51'],
  ]:[
   ['基础信息',`${change.order} ${change.colorNo??card?.colorNo??'—'}`],
   ['颜色信息',`${change.colorNo??card?.colorNo??'—'} | ${details?.color??card?.color??'浅绿'} | ${details?.depth??card?.depth??'浅色'}`],
   ['白坯信息',`${details?.product??card?.product??order?.product??'短纤与棉'} | 门幅${order?.width??'166cm'} | 克重${order?.weight??'355g'}`],
   ['成品要求','门幅146全幅 | 克重290克/平方米'],
   ['加工要求','打长卷 | 成品手感：滑爽 | 成品光暗：一般 | 布面起皱风格：否 | 布面光洁：否 | 高牢度：否 | 预缩要求：否'],
   ['报单时间',order?.created??'2026-09-17 13:06:51'],
  ];
  return <><dl className="formula-compact-summary">{fields.map(([label,value])=><div key={label} className={label==='加工要求'?'formula-compact-requirements':''}><dt>{label}：</dt><dd>{value}</dd></div>)}</dl>{!hideContext&&<div className="formula-change-context"><span>流程卡：{change.card.replace(/-1$/, '')}</span><span>{change.category==='addition'?'加料原因：':''}{change.reason}</span>{warehouseStyle&&<span>申请人：{change.applicant?.trim()||'未记录'}</span>}{confirmedBy!==undefined&&<span>确认人：{confirmedBy||'未记录'}</span>}<span>{confirmedAt!==undefined?'确认时间':timeLabel}：{(confirmedAt!==undefined?confirmedAt:change.submittedAt)?new Date(confirmedAt!==undefined?confirmedAt:change.submittedAt).toLocaleString():'未记录'}</span></div>}</>;
 }
 if(plan){
  const requirements=[...processing.flatMap(([, ...values])=>values),...production.map(([label,...values])=>`${label}：${values.join('、')}`)].join(' | ');
  const fields=[
   {label:'基础信息',value:`${plan.order||'未填写'} | ${card?.product??order?.product??'短纤与棉'}`},
   {label:'颜色信息',value:`${card?.colorNo??order?.color??'薄荷绿'} | ${card?.color??'浅绿'} | ${card?.depth??plan.depth??'浅色'}`},
   {label:'白坯信息',value:`门幅${order?.width??'150cm'} | 克重${order?.weight??'200g'}`},
   {label:'不良信息',value:'— | — | —'},
   {label:'米数信息',value:`预配${plan.pieces??order?.pieces??'—'}匹 | 实配${card?.pieces??'未发货'}匹 | 实配${card?.meters??'未发货'}米`},
   {label:'成品要求',value:'门幅无要求 | 克重无要求'},
   {label:'加工要求',value:requirements,wide:true},
  ];
  return <dl className="opening-card-details">{fields.map(field=><div key={field.label} className={field.wide?'opening-card-requirements':''}><dt>{field.label}：</dt><dd>{field.value}</dd></div>)}</dl>;
 }
 return <><Descriptions className="formula-card-metadata formula-expanded-metadata" bordered size="small" column={{xxl:5,xl:5,lg:3,md:2,sm:2,xs:1}} items={[
  {key:'product',label:'品名',children:details?.product??card?.product??order?.product??'未填写'},
  {key:'colorNo',label:'色号',children:change?.colorNo??card?.colorNo??order?.color??'未填写'},
  {key:'color',label:'颜色',children:details?.color??card?.color??order?.color??'未填写'},
  {key:'depth',label:'浅中深',children:details?.depth??card?.depth??(order?.colorGroup?`${order.colorGroup}色`:'未填写')},
  {key:'ratio',label:'比例',children:'未填写'},
  {key:'weight',label:'白坯克重',children:order?.weight??'未填写'},
  {key:'width',label:'白坯门幅',children:order?.width??'未填写'},
  {key:'size',label:'浆料',children:'淀粉浆'},
  {key:'edge',label:'两绞边',children:'是'},
  {key:'shrink',label:'缩率',children:'无要求'},
  {key:'finishedWeight',label:'成品克重',children:'无要求'},
  {key:'finishedWidth',label:'成品门幅',children:'无要求'},
  {key:'planned',label:'预配匹数',children:order?.pieces??'—'},
  {key:'actual',label:'实配匹数',children:card?.pieces??'未发货'},
  {key:'meters',label:'实配米数',children:card?.meters??'未发货'},
  {key:'operator',label:'开卡人',children:'未记录'},
  {key:'opened',label:'开卡时间',children:'未记录'},
  {key:'badProcess',label:'不良工序',children:'—'},
  {key:'bad',label:'不良',children:'—'},
  {key:'badReason',label:'原因',children:'—'},
  {key:'processing',label:'加工要求',span:'filled',children:<Requirements groups={processing}/>},
  {key:'production',label:'生产要求',span:'filled',children:<Requirements groups={production}/>},
 ]}/>{change&&!hideContext&&<div className="formula-change-context"><span>流程卡：{change.card}</span><span>{change.category==='addition'?'加料原因：':''}{change.reason}</span>{confirmedBy!==undefined&&<span>确认人：{confirmedBy||'未记录'}</span>}<span>{confirmedAt!==undefined?'确认时间':timeLabel}：{(confirmedAt!==undefined?confirmedAt:change.submittedAt)?new Date(confirmedAt!==undefined?confirmedAt:change.submittedAt).toLocaleString():'未记录'}</span></div>}</>;
}
