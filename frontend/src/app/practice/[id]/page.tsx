"use client";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Header from "@/components/ui/header";
import QuestionPanel from "@/components/practice/question-panel";
import CodeEditorPanel from "@/components/practice/code-editor-panel";
import CommunicationPanel from "@/components/practice/communication-panel";
import CodeOutputPanel from "@/components/practice/code-output-panel";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function PracticePage() {
  const router = useRouter();
  const navigateToHome = () => {
    router.push("/");
  };
  return (
    <div className="h-screen w-full flex flex-col">
      <Header>
        <Button variant={"destructive"} onClick={navigateToHome}>
          Leave Session
        </Button>
      </Header>

      <div className="flex-1">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          {/* Left Panel */}
          <ResizablePanel>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel>
                <div className="h-full overflow-y-auto">
                  <QuestionPanel />
                </div>
              </ResizablePanel>
              <ResizableHandle className="bg-gray-400 hover:bg-gray-600 w-1 cursor-col-resize" />
              <ResizablePanel>
                <div className="h-full overflow-y-auto">
                  <CommunicationPanel />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle className="bg-gray-400 hover:bg-gray-600 w-1 cursor-col-resize" />

          {/* Right Panel */}
          <ResizablePanel>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel>
                <div className="h-full overflow-y-auto">
                  <CodeEditorPanel />
                </div>
              </ResizablePanel>
              <ResizableHandle className="bg-gray-400 hover:bg-gray-600 w-1 cursor-col-resize" />
              <ResizablePanel>
                <div className="h-full overflow-y-auto">
                  <CodeOutputPanel />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
