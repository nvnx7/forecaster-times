"use client";

import { ConnectKitButton } from "connectkit";

export function ConnectWalletButton() {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show, truncatedAddress }) => (
        <button
          type="button"
          className="h-7 border border-foreground bg-foreground px-3 font-sans text-xs leading-none font-semibold tracking-[0.08em] text-background uppercase transition-colors hover:bg-accent hover:text-foreground"
          onClick={show}
        >
          {isConnected ? truncatedAddress : "Connect wallet"}
        </button>
      )}
    </ConnectKitButton.Custom>
  );
}
