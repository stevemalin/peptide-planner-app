import React from'react';import{View,Text}from'react-native';import type{Draft}from'./engine';import{calculate}from'./planning';import{u}from'./ui';
export default function SetupSummary({plan}:{plan:Pick<Draft,'vialMg'|'waterMl'|'setupOrigin'>}){
 const result=calculate(plan.vialMg,plan.waterMl,'1');
 return <View style={[u.evidence,{borderLeftColor:'#94600a'}]}><Text style={u.label}>CALCULATION SETUP</Text><Text style={u.heading}>{plan.setupOrigin?(plan.setupOrigin.customized?'Customized Common Research Setup':'Common Research Setup'):'Your vial setup'}</Text><Text style={u.body}>{plan.vialMg&&plan.waterMl?plan.vialMg+' mg vial · '+plan.waterMl+' mL BAC':'Confirm vial setup'}</Text>{result&&<Text style={u.body}>{Number(result.concentration.toFixed(2))} mg/mL</Text>}<Text style={u.small}>Separate from the plan’s clinical or research evidence. Editable.</Text></View>;
}
