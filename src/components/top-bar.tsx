"use client";

import Image from "next/image";
import { useFrameContext } from "~/components/providers/frame-provider";
import { sdk } from "@farcaster/miniapp-sdk";

export function TopBar() {
  const { user } = useFrameContext();

  const handleProfileClick = () => {
    if (user?.fid) {
      sdk.actions.viewProfile({ fid: user.fid });
    }
  };

  return (
    <div className="mb-6 mt-3 flex items-center justify-between">
      <Image 
        src="/base-logo.png" 
        alt="Base" 
        width={120}
        height={32}
        className="h-8 object-contain"
      />
      
      {user?.pfpUrl && (
        <button
          onClick={handleProfileClick}
          className="flex-shrink-0"
        >
          <Image
            src={user.pfpUrl}
            alt="Profile"
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
          />
        </button>
      )}
    </div>
  );
}
