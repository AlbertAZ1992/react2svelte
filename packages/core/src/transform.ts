import generator from '@babel/generator';
import prettier from 'prettier';
import * as prettierSvelte from 'prettier-plugin-svelte';
import get from 'lodash/get';
import set from 'lodash/set';
import * as t from './helpers/ast';
import isHtmlTag from './helpers/is-html-tag';
import templateStyle from './helpers/template-style';
import { updateWithJSXElementStatement, hasUnFlattenJSXElementFunctions, } from './helpers/template';

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

  // console.log('componentTemplate', componentTemplate);
  // console.log('scriptAsts', scriptAsts);

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

  return prettier.format(svelteCode, {
    parser: 'svelte',
    plugins: [prettierSvelte],
    svelteSortOrder: 'options-styles-scripts-markup',
    svelteStrictMode: true,
    svelteBracketNewLine: true,
    svelteAllowShorthand: true,
    svelteIndentScriptAndStyle: true,
    singleQuote: true,
  });
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

  const updateWithJSXElementFunctionScope = ({
    componentScope,
    withJSXElementFunctionPath,
    globalPositionPath,
  }: {
    componentScope: t.Scope,
    withJSXElementFunctionPath: t.NodePath<t.FunctionDeclaration> | t.NodePath<t.ArrowFunctionExpression> | t.NodePath<t.FunctionExpression>,
    globalPositionPath: t.NodePath<any> | null,
  }) => {
    const currentScope = withJSXElementFunctionPath.scope;
    const withJSXElementFunctionNode = withJSXElementFunctionPath.node;
    const functionDeclarationBodyAst = withJSXElementFunctionNode.body;
    updateWithJSXElementStatement({
      componentScope,
      currentScope,
      statementAst: functionDeclarationBodyAst,
      globalPositionPath,
    })
  };

  const { scope: componentScope } = exportDefaultComponentAst;
  // ??????????????? JSXElement ????????????????????????
  // ????????????????????????????????????????????????????????????????????? render jsx ?????????????????????
  while (hasUnFlattenJSXElementFunctions(exportDefaultComponentAst)) {
    exportDefaultComponentAst.traverse({
      enter(path: t.NodePath<any>) {
        if (t.isFunctionReturnStatement({ // ??????????????????????????? return
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
          updateWithJSXElementFunctionScope({
            componentScope,
            withJSXElementFunctionPath: path,
            globalPositionPath: path,
          });
        }
      },
      ArrowFunctionExpression(path: t.NodePath<t.ArrowFunctionExpression>) {
        if (t.hasJSX(path.node)) {
          updateWithJSXElementFunctionScope({
            componentScope,
            withJSXElementFunctionPath: path,
            globalPositionPath: path.parentPath.parentPath,
          });
        }
      },
      FunctionExpression(path: t.NodePath<t.FunctionExpression>) {
        if (t.hasJSX(path.node)) {
          updateWithJSXElementFunctionScope({
            componentScope,
            withJSXElementFunctionPath: path,
            globalPositionPath: path.parentPath.parentPath,
          });
        }
      },
    });
  }



  const getWrapperedWithJSXElementFunction = (
    withJSXElementFunctionPath: t.NodePath<t.FunctionDeclaration> | t.NodePath<t.ArrowFunctionExpression> | t.NodePath<t.FunctionExpression>
  ): t.IfStatement | null => {
    const withJSXElementFunctionNode = withJSXElementFunctionPath.node;
    const functionDeclarationBodyAst = withJSXElementFunctionNode.body;
    let scopedWithJSXElementFunctionAst: t.IfStatement | null = null;
    // ?????????????????? ifstatement
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
    } else { // ????????????????????? ifstatement???????????? ifstatement ??? test ??????????????????????????????
      if (t.isBlockStatement(withJSXElementFunctionNode.body)) {
        for (let bodyStatementAst of withJSXElementFunctionNode.body.body) {
          if (t.isIfStatement(bodyStatementAst)) {

            let currentAlternate = bodyStatementAst;

            while (currentAlternate && t.isIfStatement(currentAlternate)) {

              let currentTest = currentAlternate.test;
              let currentConsequent = currentAlternate.consequent;

              const scopeBodys: any[] = [];
              let scopeReturnStatement = null;
              if (t.isBlockStatement(currentConsequent)) {
                for (let bodyStatementAst of currentConsequent.body) {
                  if (t.isReturnStatement(bodyStatementAst)) {
                    scopeReturnStatement = bodyStatementAst;
                    scopeBodys.push(t.returnStatement(t.booleanLiteral(true)));
                  } else {
                    scopeBodys.push(bodyStatementAst);
                  }
                }
              }
              if (scopeReturnStatement) {
                set(currentAlternate, 'test', t.logicalExpression('&&', currentTest, t.arrowFunctionExpression(
                  [],
                  t.blockStatement(scopeBodys)
                )));
                set(currentAlternate, 'consequent', scopeReturnStatement);
              }
              currentAlternate = currentAlternate.alternate as any;
            }
          }
        }
      }
    }
    return scopedWithJSXElementFunctionAst;
  }

  /// ??????????????? JSXElement ??????????????? if statement
  exportDefaultComponentAst.traverse({
    enter(path: t.NodePath<any>) {
      if (t.isFunctionReturnStatement({ // ??????????????????????????? return
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
        const scopedWithJSXElementFunctionAst = getWrapperedWithJSXElementFunction(path);
        if (scopedWithJSXElementFunctionAst) {
          path.replaceWith(t.functionDeclaration(path.node.id, path.node.params, t.blockStatement([scopedWithJSXElementFunctionAst])));
        }
      }
    },
    ArrowFunctionExpression(path: t.NodePath<t.ArrowFunctionExpression>) {
      if (t.hasJSX(path.node)) {
        const scopedWithJSXElementFunctionAst = getWrapperedWithJSXElementFunction(path);
        if (scopedWithJSXElementFunctionAst) {
          path.replaceWith(t.arrowFunctionExpression(path.node.params, t.blockStatement([scopedWithJSXElementFunctionAst])));
        }
      }
    },
    FunctionExpression(path: t.NodePath<t.FunctionExpression>) {
      if (t.hasJSX(path.node)) {
        const scopedWithJSXElementFunctionAst = getWrapperedWithJSXElementFunction(path);
        if (scopedWithJSXElementFunctionAst) {
          path.replaceWith(t.functionExpression(path.node.id, path.node.params, t.blockStatement([scopedWithJSXElementFunctionAst])));
        }
      }
    },
  });

  // console.log(generator(exportDefaultComponentAst.node).code);

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
        else {
          scriptAsts.push(bodyStatementAst);
        }
      } else if (t.isFunctionDeclaration(bodyStatementAst)) {
        if (t.hasJSX(bodyStatementAst)) {
          withJSXFunctionDeclarations.push(bodyStatementAst);
        }
        else {
          scriptAsts.push(bodyStatementAst);
        }
      } else if (!t.hasJSX(bodyStatementAst)) {
        scriptAsts.push(bodyStatementAst);
      }
    }
  }

  // ????????????
  return getComponentTemplate({
    componentAst: exportDefaultComponentAst.node,
    withJSXVariableDeclarations: withJSXVariableDeclarations,
    withJSXFunctionDeclarations: withJSXFunctionDeclarations,
    scriptAsts,
  });
}





function getComponentTemplate({
  componentAst,
  withJSXVariableDeclarations,
  withJSXFunctionDeclarations,
  scriptAsts,
} : {
  componentAst: t.Node,
  withJSXVariableDeclarations: any[],
  withJSXFunctionDeclarations: any[],
  scriptAsts: t.Node[]
}): string {

  if (t.isVariableDeclaration(componentAst)) {

    const declarationInitAst = get(componentAst.declarations[0], 'init');
    if (declarationInitAst) {
      return transformSvelteTemplate({
        node: declarationInitAst,
        withJSXVariableDeclarations,
        withJSXFunctionDeclarations,
        scriptAsts,
        blockInfo: {},
      })
    }
    return '';
  } else { // ??????????????????????????????
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
            withJSXVariableDeclarations,
            withJSXFunctionDeclarations,
            scriptAsts,
            blockInfo: {},
          });


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
          return transformSvelteTemplate({
            node: bodyStatementAst,
            withJSXVariableDeclarations,
            withJSXFunctionDeclarations,
            scriptAsts,
            blockInfo: {},
          });
        }
      }
      return '';
    }
    return '';
  }
}



function transformSvelteTemplate({
  node,
  withJSXVariableDeclarations,
  withJSXFunctionDeclarations,
  scriptAsts,
  blockInfo,
} : {
  node: t.Node,
  withJSXVariableDeclarations: any[],
  withJSXFunctionDeclarations: any[],
  scriptAsts: t.Node[],
  blockInfo: any
}): string {

  if (t.isJSXElement(node)) {
    let str = '<';
    let tagName = get(node, 'openingElement.name.name');

    if (!isHtmlTag(tagName)) {

      let tagComponentAst = null;

      for (let functionDeclaration of withJSXFunctionDeclarations) {
        if (get(functionDeclaration, 'id.name') === tagName) {
          tagComponentAst = functionDeclaration;
        }
      }

      for (let variableDeclaration of withJSXVariableDeclarations) {
        for (let declaration of variableDeclaration.declarations) {
          if (get(declaration, 'id.name') === tagName) {
            tagComponentAst = declaration.init;
          }
        }
      }


      return getComponentTemplate({
        componentAst: tagComponentAst,
        withJSXVariableDeclarations,
        withJSXFunctionDeclarations,
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
        withJSXVariableDeclarations,
        withJSXFunctionDeclarations,
        scriptAsts,
        blockInfo: {},
      })).join('');
      str += `</${get(node, 'openingElement.name.name')}>`;
    } else {
      str += '/>';
    }
    return str;
  } else if (t.isJSXText(node)) { // ???????????????
    return node.value || '';
  } else if (t.isJSXExpressionContainer(node)) { // ???????????????

    if (t.isCallExpression(node.expression)) { // ?????????????????????
      const callName = get(node.expression, 'callee.name');
      if (callName) { // ???????????????????????????
        let callComponentAst = null;
        for (let functionDeclaration of withJSXFunctionDeclarations) {
          if (get(functionDeclaration, 'id.name') === callName) {
            callComponentAst = functionDeclaration;
          }
        }

        for (let variableDeclaration of withJSXVariableDeclarations) {
          for (let declaration of variableDeclaration.declarations) {
            if (get(declaration, 'id.name') === callName) {
              callComponentAst = declaration.init;
            }
          }
        }

        return getComponentTemplate({
          componentAst: callComponentAst,
          withJSXVariableDeclarations,
          withJSXFunctionDeclarations,
          scriptAsts,
        });
      } else if (t.isMapCallExpression(node.expression)) { // map ??????
        const callback = node.expression.arguments[0];
        const callbackParams = get(callback, 'params') || [];
        const calleeNode = get(node.expression, 'callee.object');
        let str = `\n{#each ${generator(calleeNode).code} as ${callbackParams.map((p: any) => p.name).join(', ')}}}\n`;
        str += `${getComponentTemplate({
          componentAst: callback,
          withJSXVariableDeclarations,
          withJSXFunctionDeclarations,
          scriptAsts,
        })}`;
        str += '\n{/each}\n';
        return str;
      }
    }

    if (t.isTemplateLiteral(node.expression)) {  // ???????????????
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
    if (t.isLogicalExpression(node.expression)) { // ???????????????
      if (get(node.expression, 'operator') === '&&') { // || ?????? JSXElement ???????????????????????????
        let nodeAst = t.ifStatement(
          t.arrowFunctionExpression(
            [],
            node.expression.left
          ),
          t.returnStatement(node.expression.right),
        );
        return transformSvelteTemplate({
          node: nodeAst,
          withJSXVariableDeclarations,
          withJSXFunctionDeclarations,
          scriptAsts,
          blockInfo: {},
        });
      }
    }

    if (t.hasJSX(node)) {
      return transformSvelteTemplate({
        node: node.expression,
        withJSXVariableDeclarations,
        withJSXFunctionDeclarations,
        scriptAsts,
        blockInfo: {},
      });
    }

    return generator(node).code
  } else if (t.isConditionalExpression(node) || t.isIfStatement(node)) {
    let str = `\n{#if ${generator(node.test).code}}\n`;
    let childrenJSXElement: any = node.consequent;
    if (t.isReturnStatement(node.consequent)) {
      let argument = get(node.consequent, 'argument');
      if (argument && t.isCallExpression(argument)) {
        childrenJSXElement = t.jSXExpressionContainer(argument);
      } else if (argument) {
        childrenJSXElement = argument;
      }
    } else if (t.isCallExpression(node.consequent)) {
      childrenJSXElement = t.jSXExpressionContainer(node.consequent);
    }
    str += transformSvelteTemplate({
      node: childrenJSXElement,
      withJSXVariableDeclarations,
      withJSXFunctionDeclarations,
      scriptAsts,
      blockInfo: {},
    });
    if (node.alternate) {
      str += '\n{:else}\n';
      str += transformSvelteTemplate({
        node: node.alternate,
        withJSXVariableDeclarations,
        withJSXFunctionDeclarations,
        scriptAsts,
        blockInfo: {},
      });
    }
    str += '\n{/if}\n';
    return str;
  }
  return '';
}