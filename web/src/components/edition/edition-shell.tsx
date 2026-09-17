import type { ReactNode } from "react";

export function EditionShell({ children }: { children: ReactNode }) {
  return <main className="edition-viewport">{children}</main>;
}

export function EditionPaper({ children }: { children: ReactNode }) {
  return <article className="edition-paper">{children}</article>;
}
