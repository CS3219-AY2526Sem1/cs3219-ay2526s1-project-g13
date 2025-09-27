"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Navbar() {
  return (
    <div className="w-full bg-[#20222E] text-white flex items-center justify-between px-4 py-2">
      <h1 className="text-xl font-bold">PeerPrep</h1>
      <nav className="px-4 py-2">
        <NavigationMenu>
          <NavigationMenuList className="flex gap-4">
            {/* Home Link */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/">Home</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Practice Link */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/practice">Practice</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Account Link */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/account">Account</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Logout Button */}
            <NavigationMenuItem>
              <Button
                variant="secondary"
                className="text-black"
                onClick={() => {
                  // Handle logout logic here
                  console.log("Logout clicked");
                }}
              >
                Logout
              </Button>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </nav>
    </div>
  );
}
