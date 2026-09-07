const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs');
const app=fs.readFileSync('./app/App.tsx','utf8');
const accordion=fs.readFileSync('./app/src/SchoolAccordion.tsx','utf8');
const profile=fs.readFileSync('./app/src/school-profile-v04.ts','utf8');
const expanded=fs.readFileSync('./app/src/content-v04.ts','utf8');
test('school detail uses progressive disclosure and related navigation',()=>{assert.match(app,/SchoolAccordion/);assert.match(app,/RelatedSchoolCards/);assert.match(app,/schoolSections\(selected\)/);assert.match(app,/relatedSchool\(selected,compounds\)/);});
test('related cards navigate inside Pep School',()=>{assert.match(accordion,/Learn about/);assert.match(accordion,/onOpen\(item\.id\)/);assert.match(profile,/ss-31.*mots-c.*nad-plus/);});
test('commercial path stays discreet and disconnected until enabled',()=>{assert.match(accordion,/Research product/);assert.match(accordion,/Store connection coming later/);assert.doesNotMatch(app,/BUY NOW|Buy Now/);});
test('bottom navigation uses school and book symbols',()=>{assert.match(app,/NavIcon/);assert.match(app,/Pep School/);assert.match(app,/Guide/);assert.doesNotMatch(app,/🎓|📖/);});
test('first AURAPEP family expansion preserves route and evidence boundaries',()=>{
 for(const id of ['bpc-157','tb-500','ipamorelin','tesamorelin','cagrilintide'])assert.match(expanded,new RegExp("id:'"+id+"'"));
 assert.match(expanded,/Two-person human intravenous pilot plus predominantly preclinical research/);
 assert.match(expanded,/Human topical wound research plus preclinical evidence/);
 assert.match(expanded,/Early human intravenous PK\/PD research/);
 assert.match(expanded,/Tesamorelin[\s\S]*formulation-specific/);
 assert.match(expanded,/Cagrilintide[\s\S]*investigational schedules are not approved recommendations/);
 assert.doesNotMatch(expanded,/stack compatibility/i);
});
test('remaining current families preserve blend and route boundaries',()=>{
 for(const id of ['wolverine','klow','melanotan-i','melanotan-ii','kisspeptin','semax'])assert.match(expanded,new RegExp("id:'"+id+"'"));
 assert.match(expanded,/Wolverine[\s\S]*component-level evidence only/);
 assert.match(expanded,/KLOW[\s\S]*synergy and formulation compatibility are unestablished/);
 assert.match(expanded,/Melanotan I[\s\S]*implant and research-vial formulations are not interchangeable/);
 assert.match(expanded,/Melanotan II[\s\S]*serious toxicity case reports/);
 assert.match(expanded,/Kisspeptin[\s\S]*population, purpose and route are decisive/);
 assert.match(expanded,/Semax[\s\S]*intranasal contexts; no injectable reference is inferred/);
});
