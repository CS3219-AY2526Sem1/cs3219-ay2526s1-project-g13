"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Card, CardTitle, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Video, MicOff, VideoOff } from "lucide-react";

export default function CommunicationPanel() {
  const [isMicOn, toggleMic] = useState(false);
  const [isVideoOn, toggleVideo] = useState(false);
  return (
    <Card className="rounded-none min-h-full h-auto w-full flex flex-col">
      {/* Header */}
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Communication</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="default"
            className="w-[100px] h-[35px]"
            onClick={() => toggleMic(!isMicOn)}
          >
            {isMicOn ? <Mic /> : <MicOff />}
          </Button>
          <Button
            variant="default"
            className="w-[100px] h-[35px]"
            onClick={() => toggleVideo(!isVideoOn)}
          >
            {isVideoOn ? <Video /> : <VideoOff />}
          </Button>
        </div>
      </CardHeader>

      <Separator />

      <div className="flex gap-2 flex-1 p-4">
        <div className="flex-1 bg-gray-200 rounded-md h-48 flex items-center justify-center">
          <span className="text-gray-500">User 1</span>
        </div>
        <div className="flex-1 bg-gray-200 rounded-md h-48 flex items-center justify-center">
          <span className="text-gray-500">User 2</span>
        </div>
      </div>
    </Card>
  );
}
