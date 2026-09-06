// Compile TypeScript to CommonJS for Node tests, matching Metro's module handling.
const ts=require('./app/node_modules/typescript');
const fs=require('fs');
require.extensions['.ts']=(module,filename)=>{
 const source=fs.readFileSync(filename,'utf8');
 const result=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},fileName:filename});
 module._compile(result.outputText,filename);
};
