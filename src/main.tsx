import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import { baseSepolia } from 'viem/chains';
import App from './App';
import './styles.css';

// Public Privy App ID (not a secret). No app secret is used anywhere in this client.
export const PRIVY_APP_ID = 'cmuknpmjm00c40di9z0o6odyl';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email'],
        appearance: { theme: 'light', accentColor: '#111111', showWalletLoginFirst: false },
        embeddedWallets: {
          ethereum: { createOnLogin: 'users-without-wallets' },
          showWalletUIs: false,
        },
        defaultChain: baseSepolia,
        supportedChains: [baseSepolia],
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>,
);
