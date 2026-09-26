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
  "--ck-connectbutton-color": "#241b0f",
  "--ck-connectbutton-background": "transparent",
  "--ck-connectbutton-box-shadow": "inset 0 0 0 1px #241b0f",
  "--ck-connectbutton-hover-color": "#241b0f",
  "--ck-connectbutton-hover-background": "#f8e8c9",
  "--ck-connectbutton-active-background": "#e1c89d",
  "--ck-primary-button-color": "#241b0f",
  "--ck-primary-button-background": "transparent",
  "--ck-primary-button-box-shadow": "inset 0 0 0 1px #9f855e",
  "--ck-primary-button-border-radius": "0px",
  "--ck-primary-button-hover-border-radius": "0px",
  "--ck-primary-button-active-border-radius": "0px",
  "--ck-primary-button-hover-color": "#241b0f",
  "--ck-primary-button-hover-background": "#f8e8c9",
  "--ck-secondary-button-color": "#241b0f",
  "--ck-secondary-button-background": "transparent",
  "--ck-secondary-button-box-shadow": "inset 0 0 0 1px #9f855e",
  "--ck-secondary-button-border-radius": "0px",
  "--ck-secondary-button-hover-background": "#f8e8c9",
  "--ck-tertiary-border-radius": "0px",
  "--ck-body-color": "#241b0f",
  "--ck-body-color-muted": "#675a46",
  "--ck-body-background": "#fff0d6",
  "--ck-body-background-secondary": "#f8e8c9",
  "--ck-body-background-tertiary": "#e1c89d",
  "--ck-body-divider": "#9f855e",
  "--ck-modal-box-shadow": "none",
  "--ck-overlay-background": "rgba(36, 27, 15, 0.4)",
  "--ck-focus-color": "#993b2d",
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
