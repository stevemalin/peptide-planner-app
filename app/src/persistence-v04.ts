import {decodeStore, type Store} from './engine';
import {normalizeStoreV04} from './multiplan-migration-v04';
export const STORAGE_KEY_V04='peptide-planner:local:v04';
export const LEGACY_STORAGE_KEY='peptide-planner:local:v03';
// Validate each plan through the established reader before adopting the collection.
export function decodePlannerStore(raw:string):Store{
 const value=JSON.parse(raw);
 if(value?.version===3)return {...decodeStore(raw),activePlans:value.active?[decodeStore(raw).active!]:[]};
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
