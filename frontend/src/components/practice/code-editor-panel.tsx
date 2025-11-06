"use client";

import { useRef, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Editor } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import * as monaco from "monaco-editor";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import { toast } from "react-toastify";
import { Separator } from "@/components/ui/separator";
import { Card, CardTitle, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCollaborationState, useCollaborationActions } from "@/stores/collaboration-store";
import { ProgrammingLanguage, ConnectionState } from "@/utils/enums";
import { collaborationConfig } from "@/utils/config";

interface CodeEditorPanelProps {
  readOnly?: boolean;
}

const programmingLanguageMonacoMap: Record<ProgrammingLanguage, string> = {
  [ProgrammingLanguage.PYTHON]: "python",
  [ProgrammingLanguage.JAVASCRIPT]: "javascript",
  [ProgrammingLanguage.JAVA]: "java",
  [ProgrammingLanguage.CPP]: "cpp",
};

const programmingLanguageDisplayMap: Record<ProgrammingLanguage, string> = {
  [ProgrammingLanguage.PYTHON]: "Python",
  [ProgrammingLanguage.JAVASCRIPT]: "JavaScript",
  [ProgrammingLanguage.JAVA]: "Java",
  [ProgrammingLanguage.CPP]: "C++",
};

export default function CodeEditorPanel({ readOnly = false }: CodeEditorPanelProps) {
  const params = useParams();
  const roomId = params?.id as string;

  const { roomDetails, documentContent } = useCollaborationState();
  const { changeLanguage, updateLanguage, setSourceCode, setExecutionResult } =
    useCollaborationActions();

  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null);
  const [monacoInstance, setMonacoInstance] = useState<typeof monaco | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED,
  );

  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  const currentLanguage = roomDetails?.programmingLanguage || ProgrammingLanguage.PYTHON;
  const monacoLanguage = programmingLanguageMonacoMap[currentLanguage];

  // Initialize Yjs and WebSocket provider for active rooms
  useEffect(() => {
    if (!roomId || !roomDetails?.isActive || !editorInstance || providerRef.current) {
      return;
    }

    // Get access token
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("Authentication required");
      return;
    }

    // Create Yjs document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Create WebSocket provider with token in URL
    const wsUrl = collaborationConfig.WS_URL;
    const roomWithToken = `${roomId}?token=${accessToken}`;
    const provider = new WebsocketProvider(wsUrl, roomWithToken, ydoc);
    providerRef.current = provider;

    // Create Monaco binding
    const yText = ydoc.getText("monaco");
    const binding = new MonacoBinding(
      yText,
      editorInstance.getModel()!,
      new Set([editorInstance]),
      provider.awareness,
    );
    bindingRef.current = binding;

    // Listen to code changes
    const onTextChange = () => {
      setSourceCode(yText.toString());
    };
    yText.observe(onTextChange);
    onTextChange();

    setConnectionStatus(ConnectionState.CONNECTING);

    // Listen for connection status
    provider.on("status", (event: { status: string }) => {
      if (event.status === ConnectionState.CONNECTED) {
        setConnectionStatus(ConnectionState.CONNECTED);
        toast.success("Connected to collaboration session");
      } else if (event.status === ConnectionState.DISCONNECTED) {
        setConnectionStatus(ConnectionState.DISCONNECTED);
        toast.warn("Disconnected from collaboration session");
      }
    });

    // Listen for custom messages
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data === "string") {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "language-change-notification") {
            const programmingLanguage = message.data.language as ProgrammingLanguage;
            updateLanguage(programmingLanguage);
            toast.info(`Language changed to ${programmingLanguageDisplayMap[programmingLanguage]}`);
          } else if (message.type === "room-close-notification") {
            toast.warn("The collaboration room has been closed");
          } else if (message.type === "code-execution-result") {
            setExecutionResult(message.data);
          }
        } catch {
          // Ignore non-JSON messages (e.g., Yjs updates)
        }
      }
    };
    provider.ws?.addEventListener("message", handleMessage);

    // Cleanup
    return () => {
      yText.unobserve(onTextChange);
      provider.ws?.removeEventListener("message", handleMessage);
      binding.destroy();
      provider.destroy();
      ydoc.destroy();
    };
  }, [
    roomId,
    roomDetails?.isActive,
    editorInstance,
    updateLanguage,
    setSourceCode,
    setExecutionResult,
  ]);

  // Update Monaco language when room language changes
  useEffect(() => {
    if (editorInstance && monacoLanguage && monacoInstance) {
      const model = editorInstance.getModel();
      if (model) {
        monacoInstance.editor.setModelLanguage(model, monacoLanguage);
      }
    }
  }, [editorInstance, monacoLanguage, monacoInstance]);

  // Handle language change from dropdown
  const handleLanguageChange = async (language: ProgrammingLanguage) => {
    if (!roomId || readOnly) return;
    changeLanguage(roomId, language).catch((err) => {
      console.error("Failed to change language:", err);
    });
  };

  // Handle editor mount
  const handleEditorDidMount = (
    editorRef: editor.IStandaloneCodeEditor,
    monacoRef: typeof monaco,
  ) => {
    setEditorInstance(editorRef);
    setMonacoInstance(monacoRef);

    // Set document content for read-only mode
    if (readOnly && documentContent) {
      editorRef.setValue(documentContent);
    }
  };

  // Connection status badge
  const getConnectionBadge = () => {
    if (readOnly || !roomDetails?.isActive) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-500" />
          <span className="text-sm text-muted-foreground">Read-Only</span>
        </div>
      );
    }

    const statusConfig = {
      [ConnectionState.CONNECTING]: { color: "bg-yellow-500", text: "Connecting..." },
      [ConnectionState.CONNECTED]: { color: "bg-green-500", text: "Connected" },
      [ConnectionState.DISCONNECTED]: { color: "bg-red-500", text: "Disconnected" },
      [ConnectionState.RECONNECTING]: { color: "bg-yellow-500", text: "Reconnecting..." },
    };

    const config = statusConfig[connectionStatus];

    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        <span className="text-sm text-muted-foreground">{config.text}</span>
      </div>
    );
  };

  return (
    <Card className="rounded-none min-h-full h-auto w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle>Editor</CardTitle>
            <Select
              value={currentLanguage}
              onValueChange={handleLanguageChange}
              disabled={readOnly}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                <SelectGroup>
                  {Object.values(ProgrammingLanguage).map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {programmingLanguageDisplayMap[lang]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          {getConnectionBadge()}
        </div>
      </CardHeader>
      <Separator />
      <Editor
        height="60vh"
        language={monacoLanguage}
        theme="vs-dark"
        options={{
          readOnly: readOnly,
          fontSize: 14,
        }}
        onMount={handleEditorDidMount}
      />
    </Card>
  );
}
