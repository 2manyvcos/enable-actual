import type { ReactNode } from 'react';

export default function ErrorMessage({ children }: { children: ReactNode }) {
  return <p className="error">{children}</p>;
}
