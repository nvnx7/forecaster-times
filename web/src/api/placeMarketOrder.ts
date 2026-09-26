"use client";

import { createSecureClient, OrderSide, OrderType } from "@polymarket/client";
import { signerFrom } from "@polymarket/client/viem";
import { useMutation } from "@tanstack/react-query";
import { polygon } from "viem/chains";
import { useAccount, useWalletClient } from "wagmi";

export type PlaceMarketOrderInput = {
  /** The CLOB token ID for the selected market outcome. */
  assetId: string;
  /** Maximum all-in pUSD spend, including fees. */
  amount: string;
  /** Highest acceptable price per outcome share, from 0 to 1. */
  maxPrice: string;
};

function isPositiveDecimal(value: string) {
  return /^\d+(?:\.\d+)?$/.test(value) && Number(value) > 0;
}

function validateOrder({ assetId, amount, maxPrice }: PlaceMarketOrderInput) {
  if (!assetId.trim())
    throw new Error("A Polymarket outcome token is required.");
  if (!isPositiveDecimal(amount)) {
    throw new Error("Order amount must be a positive pUSD value.");
  }

  if (!isPositiveDecimal(maxPrice) || Number(maxPrice) > 1) {
    throw new Error("Maximum price must be greater than 0 and no more than 1.");
  }
}

/**
 * Places an immediate buy for an outcome using the connected Polygon EOA.
 *
 * This mutation never runs on wallet connection; call `mutate` only after the
 * user explicitly confirms a trade. `amount` is both the all-in spend cap and
 * the requested pre-fee notional, so the SDK reduces the latter if needed to
 * keep fees within the cap.
 */
export function usePlaceMarketOrder() {
  const { address, chainId, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient({ chainId: polygon.id });

  return useMutation({
    mutationFn: async (input: PlaceMarketOrderInput) => {
      if (!isConnected || !address) {
        throw new Error("Connect a wallet before placing an order.");
      }

      if (chainId !== polygon.id) {
        throw new Error("Switch the connected wallet to Polygon to trade.");
      }

      if (!walletClient) {
        throw new Error(
          "Your Polygon wallet is not ready yet. Please try again.",
        );
      }

      validateOrder(input);

      const client = await createSecureClient({
        signer: signerFrom(walletClient),
        wallet: address,
      });

      const response = await client.placeMarketOrder({
        assetId: input.assetId,
        side: OrderSide.BUY,
        amount: input.amount,
        maxSpend: input.amount,
        maxPrice: input.maxPrice,
        orderType: OrderType.FAK,
      });

      if (!response.ok) throw new Error(response.message);
      return response;
    },
  });
}
