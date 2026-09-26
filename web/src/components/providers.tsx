"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { type ReactNode, useState } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { polygon } from "wagmi/chains";

import { Toaster } from "@/components/ui/sonner";

const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: "Forecaster Times",
    appDescription: "The news, priced in.",
    ssr: true,
    chains: [polygon],
    transports: { [polygon.id]: http() },
    enableAaveAccount: false,
    walletConnectProjectId: "",
  }),
);

const connectKitTheme = {
  "--ck-font-family": "var(--font-sans)",
  "--ck-border-radius": "0px",
  "--ck-connectbutton-border-radius": "0px",
  "--ck-connectbutton-font-size": "0.6875rem",
  "--ck-connectbutton-color": "#221b0b",
  "--ck-connectbutton-background": "transparent",
  "--ck-connectbutton-box-shadow": "inset 0 0 0 1px #221b0b",
  "--ck-connectbutton-hover-color": "#221b0b",
  "--ck-connectbutton-hover-background": "#fff8e8",
  "--ck-connectbutton-active-background": "#e7d8bf",
  "--ck-primary-button-color": "#221b0b",
  "--ck-primary-button-background": "transparent",
  "--ck-primary-button-box-shadow": "inset 0 0 0 1px #c9b186",
  "--ck-primary-button-border-radius": "0px",
  "--ck-primary-button-hover-border-radius": "0px",
  "--ck-primary-button-active-border-radius": "0px",
  "--ck-primary-button-hover-color": "#221b0b",
  "--ck-primary-button-hover-background": "#fff8e8",
  "--ck-secondary-button-color": "#221b0b",
  "--ck-secondary-button-background": "transparent",
  "--ck-secondary-button-box-shadow": "inset 0 0 0 1px #c9b186",
  "--ck-secondary-button-border-radius": "0px",
  "--ck-secondary-button-hover-background": "#fff8e8",
  "--ck-tertiary-border-radius": "0px",
  "--ck-body-color": "#221b0b",
  "--ck-body-color-muted": "#59554f",
  "--ck-body-background": "#fff0d6",
  "--ck-body-background-secondary": "#fff8e8",
  "--ck-body-background-tertiary": "#e7d8bf",
  "--ck-body-divider": "#c9b186",
  "--ck-modal-box-shadow": "none",
  "--ck-overlay-background": "rgba(34, 27, 11, 0.35)",
  "--ck-focus-color": "#a82c1b",
} as const;

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="minimal"
          customTheme={connectKitTheme}
          options={{
            hideNoWalletCTA: true,
            hideQuestionMarkCTA: true,
          }}
        >
          {children}
          <Toaster position="top-center" />
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
