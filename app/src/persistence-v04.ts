import {decodeStore, type Store} from './engine';
import {normalizeStoreV04} from './multiplan-migration-v04';
export const STORAGE_KEY_V04='peptide-planner:local:v04';
export const LEGACY_STORAGE_KEY='peptide-planner:local:v03';
// Validate each plan through the established reader before adopting the collection.
export function decodePlannerStore(raw:string):Store{
 const value=JSON.parse(raw);
 if(value?.version===3){
  if(value.activePlans!==undefined)return decodePlannerStore(JSON.stringify({...value,version:4}));
  const legacy=decodeStore(raw);return {...legacy,activePlans:legacy.active?[legacy.active]:[]};
 }
 if(value?.version!==4||!Array.isArray(value.activePlans))throw Error('Saved data has an unsupported format. It has been preserved.');
 const base=decodeStore(JSON.stringify({version:3,draft:value.draft,active:null,archives:value.archives}));
 const plans=value.activePlans.map((active:unknown)=>decodeStore(JSON.stringify({version:3,draft:null,active,archives:[]})).active);
 if(plans.some((p:any)=>!p)||new Set(plans.map((p:any)=>p.id)).size!==plans.length)throw Error('Saved plan identifiers are invalid. Your data is preserved.');
 let activeEdit=value.activeEdit??null;
 if(activeEdit){
  if(typeof activeEdit.planId!=='string'||typeof activeEdit.baseSettings!=='string'||typeof activeEdit.supplyVials!=='string')throw Error('Saved edits could not be read. Your data is preserved.');
  const checked=decodeStore(JSON.stringify({version:3,draft:activeEdit.draft,active:null,archives:[]})).draft;
  if(!checked||checked.id!==activeEdit.planId)throw Error('Saved edits do not match a plan. Your data is preserved.');
  activeEdit={...activeEdit,draft:checked};
 }
 return {...base,...(value.activeEdit!==undefined?{activeEdit}:{}),activePlans:plans,active:plans[0]??null};
}
export function encodePlannerStore(store:Store){return JSON.stringify(normalizeStoreV04(store));}


export type ExternalCsvRow={
 recordType:'inventory'|'log'|'schedule';
 peptideName:string;
 date?:string;
 time?:string;
 doseMg?:number;
 originalDoseAmount?:number;
 originalDoseUnit?:'mg'|'mcg';
 eventType?:'taken'|'skipped';
 inventoryStartMg?:number;
 inventoryCurrentMg?:number;
 scheduleType?:string;
 scheduleDays?:number[];
 scheduleTimes?:string[];
 startDate?:string;
};
export type ExternalCsvPreview={
 source:'Peptide Library CSV';
 totalRows:number;
 inventoryCount:number;
 historyCount:number;
 scheduleCount:number;
 peptides:string[];
 rows:ExternalCsvRow[];
 warnings:string[];
 duplicateKeys:string[];
};

function csvCells(text:string){
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(quoted){
   if(ch==='"'&&text[i+1]==='"'){cell+='"';i++;}
   else if(ch==='"')quoted=false;
   else cell+=ch;
  }else if(ch==='"')quoted=true;
  else if(ch===','){row.push(cell);cell='';}
  else if(ch==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}
  else cell+=ch;
 }
 if(cell||row.length){row.push(cell.replace(/\r$/,''));rows.push(row);}
 if(quoted)throw Error('The CSV ends inside a quoted field.');
 return rows.filter(values=>values.some(value=>value.trim()!==''));
}
const finite=(value:string)=>value.trim()!==''&&Number.isFinite(Number(value))?Number(value):undefined;
const mgValue=(amount:string,unit:string)=>{
 const value=finite(amount);if(value===undefined)return undefined;
 if(unit==='mg')return value;if(unit==='mcg')return value/1000;
 return undefined;
};
export const externalHistoryKey=(row:Pick<ExternalCsvRow,'peptideName'|'date'|'time'|'doseMg'|'eventType'>)=>
 [row.peptideName.trim().toLowerCase(),row.date,row.time,Number(row.doseMg??0).toFixed(8),row.eventType].join('|');

export function previewPeptideLibraryCsv(text:string):ExternalCsvPreview{
 const matrix=csvCells(text.replace(/^\uFEFF/,''));
 if(matrix.length<2)throw Error('This CSV does not contain any data rows.');
 const header=matrix[0].map(value=>value.trim());
 const required=['record_type','peptide_name'];
 for(const name of required)if(!header.includes(name))throw Error('This is not a supported peptide-library CSV. Missing '+name+'.');
 const at=(values:string[],name:string)=>values[header.indexOf(name)]?.trim()??'';
 const rows:ExternalCsvRow[]=[],warnings:string[]=[];
 for(let index=1;index<matrix.length;index++){
  const values=matrix[index],recordType=at(values,'record_type'),peptideName=at(values,'peptide_name');
  if(!['inventory','log','schedule'].includes(recordType)){warnings.push('Row '+(index+1)+' has an unsupported record type and will be skipped.');continue;}
  if(!peptideName){warnings.push('Row '+(index+1)+' has no peptide name and will be skipped.');continue;}
  if(recordType==='inventory'){
   const unit=at(values,'inventory_unit'),start=finite(at(values,'inventory_start_amount')),current=finite(at(values,'inventory_current_amount'));
   if(unit!=='mg'||start===undefined||current===undefined){warnings.push(peptideName+' inventory is incomplete or does not use mg.');continue;}
   rows.push({recordType:'inventory',peptideName,inventoryStartMg:start,inventoryCurrentMg:current});
  }else if(recordType==='log'){
   const date=at(values,'date'),time=at(values,'time'),originalDoseAmount=finite(at(values,'dose_amount')),originalDoseUnit=at(values,'dose_unit') as 'mg'|'mcg',doseMg=mgValue(at(values,'dose_amount'),originalDoseUnit),rawEvent=at(values,'event_type'),eventType=rawEvent==='taken'?'taken':rawEvent==='skipped'?'skipped':undefined;
   if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)||doseMg===undefined||doseMg<=0||!eventType){warnings.push('Row '+(index+1)+' has an incomplete history entry and will be skipped.');continue;}
   rows.push({recordType:'log',peptideName,date,time,doseMg,originalDoseAmount,originalDoseUnit,eventType});
  }else{
   const scheduleType=at(values,'schedule_type');
   const scheduleDays=[...new Set(at(values,'schedule_days').split(',').map(v=>finite(v)).filter((v):v is number=>v!==undefined&&Number.isInteger(v)&&v>=0&&v<=6))];
   const scheduleTimes=[...new Set(at(values,'schedule_times').split(';').map(v=>v.trim()).filter(v=>/^([01]\d|2[0-3]):[0-5]\d$/.test(v)))];
   const startDate=at(values,'notes');
   if(scheduleType==='custom'&&!scheduleDays.length)warnings.push(peptideName+' has a custom schedule with no weekdays; confirm it before activation.');
   if(!scheduleTimes.length)warnings.push(peptideName+' has no valid schedule time.');
   rows.push({recordType:'schedule',peptideName,scheduleType,scheduleDays,scheduleTimes,startDate:/^\d{4}-\d{2}-\d{2}$/.test(startDate)?startDate:undefined});
  }
 }
 const history=rows.filter(row=>row.recordType==='log'),seen=new Set<string>(),duplicates:string[]=[];
 for(const row of history){const key=externalHistoryKey(row);if(seen.has(key))duplicates.push(key);else seen.add(key);}
 return {
  source:'Peptide Library CSV',totalRows:rows.length,
  inventoryCount:rows.filter(row=>row.recordType==='inventory').length,
  historyCount:history.length,scheduleCount:rows.filter(row=>row.recordType==='schedule').length,
  peptides:[...new Set(rows.map(row=>row.peptideName))].sort((a,b)=>a.localeCompare(b)),
  rows,warnings:[...new Set(warnings)],duplicateKeys:duplicates,
 };
}


