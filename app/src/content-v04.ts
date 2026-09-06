export type DeepSection={title:string;body:string};
export type V04LibraryEntry={
 id:string;name:string;aliases:string[];kind:string;accent:string;
 summary:string;plainEnglish:string;evidence:string;studiedFor:string;mechanism:string;
 deeper:DeepSection[];referenceMode:'existing'|'custom-only'; sources?:{id:string;title:string;type:string;url:string}[];
};

// 0.4 additions are intentionally educational/contextual. Study-specific human
// administration is kept distinct from community/common-practice conventions.
export const addedLibraryV04:V04LibraryEntry[]=[
 {id:'5-amino-1mq',name:'5-Amino-1MQ',aliases:['5 amino 1mq','5amino1mq','1mq'],kind:'Small-molecule research compound',accent:'#5A67D8',referenceMode:'custom-only',
  summary:'5-Amino-1MQ is a small-molecule NNMT inhibitor used in metabolic research. It is not itself a peptide.',
  plainEnglish:'This belongs in the same tracker because people often research it alongside peptides, but the chemistry and evidence category are different.',
  evidence:'Preclinical research; no established human dosing schedule in this library.',studiedFor:'NNMT biology, cellular metabolism and preclinical metabolic models.',
  mechanism:'Research focuses on inhibition of nicotinamide N-methyltransferase (NNMT), an enzyme involved in nicotinamide and methyl-donor metabolism.',
  deeper:[{title:'Research overview',body:'Published work has examined NNMT inhibition in cells and animal metabolic models. It is important to keep that evidence separate from human clinical dosing claims.'},{title:'What is known in humans?',body:'This library does not encode an established human administration schedule. Custom tracking remains available without labeling it as a published human protocol.'},{title:'Why it is still here',body:'Users may track non-peptide research compounds alongside peptides. Classification is shown clearly rather than forcing everything into one category.'}]},
 {id:'ss-31',name:'SS-31 / Elamipretide',aliases:['ss31','ss-31','elamipretide','mmtp-131'],kind:'Mitochondria-targeting peptide',accent:'#18A0AE',referenceMode:'custom-only',
  summary:'SS-31, also called elamipretide, is a mitochondria-targeting peptide studied in several human clinical programs.',
  plainEnglish:'It is designed to interact with mitochondrial membranes, so researchers have explored whether it can influence cellular energy function in mitochondrial disease and other settings.',
  sources:[
   {id:'MMPOWER2-2020',title:'A randomized crossover trial of elamipretide in adults with primary mitochondrial myopathy',type:'Published randomized human clinical trial',url:'https://pubmed.ncbi.nlm.nih.gov/32096613/'},
   {id:'MMPOWER3-2023',title:'Efficacy and Safety of Elamipretide in Individuals With Primary Mitochondrial Myopathy: MMPOWER-3',type:'Published phase 3 randomized human clinical trial',url:'https://pubmed.ncbi.nlm.nih.gov/37268435/'},
   {id:'PROGRESSHF-2020',title:'Effects of Elamipretide on Left Ventricular Function in HFrEF: PROGRESS-HF',type:'Published phase 2 randomized human clinical trial',url:'https://pubmed.ncbi.nlm.nih.gov/32068002/'}
  ],evidence:'Published randomized human clinical research; study-specific schedules are not universal recommendations.',studiedFor:'Primary mitochondrial myopathy, Barth syndrome, cardiac and ophthalmic mitochondrial research settings.',
  mechanism:'Elamipretide is designed to associate with cardiolipin-rich mitochondrial inner membranes and influence mitochondrial structure and bioenergetics.',
  deeper:[
   {title:'Human research',body:'MMPOWER-2 randomized adults with primary mitochondrial myopathy to 40 mg/day subcutaneous elamipretide for 4 weeks in a crossover design. MMPOWER-3 studied 40 mg/day subcutaneously for 24 weeks. These are published study regimens tied to specific populations, not a universal starting plan.'},
   {title:'Dose-ranging context',body:'PROGRESS-HF randomized participants with heart failure with reduced ejection fraction to placebo, 4 mg, or 40 mg subcutaneous elamipretide once daily for 28 days. Neither elamipretide group significantly improved the primary ventricular-volume outcome versus placebo.'},
   {title:'Research limitations',body:'Clinical programs have produced mixed outcomes across indications. MMPOWER-3 did not demonstrate significant benefit on its primary endpoints in the overall genetically diverse primary mitochondrial myopathy population.'},
   {title:'Planning context',body:'School can show and model a published study regimen only with its population, route, duration and source attached. Community-style microgram ranges, fasting timing, reconstitution volumes and cycling conventions require independent sourcing before they are presented as reference data.'}
  ]},
 {id:'nad-plus',name:'NAD+',aliases:['nad','nad+','nicotinamide adenine dinucleotide'],kind:'Endogenous cofactor / metabolite',accent:'#7C5CFF',referenceMode:'custom-only',
  summary:'NAD+ is a naturally occurring cellular cofactor central to redox reactions and energy metabolism. It is not a peptide.',
  plainEnglish:'Cells use NAD+ as part of energy and repair chemistry. Research and commercial contexts can involve very different routes and formulations, so “NAD+” should never be treated as one universal protocol.',
  evidence:'Human research exists in route-specific contexts; no universal plan is encoded.',studiedFor:'Metabolism, aging biology, redox balance and pharmacokinetic questions in specific administration studies.',
  mechanism:'NAD+ participates in electron transfer and also serves as a substrate for enzymes including sirtuins and PARPs.',
  deeper:[{title:'Route matters',body:'Intravenous NAD+ research is not interchangeable with oral precursor research or other formulations. The app should always keep route/formulation context visible.'},{title:'Human evidence',body:'Human studies include pharmacokinetic and metabolomic work, but evidence is heterogeneous and should not be collapsed into a single recommended schedule.'},{title:'Tracker role',body:'The planner supports custom tracking so a user can organize a personally selected plan without the School page fabricating a universal reference.'}]},
 {id:'mots-c',name:'MOTS-c',aliases:['motsc','mots c','mitochondrial open reading frame of the 12s rrna-c'],kind:'Mitochondrial-derived peptide',accent:'#2FA9FF',referenceMode:'custom-only',
  summary:'MOTS-c is a mitochondrial-derived peptide studied for links between mitochondrial signaling, metabolism and exercise biology.',
  plainEnglish:'It is a small signal encoded by mitochondrial DNA. Human studies have measured endogenous MOTS-c biology, but that is different from having an established administered dosing schedule.',
  evidence:'Human biomarker/exercise research plus preclinical evidence; no established administered human schedule encoded.',studiedFor:'Exercise response, metabolic signaling, insulin sensitivity and aging-related mitochondrial biology.',
  mechanism:'Research suggests MOTS-c can participate in cellular stress and metabolic signaling, including pathways connected with AMPK and metabolic homeostasis.',
  deeper:[{title:'Human research',body:'Published human work includes circulating/endogenous MOTS-c observations and exercise-response studies. Those findings do not automatically define an exogenous administration plan.'},{title:'Preclinical research',body:'A substantial portion of the mechanistic and intervention literature remains preclinical. This library keeps that distinction visible.'},{title:'Planning context',body:'Custom-plan tools remain available, but the app labels the plan as user-created unless a route-matched human reference is deliberately added later.'}]}
];

export const deepSectionLabels=['Research overview','How it works — deeper dive','Human evidence','Preclinical evidence','Key studies','Safety & limitations','Reference context','Sources'];
