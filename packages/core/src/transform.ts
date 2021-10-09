
import traverse from '@babel/traverse';
import generator from '@babel/generator';
import get from 'lodash/get';


import * as t from './helpers/ast';
import canR2S from './helpers/can-r2s';
import templateStyle from './helpers/template-style';

export enum COMPONENT_TYPE {
  FUNCTION_COMPONENT = 'FUNCTION_COMPONENT',
  CLASS_COMPONENT = 'CLASS_COMPONENT',
}

export enum COMPONENT_PREFFIX {
  PROPS = '$PROPS',
}


export function transformR2SAst(ast: t.Node, code: string): any {
  const scriptAsts: any[] = [];
  const templateAsts: any[] = [];
  let newTemplateCode = '';

  const functionComponentAsts = getFunctionComponentAsts(ast);

  for (let functionComponentAst of functionComponentAsts) {
    const templateBlock = transformComponentBlockAst({
      path: functionComponentAst,
      type: COMPONENT_TYPE.FUNCTION_COMPONENT,
      scriptAsts,
      templateAsts
    });
    newTemplateCode = `${newTemplateCode}${templateBlock}`;
  }

  return {
    scriptAsts,
    templateAsts,
    newTemplateCode
  }
}

/**
 *
 * @param ast
 * @returns list of function component ast
 */
function getFunctionComponentAsts(ast: t.Node): t.NodePath<any>[] {
  const keetAsts: t.NodePath<any>[] = [];
  const safeAsts: boolean[] = [];

  const travalCode = (
    path: t.NodePath<t.FunctionDeclaration> | t.NodePath<t.FunctionExpression> | t.NodePath<t.ArrowFunctionExpression>,
    keetAsts: t.NodePath<any>[],
    safeAsts: boolean[],
  ) => {
    const start = path?.node?.start;
    const end = path?.node?.end;
    if (start && end && !safeAsts[start] && canR2S(path)) {
      for (let i = start; i < end; i++) {
        safeAsts[i] = true
      }
      keetAsts.push(path);
    }
  }
  // const
  traverse(ast, {
    FunctionDeclaration(path: t.NodePath<t.FunctionDeclaration>) {
      travalCode(path, keetAsts, safeAsts);
    },
    FunctionExpression(path: t.NodePath<t.FunctionExpression>) {
      travalCode(path, keetAsts, safeAsts);
    },
    ArrowFunctionExpression(path: t.NodePath<t.ArrowFunctionExpression>) {
      travalCode(path, keetAsts, safeAsts);
    },
  });

  return keetAsts;
}


function transformComponentBlockAst({
  path,
  type,
  scriptAsts,
  templateAsts,
} : {
  path: t.NodePath<t.FunctionDeclaration> | t.NodePath<t.FunctionExpression> | t.NodePath<t.ArrowFunctionExpression>,
  type: COMPONENT_TYPE,
  scriptAsts: any,
  templateAsts: any,
}) {

  if (type === COMPONENT_TYPE.FUNCTION_COMPONENT) {
    let templateAst: any;
    const { node, scope } = path;
    const { body } = node;
    const param = node.params[0];
    const blockInfo: {
      props?: any
      id?: any,
    } = {};

    if ((node as any).id) {
      blockInfo.id = (node as any).id;
    }

    if (param) {
      if (t.isIdentifier(param)) {
        blockInfo.props = param;
      } else if (t.isObjectPattern(param)) {
        let props = scope.generateUidIdentifier(COMPONENT_PREFFIX.PROPS);
        blockInfo.props = props;
        scriptAsts.push(t.variableDeclaration(
          'const',
          [
            t.variableDeclarator(
              t.identifier('arg'),
              props,
            )
          ]
        ));
      } else if (t.isAssignmentPattern(param)) { // props = 1, left, right

      }
    }
    if (t.isBlockStatement(body)) {
      for (let statement of body.body) {
        if (t.isReturnStatement(statement)) {
          // console.log('statement', statement);
          templateAst = statement.argument;
          templateAsts.push(templateAst);

          // break;
        } else {
          scriptAsts.push(statement);
        }
      }
    } else {
      templateAst = body;
      templateAsts.push(templateAst);
    }

    const templateBlock = transformSvelteTemplate(templateAst, blockInfo)
    return templateBlock;

  }
  return '';
}



function transformSvelteTemplate(node: t.Node, blockInfo: any): string {
  if (t.isJSXElement(node)) {
    let str = '<';
    str += get(node, 'openingElement.name.name');

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
      str += node.children.map((el) => transformSvelteTemplate(el, blockInfo)).join('');
      str += '</' + get(node, 'openingElement.name.name') + '>';
    } else {
      str += '/>';
    }
    return str;
  } else if (t.isJSXText(node)) {
    let value = node.value;
    if (value) {
      if (value.trim()) {
        value = value.replace(/(^\s*\n\s*|\s*\n\s*$)/g, '<!--$1-->');
      } else if (value.indexOf('\n') > -1) {
        value = '<!--' + value + '-->';
      }
    }
    return value;
  } else if (t.isJSXExpressionContainer(node)) {
    if (t.hasJSX(node)) {
      return transformSvelteTemplate(node.expression, blockInfo);
    }
    return generator(node).code
  } else if (t.isConditionalExpression(node)) {
    let str = '{#if ' + generator(node.test).code + '}';
    str += transformSvelteTemplate(node.consequent, blockInfo);
    if (node.alternate && t.isNullLiteral(node.alternate)) {
      str += '{:else}';
      str += transformSvelteTemplate(node.alternate, blockInfo);
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
    str += `}${transformSvelteTemplate(callback.body, blockInfo)}{/each}`;
    return str
  } else if (t.isArrayExpression(node)) {
    return node.elements.map((el: any) => transformSvelteTemplate(el, blockInfo)).join('');
  }
  return '';
}