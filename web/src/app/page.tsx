import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[1600px] flex-col gap-5 px-3 py-4 md:px-5">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[0.6875rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          <span>Vol. I · Issue 001</span>
          <span>New York · Market Open</span>
          <span>Wednesday, XVI September MMXXVI</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="font-mono text-[0.6875rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Dept. of speculative futures
            </p>
            <h1 className="font-heading text-5xl leading-none font-bold tracking-[-0.02em] md:text-7xl">
              Probability Press
            </h1>
          </div>
          <Badge variant="outline">The Morning Issue</Badge>
        </div>
        <div className="flex flex-col gap-0.5" aria-hidden="true">
          <Separator tone="ink" />
          <Separator />
        </div>
        <p className="font-mono text-[0.6875rem] font-medium tracking-[0.08em] text-muted-foreground uppercase">
          Alea Iacta Est, Pretio Demonstrato · The die is cast, price
          demonstrated.
        </p>
      </header>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,7fr)_minmax(0,3fr)]">
        <aside className="flex flex-col gap-4">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Morning Index</CardTitle>
              <CardDescription>
                Implied movements at press time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 font-mono text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">S&amp;P 500</span>
                  <span className="text-positive">+0.74%</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">FED.CUT</span>
                  <span>68.2%</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">GOLD</span>
                  <span>$4,892.10</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Badge variant="secondary">Live Ledger</Badge>
            </CardFooter>
          </Card>
        </aside>

        <article className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[0.6875rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Lead Dispatch · Central Desk
            </p>
            <Badge>High Conviction</Badge>
          </div>
          <Card>
            <CardHeader>
              <CardTitle size="lead">
                The price of a decision is becoming clearer before the decision
                arrives.
              </CardTitle>
              <CardDescription>
                A working proof that every forecast is a market in disguise.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 text-lg leading-7">
                <p>
                  Probability Press is ready for its first issue. The interface
                  is built as a measured newspaper: paper surfaces, mechanical
                  rules, and numbers set apart from narrative.
                </p>
                <p className="text-muted-foreground">
                  This starter establishes the editorial system for the
                  reporting, market ledgers, and verdicts that follow.
                </p>
              </div>
            </CardContent>
            <CardFooter className="justify-between gap-3">
              <span className="font-mono text-[0.6875rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                Read time · 3 min
              </span>
              <Button>Open Dispatch</Button>
            </CardFooter>
          </Card>
        </article>

        <aside className="flex flex-col gap-4">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Active Contract</CardTitle>
              <CardDescription>Federal rate cut by December.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-end justify-between gap-3">
                <span className="font-mono text-3xl font-semibold">68.2%</span>
                <Badge variant="secondary">▲ 1.4%</Badge>
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">
                Liquidity deepens as the market revises its calendar.
              </p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button className="flex-1" variant="outline">
                Yes
              </Button>
              <Button className="flex-1" variant="destructive">
                No
              </Button>
            </CardFooter>
          </Card>
        </aside>
      </section>
    </main>
  );
}
