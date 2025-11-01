"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Header from "@/components/ui/header";
import QuestionPanel from "@/components/practice/question-panel";
import CommunicationPanel from "@/components/practice/communication-panel";
import CodeOutputPanel from "@/components/practice/code-output-panel";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCollaborationState, useCollaborationActions } from "@/stores/collaboration-store";
import ProtectedRoute from "@/components/auth/protected-route";

const CodeEditorPanel = dynamic(() => import("@/components/practice/code-editor-panel"), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center">Loading editor...</div>,
});

export default function PracticePage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params?.id as string;

  const { roomDetails, isLoading, error } = useCollaborationState();
  const { fetchRoomDetails, reset } = useCollaborationActions();

  // Fetch room details on mount
  useEffect(() => {
    if (roomId) {
      fetchRoomDetails(roomId).catch((err) => {
        console.error("Failed to fetch room details:", err);
      });
    }

    // Cleanup on unmount
    return () => {
      reset();
    };
  }, [fetchRoomDetails, reset, roomId]);

  // Handle leave session
  const handleLeaveSession = () => {
    // Simply redirect to home page
    router.push("/");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner />
          <p className="text-muted-foreground">Loading collaboration room...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !roomDetails) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-destructive font-semibold">Failed to load room</p>
          <p className="text-muted-foreground">{error || "Room not found"}</p>
          <Button onClick={() => router.push("/")}>Go Back Home</Button>
        </div>
      </div>
    );
  }

  // Read-only mode (room is closed)
  const isReadOnly = !roomDetails.isActive;

  return (
    <ProtectedRoute>
      <div className="h-screen w-full flex flex-col">
        <Header>
          <div className="flex items-center gap-4">
            <Button variant={"destructive"} onClick={handleLeaveSession}>
              Leave Room
            </Button>
          </div>
        </Header>

        <div className="flex-1">
          {isReadOnly ? (
            // Read-only layout: Only question and read-only code editor
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
              {/* Left Panel */}
              <ResizablePanel>
                <div className="h-full overflow-y-auto">
                  <QuestionPanel />
                </div>
              </ResizablePanel>

              <ResizableHandle className="bg-gray-400 hover:bg-gray-600 w-1 cursor-col-resize" />

              {/* Right Panel */}
              <ResizablePanel>
                <div className="h-full overflow-y-auto">
                  <CodeEditorPanel readOnly={true} />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            // Full layout with all panels
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
                      <CodeEditorPanel readOnly={false} />
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
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
