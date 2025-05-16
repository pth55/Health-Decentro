// src/global.d.ts
interface EthereumProvider {
  request(args: { method: string }): Promise<string[]>;
  on(event: "accountsChanged", handler: (accounts: string[]) => void): void;
  removeListener(
    event: "accountsChanged",
    handler: (accounts: string[]) => void
  ): void;
}

interface Window {
  ethereum?: EthereumProvider;
}
