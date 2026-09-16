import type { ReactNode } from "react";

export function EditionShell({ children }: { children: ReactNode }) {
  return (
    <main className="edition-viewport">
      <article className="edition-paper">{children}</article>
    </main>
  );
}
