import { Anchor, Breadcrumbs as MantineBreadcrumbs } from '@mantine/core';
import { Link } from 'react-router';
import type { ReactNode } from 'react';

export type BreadcrumbItem = {
  label: ReactNode;
  to?: string;
};

type Props = {
  items: BreadcrumbItem[];
};

function Breadcrumbs({ items }: Props) {
  return (
    <MantineBreadcrumbs mb="md">
      {items.map((item, index) =>
        item.to ? (
          <Anchor key={index} component={Link} to={item.to}>
            {item.label}
          </Anchor>
        ) : (
          <span key={index}>{item.label}</span>
        ),
      )}
    </MantineBreadcrumbs>
  );
}

export default Breadcrumbs;
