import type {Draft,SavedPlan,Store,ActiveEdit} from './engine';
import {generateEvents,inventoryCoverage} from './engine';
import {getActivePlans,replacePlan} from './multiplan-v04';
export function planDraft(plan:SavedPlan):Draft{
 const {events,activatedAt,inventoryTotalMg,timezone,revisions,...draft}=plan;
 return JSON.parse(JSON.stringify(draft));
}
export const planSettings=(plan:SavedPlan)=>JSON.stringify({draft:planDraft(plan),inventoryTotalMg:plan.inventoryTotalMg});
export function beginActiveEdit(plan:SavedPlan):ActiveEdit{
 return {planId:plan.id,draft:planDraft(plan),baseSettings:planSettings(plan),supplyVials:''};
}
export function applyActiveEdit(store:Store,edit:ActiveEdit,now=new Date()):Store{
 const plan=getActivePlans(store).find(p=>p.id===edit.planId);
 if(!plan)throw Error('This plan is no longer active. Your edits are still saved.');
 if(planSettings(plan)!==edit.baseSettings)throw Error('This plan changed while you were editing. Your edits are saved; reopen the current plan before applying them.');
 if(edit.draft.id!==plan.id||edit.draft.compoundId!==plan.compoundId)throw Error('The edited plan does not match the original.');
 if(Intl.DateTimeFormat().resolvedOptions().timeZone!==plan.timezone)throw Error('Return to the time zone used to start this plan before changing its schedule.');
 const draft={...edit.draft,reviewed:true};
 // Never regenerate past/unlogged events or any completed/skipped event. Their
 // original amount, calculation, stage ID and logging timestamps stay byte-for-byte.
 const retained=plan.events.filter(e=>e.status!=='pending'||new Date(e.scheduledAt)<=now);
 const retainedTimes=new Set(retained.map(e=>e.scheduledAt));
 const priorById=new Map(plan.events.map(e=>[e.id,e]));
 const upcoming=generateEvents(draft).filter(e=>new Date(e.scheduledAt)>now&&!retainedTimes.has(e.scheduledAt)).map(e=>{
  const original=priorById.get(e.id);
  return original?.status==='pending'&&original.amountMg===e.amountMg&&JSON.stringify(original.calculation)===JSON.stringify(e.calculation)?{...e,...(original.snoozedUntil?{snoozedUntil:original.snoozedUntil}:{})}:e;
 });
 let inventoryTotalMg=plan.inventoryTotalMg;
 if(edit.supplyVials!==''){
  if(!/^\d+$/.test(edit.supplyVials)||!Number.isSafeInteger(Number(edit.supplyVials)))throw Error('Enter a whole number of individual vials remaining, or leave it blank.');
  inventoryTotalMg=inventoryCoverage(plan,now).used+Number(edit.supplyVials)*Number(draft.vialMg);
  if(!Number.isFinite(inventoryTotalMg))throw Error('The supply quantity is too large.');
 }
 const revised:SavedPlan={...plan,...draft,inventoryTotalMg,events:[...retained,...upcoming].sort((a,b)=>a.scheduledAt.localeCompare(b.scheduledAt)),revisions:[...(plan.revisions??[]),{changedAt:now.toISOString(),previous:planDraft(plan),inventoryTotalMg:plan.inventoryTotalMg}]};
 return {...replacePlan(store,revised),activeEdit:null};
}
