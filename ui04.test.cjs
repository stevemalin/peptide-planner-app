const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs');
const lab=fs.readFileSync('./app/src/MultiPlanLab.tsx','utf8');
const model=fs.readFileSync('./app/src/multiplan-v04.ts','utf8');
const content=fs.readFileSync('./app/src/content-v04.ts','utf8');
const entry=fs.readFileSync('./app/AppV04.tsx','utf8');

test('0.4 review surface exposes required multi-plan stress counts',()=>{for(const n of ['1','3','6','10'])assert.match(lab,new RegExp(`stressPlanCounts|${n}`));assert.match(model,/\[1,3,6,10\]/);});
test('aggregate review includes plans today calendar inventory and school',()=>{for(const label of ['Plans','Today','Calendar','Inventory','School'])assert.match(lab,new RegExp(`'${label}'`));});
test('inventory explains individual vials and optional kit conversion',()=>{assert.match(lab,/Enter individual vials, not kits/);assert.match(lab,/1 kit containing 10 vials = 10 individual vials/);assert.match(lab,/I buy by kit/);});
test('six-plan acceptance set is represented',()=>{for(const id of ['retatrutide','ghk-cu','5-amino-1mq','ss-31','nad-plus','mots-c'])assert.match(lab,new RegExp(id));});
test('four added library records are classified and do not invent universal schedules',()=>{for(const id of ['5-amino-1mq','ss-31','nad-plus','mots-c'])assert.match(content,new RegExp(`id:'${id}'`));assert.match(content,/Small-molecule research compound/);assert.match(content,/Endogenous cofactor \/ metabolite/);assert.equal((content.match(/referenceMode:'custom-only'/g)||[]).length,4);});
test('0.3.3 core remains accessible from review wrapper',()=>{assert.match(entry,/import App03 from'.\/App'/);assert.match(entry,/0\.3\.3 core/);assert.match(entry,/mode==='core'\?<App03\/>/);});
