'use client'

import { ChakraProvider } from '@chakra-ui/react';

import '@rainbow-me/rainbowkit/styles.css';

import {
  getDefaultWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import {
  hardhat
} from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient } = configureChains(
  [hardhat],
  [
    publicProvider()
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'My RainbowKit App',
  projectId: 'a82c5eec414267ad0ed76d7282976d96',
  chains
});

const wagmiConfig = createConfig({
  autoConnect: false,
  connectors,
  publicClient
})

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ChakraProvider>
          <WagmiConfig config={wagmiConfig}>
            <RainbowKitProvider chains={chains}>
              {children}
            </RainbowKitProvider>
          </WagmiConfig>
        </ChakraProvider>
      </body>
    </html>
  )
}
