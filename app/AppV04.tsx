import React,{useState}from'react';
import{View,Text,Pressable,StyleSheet}from'react-native';
import App03 from'./App';
import MultiPlanLab from'./src/MultiPlanLab';

export default function AppV04(){
 const [mode,setMode]=useState<'review'|'core'>('review');
 return <View style={s.root}>
  <View style={s.switcher}>
   <View style={{flex:1}}><Text style={s.brand}>PEPTIDE GUIDE</Text><Text style={s.meta}>Prototype 0.4 development review</Text></View>
   <Pressable accessibilityRole="button" accessibilityLabel="Open 0.4 review" onPress={()=>setMode('review')} style={[s.button,mode==='review'&&s.on]}><Text style={[s.buttonText,mode==='review'&&s.onText]}>0.4 Review</Text></Pressable>
   <Pressable accessibilityRole="button" accessibilityLabel="Open 0.3.3 core" onPress={()=>setMode('core')} style={[s.button,mode==='core'&&s.on]}><Text style={[s.buttonText,mode==='core'&&s.onText]}>Core</Text></Pressable>
  </View>
  <View style={s.body}>{mode==='review'?<MultiPlanLab/>:<App03/>}</View>
 </View>
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:'#fff'},body:{flex:1},switcher:{minHeight:54,paddingHorizontal:12,paddingVertical:7,flexDirection:'row',alignItems:'center',gap:6,borderBottomWidth:1,borderBottomColor:'#DDE8F6',backgroundColor:'#fff'},brand:{fontSize:11,fontWeight:'800',letterSpacing:1.1,color:'#12204A'},meta:{fontSize:9,color:'#667597',marginTop:2},button:{paddingHorizontal:10,paddingVertical:8,borderRadius:11,backgroundColor:'#EEF2F8'},on:{backgroundColor:'#DDF6FF'},buttonText:{fontSize:11,fontWeight:'800',color:'#667597'},onText:{color:'#0A7DAA'}});
