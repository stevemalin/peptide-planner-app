import type {Compound} from './content';
import type {Schedule} from './engine';
import {referenceSetups} from './reference-setup';
export const RESEARCH_PRACTICE_LABEL='COMMON RESEARCH PRACTICE';
export const RESEARCH_PRACTICE_NOTICE='This reference reflects dosing patterns reported in research-oriented sources and is not an established human clinical dosing schedule. Published information may vary considerably. Use this as a starting point for further independent research and customize the plan as appropriate.';
export const RESEARCH_IMPORT_NOTICE='Research-practice reference imported. These values were pre-filled from the selected research-practice reference, not a clinical recommendation. Review and customize them before starting your plan.';
export type ResearchPracticeReference={
 id:string;title:string;evidenceClass:string;transferable:boolean;
 amount:number|null;unit:'mg'|'mcg';stages:{amount:number|null;unit:'mg'|'mcg';durationWeeks:number|null;schedule:Schedule|null}[];
 frequency:string|Record<string,unknown>|null;durationWeeks:number|null;plannedBreakWeeks:number|null;defaultTime:string|null;vialStrengthMg:number|null;diluentMl:number|null;
 provenance:{sourceIds:string[];sourceUrls:string[];sourceTitle:string;notes:string};
};
// Empty fields intentionally stay empty until the separate defaults matrix is approved.
export function researchPracticeFor(compound:Compound):ResearchPracticeReference{
 if(compound.researchPracticeReference)return compound.researchPracticeReference;
 const raw=compound.supplied?.commonResearchPractice,setup=raw?referenceSetups[compound.id]:null;
 return {id:compound.id+'-research-practice',title:raw?.title||compound.name+' research-practice reference',evidenceClass:raw?.sourceClass||RESEARCH_PRACTICE_LABEL,transferable:raw?.guideTransfer===true,amount:raw?.amountMcg??raw?.amountMg??null,unit:raw?.amountMcg!=null?'mcg':'mg',stages:(raw?.stages||[]).map((s:any)=>({amount:s.amountMcg??s.amountMg??null,unit:s.amountMcg!=null?'mcg':'mg',durationWeeks:s.durationWeeks??null,schedule:s.schedule??null})),frequency:raw?.schedule??raw?.frequency??null,durationWeeks:raw?.durationWeeks??null,plannedBreakWeeks:raw?.plannedBreakWeeks??null,defaultTime:raw?.uxDefaultTime??setup?.defaultTime??null,vialStrengthMg:raw?.vialStrengthMg??setup?.vialStrengthMg??null,diluentMl:raw?.diluentMl??raw?.reconstitutionVolumeMl??setup?.diluentMl??null,provenance:{sourceIds:[...(raw?.sourceIds||[])],sourceUrls:[...(raw?.sourceUrls||[])],sourceTitle:raw?.title||'',notes:raw?.disclaimer||''}};
}
export function practiceTransfer(reference:ResearchPracticeReference){
 if(!reference.transferable)throw Error('This research-practice reference is not approved for transfer.');
 const amount=(value:number|null,unit:'mg'|'mcg')=>unit==='mcg'?{amountMcg:value}:{amountMg:value};
 return {id:reference.id,title:reference.title,sourceClass:reference.evidenceClass,guideTransfer:true,...amount(reference.amount,reference.unit),stages:reference.stages.map(s=>({...amount(s.amount,s.unit),durationWeeks:s.durationWeeks,schedule:s.schedule})),frequency:reference.frequency,durationWeeks:reference.durationWeeks,plannedBreakWeeks:reference.plannedBreakWeeks,uxDefaultTime:reference.defaultTime,vialStrengthMg:reference.vialStrengthMg,diluentMl:reference.diluentMl,sourceIds:reference.provenance.sourceIds,sourceUrls:reference.provenance.sourceUrls,sourceTitle:reference.provenance.sourceTitle,disclaimer:RESEARCH_PRACTICE_NOTICE,sourceNotes:[reference.provenance.notes]};
}
