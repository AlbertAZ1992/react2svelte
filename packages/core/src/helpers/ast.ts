import traverse,
{
  TraverseOptions,
  NodePath,
  Visitor,
  Binding,
  Scope
} from '@babel/traverse';
import * as t from '@babel/types';
import get from 'lodash/get';

type AST = t.File;
type RootNodePath<T = t.Node> = NodePath<T> & {
  parentPath: NodePath<t.Program>;
};

function isRootNodePath<T = t.Node>(
  path: NodePath<T>
): path is RootNodePath<T> {
  return path.parentPath?.isProgram() ?? false;
}


function isMapCallExpression(expression: t.CallExpression): boolean {
  const callee = expression.callee;
  const args = expression.arguments;
  if (!t.isMemberExpression(callee)) {
    return false;
  }
  if (get(callee, 'property.name') !== 'map') {
    return false;
  }
  const callback = args[0];
  if (!callback) {
    return false;
  }
  if (!t.isArrowFunctionExpression(args[0]) && !t.isFunctionExpression(args[0])) {
    return false;
  }
  return true;
}


function isFunctionReturnStatement({
  functionAstNode,
  returnStatementPath,
} : {
  functionAstNode: t.Node,
  returnStatementPath: NodePath<t.ReturnStatement>
}): boolean {
  if (t.isReturnStatement(returnStatementPath.node)) {
    const functionStart = get(functionAstNode, 'start');
    const functionEnd = get(functionAstNode, 'end');
    const returnStatementBelongToFunctionStart = get(returnStatementPath, 'parentPath.parentPath.node.start');
    const returnStatementBelongToFunctionEnd = get(returnStatementPath, 'parentPath.parentPath.node.end');
    if (functionStart === returnStatementBelongToFunctionStart && functionEnd === returnStatementBelongToFunctionEnd) {
      return true;
    }
  }
  return false;
}


function hasJSX(node: any): boolean | t.Node {
  for (let key in node) {
    const item = node[key];
    if (item === 'JSXElement') {
      return true;
    } else if (item && typeof item === 'object') {
      const has = hasJSX(item);
      if (has) {
        return true === has ? has : item;
      }
    }
  }
  return false;
}

export * from '@babel/types';
export {
  traverse,
  AST,
  TraverseOptions,
  NodePath,
  Visitor,
  Scope,
  Binding,
  RootNodePath,
  hasJSX,
  isRootNodePath,
  isMapCallExpression,
  isFunctionReturnStatement,
};