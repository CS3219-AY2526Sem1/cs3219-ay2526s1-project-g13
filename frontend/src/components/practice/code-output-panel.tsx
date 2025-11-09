import * as React from "react";
import { Separator } from "@/components/ui/separator";
import { Card, CardTitle, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useCollaborationState, useCollaborationActions } from "@/stores/collaboration-store";
import { Spinner } from "../ui/spinner";

export default function CodeOutputPanel() {
  // get State and Action from Store
  const { isExecuting, executionResult } = useCollaborationState();
  const { submitCode } = useCollaborationActions();

  const handleExecute = () => {
    submitCode();
  };

  return (
    <Card className={"rounded-none min-h-full h-auto w-full flex flex-col"}>
      <CardHeader className="flex flex-row items-center justify-between p-4 sticky top-0 z-10 bg-white">
        <CardTitle>Output</CardTitle>
        <Button variant={"default"} className="w-28" onClick={handleExecute} disabled={isExecuting}>
          {isExecuting ? <Spinner className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isExecuting ? "Executing..." : "Execute"}
        </Button>
      </CardHeader>
      <Separator />

      <CardContent className="min-h-full h-auto w-full">
        <pre
          style={{
            color: executionResult
              ? executionResult?.isError
                ? "var(--destructive)"
                : "#22c55e"
              : "inherit",
            whiteSpace: "pre-wrap",
            fontFamily: "var(--font-geist-mono)",
          }}
        >
          {executionResult ? executionResult.output : "Click 'Execute' to run your code."}
        </pre>
      </CardContent>
    </Card>
  );
}
