import { createContext, type ReactNode } from 'react';
import { getYSDK } from './ysdk';

const YSDKContext = createContext<YandexGamesSDK | null>(null);

export function YSDKProvider({ children }: { children: ReactNode }) {
  return (
    <YSDKContext.Provider value={getYSDK()}>
      {children}
    </YSDKContext.Provider>
  );
}