import traverse,
{
  TraverseOptions,
  NodePath,
  Visitor,
  Binding,
  Scope
} from '@babel/traverse';
import * as t from '@babel/types';

type AST = t.File;
type RootNodePath<T = t.Node> = NodePath<T> & {
  parentPath: NodePath<t.Program>;
};

function isRootNodePath<T = t.Node>(
  path: NodePath<T>
): path is RootNodePath<T> {
  return path.parentPath?.isProgram() ?? false;
}


function isMapCallExpressionNode(node: t.CallExpression): boolean {

  const args = node.arguments;
  if (!t.isMemberExpression(node.callee)) {
    return false;
  }

  if (t.isIdentifier(node.callee.property) || (node.callee as any).name !== 'map') {
    return false;
  }

  if (!args[0]) {
    return false;
  }

  if (t.isArrowFunctionExpression(args[0]) && t.isFunctionExpression(args[0])) {
    return false;
  }

  return true;
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
  isMapCallExpressionNode,
};