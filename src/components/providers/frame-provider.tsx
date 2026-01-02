'use client'

import { sdk } from "@farcaster/miniapp-sdk";
import { createContext, useContext, useEffect, useState } from "react";

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface MiniAppClient {
  platformType?: 'web' | 'mobile';
  clientFid: number;
  added: boolean;
  safeAreaInsets?: SafeAreaInsets;
  notificationDetails?: {
    url: string;
    token: string;
  };
}

export interface MiniAppUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

export interface MiniAppContext {
  user: MiniAppUser;
  location?: Record<string, unknown>;
  client: MiniAppClient;
}

export type FrameContextType = {
  /** Typed user object - null if not in mini app or failed to load */
  user: MiniAppUser | null;
  /** Typed client object - null if not in mini app or failed to load */
  client: MiniAppClient | null;
  /** Whether we're running inside a Farcaster mini app */
  isInMiniApp: boolean;
  /** Raw context for anything not covered by typed fields */
  rawContext: MiniAppContext | Record<string, unknown> | null;
};

// Helper to check if raw context is a valid MiniAppContext
function isMiniAppContext(context: unknown): context is MiniAppContext {
  return context !== null && 
    typeof context === 'object' && 
    'user' in context && 
    typeof (context as MiniAppContext).user?.fid === 'number';
}

const defaultContext: FrameContextType = {
  user: null,
  client: null,
  isInMiniApp: false,
  rawContext: null,
};

const FrameContext = createContext<FrameContextType>(defaultContext);

export const useFrameContext = () => useContext(FrameContext);

export default function FrameProvider({ children }: { children: React.ReactNode }){
  const [frameContext, setFrameContext] = useState<FrameContextType>(defaultContext);

  useEffect(() => {
    const init = async () => {
      try {
        const context = await sdk.context;
        sdk.actions.ready();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const isInMiniApp = await sdk.isInMiniApp();
        
        // Extract typed values if context is valid
        if (isMiniAppContext(context)) {
          setFrameContext({
            user: context.user,
            client: context.client,
            isInMiniApp,
            rawContext: context,
          });
        } else {
          setFrameContext({
            user: null,
            client: null,
            isInMiniApp,
            rawContext: context,
          });
        }
        
      } catch {
        setFrameContext({ 
          user: null,
          client: null,
          isInMiniApp: false,
          rawContext: { error: 'Failed to initialize' },
        });
      }
    }
    
    init();
  }, [])

  return(
    <FrameContext.Provider value={frameContext}>
      {children}
    </FrameContext.Provider>
  );
}
