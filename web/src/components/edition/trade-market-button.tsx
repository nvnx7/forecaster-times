"use client";

import { useModal } from "connectkit";
import { type FormEvent, type ReactNode, useState } from "react";
import { toast } from "sonner";
import { useAccount } from "wagmi";

import { usePlaceMarketOrder } from "@/api/placeMarketOrder";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatProbabilityAsCents } from "@/utils/market-format";
import {
  getMarketTradingStatus,
  type LiveMarketPanel,
} from "@/utils/polymarket-gamma";

type TradeMarketButtonProps = {
  market: LiveMarketPanel;
  outcomeIndex: 0 | 1;
  size: "default" | "sm";
  children: ReactNode;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to place this order.";
}

function isPositiveNumber(value: string) {
  return /^\d+(?:\.\d+)?$/.test(value) && Number(value) > 0;
}

function formatOrderTotal(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function TradeMarketButton({
  market,
  outcomeIndex,
  size,
  children,
}: TradeMarketButtonProps) {
  const { isConnected } = useAccount();
  const { setOpen: setConnectModalOpen } = useModal();
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false);
  const [shares, setShares] = useState("");
  const order = usePlaceMarketOrder();
  const tokenId = market.outcomeTokenIds?.[outcomeIndex];
  const tradingStatus = getMarketTradingStatus(market);
  const label =
    outcomeIndex === 0 ? (market.yesLabel ?? "Yes") : (market.noLabel ?? "No");
  const price = outcomeIndex === 0 ? market.yes : market.no;
  const shareCount = Number(shares);
  const estimatedTotal = isPositiveNumber(shares) ? shareCount * price : 0;
  const maxPrice = Math.min(1, price + 0.02);
  const canSubmit =
    Boolean(tokenId) &&
    isPositiveNumber(shares) &&
    price > 0 &&
    estimatedTotal >= 0.01;

  function openTrade() {
    if (tradingStatus) return;

    if (!isConnected) {
      setConnectModalOpen(true);
      return;
    }

    setIsTradeDialogOpen(true);
  }

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tokenId || !canSubmit) return;

    try {
      await order.mutateAsync({
        assetId: tokenId,
        amount: estimatedTotal.toFixed(2),
        maxPrice: maxPrice.toFixed(2),
      });
      toast.success(`${label} order submitted.`);
      setIsTradeDialogOpen(false);
      setShares("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="marketQuote"
        size={size}
        onClick={openTrade}
        disabled={Boolean(tradingStatus)}
      >
        {children}
      </Button>
      <Dialog open={isTradeDialogOpen} onOpenChange={setIsTradeDialogOpen}>
        <DialogContent className="max-w-md gap-0 border-2 border-foreground bg-background p-0 shadow-none">
          <DialogHeader className="gap-3 p-6 pb-5">
            <p className="font-sans text-[0.625rem] font-semibold tracking-[0.16em] text-destructive uppercase">
              Market Order
            </p>
            <DialogTitle className="text-3xl leading-[0.95] font-semibold">
              Buy {label}
            </DialogTitle>
            <DialogDescription className="font-sans text-base leading-snug text-foreground">
              {market.question}
            </DialogDescription>
          </DialogHeader>
          <Separator className="bg-foreground" />
          <form className="flex flex-col gap-5 p-6" onSubmit={placeOrder}>
            <FieldGroup>
              <Field>
                <FieldLabel
                  htmlFor={`shares-${market.marketId}-${outcomeIndex}`}
                >
                  Number of shares
                </FieldLabel>
                <Input
                  id={`shares-${market.marketId}-${outcomeIndex}`}
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={shares}
                  onChange={(event) => setShares(event.target.value)}
                  placeholder="0"
                  aria-invalid={shares.length > 0 && !isPositiveNumber(shares)}
                />
                <FieldDescription>
                  {isPositiveNumber(shares)
                    ? `Estimated total: ${formatOrderTotal(estimatedTotal)} at ${formatProbabilityAsCents(price)} per share; execution is capped at ${formatProbabilityAsCents(maxPrice)}.`
                    : "Enter shares to calculate your estimated total."}
                </FieldDescription>
              </Field>
            </FieldGroup>
            {!tokenId ? (
              <p className="font-sans text-xs text-muted-foreground">
                Live market data is still loading. Try again in a moment.
              </p>
            ) : null}
            <DialogFooter className="-mx-6 -mb-6 rounded-none border-foreground bg-paper-inset p-4">
              <Button
                type="submit"
                variant="marketTrade"
                disabled={!canSubmit || order.isPending}
              >
                {order.isPending ? "Submitting…" : `Buy ${label}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
