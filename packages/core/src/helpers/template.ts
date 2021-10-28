import get from 'lodash/get';
import set from 'lodash/set';
import * as t from './ast';

export function updateWithJSXElementStatement({
  componentScope,
  currentScope,
  statementAst,
  globalPositionPath,
}: {
  componentScope: t.Scope,
  currentScope: t.Scope,
  statementAst: t.BlockStatement | t.Expression | t.Statement,
  globalPositionPath: t.NodePath<any> | null,
}) {
  let scopedDeclarations: t.Node[] = [];
  // 重命名作用域内变量
  if (t.isBlockStatement(statementAst)) {
    let index = 0;
    for (let bodyStatementAst of statementAst.body) {
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
            // 如果定义的内容里还包含 JSXElement， 直接提取到全局
            if (declaratorInit && t.hasJSX(declaratorInit)) {
              // 补上一个空 statement，避免迭代出现混乱
              expressions.push(t.emptyStatement());
              declarations.push(set(variableDeclarator, 'init', declaratorInit));
            } else if (declaratorInit) { // 如果不包含 JSXElement，把作用域内的变量定义改成变量复制，把变量定义提取到全局
              // 局部变量赋值
              expressions.push(t.expressionStatement(
                t.assignmentExpression('=', t.identifier(get(variableDeclarator, 'id.name')), declaratorInit))
              );
              // 全局变量定义
              declarations.push(set(variableDeclarator, 'init', null));
            }
          }
        }
        // 删掉 variableDeclaration 节点，替换成 expressions
        statementAst.body.splice(index, 1, ...expressions);
        // 该变量需要提到全局
        scopedDeclarations.push(t.variableDeclaration('let', declarations));

      } else if (t.isIfStatement(bodyStatementAst)) { // 如果是 if statement 要遍历每个 if 项，有点复杂了
        updateWithJSXElementStatement({
          componentScope,
          currentScope,
          statementAst: bodyStatementAst.consequent,
          globalPositionPath,
        });

        let currentAlternate = bodyStatementAst.alternate;
        while (currentAlternate && t.isIfStatement(currentAlternate)) {
          if (globalPositionPath) {
            updateWithJSXElementStatement({
              componentScope,
              currentScope,
              statementAst: currentAlternate.consequent,
              globalPositionPath,
            });
          }
          currentAlternate = currentAlternate.alternate;
        }
      }
      index += 1;
    }
  }

  if (globalPositionPath) {
    for (let declaration of scopedDeclarations) {
      globalPositionPath.insertBefore(declaration);
    }
  }

}

export function hasUnFlattenJSXElementFunctions(componentAst: t.NodePath<any>): boolean {
  let hasUnFlattenJSXElementFunctionsFlag = false;
  const judgement = (path: t.NodePath<any>) => {
    if (t.hasJSX(path.node)) {
      const functionDeclarationBodyAst = path.node.body;
      // 重命名作用域内变量
      if (t.isBlockStatement(functionDeclarationBodyAst)) {
        for (let bodyStatementAst of functionDeclarationBodyAst.body) {
          if (t.isVariableDeclaration(bodyStatementAst)) {
            for (let variableDeclarator of bodyStatementAst.declarations) {
              const declaratorName = get(variableDeclarator, 'id.name');
              const declaratorInit = get(variableDeclarator, 'init');
              if (declaratorName) {
                if (declaratorInit && t.hasJSX(declaratorInit)) {
                  hasUnFlattenJSXElementFunctionsFlag = true;
                  break;
                }
              }
            }
          }
        }
      }
    }
  }
  componentAst.traverse({
    enter(path: t.NodePath<any>) {
      if (hasUnFlattenJSXElementFunctionsFlag) {
        path.skip();
      }
      if (t.isFunctionReturnStatement({ // 跳过组件函数本身的 return
        functionAstNode: componentAst.node,
        returnStatementPath: path,
      })) {
        path.skip();
      }
      if (!t.hasJSX(path.node)) {
        path.skip();
      }
    },
    FunctionDeclaration(path: t.NodePath<t.FunctionDeclaration>) {
      judgement(path);
    },
    ArrowFunctionExpression(path: t.NodePath<t.ArrowFunctionExpression>) {
      judgement(path);
    },
    FunctionExpression(path: t.NodePath<t.FunctionExpression>) {
      judgement(path);
    },
  });
  return hasUnFlattenJSXElementFunctionsFlag;
}
