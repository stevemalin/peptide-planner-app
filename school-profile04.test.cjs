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

test('SS-31 keeps current FDA labeling separate from research-vial planning',()=>{const start=expanded.indexOf("{id:'ss-31'"),end=expanded.indexOf("{id:'nad-plus'",start),entry=expanded.slice(start,end);assert.match(entry,/FDA-FORZINITY-2025/);assert.match(entry,/215244s000lbl\.pdf/);assert.match(entry,/U\.S\. FDA approved product labeling/);assert.match(entry,/ready-to-use 80 mg\/mL/);assert.match(entry,/Barth syndrome weighing at least 30 kg/);assert.match(entry,/not a lyophilized research vial/);assert.match(entry,/not transferred into Guide/);assert.match(entry,/referenceMode:'custom-only'/);});

test('tesamorelin keeps EGRIFTA WR labeling product-specific and non-transferable',()=>{const start=expanded.indexOf("{id:'tesamorelin'"),end=expanded.indexOf("{id:'cagrilintide'",start),entry=expanded.slice(start,end);assert.match(entry,/FDA-EGRIFTA-WR-2025/);assert.match(entry,/022505s020lbl\.pdf/);assert.match(entry,/proprietary 11\.6 mg-per-vial formulation/);assert.match(entry,/1\.3 mL of the supplied Bacteriostatic Water for Injection/);assert.match(entry,/EGRIFTA WR and EGRIFTA SV are not substitutable/);assert.match(entry,/not establish a universal tesamorelin-vial method/);assert.match(entry,/not transferred into Guide/);assert.match(entry,/referenceMode:'custom-only'/);});

test('afamelanotide keeps SCENESSE and historical MT-1 protocols separate from vial planning',()=>{const start=expanded.indexOf("{id:'melanotan-i'"),end=expanded.indexOf("{id:'melanotan-ii'",start),entry=expanded.slice(start,end);assert.match(entry,/FDA-SCENESSE-2024/);assert.match(entry,/210797s007lbl\.pdf/);assert.match(entry,/proprietary 16 mg controlled-release, bioresorbable implant/);assert.match(entry,/healthcare professional inserts one implant subcutaneously/);assert.match(entry,/every 2 months/);assert.match(entry,/not a reconstituted injection/);assert.match(entry,/MT1-UV-2004/);assert.match(entry,/three small phase 1 protocols/);assert.match(entry,/Fitzpatrick type III–IV/);assert.match(entry,/0\.08 mg\/kg in protocol 1 or 0\.16 mg\/kg in protocols 2–3/);assert.match(entry,/2 weeks \(10 injections\) or 4 weeks \(20 injections\)/);assert.match(entry,/not a recommendation, retail-vial recipe or transferable plan/);assert.match(entry,/no value is transferred into Guide/);assert.match(entry,/referenceMode:'custom-only'/);});
