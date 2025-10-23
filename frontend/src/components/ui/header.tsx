/**
 * A minimal top bar (no navigation links)
 * Shown only on public/auth pages (e.g. login, register, forgot password).
 * Use NavBar instead when the user is authenticated.
 */

import * as React from "react";

interface HeaderProps {
  children?: React.ReactNode;
}

export default function Header({ children }: HeaderProps) {
  return (
    <div className="w-full bg-[#20222E] text-white flex items-center justify-between px-4 py-4">
      <h1 className="text-xl font-bold">PeerPrep</h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
