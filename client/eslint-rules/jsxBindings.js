// ESLint's core no-undef does not resolve JSX tag names.
export default {
  meta: { type: 'problem', schema: [], messages: { missing: 'JSX component {{name}} is not defined. Import or declare it before use.' } },
  create(context) {
    return {
      JSXOpeningElement(node) {
        let tag = node.name;
        while (tag.type === 'JSXMemberExpression') tag = tag.object;
        if (tag.type !== 'JSXIdentifier' || !/^[A-Z]/.test(tag.name)) return;
        let scope = context.sourceCode.getScope(node);
        while (scope) {
          if (scope.set.has(tag.name)) return;
          scope = scope.upper;
        }
        context.report({ node: tag, messageId: 'missing', data: { name: tag.name } });
      },
    };
  },
};
