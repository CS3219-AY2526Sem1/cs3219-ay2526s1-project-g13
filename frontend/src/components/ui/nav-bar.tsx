"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import LogoutButton from "../auth/logout-button";
import { useAuthContext } from "@/contexts/auth-context";

export default function Navbar() {
  const { isAuthenticated } = useAuthContext();

  return (
    <div className="w-full h-16 bg-[#20222E] text-white flex items-center justify-between px-4 py-2">
      <h1 className="text-xl font-bold">PeerPrep</h1>
      {isAuthenticated && (
        <nav className="px-4 py-2">
          <NavigationMenu>
            <NavigationMenuList className="flex gap-4">
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/">Home</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/matching">Practice</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/account">Account</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <LogoutButton />
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </nav>
      )}
    </div>
  );
}
