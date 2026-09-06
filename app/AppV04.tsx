import React,{useState}from'react';
import{View,Text,Pressable,StyleSheet}from'react-native';
import App03 from'./App';
import MultiPlanLab from'./src/MultiPlanLab';
import SchoolBasicsReview from'./src/SchoolBasicsReview';

type Mode='review'|'basics'|'core';
export default function AppV04(){
 const [mode,setMode]=useState<Mode>('review');
 const choices:{key:Mode;label:string;a11y:string}[]=[
  {key:'review',label:'0.4 Review',a11y:'Open 0.4 review'},
  {key:'basics',label:'Quick Start',a11y:'Open Pep School quick start'},
  {key:'core',label:'Core',a11y:'Open 0.3.3 core'}
 ];
 return <View style={s.root}>
  <View style={s.switcher}>
   <View style={{flex:1}}><Text style={s.brand}>PEPTIDE GUIDE</Text><Text style={s.meta}>Prototype 0.4 development review</Text></View>
   {choices.map(choice=><Pressable key={choice.key} accessibilityRole="button" accessibilityLabel={choice.a11y} onPress={()=>setMode(choice.key)} style={[s.button,mode===choice.key&&s.on]}><Text style={[s.buttonText,mode===choice.key&&s.onText]}>{choice.label}</Text></Pressable>)}
  </View>
  <View style={s.body}>{mode==='review'?<MultiPlanLab/>:mode==='basics'?<SchoolBasicsReview/>:<App03/>}</View>
 </View>
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:'#fff'},body:{flex:1},switcher:{minHeight:54,paddingHorizontal:10,paddingVertical:7,flexDirection:'row',alignItems:'center',gap:5,borderBottomWidth:1,borderBottomColor:'#DDE8F6',backgroundColor:'#fff'},brand:{fontSize:10,fontWeight:'800',letterSpacing:1,color:'#12204A'},meta:{fontSize:8,color:'#667597',marginTop:2},button:{paddingHorizontal:8,paddingVertical:8,borderRadius:11,backgroundColor:'#EEF2F8'},on:{backgroundColor:'#DDF6FF'},buttonText:{fontSize:10,fontWeight:'800',color:'#667597'},onText:{color:'#0A7DAA'}});
