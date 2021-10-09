
import traverse from '@babel/traverse';
import generator from '@babel/generator';
import * as babelParser from '@babel/parser';
import * as svelteCompiler from 'svelte/compiler';
import * as t from './helpers/ast';
import canR2S from './helpers/can-r2s';


export function generateR2SCode({
  scriptAsts,
  newTemplateCode
}: {
  scriptAsts: any[],
  newTemplateCode: string
}): string {



  const declarations: any[] = [];
  const scriptProgramBodyAst: any[] = [];

  for (let scriptAst of scriptAsts) {
    if (t.isVariableDeclaration(scriptAst)) {
      if (scriptAst.kind === 'const') {
        scriptAst.kind = 'let';
      }
      for (let declaration of scriptAst.declarations) {
        declarations.push(declaration);
      }
    }
    scriptProgramBodyAst.push(scriptAst);
  }
  const newScriptAst = t.program(scriptProgramBodyAst);
  const newScriptCode = generator(newScriptAst).code;



  console.log('scriptAsts', scriptAsts);
  console.log('newScriptCode', newScriptCode);
  console.log('newTemplateCode', newTemplateCode);


  const svelteCode = '<script>\n' + newScriptCode.replace(/\<\/script/g, '<\\/script') + '\n</script>\n' + newTemplateCode;

  return svelteCode;
  // const compiledSvelteComponent = svelteCompiler.compile(svelteCode, { name: 'R2SComponent', customElement: true })

  // console.log(compiledSvelteComponent);
  // return compiledSvelteComponent;
}