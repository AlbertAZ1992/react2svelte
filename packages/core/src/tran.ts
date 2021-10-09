
import traverse from '@babel/traverse';
import generator from '@babel/generator';
import * as babelParser from '@babel/parser';
import get from 'lodash/get';
import set from 'lodash/set';
import * as svelteCompiler from 'svelte/compiler';
import * as t from './helpers/ast';
import canR2S from './helpers/can-r2s';
import isHtmlTag from './helpers/is-html-tag';
import templateStyle from './helpers/template-style';

export enum COMPONENT_TYPE {
  FUNCTION_COMPONENT = 'FUNCTION_COMPONENT',
  CLASS_COMPONENT = 'CLASS_COMPONENT',
}


export function generateR2SCode({
  sourceAst,
  sourceCode
}: {
  sourceAst: any,
  sourceCode: string
}): string {

  const {
    exportDefaultDeclaration,
    exportNamedDeclarations,
    variableDeclarations,
    functionDeclarations,
  } = getAllDeclarations(sourceAst);

  if (!exportDefaultDeclaration) {
    return ''
  }

  const exportDefaultComponentAst = getExportDefaultComponentAst({
    exportDefaultDeclaration,
    variableDeclarations,
    functionDeclarations
  });


  if (!exportDefaultComponentAst) {
    return '';
  }


  // const { templateAst } = getSvelteTemplateAst({
  //   exportDefaultComponentAst,
  //   variableDeclarations,
  //   functionDeclarations,
  // });

  let scriptAsts: any[] = [];
  const componentTemplate = getExportDefaultComponentTemplate({
    exportDefaultComponentAst,
    scriptAsts,
  })

  console.log('scriptAsts', scriptAsts);

  return componentTemplate;

}

function getAllDeclarations(ast: t.Node): any {
  let exportDefaultDeclaration = null;
  let exportNamedDeclarations: any[] = [];
  let variableDeclarations: any[] = [];
  let functionDeclarations: any[] = [];

  traverse(ast, {
    ExportDefaultDeclaration(path: t.NodePath<t.ExportDefaultDeclaration>) {
      exportDefaultDeclaration = path;
    },
    VariableDeclaration(path: t.NodePath<t.VariableDeclaration>) {
      variableDeclarations.push(path);
    },
    FunctionDeclaration(path: t.NodePath<t.FunctionDeclaration>) {
      functionDeclarations.push(path);
    },
    ExportNamedDeclaration(path: t.NodePath<t.ExportNamedDeclaration>) {
      exportNamedDeclarations.push(path);
    }
  });
  return {
    exportDefaultDeclaration,
    exportNamedDeclarations,
    variableDeclarations,
    functionDeclarations,
  }
}

function getExportDefaultComponentAst({
  exportDefaultDeclaration,
  variableDeclarations,
  functionDeclarations,
}: {
  exportDefaultDeclaration: t.NodePath<any>,
  variableDeclarations: any[],
  functionDeclarations: any[],
}): t.NodePath<any> | null {

  let exportDefaultComponentName = '';
  if (t.isIdentifier(exportDefaultDeclaration.node.declaration)) {
    exportDefaultComponentName = get(exportDefaultDeclaration.node.declaration, 'name');
    for (let functionDeclaration of functionDeclarations) {
      if (get(functionDeclaration.node, 'id.name') === exportDefaultComponentName) {
        return functionDeclaration;
      }
    }
    for (let variableDeclaration of variableDeclarations) {
      for (let declaration of variableDeclaration.node.declarations) {
        // console.log('ss', declaration);
        // console.log('s', get(declaration, 'id.name'));
        if (get(declaration, 'id.name') === exportDefaultComponentName) {
          return declaration;
        }
      }
    }
  } else if (t.isFunctionDeclaration(exportDefaultDeclaration.node.declaration)) {
    return exportDefaultDeclaration.node.declaration;
  }
  return null;

}

function getExportDefaultComponentTemplate({
  exportDefaultComponentAst,
  scriptAsts,
} : {
  exportDefaultComponentAst: t.NodePath<any>,
  scriptAsts: t.Node[]
}): string {
  const { node, scope } = exportDefaultComponentAst;
  const { body, params } = node;
  const param = params ? params[0] : null;


  const variableDeclarations: any[] = [];
  const functionDeclarations: any[] = [];

  if (t.isBlockStatement(body)) {
    for (let bodyStatementAst of body.body) {
      if (t.isVariableDeclaration(bodyStatementAst)) {
        if (t.hasJSX(bodyStatementAst)) {
          variableDeclarations.push(bodyStatementAst);
        }
      } else if (t.isFunctionDeclaration(bodyStatementAst)) {
        if (t.hasJSX(bodyStatementAst)) {
          functionDeclarations.push(bodyStatementAst);
        }
      }
    }
  }




  return getComponentTemplate({
    componentAst: exportDefaultComponentAst.node,
    variableDeclarations,
    functionDeclarations,
    scriptAsts,
  });
}

function getComponentTemplate({
  componentAst,
  variableDeclarations,
  functionDeclarations,
  scriptAsts,
} : {
  componentAst: t.Node,
  variableDeclarations: any[],
  functionDeclarations: any[],
  scriptAsts: t.Node[]
}): string {

  if (t.isVariableDeclaration(componentAst)) {

    const declarationInitAst = get(componentAst.declarations[0], 'init');
    if (declarationInitAst) {
      return transformSvelteTemplate({
        node: declarationInitAst,
        variableDeclarations,
        functionDeclarations,
        scriptAsts,
        blockInfo: {},
      })
    }
    return '';
  } else { // 要判断一下是不是函数
    // const { node, scope } = componentAst;
    const { body, params } = componentAst as any;
    const param = params ? params[0] : null;

    let templateAst: any;

    if (t.isBlockStatement(body)) {

      for (let bodyStatementAst of body.body) {
        if (t.isReturnStatement(bodyStatementAst)) {
          templateAst = bodyStatementAst.argument;

          return transformSvelteTemplate({
            node: templateAst,
            variableDeclarations,
            functionDeclarations,
            scriptAsts,
            blockInfo: {},
          })


        } else if (t.isIfStatement(bodyStatementAst)) {
          let finalALternate = null
          let currentAlternate = bodyStatementAst.alternate;
          let level = 0;
          while (currentAlternate && t.isIfStatement(currentAlternate)) {
            level +=1;
            currentAlternate = currentAlternate.alternate;
          }
          if (!currentAlternate) {
            for (let bodyStatementAstForIfStatement of body.body) {
              if (t.isReturnStatement(bodyStatementAstForIfStatement)) {
                finalALternate = bodyStatementAstForIfStatement.argument;
                break;
              }
            }
          }

          if (finalALternate) {
            const setPathLevels = new Array(level);
            set(bodyStatementAst, setPathLevels.fill('alternate').join('.'), finalALternate);
          }

          console.log(230, currentAlternate);
          console.log(231, bodyStatementAst);

          return transformSvelteTemplate({
            node: bodyStatementAst,
            variableDeclarations,
            functionDeclarations,
            scriptAsts,
            blockInfo: {},
          })
        }
        else if (t.isVariableDeclaration(bodyStatementAst)) {
          if (t.hasJSX(bodyStatementAst)) {
            // getComponentTemplate({ componentAst: bodyStatementAst, scriptAsts });
            // variableDeclarations.push(bodyStatement);
          } else {
            scriptAsts.push(bodyStatementAst);
          }
        } else if (t.isFunctionDeclaration(bodyStatementAst)) {
          if (t.hasJSX(bodyStatementAst)) {
            // getComponentTemplate({ componentAst: bodyStatementAst, scriptAsts });
            // functionDeclarations.push(bodyStatement);
          } else {
            scriptAsts.push(bodyStatementAst);
          }
        }
      }
      return '';
    }
    return '';
  }
}



function transformSvelteTemplate({
  node,
  variableDeclarations,
  functionDeclarations,
  scriptAsts,
  blockInfo,
} : {
  node: t.Node,
  variableDeclarations: any[],
  functionDeclarations: any[],
  scriptAsts: t.Node[],
  blockInfo: any
}): string {

  if (t.isJSXElement(node)) {
    let str = '<';
    let tagName = get(node, 'openingElement.name.name');

    if (!isHtmlTag(tagName)) {
      console.log(tagName);
      let tagComponentAst = null;

      for (let functionDeclaration of functionDeclarations) {
        if (get(functionDeclaration, 'id.name') === tagName) {
          tagComponentAst = functionDeclaration;
        }
      }

      for (let variableDeclaration of variableDeclarations) {
        for (let declaration of variableDeclaration.declarations) {
          if (get(declaration, 'id.name') === tagName) {
            tagComponentAst = declaration.init;
          }
        }
      }

      console.log(273, tagComponentAst);

      return getComponentTemplate({
        componentAst: tagComponentAst,
        variableDeclarations,
        functionDeclarations,
        scriptAsts,
      });
    }

    str += tagName;
    for (let attr of node.openingElement.attributes) {
      let name = get(attr, 'name.name');
      let value = get(attr, 'value');
      if (name === 'key') {
        continue;
      }
      str += ' ';
      if (name === 'className') {
        str += 'class';
      } else if (/^on[A-Z]/.test(name)) {
        str += 'on:' + name.substr(2).toLowerCase();
      } else {
        str += name;
      }
      if (value) {
        str += '=';
        if (name === 'style' && t.isJSXExpressionContainer(value)) {
          let styleProperties = get(value, 'expression.properties');

          // let styleObjectString = generator(value.expression, { compact: true }).code;
          // let styleObject = JSON.parse(styleObjectString);
          str +=  templateStyle(styleProperties);
        } else {
          str += generator(value, { compact: true }).code
        }
      } else {
        str += '{true}'
      }
    }

    if (node.closingElement) {
      str += '>';
      str += node.children.map((el) => transformSvelteTemplate({
        node: el,
        variableDeclarations,
        functionDeclarations,
        scriptAsts,
        blockInfo: {},
      })).join('');
      str += '</' + get(node, 'openingElement.name.name') + '>';
    } else {
      str += '/>';
    }
    return str;
  } else if (t.isJSXText(node)) {
    let value = node.value;
    // if (value) {
    //   if (value.trim()) {
    //     value = value.replace(/(^\s*\n\s*|\s*\n\s*$)/g, '<!--$1-->');
    //   } else if (value.indexOf('\n') > -1) {
    //     value = '<!--' + value + '-->';
    //   }
    // }
    return value;
  } else if (t.isJSXExpressionContainer(node)) {
    if (t.hasJSX(node)) {
      return transformSvelteTemplate({
        node: node.expression,
        variableDeclarations,
        functionDeclarations,
        scriptAsts,
        blockInfo: {},
      });
    }

    if (t.isCallExpression(node.expression)) {
      const callName = get(node.expression, 'callee.name');
      if (callName) {
        let callComponentAst = null;
        for (let functionDeclaration of functionDeclarations) {
          if (get(functionDeclaration, 'id.name') === callName) {
            callComponentAst = functionDeclaration;
          }
        }

        for (let variableDeclaration of variableDeclarations) {
          for (let declaration of variableDeclaration.declarations) {
            if (get(declaration, 'id.name') === callName) {
              callComponentAst = declaration.init;
            }
          }
        }

        return getComponentTemplate({
          componentAst: callComponentAst,
          variableDeclarations,
          functionDeclarations,
          scriptAsts,
        });
      }

    }

    return generator(node).code
  } else if (t.isConditionalExpression(node) || t.isIfStatement(node)) {
    let str = '{#if ' + generator(node.test).code + '}';
    str += transformSvelteTemplate({
      node: node.consequent,
      variableDeclarations,
      functionDeclarations,
      scriptAsts,
      blockInfo: {},
    });
    if (node.alternate) {
      str += '{:else}';
      str += transformSvelteTemplate({
        node: node.alternate,
        variableDeclarations,
        functionDeclarations,
        scriptAsts,
        blockInfo: {},
      });
    }
    str += '{/if}';
    return str;
  }
  else if (t.isMapCallExpressionNode(node as t.CallExpression)) {
    const callback = (node as t.CallExpression).arguments[0] as any;
    const callee = (node as t.CallExpression).callee as any;
    let str = '{#each ' + generator(callee.object).code + ' as ' + callback.params.map((p: any) => p.name).join(', ')
    if (t.isJSXElement(callback.body)) {
      for (const attr of callback.body.openingElement.attributes) {
        if (attr.name.name === 'key' && t.isJSXExpressionContainer(attr.value)) {
          str += ' (' + generator(attr.value.expression).code + ')'
          break;
        }
      }
    }
    str += `}${transformSvelteTemplate({
      node: callback.body,
      variableDeclarations,
      functionDeclarations,
      scriptAsts,
      blockInfo: {},
    })}{/each}`;
    return str
  } else if (t.isArrayExpression(node)) {
    return node.elements.map((el: any) => transformSvelteTemplate({
      node: el,
      variableDeclarations,
      functionDeclarations,
      scriptAsts,
      blockInfo: {},
    })).join('');
  }
  return '';
}