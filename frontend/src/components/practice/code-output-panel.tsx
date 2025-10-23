import * as React from "react";
import { Separator } from "@/components/ui/separator";
import { Card, CardTitle, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export default function CodeOutputPanel() {
  return (
    <Card className={"rounded-none min-h-full h-auto w-full"}>
      <CardHeader>
        <CardTitle>Output</CardTitle>
      </CardHeader>
      <Separator />
      <Button variant={"default"} className="w-[100] h-[35] mb-[15] ml-[20]">
        <Play /> Execute
      </Button>

      <CardContent className="min-h-full h-auto w-full">Output</CardContent>
    </Card>
  );
}
