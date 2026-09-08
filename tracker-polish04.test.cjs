const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs');
require('./register-tests.cjs');
const {upcomingGroup}=require('./app/src/today-sections.ts');
const tracker=fs.readFileSync('./app/src/AggregateTracker.tsx','utf8');
const app=fs.readFileSync('./app/App.tsx','utf8');
const planTracker=fs.readFileSync('./app/src/Tracker.tsx','utf8');
const activeEditor=fs.readFileSync('./app/src/ActivePeptideEditor.tsx','utf8');
const store=fs.readFileSync('./app/src/store.ts','utf8');
test('tracker leads with operational today dashboard',()=>{assert.match(tracker,/Today at a glance/);assert.match(tracker,/need logging/);assert.match(tracker,/Up next/);});
test('tracker preserves aggregate calendar and history',()=>{for(const term of ['Today','Calendar','History','Counts include every active plan|total across every active plan'])assert.match(tracker,new RegExp(term));});
test('tracker keeps compound identity visually distinct',()=>{assert.match(tracker,/compoundColor/);assert.match(tracker,/compoundDot/);assert.match(tracker,/plan\.compoundName/);});

test('upcoming group includes due and next-hour events while respecting snooze and status',()=>{
 const now=new Date('2026-09-07T08:00:00.000Z');
 const row=(id,scheduled,status='pending',snoozedUntil=null)=>({plan:{id:'p-'+id,compoundName:id},event:{id,scheduledAt:scheduled,snoozedUntil,status}});
 const due=row('due','2026-09-07T07:45:00.000Z');
 const soon=row('soon','2026-09-07T08:50:00.000Z');
 const later=row('later','2026-09-07T09:01:00.000Z');
 const snoozed=row('snoozed','2026-09-07T07:30:00.000Z','pending','2026-09-07T09:30:00.000Z');
 const completed=row('completed','2026-09-07T08:15:00.000Z','completed');
 assert.deepEqual(upcomingGroup([later,completed,soon,snoozed,due],now).map(x=>x.event.id),['due','soon']);
});
test('upcoming group window can be changed without including distant events',()=>{
 const now=new Date('2026-09-07T08:00:00.000Z');
 const rows=[30,31].map(minutes=>({plan:{id:String(minutes)},event:{id:String(minutes),status:'pending',scheduledAt:new Date(now.getTime()+minutes*60000).toISOString(),snoozedUntil:null}}));
 assert.deepEqual(upcomingGroup(rows,now,30).map(x=>x.event.id),['30']);
});
test('tracker exposes review, selective confirmation and grouped undo',()=>{
 for(const term of ['UPCOMING TOGETHER','Review & mark group taken','Uncheck anything','grouped completions undone'])assert.match(tracker,new RegExp(term));
});

test('taking or skipping events triggers targeted reminder cancellation',()=>{
 assert.match(tracker,/cancelEventReminders/);
 assert.match(tracker,/value==='completed'\|\|value==='skipped'/);
 assert.match(tracker,/selectedGroup\.map/);
});


test('first-run guidance keeps navigation stable and Today becomes Start Here before a plan',()=>{
 for(const term of ['WELCOME TO EZPEP PLANNER','How familiar are you with peptides?','What would you like to do first?','Show me where to begin','START HERE','Learn the essentials','Research a peptide','Build your plan','Review calculations','Start tracking'])assert.match(app,new RegExp(term));
 assert.match(app,/screen==='tracker'&&!plans\.length/);
 assert.match(app,/screen==='tracker'&&!!plans\.length/);
 assert.match(app,/{ key: "school", label: "Learn" }/);
 assert.match(app,/{ key: "guide", label: "Build Plan" }/);
 assert.match(app,/screen!=="welcome"&&<BottomNav/);
 assert.match(app,/RECOMMENDED FIRST/);
 assert.match(app,/plans\.length\|\|saved\.store\.draft/);
});

test('onboarding is local, optional, restartable and does not alter saved plans',()=>{
 assert.match(app,/pepplan\.onboarding\.v1/);
 assert.match(app,/Skip for now/);
 assert.match(app,/Restart Quick Start Onboarding/);
 assert.match(app,/saved plans, history and settings will not be changed/);
 assert.match(app,/does not select a peptide or prescribe a dose/);
});

test('plan tracker claims horizontal swipes before the vertical scroll container on web and native',()=>{
 assert.match(planTracker,/onMoveShouldSetPanResponderCapture/);
 assert.match(planTracker,/onPanResponderTerminationRequest:\(\)=>false/);
 assert.match(planTracker,/touchAction:'pan-y'/);
 assert.match(planTracker,/Math\.abs\(gesture\.dx\)<60/);
});

test('settings can export a private local backup without changing stored plans',()=>{
 assert.match(app,/encodePlannerStore\(saved\.store\)/);
 assert.match(app,/Export local backup/);
 assert.match(app,/The app does not upload this backup/);
 assert.match(app,/Share\.share/);
 assert.match(app,/link\.download=filename/);
});

test('active plan editor exposes confirmed stage removal while retaining at least one stage',()=>{
 assert.match(activeEditor,/onRemove={d\.stages\.length>1/);
 assert.match(activeEditor,/d\.stages\.filter\(item=>item\.id!==stage\.id\)/);
 assert.match(activeEditor,/StageCard/);
});

test('Professor Lynch explains each active-plan maintenance section without adding plan values',()=>{
 for(const section of ['Dose & Stages','Schedule','Vial & Concentration','Syringe','Inventory','Cycle / Break','Reminders','Pause / Archive'])assert.ok(activeEditor.includes("'"+section+"'"));
 assert.match(activeEditor,/ProfessorHelp title={name}/);
 assert.match(activeEditor,/do not verify preparation or clinical suitability/);
});


test('planner persistence keeps and automatically restores a last-known-good local save',()=>{
 assert.match(store,/RECOVERY_STORAGE_KEY/);
 assert.match(store,/last-good/);
 assert.match(store,/decodePlannerStore\(recoveryRaw\)/);
 assert.match(store,/last complete local save was recovered automatically/);
 assert.match(store,/AsyncStorage\.setItem\(RECOVERY_STORAGE_KEY,encoded\)/);
});


test('Build Plan hero introduces Professor Lynch without selecting plan values',()=>{
 assert.match(app,/Peptide Research/);
 assert.match(app,/A QUICK WORD FROM PROFESSOR LYNCH/);
 assert.match(app,/review its research context/);
 assert.match(app,/without choosing amounts or schedules for you/);
});


test('active plan editing is one continuous page with stages expanded and one save action',()=>{
 assert.match(activeEditor,/Edit any fields below, then save all changes once at the bottom/);
 assert.doesNotMatch(activeEditor,/Back to peptide sections/);
 assert.doesNotMatch(activeEditor,/setSection\(/);
 for(const section of ['Dose & Stages','Schedule','Vial & Concentration','Syringe','Inventory','Cycle / Break','Reminders','Pause / Archive'])assert.match(activeEditor,new RegExp('SectionTitle name="'+section.replace('/','\\/')+'"'));
 assert.match(activeEditor,/startExpanded/);
 assert.equal((activeEditor.match(/label="Save changes"/g)||[]).length,1);
});
