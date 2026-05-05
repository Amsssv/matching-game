import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getYSDK } from './ysdk';

type PlayerState =
  | null
  | { isAuthorized: false; name: null; avatarUrl: null }
  | { isAuthorized: true; name: string; avatarUrl: string | null };

const YSDKContext = createContext<YandexGamesSDK | null>(null);

export function YSDKProvider({ children }: { children: ReactNode }) {
  return (
    <YSDKContext.Provider value={getYSDK()}>
      {children}
    </YSDKContext.Provider>
  );
}

export function useYSDK(): YandexGamesSDK | null {
  return useContext(YSDKContext);
}

export function usePlayer(): PlayerState {
  const sdk = useYSDK();
  const [player, setPlayer] = useState<PlayerState>(null);

  useEffect(() => {
    if (!sdk) return;
    sdk.getPlayer({ scopes: false }).then((p) => {
      if (!p.isAuthorized()) {
        setPlayer({ isAuthorized: false, name: null, avatarUrl: null });
      } else {
        const photo = p.getPhoto('small');
        setPlayer({
          isAuthorized: true,
          name: p.getName(),
          avatarUrl: photo || null,
        });
      }
    }).catch(() => {
      setPlayer({ isAuthorized: false, name: null, avatarUrl: null });
    });
  }, [sdk]);

  return player;
}