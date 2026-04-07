import clsx from 'clsx';
import { useState, type ReactNode } from 'react';

export default function Section({
  collapsible,
  collapsed: defaultCollapsed = true,
  header,
  children,
}: {
  collapsible?: boolean;
  collapsed?: boolean;
  header: ReactNode;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="section">
      <a
        className={clsx('header', { collapsible, collapsed })}
        onClick={() => {
          setCollapsed((prev) => !prev);
        }}
      >
        <h1>{header}</h1>
      </a>

      {collapsible && collapsed ? null : children}
    </div>
  );
}
