import {adjustedInventory} from './inventory-maintenance';
import type {Draft,SavedPlan,Store,ActiveEdit} from './engine';
import {generateEvents,inventoryCoverage,validateDraft} from './engine';
import {getActivePlans,replacePlan} from './multiplan-v04';
export function planDraft(plan:SavedPlan):Draft{
 const {events,activatedAt,inventoryTotalMg,timezone,revisions,inventoryLedger,...draft}=plan;
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
 const eventSettings=(d:Draft)=>JSON.stringify([d.stages,d.defaultSchedule,d.startDate,d.breakWeeks,d.vialMg,d.waterMl]);
 const eventsChanged=eventSettings(edit.draft)!==eventSettings(plan);
 if(eventsChanged&&Intl.DateTimeFormat().resolvedOptions().timeZone!==plan.timezone)throw Error('Return to the time zone used to start this plan before changing its schedule.');
 const draft={...edit.draft,reviewed:true};
 const errors=validateDraft(draft);if(errors.length)throw Error(errors.join('\n'));
 // Never regenerate past/unlogged events or any completed/skipped event. Their
 // original amount, calculation, stage ID and logging timestamps stay byte-for-byte.
 const retained=plan.events.filter(e=>e.status!=='pending'||new Date(e.scheduledAt)<=now);
 const retainedTimes=new Set(retained.map(e=>e.scheduledAt));
 const priorById=new Map(plan.events.map(e=>[e.id,e]));
 const upcoming=(eventsChanged?generateEvents(draft):plan.events).filter(e=>new Date(e.scheduledAt)>now&&!retainedTimes.has(e.scheduledAt)).map(e=>{
  const original=priorById.get(e.id);
  return original?.status==='pending'&&original.amountMg===e.amountMg&&JSON.stringify(original.calculation)===JSON.stringify(e.calculation)?{...e,...(original.snoozedUntil?{snoozedUntil:original.snoozedUntil}:{})}:e;
 });
 let inventoryTotalMg=plan.inventoryTotalMg;
 if(edit.supplyVials!==''){
  if(!/^\d+$/.test(edit.supplyVials)||!Number.isSafeInteger(Number(edit.supplyVials)))throw Error('Enter a whole number of individual vials remaining, or leave it blank.');
  inventoryTotalMg=inventoryCoverage(plan,now).used+Number(edit.supplyVials)*Number(draft.vialMg);
  if(!Number.isFinite(inventoryTotalMg))throw Error('The supply quantity is too large.');
 }
 if(edit.inventoryChange)inventoryTotalMg=adjustedInventory(plan,edit.inventoryChange,Number(draft.vialMg),now);
 const ledger=edit.inventoryChange?[...(plan.inventoryLedger??[]),{at:now.toISOString(),kind:edit.inventoryChange.kind,previousTotalMg:plan.inventoryTotalMg,totalMg:inventoryTotalMg!}]:plan.inventoryLedger;
 const revised:SavedPlan={...plan,...draft,...(ledger?{inventoryLedger:ledger}:{}),inventoryTotalMg,events:eventsChanged?[...retained,...upcoming].sort((a,b)=>a.scheduledAt.localeCompare(b.scheduledAt)):plan.events,revisions:[...(plan.revisions??[]),{changedAt:now.toISOString(),previous:planDraft(plan),inventoryTotalMg:plan.inventoryTotalMg}]};
 return {...replacePlan(store,revised),activeEdit:null};
}
