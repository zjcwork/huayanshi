import type {WorkItem} from './workbench-model';
export type Queue = 'bulk'|'pre'|'assign'|'confirm'|'assigned'|'running'|'all';
export type Risk = 'overdue'|'repeated'|'cloth'|'addition';
export type WorkbenchTarget = {page:'大货订单审核'|'预打样订单审核'|'任务分配'|'配方确认'|'试样任务跟踪'|'带布跟进'|'加料流程卡';team?:string;queue?:Queue;risk?:Risk;kind?:WorkItem['kind'];id?:string};
