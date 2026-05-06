import { SyntaxKind, Project, Node, type CallExpression, type ObjectLiteralExpression } from 'ts-morph';

const targetGlob = process.argv[2] || 'src/modules/**/*.service.ts';

function isPrismaCall(call: CallExpression): boolean {
  const expr = call.getExpression();
  if (!Node.isPropertyAccessExpression(expr)) return false;
  const delegateExpr = expr.getExpression().getText();
  return delegateExpr.startsWith('prisma.');
}

function methodName(call: CallExpression): string | null {
  const expr = call.getExpression();
  if (!Node.isPropertyAccessExpression(expr)) return null;
  return expr.getName();
}

function ensureCompanyInObject(obj: ObjectLiteralExpression, propName: 'where' | 'data'): boolean {
  const prop = obj.getProperty(propName);

  if (!prop || !Node.isPropertyAssignment(prop)) {
    obj.addPropertyAssignment({
      name: propName,
      initializer: '{ companyId }',
    });
    return true;
  }

  const init = prop.getInitializer();
  if (!init) {
    prop.setInitializer('{ companyId }');
    return true;
  }

  if (Node.isObjectLiteralExpression(init)) {
    const hasCompany = init.getProperty('companyId');
    if (hasCompany) return false;
    init.addShorthandPropertyAssignment({ name: 'companyId' });
    return true;
  }

  const txt = init.getText();
  prop.setInitializer(`{ ...(${txt}), companyId }`);
  return true;
}

function convertUpdateDelete(call: CallExpression): boolean {
  const expr = call.getExpression();
  if (!Node.isPropertyAccessExpression(expr)) return false;

  const method = expr.getName();
  if (method !== 'update' && method !== 'delete') return false;

  expr.getNameNode().replaceWithText(method === 'update' ? 'updateMany' : 'deleteMany');

  const firstArg = call.getArguments()[0];
  if (!firstArg || !Node.isObjectLiteralExpression(firstArg)) {
    if (method === 'update') {
      call.addArgument('{ where: { companyId }, data: {} }');
    } else {
      call.addArgument('{ where: { companyId } }');
    }
    return true;
  }

  ensureCompanyInObject(firstArg, 'where');
  return true;
}

function processCall(call: CallExpression): boolean {
  if (!isPrismaCall(call)) return false;

  const method = methodName(call);
  if (!method) return false;

  if (method === 'update' || method === 'delete') {
    return convertUpdateDelete(call);
  }

  if (method !== 'findMany' && method !== 'findFirst' && method !== 'create') {
    return false;
  }

  const firstArg = call.getArguments()[0];
  if (!firstArg || !Node.isObjectLiteralExpression(firstArg)) {
    if (method === 'create') {
      call.addArgument('{ data: { companyId } }');
    } else {
      call.addArgument('{ where: { companyId } }');
    }
    return true;
  }

  if (method === 'create') {
    return ensureCompanyInObject(firstArg, 'data');
  }

  return ensureCompanyInObject(firstArg, 'where');
}

async function run() {
  const project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  });

  const files = project.addSourceFilesAtPaths(targetGlob);
  let changedCalls = 0;
  let changedFiles = 0;

  for (const file of files) {
    let fileChanged = false;
    const calls = file.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (const call of calls) {
      if (processCall(call)) {
        changedCalls++;
        fileChanged = true;
      }
    }
    if (fileChanged) {
      changedFiles++;
      file.fixUnusedIdentifiers();
      file.formatText();
    }
  }

  await project.save();
  console.log(`[codemod:tenant] files=${files.length} changedFiles=${changedFiles} changedCalls=${changedCalls}`);
}

run().catch((err) => {
  console.error('[codemod:tenant] failed:', err);
  process.exit(1);
});
