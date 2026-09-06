import React,{useState}from'react';
import{View,Text,Pressable,StyleSheet}from'react-native';
import{Card,u}from'./ui';

export type SchoolSection={id:string;title:string;summary?:string;body:string};
export type RelatedSchoolItem={id:string;name:string;subtitle:string;accent?:string};

export function SchoolAccordion({sections}:{sections:SchoolSection[]}){
 const [open,setOpen]=useState<string|null>(null);
 return <View style={s.wrap}>{sections.map(section=>{const expanded=open===section.id;return <View key={section.id} style={s.section}>
  <Pressable accessibilityRole="button" accessibilityLabel={section.title} accessibilityState={{expanded}} onPress={()=>setOpen(expanded?null:section.id)} style={s.header}>
   <View style={{flex:1}}><Text style={s.title}>{section.title}</Text>{section.summary&&<Text style={s.summary}>{section.summary}</Text>}</View><Text style={s.chevron}>{expanded?'−':'+'}</Text>
  </Pressable>
  {expanded&&<Text style={s.body}>{section.body}</Text>}
 </View>})}</View>;
}

export function RelatedSchoolCards({items,onOpen}:{items:RelatedSchoolItem[];onOpen:(id:string)=>void}){
 if(!items.length)return null;
 return <View style={{marginTop:18}}><Text style={u.heading}>Related compounds</Text><Text style={u.small}>Explore another School profile without leaving the learning flow.</Text><View style={s.relatedRow}>{items.map(item=><Pressable accessibilityRole="button" accessibilityLabel={'Learn about '+item.name} key={item.id} onPress={()=>onOpen(item.id)} style={s.relatedCard}><View style={[s.dot,{backgroundColor:item.accent||'#27B9EE'}]}/><Text style={s.relatedName}>{item.name}</Text><Text style={s.relatedSub}>{item.subtitle}</Text><Text style={s.learn}>Learn →</Text></Pressable>)}</View></View>;
}

export function ResearchProductLink({label,onPress}:{label:string;onPress?:()=>void}){
 return <Card><Text style={u.heading}>Research product</Text><Text style={u.body}>Finished learning? View the corresponding AURAPEP research product, documentation and availability when the store connection is enabled.</Text><Pressable accessibilityRole="button" accessibilityLabel={label} disabled={!onPress} onPress={onPress} style={[s.product,!onPress&&{opacity:.55}]}><Text style={s.productText}>{onPress?label:'Store connection coming later'}</Text></Pressable></Card>;
}

const s=StyleSheet.create({wrap:{marginTop:12,gap:9},section:{borderWidth:1,borderColor:'#DDE8F6',borderRadius:18,backgroundColor:'#fff',overflow:'hidden'},header:{minHeight:58,paddingHorizontal:16,paddingVertical:13,flexDirection:'row',alignItems:'center',gap:12},title:{fontSize:16,fontWeight:'800',color:'#0E1C4A'},summary:{fontSize:12,lineHeight:17,color:'#667597',marginTop:3},chevron:{fontSize:23,fontWeight:'600',color:'#27A8D8'},body:{fontSize:14,lineHeight:21,color:'#34456C',paddingHorizontal:16,paddingBottom:16},relatedRow:{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:10},relatedCard:{width:'48%',minHeight:132,borderWidth:1,borderColor:'#DDE8F6',borderRadius:18,padding:14,backgroundColor:'#fff'},dot:{width:12,height:12,borderRadius:6,marginBottom:10},relatedName:{fontSize:16,fontWeight:'800',color:'#0E1C4A'},relatedSub:{fontSize:11,lineHeight:16,color:'#667597',marginTop:4},learn:{fontSize:12,fontWeight:'800',color:'#168BB8',marginTop:10},product:{marginTop:12,borderRadius:14,paddingVertical:12,paddingHorizontal:14,backgroundColor:'#EAF9FF',alignItems:'center'},productText:{fontSize:14,fontWeight:'800',color:'#126EA5'}});
