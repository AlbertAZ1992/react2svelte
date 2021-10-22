import generator from '@babel/generator';
import * as babelParser from '@babel/parser';
import get from 'lodash/get';
import set from 'lodash/set';
import * as svelteCompiler from 'svelte/compiler';
import * as t from './helpers/ast';
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
    ImportDeclaration,
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

  let scriptAsts: any[] = [];
  const componentTemplate = getExportDefaultComponentTemplate({
    exportDefaultComponentAst,
    scriptAsts,
  })

  console.log('componentTemplate', componentTemplate);
  console.log('scriptAsts', scriptAsts);

  const scriptProgramBodyAst: any[] = [];
  for (let scriptAst of scriptAsts) {
    if (t.isVariableDeclaration(scriptAst)) {
      if (scriptAst.kind === 'const') {
        scriptAst.kind = 'let';
      }
    }
    scriptProgramBodyAst.push(scriptAst);
  }

  const svelteScriptAst = t.program(scriptProgramBodyAst);
  const componentScriptCode = generator(svelteScriptAst).code;

  const svelteCode = '<script>\n' + componentScriptCode + '\n</script>\n' + componentTemplate;

  return svelteCode;
}

function getAllDeclarations(ast: t.Node): any {
  let exportDefaultDeclaration = null;
  let exportNamedDeclarations: any[] = [];
  let variableDeclarations: any[] = [];
  let functionDeclarations: any[] = [];

  t.traverse(ast, {
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
  // 遍历所有包含 JSXElement 的函数定义，重新标记函数内部的变量定义
  const { scope: componentScope } = exportDefaultComponentAst;

  const getWrapperedWithJSXElementFunction = (
    withJSXElementFunctionPath: t.NodePath<t.FunctionDeclaration> | t.NodePath<t.ArrowFunctionExpression> | t.NodePath<t.FunctionExpression>
  ): {
    scopedWithJSXElementFunctionAst: t.IfStatement | null,
    scopedDeclarations: t.Node[],
  } => {
    const currentScope = withJSXElementFunctionPath.scope;
    const withJSXElementFunctionNode = withJSXElementFunctionPath.node;
    const functionDeclarationBodyAst = withJSXElementFunctionNode.body;
    let scopedDeclarations: t.Node[] = [];
    let scopedWithJSXElementFunctionAst: t.IfStatement | null = null;
    // 重命名作用域内变量
    if (t.isBlockStatement(functionDeclarationBodyAst)) {
      let index = 0;
      for (let bodyStatementAst of functionDeclarationBodyAst.body) {
        if (t.isVariableDeclaration(bodyStatementAst)) {
          let declarations: any = [];
          let expressions = []
          for (let variableDeclarator of bodyStatementAst.declarations) {
            const declaratorName = get(variableDeclarator, 'id.name');
            const declaratorInit = get(variableDeclarator, 'init');
            if (declaratorName) {
              // 把作用域内的变量重命名
              const scopedDeclaratorName = componentScope.generateUidIdentifier(declaratorName);
              currentScope.rename(declaratorName, scopedDeclaratorName.name);
              if (declaratorInit) {
                expressions.push(t.expressionStatement(
                  t.assignmentExpression('=', t.identifier(scopedDeclaratorName.name), declaratorInit))
                );
              }
            }
            // 改成变量定义
            declarations.push(set(variableDeclarator, 'init', null));
          }
          debugger;
          if (expressions.length > 0) {
            // 删掉 variableDeclaration 节点，替换成 assignmentExpressions
            ((withJSXElementFunctionPath.node as any).body as any).body.splice(index, 1, ...expressions);
            debugger;
          }
          // 该变量需要提到全局
          debugger;
          scopedDeclarations.push(t.variableDeclaration('let', declarations));

        }
        index += 1;
      }
    }

    // 给函数体包上 ifstatement
    if (!t.functionBodyHasIfStatement(withJSXElementFunctionNode)) {
      const scopeBodys: any[] = [];
      let scopeReturnStatement = null;
      if (t.isBlockStatement(functionDeclarationBodyAst)) {
        for (let bodyStatementAst of functionDeclarationBodyAst.body) {
          if (t.isReturnStatement(bodyStatementAst)) {
            scopeReturnStatement = bodyStatementAst;
            scopeBodys.push(t.returnStatement(t.booleanLiteral(true)));
          } else {
            scopeBodys.push(bodyStatementAst);
          }
        }
      }
      if (scopeReturnStatement) {
        scopedWithJSXElementFunctionAst = t.ifStatement(
          t.arrowFunctionExpression(
            [],
            t.blockStatement(scopeBodys)
          ),
          scopeReturnStatement,
        );
      }
    } else { // 如果函数体包含 ifstatement，

    }
    return {
      scopedWithJSXElementFunctionAst,
      scopedDeclarations,
    };
  }

  let traversedFunctions:  {[key:string]: unknown } = {};
  exportDefaultComponentAst.traverse({
    enter(path: t.NodePath<any>) {
      if (t.isFunctionReturnStatement({ // 调过组件函数本身的 return
        functionAstNode: exportDefaultComponentAst.node,
        returnStatementPath: path,
      })) {
        path.skip();
      }
      if (!t.hasJSX(path.node)) {
        path.skip();
      }
    },
    FunctionDeclaration(path: t.NodePath<t.FunctionDeclaration>) {
      if (t.hasJSX(path.node)) {
        if (traversedFunctions[get(path.node, 'loc.start.line')]) {
          path.skip();
        }
        traversedFunctions[get(path.node, 'loc.start.line')] = true;
        // 更新函数 ast
        const { scopedWithJSXElementFunctionAst, scopedDeclarations } = getWrapperedWithJSXElementFunction(path);
        if (scopedWithJSXElementFunctionAst) {
          path.replaceWith(t.functionDeclaration(path.node.id, path.node.params, t.blockStatement([scopedWithJSXElementFunctionAst])));
        }
        debugger;
        for (let declaration of scopedDeclarations) {
          path.insertBefore(declaration);
        }
        debugger;
      }
    },
    ArrowFunctionExpression(path: t.NodePath<t.ArrowFunctionExpression>) {
      if (traversedFunctions[get(path.node, 'loc.start.line')]) {
        path.skip();
      }
      traversedFunctions[get(path.node, 'loc.start.line')] = true;
      if (t.hasJSX(path.node)) {
        // 更新函数 ast
        const { scopedWithJSXElementFunctionAst, scopedDeclarations } = getWrapperedWithJSXElementFunction(path);
        if (scopedWithJSXElementFunctionAst) {
          path.replaceWith(t.arrowFunctionExpression(path.node.params, t.blockStatement([scopedWithJSXElementFunctionAst])));
        }
        for (let declaration of scopedDeclarations) {
          path.insertBefore(declaration);
        }
        debugger;
      }
    },
    FunctionExpression(path: t.NodePath<t.FunctionExpression>) {
      if (traversedFunctions[get(path.node, 'loc.start.line')]) {
        path.skip();
      }
      traversedFunctions[get(path.node, 'loc.start.line')] = true;
      if (t.hasJSX(path.node)) {
        // 更新函数 ast
        const { scopedWithJSXElementFunctionAst, scopedDeclarations } = getWrapperedWithJSXElementFunction(path);
        if (scopedWithJSXElementFunctionAst) {
          path.replaceWith(t.functionExpression(path.node.id, path.node.params, t.blockStatement([scopedWithJSXElementFunctionAst])));
        }
        for (let declaration of scopedDeclarations) {
          path.insertBefore(declaration);
        }
        debugger;
      }
    },
  });

  console.log(generator(exportDefaultComponentAst.node).code);

  const withJSXVariableDeclarations: any[] = [];
  const withJSXFunctionDeclarations: any[] = [];
  const { node } = exportDefaultComponentAst;
  const { body, params } = node;
  // const param = params ? params[0] : null;

  if (t.isBlockStatement(body)) {
    for (let bodyStatementAst of body.body) {
      if (t.isVariableDeclaration(bodyStatementAst)) {
        if (t.hasJSX(bodyStatementAst)) {
          withJSXVariableDeclarations.push(bodyStatementAst);
        }
        // else {
        //   scriptAsts.push(bodyStatementAst);
        // }
      } else if (t.isFunctionDeclaration(bodyStatementAst)) {
        if (t.hasJSX(bodyStatementAst)) {
          withJSXFunctionDeclarations.push(bodyStatementAst);
        }
        // else {
        //   scriptAsts.push(bodyStatementAst);
        // }
      }
    }
  }



  // 开始转换
  return getComponentTemplate({
    componentAst: exportDefaultComponentAst.node,
    variableDeclarations: withJSXVariableDeclarations,
    functionDeclarations: withJSXFunctionDeclarations,
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
        if (!t.hasJSX(bodyStatementAst)) {
          continue;
        }
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
          let level = 1;
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
          debugger;
          return transformSvelteTemplate({
            node: bodyStatementAst,
            variableDeclarations,
            functionDeclarations,
            scriptAsts,
            blockInfo: {},
          })
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
        str += `on:${name.substr(2).toLowerCase()}`;
      } else {
        str += name;
      }
      if (value) {
        str += '=';
        if (name === 'style' && t.isJSXExpressionContainer(value)) {
          let styleProperties = get(value, 'expression.properties');
          str += templateStyle(styleProperties);
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
      str += `</${get(node, 'openingElement.name.name')}>`;
    } else {
      str += '/>';
    }
    return str;
  } else if (t.isJSXText(node)) { // 转换成注释
    return node.value || '';
  } else if (t.isJSXExpressionContainer(node)) {

    if (t.isCallExpression(node.expression)) { // 变量或函数调用
      const callName = get(node.expression, 'callee.name');
      if (callName) { // 直接调用函数或变量
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
      } else if (t.isMapCallExpression(node.expression)) { // map 函数
        const callback = node.expression.arguments[0];
        const callbackParams = get(callback, 'params') || [];
        const calleeNode = get(node.expression, 'callee.object');
        let str = `{#each ${generator(calleeNode).code} as ${callbackParams.map((p: any) => p.name).join(', ')}}`;
        str += `}${getComponentTemplate({
          componentAst: callback,
          variableDeclarations,
          functionDeclarations,
          scriptAsts,
        })}{/each}`;
        return str;
      }
    }

    if (t.isTemplateLiteral(node.expression)) {  // 模板字符串
      const expressions = [];
      for (let expression of node.expression.expressions) {
        expressions.push(generator(expression).code);
      }
      let str = '';
      for (let quasisNode of node.expression.quasis) {
        if (t.isTemplateElement(quasisNode)) {
          const quasisNodeValue = get(quasisNode, 'value.raw');
          if (quasisNodeValue) {
            str += quasisNodeValue;
          } else {
            str += `{${expressions.shift()}}`;
          }
        }
      }
      return str;

    }

    if (t.hasJSX(node)) {
      return transformSvelteTemplate({
        node: node.expression,
        variableDeclarations,
        functionDeclarations,
        scriptAsts,
        blockInfo: {},
      });
    }

    return generator(node).code
  } else if (t.isConditionalExpression(node) || t.isIfStatement(node)) {
    let str = `{#if ${generator(node.test).code}}`;
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
  return '';
}