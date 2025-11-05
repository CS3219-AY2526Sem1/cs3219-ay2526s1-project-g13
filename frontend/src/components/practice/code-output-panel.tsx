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
    <Card className={"rounded-none min-h-full h-auto w-full"}>
      <CardHeader>
        <CardTitle>Output</CardTitle>
      </CardHeader>
      <Separator />
      <Button
        variant={"default"}
        className="w-[100] h-[35] mb-[15] ml-[20]"
        onClick={handleExecute}
        disabled={isExecuting}
      >
        {isExecuting ? <Spinner className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {isExecuting ? "Executing..." : "Execute"}
      </Button>

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
