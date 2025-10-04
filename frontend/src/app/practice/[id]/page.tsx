"use client";

import { useParams } from "next/navigation";
import Header from "@/components/ui/header";
import { Button } from "@/components/ui/button";

export default function AccountPage() {
  const { id } = useParams();
  console.log("Room ID from URL:", id);

  return (
    <div>
      <Header />
      <Button>Leave Session</Button>
    </div>
  );
}
