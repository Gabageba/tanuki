import type { ReactNode } from 'react';
import { Anchor } from '@mantine/core';

const ABSOLUTE_HTTP_URL = /^https?:\/\//i;

const renderChildNodes = (nodes: NodeListOf<ChildNode>): ReactNode[] =>
  Array.from(nodes).map((node, index) => renderNode(node, index));

const renderNode = (node: ChildNode, key: number): ReactNode => {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (!(node instanceof HTMLElement)) return null;

  const children = renderChildNodes(node.childNodes);
  switch (node.tagName) {
    case 'BR':
      return <br key={key} />;
    case 'A': {
      const href = node.getAttribute('href');
      if (!href || !ABSOLUTE_HTTP_URL.test(href)) return children;
      return (
        <Anchor key={key} href={href} target="_blank" rel="noreferrer nofollow">
          {children}
        </Anchor>
      );
    }
    default:
      return children;
  }
};

/** Some sources (mangachan, grouple, nudemoon, sexkomix2 — see their parsers' `getDetails`) keep
 *  the description's own markup as-is instead of stripping it to plain text, so a synopsis can end
 *  with a real `<a>` cross-link to a spin-off/related title. Only `<a>` (absolute http(s) href)
 *  and `<br>` are given real elements — everything else is unwrapped to its text, so this never
 *  needs `dangerouslySetInnerHTML` and can't execute anything the source embeds. */
export const renderDescriptionHtml = (html: string): ReactNode => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return renderChildNodes(doc.body.childNodes);
};
