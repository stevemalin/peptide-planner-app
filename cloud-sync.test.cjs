require('./register-tests.cjs');
const test=require('node:test'),assert=require('node:assert/strict');
const {blankStore,newDraft}=require('./app/src/engine.ts');
const {library}=require('./app/src/library-v04.ts');
const {encodePlannerStore}=require('./app/src/persistence-v04.ts');
const {reviewSync,uploadReviewed,downloadReviewed}=require('./app/src/cloud/planner-sync.ts');
function local(){const s=blankStore();s.draft=newDraft(library[0]);return s;}
function row(snapshot=blankStore(),revision=2){return{user_id:'one',snapshot:JSON.parse(encodePlannerStore(snapshot)),schema_version:4,revision,updated_at:new Date().toISOString()};}
function port(cloud=row()){const calls=[];return{calls,port:{userId:async()=>'one',read:async()=>cloud,backup:async payload=>calls.push(['backup',payload]),upload:async(payload,revision,id)=>{calls.push(['upload',revision,id]);return revision+1;},apply:async store=>calls.push(['apply',encodePlannerStore(store)])}};}
test('sync review identifies matching and different device copies',()=>{assert.equal(reviewSync('one',blankStore(),row()).identical,true);const r=reviewSync('one',local(),row());assert.equal(r.identical,false);assert.equal(r.cloudRevision,2);assert.throws(()=>reviewSync('two',local(),row()),/account changed/i);});
test('confirmed upload backs up before revision-checked write',async()=>{const current=local(),f=port(),review=reviewSync('one',current,row());const revision=await uploadReviewed(review,()=>current,true,f.port);assert.equal(revision,3);assert.equal(f.calls[0][0],'backup');assert.deepEqual(f.calls[1],['upload',2,'one']);});
test('stale cloud revision blocks upload before backup',async()=>{const current=local(),cloud=row(blankStore(),2),f=port(cloud),review=reviewSync('one',current,cloud);cloud.revision=3;await assert.rejects(uploadReviewed(review,()=>current,true,f.port),/changed on another device/i);assert.deepEqual(f.calls,[]);});
test('changed local planner blocks stale upload',async()=>{let current=local(),f=port(),review=reviewSync('one',current,row());current=blankStore();await assert.rejects(uploadReviewed(review,()=>current,true,f.port),/local data changed/i);assert.deepEqual(f.calls,[]);});
test('confirmed download backs up local before applying cloud',async()=>{const current=local(),cloud=row(),f=port(cloud),review=reviewSync('one',current,cloud);await downloadReviewed(review,()=>current,true,f.port);assert.equal(f.calls[0][0],'backup');assert.equal(f.calls[1][0],'apply');assert.equal(f.calls[1][1],encodePlannerStore(blankStore()));});
test('download requires explicit confirmation and stable revision',async()=>{const current=local(),cloud=row(),f=port(cloud),review=reviewSync('one',current,cloud);await assert.rejects(downloadReviewed(review,()=>current,false,f.port),/confirm/i);cloud.revision=4;await assert.rejects(downloadReviewed(review,()=>current,true,f.port),/changed on another device/i);assert.deepEqual(f.calls,[]);});
