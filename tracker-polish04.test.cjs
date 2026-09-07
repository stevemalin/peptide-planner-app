const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs');
require('./register-tests.cjs');
const {upcomingGroup}=require('./app/src/today-sections.ts');
const tracker=fs.readFileSync('./app/src/AggregateTracker.tsx','utf8');
const app=fs.readFileSync('./app/App.tsx','utf8');
const planTracker=fs.readFileSync('./app/src/Tracker.tsx','utf8');
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
