const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs');
const tracker=fs.readFileSync('./app/src/AggregateTracker.tsx','utf8');
test('tracker leads with operational today dashboard',()=>{assert.match(tracker,/Today at a glance/);assert.match(tracker,/need logging/);assert.match(tracker,/Up next/);});
test('tracker preserves aggregate calendar and history',()=>{for(const term of ['Today','Calendar','History','Counts include every active plan|total across every active plan'])assert.match(tracker,new RegExp(term));});
test('tracker keeps compound identity visually distinct',()=>{assert.match(tracker,/compoundColor/);assert.match(tracker,/compoundDot/);assert.match(tracker,/plan\.compoundName/);});
