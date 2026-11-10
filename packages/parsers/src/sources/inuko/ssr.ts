import { parse, type AnyNode, type Expression } from 'acorn';
import { ParseError } from '../../errors';
import { parseHtml } from '../../core/html/dom';

/** Read Seroval's literal data and references, never execute the site's scripts. */
export const readInukoSsr = (html: string, sourceId: string) => {
  const fields = new Map<string, Expression>();
  const references = new Map<number, Expression>();
  const values = new Map<number, unknown>();
  const resolving = new Set<number>();
  const fail = (): never => {
    throw new ParseError(`${sourceId}: unsupported or missing SSR data`, sourceId);
  };
  const referenceId = (node: AnyNode): number | null => {
    if (
      node.type === 'MemberExpression' &&
      node.computed &&
      node.object.type === 'Identifier' &&
      node.object.name === '$R' &&
      node.property.type === 'Literal' &&
      typeof node.property.value === 'number'
    ) {
      return node.property.value;
    }
    return null;
  };
  const visit = (node: AnyNode) => {
    if (node.type === 'Property' && node.kind === 'init' && !node.computed) {
      const key = node.key.type === 'Identifier' ? node.key.name : null;
      if (key && !fields.has(key)) fields.set(key, node.value as Expression);
    }
    if (node.type === 'AssignmentExpression' && node.operator === '=') {
      const id = referenceId(node.left);
      if (id !== null) references.set(id, node.right);
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child === 'object' && 'type' in child) visit(child as AnyNode);
        }
      } else if (value && typeof value === 'object' && 'type' in value) {
        visit(value as AnyNode);
      }
    }
  };
  const { $ } = parseHtml(html, sourceId);
  for (const script of $('script').toArray()) {
    const text = $(script).text();
    if (!text.includes('$R[')) continue;
    try {
      visit(parse(text, { ecmaVersion: 'latest' }));
    } catch {
      fail();
    }
  }
  const read = (node: Expression): unknown => {
    switch (node.type) {
      case 'Literal':
        return node.value;
      case 'AssignmentExpression':
        if (node.operator !== '=' || referenceId(node.left) === null) return fail();
        return read(node.right);
      case 'MemberExpression': {
        const id = referenceId(node);
        if (id === null || resolving.has(id)) return fail();
        if (values.has(id)) return values.get(id);
        const value = references.get(id);
        if (!value) return fail();
        resolving.add(id);
        const result = read(value);
        resolving.delete(id);
        values.set(id, result);
        return result;
      }
      case 'ArrayExpression':
        return node.elements.map((item) => {
          if (!item || item.type === 'SpreadElement') return fail();
          return read(item);
        });
      case 'ObjectExpression': {
        const result: Record<string, unknown> = Object.create(null);
        for (const property of node.properties) {
          if (property.type !== 'Property' || property.kind !== 'init' || property.computed)
            return fail();
          const key =
            property.key.type === 'Identifier'
              ? property.key.name
              : property.key.type === 'Literal'
                ? String(property.key.value)
                : fail();
          result[key] = read(property.value as Expression);
        }
        return result;
      }
      case 'UnaryExpression':
        if (node.operator === '!') return !read(node.argument);
        if (node.operator === '-') return -Number(read(node.argument));
        if (node.operator === 'void') return undefined;
        return fail();
      default:
        return fail();
    }
  };
  return <T>(field: string): T => {
    const node = fields.get(field);
    if (!node) return fail();
    return read(node) as T;
  };
};
