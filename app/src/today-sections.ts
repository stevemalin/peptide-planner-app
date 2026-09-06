import type {Event,SavedPlan} from './engine';
export type TodayRow={plan:SavedPlan;event:Event};
export function todaySections(rows:TodayRow[],now:Date){
 const due:TodayRow[]=[],later:TodayRow[]=[],completed:TodayRow[]=[],skipped:TodayRow[]=[];
 for(const row of rows){const e=row.event;if(e.status==='completed')completed.push(row);else if(e.status==='skipped')skipped.push(row);else if(Math.max(Date.parse(e.scheduledAt),Date.parse(e.snoozedUntil||e.scheduledAt))>now.getTime())later.push(row);else due.push(row);}
 later.sort((a,b)=>Math.max(Date.parse(a.event.scheduledAt),Date.parse(a.event.snoozedUntil||a.event.scheduledAt))-Math.max(Date.parse(b.event.scheduledAt),Date.parse(b.event.snoozedUntil||b.event.scheduledAt)));
 return {due,later,completed,skipped};
}
