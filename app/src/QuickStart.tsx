import React,{useState} from 'react';
import {Text,Pressable,View} from 'react-native';
import {Card,u} from './ui';
import {reconstitutionBasics} from './school-basics';
export default function QuickStart(){
 const [open,setOpen]=useState(false);
 return <Card><Text style={u.heading}>Quick Start</Text><Text style={u.body}>New to vials and calculations? Start with the words, then the numbers.</Text>
 <Text style={u.small}>Freeze-dried powder + the correct liquid → a solution with a known concentration.</Text>
 <Pressable accessibilityRole="button" accessibilityLabel="Quick Start — Learn More" accessibilityState={{expanded:open}} onPress={()=>setOpen(!open)}><Text style={u.link}>{open?'Show less':'Learn More'} {open?'−':'+'}</Text></Pressable>
 {open&&<View>{reconstitutionBasics.details.map((text,i)=><View key={text} style={{marginTop:12}}><Text style={u.heading}>{['What is in the vial?','What is reconstitution?','What is bacteriostatic water?','Use the correct diluent','The math at a glance','Why volume changes the draw'][i]}</Text><Text style={u.body}>{text}</Text></View>)}<Text style={[u.heading,{marginTop:16}]}>Why values may be pre-filled</Text><Text style={u.body}>A reference may supply plan values. Some references also have a separately labelled Common Research Setup for the calculator. These are different sources: check the labels and confirm your vial and diluent. Editable setup defaults are not a clinical recommendation.</Text><Text style={u.small}>Reference labels: {reconstitutionBasics.sourceLabels.join(' · ')}</Text></View>}
 </Card>;
}
