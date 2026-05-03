/**
 * Plugin ESLint COZINCA — regras locais para o ERP.
 * Carregar em `eslint.config.*` como: `plugins: { coerp: require('./lint-rules/coerp-eslint-plugin.cjs') }`
 */
const noConsoleLog = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Evitar console.log — usar apenas console.warn/console.error onde necessário, ou remover.' },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        const c = node.callee;
        if (
          c &&
          c.type === 'MemberExpression' &&
          c.object &&
          c.object.type === 'Identifier' &&
          c.object.name === 'console' &&
          c.property &&
          c.property.type === 'Identifier' &&
          c.property.name === 'log'
        ) {
          context.report({
            node,
            message:
              '[COZINCA] Não usar console.log no código persistido — use serviços de logging ou remova antes do merge.',
          });
        }
      },
    };
  },
};

module.exports = {
  meta: { name: 'eslint-plugin-coerp', version: '1.0.0' },
  rules: {
    'no-console-log': noConsoleLog,
  },
};
