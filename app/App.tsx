import ActivePeptideEditor from './src/ActivePeptideEditor';
import {archivePlan} from './src/plan-actions-v04';
import NavIcon,{navColors,type NavGlyph} from './src/NavIcon';
import {EZPEP_LOCKUP_DATA_URI} from './src/brand-assets';
import ResearchPracticeCard from './src/ResearchPracticeCard';
import Svg,{Circle,Path} from 'react-native-svg';
import {researchPracticeFor,RESEARCH_PRACTICE_LABEL,RESEARCH_PRACTICE_NOTICE} from './src/research-practice';
import SetupPreview from './src/SetupPreview';

import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  StatusBar,
  Alert,
  BackHandler,
  AppState,
  Linking,
  Image,
} from "react-native";

import {library as compounds,searchLibrary as searchCompounds} from "./src/library-v04";
import QuickStart,{LearningPaths,SchoolBasics} from "./src/QuickStart";
import {SchoolAccordion,SchoolHighlights,RelatedSchoolCards,ResearchProductLink} from "./src/SchoolAccordion";
import {schoolSections,relatedSchool} from "./src/school-profile-v04";
import {beginActiveEdit,applyActiveEdit} from "./src/active-edit-v04";
import MyPlans from "./src/MyPlans";
import AggregateTracker from "./src/AggregateTracker";
import {getActivePlans} from "./src/multiplan-v04";
import {scopedPlanUpdate} from "./src/plan-actions-v04";
import type { Compound, PlanStage, PlanTemplate } from "./src/content";
import Workspace from "./src/Workspace";
import { usePlannerStore } from "./src/store";
import type { Draft } from "./src/engine";
import { importReference, newDraft } from "./src/engine";
import { Evidence } from "./src/ui";
import { reconcileReminders, listenForReminder } from "./src/reminders";
import type { PlanMode } from "./src/planning";
type Experience = "new" | "familiar" | "experienced";
type FirstGoal = "learn" | "research" | "setup" | "track";
type OnboardingProfile = { experience: Experience; goal: FirstGoal };
type Screen = "welcome" | "activeEditor" | "profile" | "settings" | "shop" | "plans" | "planInventory" | "planDetail" | "planTracker" | "school" | "schoolDetail" | "schoolMore" | "schoolSources" | "guide" | "detail" | "plan" | "calc" | "tracker" | "review" | "schedule" | "inventory" | "reminders" | "history" | "more";

const COLORS = {
  ink: "#0E1C4A",
  muted: "#667597",
  blue: "#27B9EE",
  purple: "#7557F6",
  border: "#DDE8F6",
  pale: "#F7FBFF",
  paleBlue: "#EAF9FF",
  palePurple: "#F2EDFF",
  white: "#FFFFFF",
};


function AppButton({ label, onPress, secondary = false }: { label: string; onPress: () => void; secondary?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.buttonSecondary, pressed && { opacity: 0.8 }]}>
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

function Molecule({ color = COLORS.blue }: { color?: string }) {
  return (
    <View style={styles.molecule}>
      <View style={[styles.atom, { backgroundColor: color, left: 29, top: 4 }]} />
      <View style={[styles.atomSmall, { backgroundColor: color, left: 5, top: 29 }]} />
      <View style={[styles.atomSmall, { backgroundColor: color, left: 50, top: 31 }]} />
      <View style={[styles.atomTiny, { backgroundColor: color, left: 29, top: 54 }]} />
      <View style={[styles.bond, { backgroundColor: color, transform: [{ rotate: "-45deg" }], left: 14, top: 24 }]} />
      <View style={[styles.bond, { backgroundColor: color, transform: [{ rotate: "45deg" }], left: 35, top: 24 }]} />
      <View style={[styles.bondVertical, { backgroundColor: color, left: 33, top: 38 }]} />
    </View>
  );
}

function BottomNav({ active, setScreen }: { active: Screen; setScreen: (s: Screen) => void }) {
  const items: { key: NavGlyph; label: string }[] = [
    { key: "school", label: "Learn" },
    { key: "guide", label: "Build Plan" },
    { key: "tracker", label: "TODAY" },
    { key: "plans", label: "My Peptides" },
    { key: "more", label: "More" },
  ];
  return (
    <View testID="bottom-navigation" style={styles.nav}>
      {items.map((item) => {
        const tab = active === "schoolDetail" || active === "schoolMore" || active === "schoolSources" ? "school" : active === "detail" ? "guide" : ["plan", "planDetail", "planInventory", "calc", "review", "schedule"].includes(active) ? "plans" : ["history","planTracker"].includes(active) ? "tracker" : ["inventory", "reminders","profile","settings"].includes(active) ? "more" : active;
        const isActive = tab === item.key;
        return (
          <Pressable accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: isActive }} key={item.key} onPress={() => setScreen(item.key)} style={styles.navItem}>
            <View testID={item.key==='tracker'?'today-center-button':undefined} style={item.key==='tracker'?[styles.todayCircle,isActive&&styles.todayCircleSelected]:[styles.iconWell,{backgroundColor:navColors[item.key]+(isActive?'25':'12')},isActive&&{borderWidth:1,borderColor:navColors[item.key]+'55'}]}><NavIcon name={item.key} color={item.key==='tracker'?'#ffffff':navColors[item.key]} size={item.key==='tracker'?31:25}/></View>
            <Text style={[styles.navLabel,{color:navColors[item.key],fontWeight:isActive||item.key==='tracker'?'800':'600'}]}>{item.key==='tracker'?'Today':item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [selected, setSelected] = useState<Compound>(compounds[0]);
  const [query,setQuery] = useState("");
  const [schoolQuery,setSchoolQuery] = useState("");
  const [schoolSection,setSchoolSection] = useState<"library"|"courses"|"facts"|"community">("library");
  const [schoolFilter,setSchoolFilter] = useState<"all"|"favorites"|"human"|"preclinical"|"blends">("all");
  const [schoolFavorites,setSchoolFavorites] = useState<string[]>([]);
  useEffect(()=>{AsyncStorage.getItem("pepplan.school.favorites").then(value=>{if(value)setSchoolFavorites(JSON.parse(value));}).catch(()=>{});},[]);
  const toggleSchoolFavorite=(id:string)=>setSchoolFavorites(current=>{const next=current.includes(id)?current.filter(item=>item!==id):[...current,id];AsyncStorage.setItem("pepplan.school.favorites",JSON.stringify(next)).catch(()=>{});return next;});

  const saved = usePlannerStore();
  const [onboarding,setOnboarding]=useState<OnboardingProfile|null|undefined>(undefined);
  const [experience,setExperience]=useState<Experience|null>(null);
  const [firstGoal,setFirstGoal]=useState<FirstGoal|null>(null);
  useEffect(()=>{AsyncStorage.getItem("pepplan.onboarding.v1").then(value=>setOnboarding(value?JSON.parse(value):null)).catch(()=>setOnboarding(null));},[]);
  const finishOnboarding=(profile:OnboardingProfile)=>{setOnboarding(profile);AsyncStorage.setItem("pepplan.onboarding.v1",JSON.stringify(profile)).catch(()=>{});setScreen("tracker");};
  const [selectedPlanId,setSelectedPlanId]=useState<string|null>(null);
  const [editingActive,setEditingActive]=useState(false);
  const [editorSection,setEditorSection]=useState('');
  const [editError,setEditError]=useState('');
 const [discardEdits,setDiscardEdits]=useState(false);
  const editing=editingActive&&!!saved.store.activeEdit&&['activeEditor','plan','review','schedule','calc'].includes(screen);
  const plans=getActivePlans(saved.store);
  const focused=plans.find(p=>p.id===selectedPlanId)??plans[0]??null;
  const scopedStore={...saved.store,active:focused,draft:editing?saved.store.activeEdit!.draft:screen==='planDetail'?null:saved.store.draft};
  const scopedUpdate=(change:Parameters<typeof saved.update>[0])=>saved.update(old=>{if(editing&&old.activeEdit){const changed=change({...old,active:focused,draft:old.activeEdit.draft});return {...old,activeEdit:{...old.activeEdit,draft:changed.draft!}};}const next=scopedPlanUpdate(old,focused?.id??null,change);if(getActivePlans(next).length>getActivePlans(old).length)setSelectedPlanId(getActivePlans(next).at(-1)!.id);return next;});
  const openPlan=(id:string)=>{setEditingActive(false);setSelectedPlanId(id);setScreen('planDetail');};
  const editPlan=(id:string,section='')=>{
   const plan=plans.find(p=>p.id===id);if(!plan)return;
   if(saved.store.activeEdit&&saved.store.activeEdit.planId!==id){setEditError('Finish or discard the existing plan edits first.');return;}
   saved.update(old=>({...old,activeEdit:old.activeEdit??{...beginActiveEdit(plan),returnTo:screen==='tracker'||screen==='history'||screen==='planTracker'?'tracker':screen==='planDetail'?'planDetail':'plans'}})).then(()=>{setSelectedPlanId(id);setEditingActive(true);setEditorSection(section);setScreen('activeEditor');setEditError('');}).catch(()=>{});
  };
  const saveActiveEdits=async()=>{const target=saved.store.activeEdit?.returnTo??'plans';await saved.update(old=>old.activeEdit?applyActiveEdit(old,old.activeEdit):old);setEditingActive(false);setScreen(target);};
  const discardActiveEdits=async()=>{const target=saved.store.activeEdit?.returnTo??'plans';await saved.update(old=>({...old,activeEdit:null}));setEditingActive(false);setScreen(target);setEditError('');};
  useEffect(()=>{if(!['activeEditor','plan','review','schedule','calc'].includes(screen))setEditingActive(false);},[screen]);
  const workspaceNavigate=(target:any)=>{if(target==='tracker'){setScreen('planTracker');}else if(target==='inventory'&&focused)editPlan(focused.id,'Inventory');else setScreen(target);};
  const [reminderError,setReminderError] = useState("");
  const filtered=searchCompounds(query);
  const schoolResults=useMemo(()=>searchCompounds(schoolQuery).filter(c=>{
    const evidence=(c.supplied?.evidenceBadge??"").toLowerCase();
    if(schoolFilter==="favorites")return schoolFavorites.includes(c.id);
    if(schoolFilter==="human")return evidence.includes("human")||evidence.includes("approved");
    if(schoolFilter==="preclinical")return evidence.includes("preclinical");
    if(schoolFilter==="blends")return evidence.includes("blend");
    return true;
  }),[schoolQuery,schoolFilter,schoolFavorites]);
  const openCompound=(compound:Compound)=>{setSelected(compound);setScreen("detail");};
  const openSchool=(compound:Compound)=>{setSelected(compound);setScreen("schoolDetail");};
  const [replacement,setReplacement]=useState<{draft:Draft;target:Screen}|null>(null);
  const chooseDraft=(draft:Draft,target:Screen)=>{if(saved.store.draft){setReplacement({draft,target});return;}saved.update(old=>({...old,draft})).then(()=>setScreen(target)).catch(()=>{});};
  const startPlan=(mode:PlanMode="staged")=>{setEditingActive(false);chooseDraft(newDraft(selected,mode),"plan");};
  const copySchoolPlan=(template?:PlanTemplate)=>{
    try {setEditingActive(false);const draft=importReference(selected,template);chooseDraft(draft,"review");} catch(e){Alert.alert("Reference",String(e));}
  };
  useEffect(()=>{
    const subscription=BackHandler.addEventListener("hardwareBackPress",()=>{
      if(screen==='activeEditor'){discardActiveEdits().catch(()=>{});return true;}
      const parent:Partial<Record<Screen,Screen>>={plans:"guide",planDetail:"plans",planInventory:"planDetail",planTracker:"planDetail",schoolSources:"schoolMore",schoolMore:"schoolDetail",schoolDetail:"school",detail:"guide",plan:"detail",review:"calc",schedule:"plan",calc:"schedule",tracker:"plan",inventory:"more",reminders:"more",history:"tracker"};
      if(!parent[screen])return false;setScreen(parent[screen]!);return true;
    });return()=>subscription.remove();
  },[screen]);
  useEffect(()=>{
    if(!saved.ready||saved.loadFailed)return;
    let mounted=true;const sync=()=>reconcileReminders(plans).then(()=>{if(mounted)setReminderError("");}).catch(e=>{if(mounted)setReminderError("Reminders need attention. Open More → Reminders. "+String(e));});
    sync();const sub=AppState.addEventListener("change",state=>{if(state==="active")sync();});return()=>{mounted=false;sub.remove();};
  },[saved.ready,saved.store.activePlans,saved.loadFailed]);
  useEffect(()=>listenForReminder((planId)=>{if(planId)setSelectedPlanId(planId);setScreen("tracker");}),[]);
  useEffect(()=>{
    if(!saved.ready||screen!=="welcome"||onboarding===undefined)return;
    if(onboarding){setScreen("tracker");return;}
    if(plans.length||saved.store.draft){const profile:OnboardingProfile={experience:plans.length?"experienced":"familiar",goal:plans.length?"track":"setup"};setOnboarding(profile);AsyncStorage.setItem("pepplan.onboarding.v1",JSON.stringify(profile)).catch(()=>{});setScreen("tracker");}
  },[saved.ready,onboarding,plans.length,saved.store.draft]);

  const renderWelcome=()=>(
    <ScrollView contentContainerStyle={styles.welcomeContent}>
      <View style={styles.welcomeBrand}><Image accessibilityLabel="EZPep Planner" source={{uri:EZPEP_LOCKUP_DATA_URI}} resizeMode="contain" style={styles.welcomeBrandImage}/></View>
      <Text style={styles.kicker}>WELCOME TO EZPEP PLANNER</Text>
      <Text style={styles.welcomeTitle}>A clearer place to begin.</Text>
      <Text style={styles.welcomeSub}>Tell us where you are starting. This changes the guidance you see—not your calculations or available features.</Text>
      <Text style={styles.onboardingQuestion}>How familiar are you with peptides?</Text>
      <View style={styles.choiceStack}>{([
        ["new","I’m new","Show the essentials and explain each step."],
        ["familiar","I know the basics","Keep guidance available without slowing setup."],
        ["experienced","I’m experienced","Lead with the fastest planning path."]
      ] as const).map(([value,label,detail])=><Pressable accessibilityRole="radio" accessibilityState={{selected:experience===value}} key={value} onPress={()=>setExperience(value)} style={[styles.choiceCard,experience===value&&styles.choiceCardSelected]}><View style={[styles.radio,experience===value&&styles.radioSelected]}/><View style={{flex:1}}><Text style={styles.choiceTitle}>{label}</Text><Text style={styles.choiceDetail}>{detail}</Text></View></Pressable>)}</View>
      <Text style={styles.onboardingQuestion}>What would you like to do first?</Text>
      <View style={styles.goalGrid}>{([
        ["learn","Learn the basics"],["research","Research a peptide"],["setup","Set up an existing routine"],["track","Track a routine underway"]
      ] as const).map(([value,label])=><Pressable accessibilityRole="radio" accessibilityState={{selected:firstGoal===value}} key={value} onPress={()=>setFirstGoal(value)} style={[styles.goalCard,firstGoal===value&&styles.goalCardSelected]}><Text style={[styles.goalText,firstGoal===value&&styles.goalTextSelected]}>{label}</Text></Pressable>)}</View>
      {experience&&firstGoal&&<AppButton label="Show me where to begin" onPress={()=>finishOnboarding({experience,goal:firstGoal})}/>}
      <Pressable accessibilityRole="button" accessibilityLabel="Skip introduction" onPress={()=>finishOnboarding({experience:"familiar",goal:"setup"})} style={styles.skipButton}><Text style={styles.crossLinkText}>Skip for now</Text></Pressable>
      <Text style={styles.onboardingSafety}>EZPep Planner organizes educational research information and routines you enter. It does not select a peptide or prescribe a dose.</Text>
    </ScrollView>
  );

  const renderStartHere=()=>{
    const newUser=onboarding?.experience==="new";
    const draft=saved.store.draft;
    const recommended=onboarding?.goal==="learn"?0:onboarding?.goal==="research"?1:2;
    const steps=[
      {n:"1",title:"Learn the essentials",detail:newUser?"Start with terminology, storage and reconstitution concepts.":"Review fundamentals whenever you need them.",action:()=>setScreen("school"),label:"Open Learn"},
      {n:"2",title:"Research a peptide",detail:"Review key facts, evidence, warnings and references.",action:()=>setScreen("school"),label:"Browse the library"},
      {n:"3",title:draft?"Continue your plan":"Build your plan",detail:draft?draft.compoundName+" setup is waiting for you.":"Choose a peptide and enter the routine you want to track.",action:()=>setScreen(draft?"plan":"guide"),label:draft?"Continue setup":"Choose a peptide"},
      {n:"4",title:"Review calculations",detail:"Confirm vial strength, diluent, concentration and syringe display inside the guided setup."},
      {n:"5",title:"Start tracking",detail:"Starting the plan creates Today, reminders and inventory forecasting."}
    ];
    return <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.startHero}><Text style={styles.kicker}>START HERE</Text><Text style={styles.welcomeTitle}>{draft?"Continue where you left off.":"Learn. Plan. Track."}</Text><Text style={styles.welcomeSub}>{newUser?"We’ll explain the essentials as you go.":"A simple path from research to a working daily schedule."}</Text></View>
      <View style={styles.pathLine}/>
      {steps.map((step,index)=><View key={step.n} style={[styles.startStep,draft&&index<2&&styles.startStepQuiet,index===recommended&&styles.startStepRecommended]}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>{step.n}</Text></View><View style={{flex:1}}>{index===recommended&&<Text style={styles.sourceClass}>RECOMMENDED FIRST</Text>}<Text style={styles.lessonTitle}>{step.title}</Text><Text style={styles.nextText}>{step.detail}</Text>{step.action&&<Pressable accessibilityRole="button" accessibilityLabel={step.label} onPress={step.action} style={styles.inlineAction}><Text style={styles.crossLinkText}>{step.label} →</Text></Pressable>}</View></View>)}
      <Text style={styles.onboardingSafety}>You can move between Learn and Build Plan at any time. Your navigation stays the same after setup.</Text>
    </ScrollView>;
  };

  const renderSchool = () => (
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.heroBubbleOne} /><View style={styles.heroBubbleTwo} />
          <Text style={styles.kicker}>PEP SCHOOL</Text>
          <Text style={styles.heroTitle}>A clearer place{"\n"}to begin.</Text>
          <Text style={styles.heroSub}>Choose one learning area at a time.</Text>
        </View>
        <View accessibilityRole="tablist" style={styles.schoolTabs}>
          <Pressable accessibilityRole="tab" accessibilityState={{selected:schoolSection==="library"}} onPress={()=>setSchoolSection("library")} style={[styles.schoolTab,schoolSection==="library"&&styles.schoolTabActive]}><Text numberOfLines={1} style={[styles.schoolTabText,schoolSection==="library"&&styles.schoolTabTextActive]}>Library</Text></Pressable>
          <Pressable accessibilityRole="tab" accessibilityState={{selected:schoolSection==="courses"}} onPress={()=>setSchoolSection("courses")} style={[styles.schoolTab,schoolSection==="courses"&&styles.schoolTabActive]}><Text numberOfLines={1} style={[styles.schoolTabText,schoolSection==="courses"&&styles.schoolTabTextActive]}>Courses</Text></Pressable>
          <Pressable accessibilityRole="tab" accessibilityState={{selected:schoolSection==="facts"}} onPress={()=>setSchoolSection("facts")} style={[styles.schoolTab,schoolSection==="facts"&&styles.schoolTabActive]}><Text numberOfLines={1} style={[styles.schoolTabText,schoolSection==="facts"&&styles.schoolTabTextActive]}>Quick Facts</Text></Pressable>
          <Pressable accessibilityRole="tab" accessibilityState={{selected:schoolSection==="community"}} onPress={()=>setSchoolSection("community")} style={[styles.schoolTab,schoolSection==="community"&&styles.schoolTabActive]}><Text numberOfLines={1} style={[styles.schoolTabText,schoolSection==="community"&&styles.schoolTabTextActive]}>Community</Text></Pressable>
        </View>

        {schoolSection==="library"&&<>
          <View style={styles.schoolSectionIntro}><Text style={styles.kicker}>THE 101 LIBRARY</Text><Text style={styles.sectionTitle}>Research by peptide</Text><Text style={styles.helper}>Beginner introductions, evidence classes and primary sources—kept separate from courses and app help.</Text></View>
          <View style={styles.searchWrap}><Text style={styles.searchIcon}>⌕</Text>
            <TextInput accessibilityLabel="Search Pep School" value={schoolQuery} onChangeText={setSchoolQuery} placeholder="Name, alias or abbreviation" style={styles.searchInput} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.schoolFilters}>{([
            ["all","All"],["favorites","★ Favorites"],["human","Human evidence"],["preclinical","Preclinical"],["blends","Blends"]
          ] as const).map(([key,label])=><Pressable key={key} accessibilityRole="button" accessibilityState={{selected:schoolFilter===key}} onPress={()=>setSchoolFilter(key)} style={[styles.schoolFilter,schoolFilter===key&&styles.schoolFilterActive]}><Text style={[styles.schoolFilterText,schoolFilter===key&&styles.schoolFilterTextActive]}>{label}</Text></Pressable>)}</ScrollView>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Peptide profiles</Text><Text style={styles.sectionLink}>{schoolResults.length} shown</Text></View>
          {schoolResults.map(c => (
            <View key={c.id} style={styles.schoolRow}>
              <Pressable accessibilityRole="button" accessibilityLabel={c.name + " 101"} onPress={() => openSchool(c)} style={styles.schoolOpen}>
                <Molecule color={c.accent} /><View style={{ flex: 1 }}><Text style={styles.planOptionTitle}>{c.name}</Text><Text style={styles.detailMeta}>101 · Fundamentals & context</Text><Text style={styles.smallBadge}>{c.supplied?.evidenceBadge}</Text></View><Text style={styles.linkArrow}>›</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={(schoolFavorites.includes(c.id)?"Remove ":"Add ") + c.name + (schoolFavorites.includes(c.id)?" from favorites":" to favorites")} onPress={()=>toggleSchoolFavorite(c.id)} style={styles.favoriteButton}><Text style={[styles.favoriteIcon,schoolFavorites.includes(c.id)&&styles.favoriteIconActive]}>{schoolFavorites.includes(c.id)?"★":"☆"}</Text></Pressable>
            </View>
          ))}
          {!schoolResults.length && <Text style={styles.emptyText}>{schoolFilter==="favorites"?"Star a School profile to keep it here.":"No matches. Try another name, alias or filter."}</Text>}
        </>}

        {schoolSection==="courses"&&<>
          <View style={styles.schoolSectionIntro}><Text style={styles.kicker}>GUIDED LEARNING</Text><Text style={styles.sectionTitle}>Courses</Text><Text style={styles.helper}>Follow a short path when you want more structure. Only the course you open expands.</Text></View>
          <QuickStart/>
          <LearningPaths/>
        </>}

        {schoolSection==="facts"&&<>
          <View style={styles.schoolSectionIntro}><Text style={styles.kicker}>QUICK FACTS</Text><Text style={styles.sectionTitle}>Answers without the course</Text><Text style={styles.helper}>Search practical app concepts, terminology and research-literacy fundamentals.</Text></View>
          <SchoolBasics/>
        </>}

        {schoolSection==="community"&&
          <View style={styles.communityCard}>
            <View style={styles.communityIcon}><Text style={styles.communityIconText}>◎</Text></View>
            <Text style={styles.kicker}>COMMUNITY · COMING LATER</Text>
            <Text style={styles.sectionTitle}>Learn with context—not noise.</Text>
            <Text style={styles.nextText}>This area is reserved for moderated questions, expert-reviewed discussions and useful shared learning. It will remain separate from your private plans and tracking.</Text>
          </View>}
      </ScrollView>
  );

  const referenceContext = (plan: PlanTemplate['suppliedPlan']) => <>
    {plan.notes && <Text style={styles.nextText}>{plan.notes}</Text>}
    {plan.continuationRule && <Text style={styles.nextText}>{plan.continuationRule}</Text>}
    {plan.maintenance && <Text style={styles.nextText}>{plan.maintenance}</Text>}
    {plan.tolerabilityRule && <Text style={styles.nextText}>{plan.tolerabilityRule}</Text>}
    {plan.maximumMgWeekly !== undefined && <Text style={styles.nextText}>Supplied maximum: {plan.maximumMgWeekly} mg weekly</Text>}
  </>;
  const renderReference = (template: PlanTemplate, deep: boolean) => <View key={template.id} style={styles.lessonCard}>
    <Text style={styles.sourceClass}>{template.sourceClass}</Text>
    <Text style={styles.lessonTitle}>{template.title}</Text>
    <Text style={styles.helper}>{template.suppliedPlan.frequency} · {template.stages.length} reference stages</Text>
    <View style={styles.referenceStages}>{template.originalStages.map((stage, i) => <View key={i} style={styles.referenceStage}>
      <Text style={styles.referenceAmount}>{stage.amountMg} mg</Text><Text style={styles.smallBadge}>{stage.durationWeeks} weeks</Text>
    </View>)}</View>
    {(template.suppliedPlan.continuationRule || template.suppliedPlan.maintenance) && <Text style={styles.helper}>Continuation is described separately; only the supplied stages are copied.</Text>}
    {deep && referenceContext(template.suppliedPlan)}
    {deep && <Text selectable style={styles.helper}>Source IDs: {template.sourceIds.join(' · ')}</Text>}
    <SetupPreview compoundId={selected.id} amountMg={String(template.originalStages[0]?.amountMg??'')}/><AppButton label="Model this in Guide →" onPress={() => copySchoolPlan(template)} secondary />
  </View>;
  const renderSchoolDetail = (deep = false) => {
    const record = selected.supplied!;
    const plans = selected.school.referenceSchedules;
    return <ScrollView contentContainerStyle={styles.scrollContent}>
      <Pressable accessibilityRole="button" onPress={() => setScreen(deep ? "schoolDetail" : "school")}><Text style={styles.back}>‹ {deep ? selected.name + " 101" : "Pep School"}</Text></Pressable>
      <Text style={styles.kicker}>{deep ? "LEARN MORE" : "COMPOUND 101"}</Text>
      <Text style={styles.detailTitle}>{selected.name}</Text>
      <Text style={styles.detailMeta}>{deep ? "Research, context & references" : "A simple introduction, one idea at a time."}</Text>
      {!deep && <>
        {[["What is it?", record.school101.whatIsIt], ["In Plain English", record.school101.plainEnglish], ["Studied / known for", record.school101.studiedFor]].map(([heading, text]) => <View key={heading} style={styles.lessonCard}><Text style={styles.lessonTitle}>{heading}</Text><Text style={styles.nextText}>{text}</Text></View>)}
      </>}

      <SchoolHighlights compound={selected}/>
      <View testID="evidence-badge"><Evidence kind={record.evidenceBadge} text={record.evidenceBadge}/></View>
      <SchoolAccordion key={selected.id} sections={schoolSections(selected)}/>
      {deep && <>
        {record.composition && <View style={styles.lessonCard}><Text style={styles.lessonTitle}>Exact blend composition</Text>{record.composition.map(component => <Text key={component.component} style={styles.nextText}>{component.component} · {component.amountMg} mg</Text>)}<Text style={styles.lessonTitle}>Total: {record.composition.reduce((sum, item) => sum + item.amountMg, 0)} mg</Text></View>}
      </>}
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Reference Plans</Text></View>
      {plans.length ? plans.map(plan => renderReference(plan, deep)) : <View style={styles.lessonCard}><Text style={styles.nextText}>{selected.id==='ss-31'?'SS-31 content / research gap: no approved transferable reference plan is supplied.':'No transferable reference plan is supplied in this library.'}</Text><Text style={styles.sourceClass}>{RESEARCH_PRACTICE_LABEL}</Text><Text style={styles.helper}>{researchPracticeFor(selected).transferable?'Reference available for review.':'Awaiting reviewed defaults. No new values have been supplied.'}</Text><Text style={styles.helper}>You can create a Custom Plan in Guide. No schedule or setup values will be filled in without a reference.</Text></View>}
      {selected.researchPracticeReference&&<ResearchPracticeCard reference={selected.researchPracticeReference} onModel={()=>copySchoolPlan()}/>}{record.commonResearchPractice && <View style={styles.lessonCard}>
        <Evidence kind={record.commonResearchPractice.sourceClass}/>
        <Text style={styles.lessonTitle}>{record.commonResearchPractice.title}</Text>
        {(record.commonResearchPractice.stages||[]).map((stage:any,i:number)=><Text key={i} style={styles.nextText}>Stage {i+1} · {stage.amountMcg!=null?stage.amountMcg+' mcg':stage.amountMg+' mg'} · {stage.durationWeeks} weeks</Text>)}
        <Text style={styles.nextText}>{record.commonResearchPractice.frequency?.type==='daily'?'Daily':'Mon–Fri'} · 9:00 AM</Text>
        <Text style={styles.nextText}>{record.commonResearchPractice.vialStrengthMg} mg vial · {record.commonResearchPractice.diluentMl} mL diluent</Text>
        {record.commonResearchPractice.plannedBreakWeeks!=null&&<Text style={styles.nextText}>Planned break · {record.commonResearchPractice.plannedBreakWeeks} weeks</Text>}
        {record.commonResearchPractice.referenceDraw&&<Text style={styles.nextText}>Reference draw · {record.commonResearchPractice.referenceDraw.u100Units} U / {record.commonResearchPractice.referenceDraw.volumeMl} mL</Text>}
        {record.commonResearchPractice.formulationLocked&&<Text style={styles.nextText}>{record.commonResearchPractice.formulationLocked}</Text>}
        <SetupPreview compoundId={selected.id} amountMg={String(record.commonResearchPractice.stages?.[0]?.amountMg??(record.commonResearchPractice.stages?.[0]?.amountMcg!=null?record.commonResearchPractice.stages[0].amountMcg/1000:''))}/>{record.commonResearchPractice.guideTransfer&&<AppButton label="Model this in Guide →" onPress={()=>copySchoolPlan()} secondary/>}
      </View>}
      <View style={styles.lessonCard}><Text style={styles.lessonTitle}>Important Considerations</Text>{(deep ? record.keyConsiderations : record.keyConsiderations.slice(0, 1)).map(text => <Text key={text} style={styles.consideration}>{text}</Text>)}{!deep && record.keyConsiderations.length > 1 && <Text style={styles.helper}>More considerations in Learn More.</Text>}</View>
      {!deep && <AppButton label="Learn More" onPress={() => setScreen("schoolMore")} secondary />}
      <AppButton label="Sources" onPress={() => setScreen("schoolSources")} secondary />
      <RelatedSchoolCards items={relatedSchool(selected,compounds)} onOpen={id=>{const next=compounds.find(c=>c.id===id);if(next)openSchool(next);}}/>
      <ResearchProductLink label={"AURAPEP research product: "+selected.name}/>
      <Pressable accessibilityRole="button" accessibilityLabel="Open in Guide" onPress={() => openCompound(selected)} style={styles.crossLink}><Text style={styles.crossLinkText}>Open in Guide →</Text></Pressable>
    </ScrollView>;
  };
  const renderSources = () => <ScrollView contentContainerStyle={styles.scrollContent}>
    <Pressable accessibilityRole="button" accessibilityLabel="Back to Learn More" onPress={() => setScreen("schoolMore")}><Text style={styles.back}>‹ Learn More</Text></Pressable>
    <Text style={styles.kicker}>SOURCES</Text><Text style={styles.detailTitle}>{selected.name}</Text><Text style={styles.detailMeta}>Sources & references</Text>
    {(selected.supplied!.commonResearchPractice?.sourceUrls||[]).map((url:string,i:number)=><View key={url} style={styles.lessonCard}><Text style={styles.sourceClass}>COMMON RESEARCH PRACTICE</Text><Text selectable style={styles.nextText}>{url}</Text></View>)}
    {selected.supplied!.sources.length===0&&<Text style={styles.helper}>This library entry provides research context only. Study citations and a transferable reference plan have not been supplied.</Text>}
    {selected.supplied!.sources.map(source => <View key={source.id} testID={"source-" + source.id} style={styles.lessonCard}><Text selectable style={styles.sourceClass}>{source.id}</Text><Text style={styles.lessonTitle}>{source.title}</Text><Text style={styles.helper}>{source.type}</Text>{source.url&&<Pressable accessibilityRole="link" accessibilityLabel={"Read "+source.title} onPress={()=>Linking.openURL(source.url!)}><Text style={styles.back}>Read source ↗</Text></Pressable>}</View>)}
  </ScrollView>;
  const renderMore = () => {
    const rows:{label:string;detail:string;target:Screen|null}[]=[
      {label:"Account",detail:"Local-first today · passwordless sync planned",target:"profile"},
      {label:"Notifications",detail:"Plan reminders, timing and permission status",target:"reminders"},
      {label:"Inventory",detail:"Individual vials across active peptides",target:"inventory"},
      {label:"History",detail:"Completed and skipped events",target:"history"},
      {label:"Preferences",detail:"Units, appearance and planner defaults",target:"settings"},
      {label:"My data & privacy",detail:"Local storage, export and deletion controls",target:"settings"},
      {label:"Help & About",detail:"EZPep Planner 0.4, guidance and disclaimers",target:"settings"},
      {label:"Shop",detail:"Future AURAPEP connection · not connected",target:null},
    ];
    return <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={[styles.kicker, { marginTop: 20 }]}>MORE</Text><Text style={styles.detailTitle}>Your EZPep Planner</Text><Text style={styles.detailMeta}>Account, reminders, preferences and support.</Text>
      <View style={styles.lessonCard}><Text style={styles.sourceClass}>ACCOUNT DIRECTION</Text><Text style={styles.lessonTitle}>Start locally. Sync when you choose.</Text><Text style={styles.nextText}>EZPep Planner remains useful without an account. Passwordless six-digit email verification will unlock backup, device transfer and Pro access after the secure service is connected.</Text><AppButton label="View account plan" secondary onPress={()=>setScreen("profile")}/></View>
      {rows.map(row=><Pressable accessibilityRole="button" accessibilityLabel={row.label} disabled={!row.target} key={row.label} style={styles.moreRow} onPress={()=>row.target&&setScreen(row.target)}><View style={{flex:1}}><Text style={styles.planOptionTitle}>{row.label}</Text><Text style={styles.smallBadge}>{row.detail}</Text></View><Text style={styles.linkArrow}>{row.target?'›':'·'}</Text></Pressable>)}
      <View style={styles.notice}><Text style={styles.noticeText}>Prototype 0.4 · plans are saved on this device. No cloud account, shop connection or customer-data integration is active.</Text></View>
    </ScrollView>;
  };

  const renderGuide = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <View style={styles.heroBubbleOne} />
        <View style={styles.heroBubbleTwo} />
        <Text style={styles.kicker}>BUILD PLAN</Text>
        <Text style={styles.heroTitle}>Peptide Research{"\n"}Made Simple</Text>
        <Text style={styles.heroSub}>Understand. Plan. Calculate. Track.</Text>

        <View style={styles.featureRow}>
          {[
            ["▤", "Clear", "Guide"],
            ["▥", "Plan", "Visually"],
            ["◎", "Track", "Progress"],
          ].map(([icon, a, b]) => (
            <View style={styles.featureItem} key={a}>
              <View style={styles.featureIcon}><Text style={styles.featureIconText}>{icon}</Text></View>
              <Text style={styles.featureText}>{a}{"\n"}{b}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          accessibilityLabel="Search Guide"
          placeholder="Name, alias or abbreviation"
          placeholderTextColor="#91A0BC"
          style={styles.searchInput}
        />
        <Text style={styles.filterIcon}>☷</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Explore compounds</Text>
        <Text style={styles.sectionLink}>View All ›</Text>
      </View>

      <View style={styles.grid}>
        {filtered.map((c) => (
          <Pressable accessibilityRole="button" accessibilityLabel={c.name + " Guide"} key={c.name} onPress={() => openCompound(c)} style={({ pressed }) => [styles.compoundCard, pressed && { opacity: 0.85 }]}>
            <Molecule color={c.accent} />
            <Text style={styles.compoundName}>{c.id === "glow-70" ? "Glow\n(70 mg blend)" : c.name}</Text>
            <Text style={styles.compoundSub}>{c.subtitle}</Text>
            <View style={styles.tagRow}>
              {c.tags.slice(0, 2).map((tag) => <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>)}
            </View>
            <Text style={styles.cardArrow}>›</Text>
          </Pressable>
        ))}
      </View>

      {!filtered.length && <Text style={styles.emptyText}>No matches. Try another name or alias.</Text>}
      <View style={styles.banner}>
        <Text style={styles.bannerIcon}>⚗</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Research. Plan. Track.</Text>
          <Text style={styles.bannerSub}>A clearer way to explore your peptide plan.</Text>
        </View>
        <Text style={styles.cardArrow}>›</Text>
      </View>
    </ScrollView>
  );

  const renderDetail = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => setScreen("guide")}><Text style={styles.back}>‹ Guide</Text></Pressable>
      <Text style={styles.detailTitle}>{selected.name}</Text>
      <Text style={styles.detailMeta}>Reference guide · plan templates · simple next steps</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Learn in Pep School" onPress={() => openSchool(selected)}><Text style={styles.back}>Learn in Pep School →</Text></Pressable>

      <View style={styles.detailHero}>
        <View style={{ flex: 1 }}>
          <Text style={styles.detailHeroTitle}>Understand first.{"\n"}Then build a plan.</Text>
          <Text style={styles.detailHeroBody}>
            Explore source-labelled reference plans in Pep School, or build your own plan here.
          </Text>
        </View>
        <Molecule color={selected.accent} />
      </View>

      <Text style={styles.sectionTitle}>Your plan structures</Text>
      <Text style={styles.helper}>User-created structures. These are separate from the source-labelled plans in Pep School.</Text>

      {[
        ["Staged plan", "A visual sequence of stages with editable duration."],
        ["Steady plan", "A simple fixed schedule structure."],
        ["Custom plan", "Start blank and define the stages yourself."],
      ].map(([title, sub], idx) => (
        <Pressable accessibilityRole="button" accessibilityLabel={title} key={title} onPress={() => startPlan((["staged", "steady", "custom"] as PlanMode[])[idx])} style={styles.planOption}>
          <View style={[styles.planBars, { backgroundColor: idx === 0 ? COLORS.paleBlue : COLORS.palePurple }]}>
            <Text style={[styles.planBarsText, { color: idx === 0 ? COLORS.blue : COLORS.purple }]}>▥</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.planOptionTitle}>{title}</Text>
            <Text style={styles.planOptionSub}>{sub}</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </Pressable>
      ))}

      <Text style={styles.helper}>Choosing a structure starts a new preview plan. My Plan keeps your current edits.</Text>
      <AppButton label="Build My Plan" onPress={() => { if (saved.store.draft?.compoundId === selected.id) setScreen("plan"); else startPlan(); }} />
    </ScrollView>
  );

  if(!saved.ready)return <SafeAreaProvider><SafeAreaView style={styles.safe}><Text style={styles.detailTitle}>Opening your saved plan…</Text></SafeAreaView></SafeAreaProvider>;
  return (
    <SafeAreaProvider><SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.topLine}>
        <View style={styles.brandLockup}><Image accessibilityLabel="EZPep Planner" source={{uri:EZPEP_LOCKUP_DATA_URI}} resizeMode="contain" style={styles.brandLockupImage}/></View>
        <View style={{flexDirection:"row",alignItems:"center",gap:4}}><Text style={[styles.tempStatus,{fontSize:10}]}>Prototype 0.4</Text><Pressable accessibilityRole="button" accessibilityLabel="Profile" onPress={()=>setScreen("profile")} style={{width:36,minHeight:44,alignItems:"center",justifyContent:"center"}}><Svg width={20} height={22} viewBox="0 0 24 24"><Circle cx={12} cy={7} r={4} fill="none" stroke={COLORS.ink} strokeWidth={1.7}/><Path d="M 4 22 L 4 19 C 4 12 20 12 20 19 L 20 22 Z" fill="none" stroke={COLORS.ink} strokeWidth={1.7}/></Svg></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={()=>setScreen("settings")} style={{width:36,minHeight:44,alignItems:"center",justifyContent:"center"}}><Text style={{fontSize:20,color:COLORS.ink}}>⚙</Text></Pressable></View>
      </View>
      <View style={{paddingHorizontal:20,paddingVertical:3}}><Text testID="save-status" style={styles.smallBadge}>{saved.saving?'Saving on device…':saved.error?saved.error:'Saved on this device'}</Text>{!!saved.error&&!saved.loadFailed&&<AppButton label="Retry save" onPress={()=>saved.retry().catch(()=>{})} secondary/>}{!!reminderError&&<Text style={styles.smallBadge}>{reminderError}</Text>}</View>
      {!!editError&&<Text style={styles.helper}>{editError}</Text>}
      {saved.store.activeEdit&&<View style={{paddingHorizontal:20,paddingVertical:4,backgroundColor:COLORS.paleBlue}}><Text style={styles.smallBadge}>{editing?'Editing active plan · changes apply when saved':'You have saved active-plan edits.'}</Text><View style={{flexDirection:'row',gap:18}}>{!editing&&<Pressable accessibilityRole="button" accessibilityLabel="Resume plan edits" onPress={()=>editPlan(saved.store.activeEdit!.planId)}><Text style={styles.back}>Resume edits</Text></Pressable>}<Pressable accessibilityRole="button" accessibilityLabel="Discard plan edits" onPress={()=>setDiscardEdits(true)}><Text style={styles.back}>Discard edits</Text></Pressable></View></View>}
      {replacement&&<View style={{padding:16,backgroundColor:COLORS.paleBlue}}><Text style={styles.helper}>You have an unfinished {saved.store.draft?.compoundName} draft. Replace only that draft? Active plans and history will stay unchanged.</Text><AppButton label="Confirm replace draft" onPress={()=>{const next=replacement;saved.update(old=>({...old,draft:next.draft})).then(()=>{setReplacement(null);setScreen(next.target);}).catch(()=>{});}}/><AppButton label="Keep existing draft" secondary onPress={()=>setReplacement(null)}/></View>}
      {discardEdits&&<View style={{padding:16,backgroundColor:COLORS.paleBlue}}><Text style={styles.helper}>Discard saved edits? Active plans and history will stay unchanged.</Text><AppButton label="Confirm discard edits" onPress={()=>discardActiveEdits().then(()=>setDiscardEdits(false))}/><AppButton label="Keep edits" secondary onPress={()=>setDiscardEdits(false)}/></View>}
      <View key={screen==='schoolDetail'?screen+selected.id:screen} style={styles.main}>
        {screen === "welcome" && renderWelcome()}
        {screen === "school" && renderSchool()}
        {screen === "schoolDetail" && renderSchoolDetail()}
        {screen === "schoolMore" && renderSchoolDetail(true)}
        {screen === "schoolSources" && renderSources()}
        {screen === "more" && renderMore()}
        {(screen==='profile'||screen==='settings')&&<ScrollView contentContainerStyle={styles.scrollContent}><Pressable accessibilityRole="button" onPress={()=>setScreen('more')}><Text style={styles.back}>‹ More</Text></Pressable><Text style={styles.kicker}>{screen==='profile'?'ACCOUNT':'PREFERENCES & DATA'}</Text><Text style={styles.detailTitle}>{screen==='profile'?'Your account':'Your settings'}</Text>{screen==='profile'?<><View style={styles.lessonCard}><Text style={styles.sourceClass}>CURRENT MODE</Text><Text style={styles.lessonTitle}>Saved locally on this device</Text><Text style={styles.nextText}>No email address or password is required in this development version. Clearing app storage removes unsynced local data.</Text></View><View style={styles.lessonCard}><Text style={styles.sourceClass}>PLANNED ACCOUNT</Text><Text style={styles.lessonTitle}>Six-digit email verification</Text><Text style={styles.nextText}>Enter an email, receive a one-time code, and verify without creating a password. An account will add backup, device transfer and EZPep Planner Pro entitlement while keeping AURAPEP commerce separate unless you explicitly connect it.</Text><Text style={styles.smallBadge}>Backend and email delivery are not connected yet.</Text></View></>:<><View style={styles.lessonCard}><Text style={styles.lessonTitle}>Plan-specific controls</Text><Text style={styles.nextText}>Dose units, schedule, reminder lead time, syringe capacity and inventory are maintained per peptide so one plan never silently changes another.</Text><AppButton label="Open My Peptides" onPress={()=>setScreen('plans')}/></View><View style={styles.lessonCard}><Text style={styles.lessonTitle}>My data & privacy</Text><Text style={styles.nextText}>Plans, calculations, event history and inventory currently remain in local app storage. Export, cloud backup and account deletion will be enabled with the account service.</Text><Text style={styles.smallBadge}>No AURAPEP order or customer data is connected.</Text></View><View style={styles.lessonCard}><Text style={styles.lessonTitle}>About EZPep Planner</Text><Text style={styles.nextText}>EZPep Planner 0.4 · Learn. Plan. Track.</Text><Text style={styles.smallBadge}>Educational planning support. Evidence classes and route/formulation limits remain attached to School content.</Text></View></>}<AppButton label="Back to More" secondary onPress={()=>setScreen('more')}/></ScrollView>}
        {screen === "guide" && renderGuide()}
        {screen === "detail" && renderDetail()}
        {screen==='activeEditor'&&focused&&saved.store.activeEdit&&<ActivePeptideEditor key={focused.id+editorSection} initialSection={editorSection} plan={focused} edit={saved.store.activeEdit} change={edit=>saved.update(old=>({...old,activeEdit:edit}))} onSave={saveActiveEdits} onCancel={discardActiveEdits} onArchive={async()=>{const target=saved.store.activeEdit?.returnTo==='tracker'?'tracker':'plans';await saved.update(old=>({...archivePlan(old,focused.id),activeEdit:null}));setEditingActive(false);setScreen(target);}}/>}
        {screen==='plans'&&!saved.loadFailed&&<MyPlans store={saved.store} update={saved.update} onOpen={openPlan} onEdit={editPlan} onDraft={()=>setScreen('plan')} onGuide={()=>setScreen('guide')}/>}
        {screen==='tracker'&&!plans.length&&!saved.loadFailed&&renderStartHere()}
        {(screen==='history'||(screen==='tracker'&&!!plans.length))&&!saved.loadFailed&&<AggregateTracker plans={plans} archives={saved.store.archives} update={saved.update} initialTab={screen==='history'?'History':'Today'} onOpen={openPlan} onEdit={editPlan}/>}
        {screen==='inventory'&&!saved.loadFailed&&<MyPlans inventory store={saved.store} update={saved.update} onOpen={id=>editPlan(id,'Inventory')} onEdit={editPlan} onDraft={()=>setScreen('review')} onGuide={()=>setScreen('guide')}/>}
        {(["plan","planDetail","planInventory","review","schedule","calc","planTracker","reminders"] as Screen[]).includes(screen) && !saved.loadFailed && <Workspace screen={(screen==='planDetail'?'plan':screen==='planInventory'?'inventory':screen==='planTracker'?'tracker':screen) as any} navigate={workspaceNavigate} store={scopedStore} update={scopedUpdate} editing={editing?{onSave:saveActiveEdits,supply:saved.store.activeEdit!.supplyVials,onSupplyChange:value=>saved.update(old=>old.activeEdit?{...old,activeEdit:{...old.activeEdit,supplyVials:value}}:old).catch(()=>{})}:undefined} onStarted={()=>setScreen("plans")} onDiscard={editing?discardActiveEdits:async()=>{const compound=compounds.find(c=>c.id===saved.store.draft?.compoundId);await saved.update(old=>({...old,draft:null}));if(compound)setSelected(compound);setScreen("detail");}} onGuide={()=>setScreen("guide")}/>}
      </View>
      {screen!=="welcome"&&<BottomNav active={screen==='activeEditor'?(saved.store.activeEdit?.returnTo??'plans'):screen} setScreen={setScreen} />}
    </SafeAreaView></SafeAreaProvider>
  );
}


const styles = StyleSheet.create({
  welcomeContent:{paddingHorizontal:22,paddingTop:28,paddingBottom:40},
  welcomeBrand:{width:"100%",maxWidth:390,height:106,alignItems:"flex-start",justifyContent:"center",marginBottom:18},
  welcomeBrandImage:{width:"100%",height:"100%"},
  welcomeTitle:{color:COLORS.ink,fontSize:31,lineHeight:36,fontWeight:"800",marginTop:10},
  welcomeSub:{color:COLORS.muted,fontSize:15,lineHeight:22,marginTop:10},
  onboardingQuestion:{color:COLORS.ink,fontSize:18,fontWeight:"800",marginTop:26,marginBottom:10},
  choiceStack:{gap:9},
  choiceCard:{flexDirection:"row",alignItems:"center",gap:12,padding:14,borderWidth:1,borderColor:COLORS.border,borderRadius:17,backgroundColor:COLORS.white},
  choiceCardSelected:{borderColor:COLORS.blue,backgroundColor:COLORS.paleBlue,borderWidth:2},
  radio:{width:20,height:20,borderRadius:10,borderWidth:2,borderColor:"#A5B2C8"},
  radioSelected:{borderWidth:6,borderColor:COLORS.blue,backgroundColor:COLORS.white},
  choiceTitle:{color:COLORS.ink,fontSize:15,fontWeight:"800"},
  choiceDetail:{color:COLORS.muted,fontSize:12,lineHeight:17,marginTop:2},
  goalGrid:{flexDirection:"row",flexWrap:"wrap",gap:9},
  goalCard:{width:"48%",minHeight:68,padding:12,borderRadius:16,borderWidth:1,borderColor:COLORS.border,justifyContent:"center",backgroundColor:COLORS.white},
  goalCardSelected:{borderColor:COLORS.purple,backgroundColor:COLORS.palePurple,borderWidth:2},
  goalText:{color:COLORS.ink,fontSize:13,fontWeight:"700",lineHeight:18},
  goalTextSelected:{color:"#5138BE"},
  skipButton:{alignItems:"center",padding:17},
  onboardingSafety:{color:COLORS.muted,fontSize:11,lineHeight:17,textAlign:"center",marginTop:16},
  startHero:{marginTop:16,borderRadius:26,padding:20,backgroundColor:COLORS.paleBlue,borderWidth:1,borderColor:COLORS.border},
  pathLine:{position:"absolute",left:38,top:215,bottom:75,width:2,backgroundColor:COLORS.border},
  startStep:{flexDirection:"row",gap:14,padding:15,marginTop:11,borderWidth:1,borderColor:COLORS.border,borderRadius:18,backgroundColor:COLORS.white},
  startStepQuiet:{backgroundColor:COLORS.pale},
  startStepRecommended:{borderColor:COLORS.blue,borderWidth:2,backgroundColor:"#F2FBFF"},
  stepNumber:{width:32,height:32,borderRadius:16,backgroundColor:COLORS.palePurple,alignItems:"center",justifyContent:"center",zIndex:1},
  stepNumberText:{color:COLORS.purple,fontWeight:"800"},
  inlineAction:{alignSelf:"flex-start",paddingTop:8,paddingBottom:3},
  evidenceBadge: { borderLeftWidth: 4, padding: 14, borderRadius: 14, marginTop: 16, backgroundColor: COLORS.paleBlue },
  evidenceText: { color: COLORS.ink, fontWeight: "700", fontSize: 14, lineHeight: 21 },
  sourceClass: { color: "#286B9C", fontSize: 11, lineHeight: 16, fontWeight: "800", marginBottom: 6 },
  referenceStages: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
  referenceStage: { minWidth: 66, borderRadius: 12, padding: 10, backgroundColor: COLORS.paleBlue },
  referenceAmount: { fontSize: 16, fontWeight: "800", color: COLORS.ink },
  consideration: { fontSize: 13, lineHeight: 20, color: COLORS.muted, marginBottom: 8 },
  originLabel: { fontSize: 13, lineHeight: 19, fontWeight: "700", color: COLORS.ink },
  schoolTabs:{flexDirection:"row",marginTop:14,marginBottom:4,padding:4,borderRadius:18,backgroundColor:"#EDF4FC",borderWidth:1,borderColor:COLORS.border},
  schoolTab:{flex:1,minHeight:42,paddingHorizontal:5,alignItems:"center",justifyContent:"center",borderRadius:14},
  schoolTabActive:{backgroundColor:COLORS.white,borderWidth:1,borderColor:"#B8D9EF",boxShadow:"0px 2px 5px rgba(14,28,74,0.10)"},
  schoolTabText:{fontSize:10,fontWeight:"700",color:COLORS.muted},
  schoolTabTextActive:{color:COLORS.ink,fontWeight:"800"},
  schoolSectionIntro:{marginTop:18,marginBottom:2},
  communityCard:{marginTop:18,padding:22,borderRadius:24,borderWidth:1,borderColor:COLORS.border,backgroundColor:COLORS.paleBlue},
  communityIcon:{width:52,height:52,borderRadius:18,alignItems:"center",justifyContent:"center",backgroundColor:COLORS.white,marginBottom:16},
  communityIconText:{fontSize:30,color:COLORS.purple,fontWeight:"800"},
  schoolRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.border, borderRadius: 22, marginBottom: 12, overflow:"hidden" },
  schoolOpen:{flex:1,flexDirection:"row",alignItems:"center",gap:16,padding:16},
  favoriteButton:{alignSelf:"stretch",width:48,alignItems:"center",justifyContent:"center",borderLeftWidth:StyleSheet.hairlineWidth,borderLeftColor:COLORS.border},
  favoriteIcon:{fontSize:25,color:"#91A0BC"},
  favoriteIconActive:{color:"#F2A31B"},
  schoolFilters:{gap:8,paddingTop:12,paddingBottom:2},
  schoolFilter:{paddingHorizontal:13,paddingVertical:9,borderRadius:16,borderWidth:1,borderColor:COLORS.border,backgroundColor:COLORS.white},
  schoolFilterActive:{backgroundColor:COLORS.palePurple,borderColor:"#B8A8FA"},
  schoolFilterText:{fontSize:11,fontWeight:"700",color:COLORS.muted},
  schoolFilterTextActive:{color:"#5A42C7"},
  smallBadge: { color: COLORS.muted, fontSize: 11, marginTop: 6 },
  linkArrow: { color: COLORS.blue, fontSize: 26 },
  emptyText: { color: COLORS.muted, paddingVertical: 24, textAlign: "center" },
  notice: { padding: 14, backgroundColor: COLORS.palePurple, borderRadius: 16, marginTop: 16 },
  noticeText: { color: COLORS.muted, fontSize: 12, lineHeight: 18 },
  crossLink: { alignSelf: "flex-start", paddingVertical: 14 },
  crossLinkText: { color: "#126EA5", fontSize: 15, fontWeight: "700" },
  lessonCard: { padding: 16, marginTop: 10, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18 },
  lessonTitle: { color: COLORS.ink, fontWeight: "800", fontSize: 16, marginBottom: 7 },
  moreRow: { padding: 17, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, marginTop: 12 },
  previewRow: { marginTop: 14, gap: 8 },
  safe: { flex: 1, width: "100%", maxWidth: 900, alignSelf: "center", backgroundColor: COLORS.white },
  main: { flex: 1 },
  topLine: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  tempBrand: { color: COLORS.ink, fontWeight: "800", letterSpacing: 1.2, fontSize: 12 },
  brandLockup: { width: 218, height: 60, alignItems: "flex-start", justifyContent: "center" },
  brandLockupImage: { width: "100%", height: "100%" },
  tempStatus: { color: COLORS.muted, fontSize: 11 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 28 },
  hero: { marginTop: 16, borderRadius: 28, padding: 20, overflow: "hidden", backgroundColor: COLORS.pale, borderWidth: 1, borderColor: COLORS.border },
  heroBubbleOne: { position: "absolute", width: 150, height: 150, borderRadius: 75, right: -35, top: -45, backgroundColor: "#D8F4FF" },
  heroBubbleTwo: { position: "absolute", width: 110, height: 110, borderRadius: 55, right: 50, top: 20, backgroundColor: "#E8DEFF", opacity: 0.7 },
  kicker: { color: COLORS.blue, fontSize: 12, fontWeight: "800", letterSpacing: 1.7 },
  heroTitle: { color: COLORS.ink, fontSize: 34, lineHeight: 38, fontWeight: "800", marginTop: 18 },
  heroSub: { color: COLORS.muted, fontSize: 16, marginTop: 8 },
  featureRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 22 },
  featureItem: { flexDirection: "row", alignItems: "center", width: "31%" },
  featureIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.paleBlue, marginRight: 8 },
  featureIconText: { color: COLORS.blue, fontWeight: "800" },
  featureText: { color: COLORS.ink, fontSize: 11, fontWeight: "700", lineHeight: 14 },
  searchWrap: { flexDirection: "row", alignItems: "center", marginTop: 16, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, paddingHorizontal: 16, backgroundColor: COLORS.white },
  searchIcon: { fontSize: 26, color: COLORS.ink },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 14, paddingHorizontal: 10, color: COLORS.ink },
  filterIcon: { fontSize: 18, color: COLORS.ink },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 22, marginBottom: 12 },
  sectionTitle: { color: COLORS.ink, fontSize: 21, fontWeight: "800" },
  sectionLink: { color: COLORS.muted, fontSize: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  compoundCard: { width: "48%", minHeight: 230, borderWidth: 1, borderColor: COLORS.border, borderRadius: 22, backgroundColor: COLORS.white, padding: 14, overflow: "hidden" },
  molecule: { width: 68, height: 72, alignSelf: "center", marginBottom: 6 },
  atom: { position: "absolute", width: 24, height: 24, borderRadius: 12 },
  atomSmall: { position: "absolute", width: 18, height: 18, borderRadius: 9, opacity: 0.9 },
  atomTiny: { position: "absolute", width: 14, height: 14, borderRadius: 7, opacity: 0.75 },
  bond: { position: "absolute", width: 28, height: 3, borderRadius: 3, opacity: 0.45 },
  bondVertical: { position: "absolute", width: 3, height: 22, borderRadius: 3, opacity: 0.45 },
  compoundName: { color: COLORS.ink, fontSize: 18, fontWeight: "800", lineHeight: 20 },
  compoundSub: { color: COLORS.muted, fontSize: 12, marginTop: 5, minHeight: 30 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  tag: { backgroundColor: COLORS.paleBlue, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  tagText: { color: "#2373C9", fontSize: 10, fontWeight: "700" },
  cardArrow: { position: "absolute", right: 12, bottom: 12, color: "#174FCE", fontSize: 26, fontWeight: "700" },
  banner: { marginTop: 14, borderRadius: 18, backgroundColor: COLORS.paleBlue, padding: 16, flexDirection: "row", alignItems: "center" },
  bannerIcon: { color: COLORS.blue, fontSize: 24, marginRight: 10 },
  bannerTitle: { color: COLORS.ink, fontSize: 17, fontWeight: "800" },
  bannerSub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  back: { color: COLORS.blue, fontSize: 15, fontWeight: "700", marginTop: 14, marginBottom: 10 },
  detailTitle: { color: COLORS.ink, fontSize: 30, fontWeight: "800" },
  detailMeta: { color: COLORS.muted, fontSize: 14, marginTop: 3 },
  detailHero: { marginTop: 18, borderRadius: 24, padding: 18, minHeight: 190, backgroundColor: COLORS.paleBlue, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  detailHeroTitle: { color: COLORS.ink, fontSize: 21, fontWeight: "800", lineHeight: 25 },
  detailHeroBody: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: 10 },
  helper: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 5, marginBottom: 8 },
  planOption: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", marginTop: 10, backgroundColor: COLORS.white },
  planBars: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 12 },
  planBarsText: { fontSize: 22, fontWeight: "800" },
  planOptionTitle: { color: COLORS.ink, fontSize: 16, fontWeight: "800" },
  planOptionSub: { color: COLORS.muted, fontSize: 12, marginTop: 3, paddingRight: 18 },
  button: { marginTop: 20, minHeight: 52, borderRadius: 17, backgroundColor: COLORS.blue, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  buttonSecondary: { backgroundColor: COLORS.paleBlue, borderWidth: 1, borderColor: COLORS.border },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: "800" },
  buttonTextSecondary: { color: COLORS.ink },
  summaryRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  summaryBox: { flex: 1, backgroundColor: COLORS.paleBlue, borderRadius: 18, padding: 14, alignItems: "center" },
  summaryBig: { color: COLORS.ink, fontSize: 24, fontWeight: "800" },
  summarySmall: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  timelineWrap: { marginTop: 18 },
  timelineRow: { flexDirection: "row", minHeight: 148 },
  timelineRail: { width: 32, alignItems: "center" },
  timelineDot: { width: 18, height: 18, borderRadius: 9, marginTop: 16 },
  timelineLine: { width: 2, flex: 1, backgroundColor: COLORS.border, marginTop: 4 },
  stageCard: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, padding: 14, marginBottom: 12 },
  stageTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  stageTitle: { color: COLORS.ink, fontSize: 17, fontWeight: "800" },
  stageWeeks: { color: COLORS.muted, fontSize: 12 },
  stageInputs: { flexDirection: "row", gap: 10, marginTop: 12 },
  inputLabel: { color: COLORS.muted, fontSize: 12, fontWeight: "700", marginBottom: 5 },
  smallInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.ink, fontSize: 16, backgroundColor: COLORS.white },
  addStage: { borderWidth: 1, borderColor: COLORS.border, borderStyle: "dashed", borderRadius: 16, padding: 15, alignItems: "center" },
  addStageText: { color: COLORS.blue, fontWeight: "800" },
  breakCard: { gap: 12, flexWrap: "wrap", marginTop: 14, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepperBtn: { minWidth: 44, minHeight: 44, textAlign: "center", textAlignVertical: "center", color: COLORS.blue, fontSize: 23, fontWeight: "800" },
  stepperValue: { color: COLORS.ink, fontWeight: "800" },
  formCard: { marginTop: 16, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, padding: 16 },
  formSection: { color: COLORS.ink, fontSize: 17, fontWeight: "800", marginBottom: 12 },
  inputUnitRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, marginBottom: 14, overflow: "hidden" },
  largeInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 17, color: COLORS.ink },
  unit: { paddingHorizontal: 14, color: COLORS.muted, fontWeight: "700" },
  concentrationCard: { marginTop: 14, backgroundColor: COLORS.paleBlue, borderRadius: 18, padding: 16, alignItems: "center" },
  concentration: { color: "#1189C2", fontSize: 24, fontWeight: "800" },
  syringeCard: { marginTop: 14, borderWidth: 1, borderColor: COLORS.border, borderRadius: 22, padding: 16, alignItems: "center" },
  syringeLabel: { color: COLORS.blue, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  syringeBig: { color: COLORS.ink, fontSize: 31, fontWeight: "800", marginTop: 4 },
  syringeMeta: { color: COLORS.muted, fontSize: 12, marginTop: 3 },
  syringe: { height: 95, width: "100%", marginTop: 26, flexDirection: "row", alignItems: "center" },
  syringePlunger: { width: 24, height: 46, borderWidth: 2, borderColor: "#9EABC0", backgroundColor: "#D5DDE9", borderRadius: 5 },
  syringeBarrel: { flex: 1, height: 48, borderWidth: 2, borderColor: "#9EABC0", backgroundColor: COLORS.white, position: "relative" },
  syringeFill: { height: "100%", backgroundColor: "#CBEFFF" },
  drawLine: { position: "absolute", top: -19, width: 3, height: 84, backgroundColor: COLORS.blue, marginLeft: -1.5 },
  tickGroup: { position: "absolute", top: 0, height: 48, width: 1 },
  tick: { width: 1, height: 11, backgroundColor: "#65728A" },
  tickText: { position: "absolute", top: 29, left: -7, width: 18, textAlign: "center", fontSize: 8, color: COLORS.muted },
  syringeNeedle: { width: 35, height: 2, backgroundColor: "#7A879A" },
  drawCallout: { marginTop: 12, backgroundColor: COLORS.paleBlue, borderRadius: 14, padding: 12, width: "100%" },
  drawCalloutText: { color: COLORS.ink, textAlign: "center", fontSize: 13, fontWeight: "700" },
  safetyNote: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 12, textAlign: "center" },
  progressCard: { marginTop: 16, borderWidth: 1, borderColor: COLORS.border, borderRadius: 22, padding: 17 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressBig: { color: COLORS.ink, fontSize: 23, fontWeight: "800" },
  percentCircle: { width: 62, height: 62, borderRadius: 31, borderWidth: 8, borderColor: COLORS.blue, alignItems: "center", justifyContent: "center" },
  percentText: { color: COLORS.ink, fontWeight: "800" },
  progressTrack: { height: 10, borderRadius: 5, backgroundColor: "#E7EDF6", overflow: "hidden", marginTop: 18 },
  progressFill: { height: "100%", backgroundColor: COLORS.purple },
  threeStats: { flexDirection: "row", gap: 8, marginTop: 16 },
  stat: { flex: 1, backgroundColor: COLORS.pale, borderRadius: 15, padding: 10, alignItems: "center" },
  statBig: { color: COLORS.ink, fontSize: 19, fontWeight: "800" },
  statSmall: { color: COLORS.muted, fontSize: 10, marginTop: 2, textAlign: "center" },
  todayCard: { marginTop: 14, borderRadius: 22, padding: 17, backgroundColor: COLORS.palePurple },
  todaySub: { color: COLORS.muted, fontSize: 12 },
  todayBig: { color: COLORS.ink, fontSize: 30, fontWeight: "800", marginTop: 3 },
  todayMeta: { color: COLORS.muted, fontSize: 13 },
  nextCard: { marginTop: 14, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, padding: 16 },
  nextText: { color: COLORS.muted, fontSize: 13, lineHeight: 20 },
  nav: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border, backgroundColor: COLORS.white, paddingTop: 12, paddingBottom: 8, paddingHorizontal: 4, minHeight: 88 },
  todayDestination: { backgroundColor: COLORS.paleBlue, borderRadius: 15, borderWidth: 1, borderColor: COLORS.blue, marginHorizontal: 3 },
  todayDestinationActive: { backgroundColor: "#d8f2ff", borderWidth: 2 },
  todayInk: { color: "#087ba5", fontWeight: "800" },
  iconWell: {width:44,height:40,borderRadius:13,alignItems:"center",justifyContent:"center"},
  todayCircle: {width:56,height:56,borderRadius:28,marginTop:-6,backgroundColor:"#06aacc",alignItems:"center",justifyContent:"center",boxShadow:"0px 3px 8px rgba(6,170,204,0.25)"},
  todayCircleSelected: {backgroundColor:"#009ebb",borderWidth:3,borderColor:"#a2eef6"},
  navItem: { minHeight: 64, flex: 1, alignItems: "center", justifyContent: "center" },
  navIcon: { color: "#7B8AA6", fontSize: 20, fontWeight: "700" },
  navLabel: { color: "#7B8AA6", fontSize: 9, marginTop: 2 },
  navActive: { color: COLORS.blue },
});
