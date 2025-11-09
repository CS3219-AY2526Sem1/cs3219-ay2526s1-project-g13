"use client";

import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Card, CardTitle, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import AgoraRTC, {
  AgoraRTCProvider,
  LocalVideoTrack,
  RemoteUser,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
} from "agora-rtc-react";
import { useCollaborationActions, useCollaborationStore } from "@/stores/collaboration-store";
import { useAuthContext } from "@/contexts/auth-context";

const client = AgoraRTC.createClient({ codec: "vp8", mode: "rtc" });
const AGORA_APP_ID = "997489f851fa4186a4b9c65bab955777";

function AgoraVideoCall(props: { userId: string | undefined }) {
  const { userId } = props;

  const { roomDetails, agoraToken } = useCollaborationStore();

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // mic, cam
  const { localMicrophoneTrack } = useLocalMicrophoneTrack();
  const { localCameraTrack } = useLocalCameraTrack();

  const remoteUsers = useRemoteUsers();
  console.log(">>> Agora connection: ", remoteUsers.length);

  usePublish([localMicrophoneTrack, localCameraTrack]);

  useJoin(
    {
      appid: AGORA_APP_ID,
      channel: roomDetails?.roomId || "",
      token: agoraToken,
      uid: userId,
    },
    !!agoraToken && !!userId,
  );

  useEffect(() => {
    if (localMicrophoneTrack) {
      localMicrophoneTrack.setEnabled(micOn);
    }
  }, [micOn, localMicrophoneTrack]);

  useEffect(() => {
    if (localCameraTrack) {
      localCameraTrack.setEnabled(camOn);
    }
  }, [camOn, localCameraTrack]);

  return (
    <>
      <div className="flex flex-row gap-2 flex-1 w-full">
        <div className="flex-1 bg-gray-900 rounded-md h-48 flex items-center justify-center relative overflow-hidden">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button
              variant={micOn ? "default" : "destructive"}
              className="w-[50px] h-[35px]"
              onClick={() => setMicOn((prev) => !prev)}
            >
              {micOn ? <Mic /> : <MicOff />}
            </Button>
            <Button
              variant={camOn ? "default" : "destructive"}
              className="w-[50px] h-[35px]"
              onClick={() => setCamOn((prev) => !prev)}
            >
              {camOn ? <Video /> : <VideoOff />}
            </Button>
          </div>
          <span className="text-gray-400 absolute top-2 left-2 z-10 text-xs">
            {userId || "You"}
          </span>
          {camOn ? (
            <LocalVideoTrack
              track={localCameraTrack}
              play={true}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span className="text-gray-500">Camera Off</span>
          )}
        </div>

        <div className="flex-1 bg-gray-900 rounded-md h-48 flex items-center justify-center relative overflow-hidden">
          {remoteUsers.length > 0 ? (
            remoteUsers.map((user) => (
              <div key={user.uid} className="w-full h-full">
                <span className="text-gray-400 absolute top-2 left-2 z-10 text-xs">
                  {user.uid.toString() || "Partner"}
                </span>
                {user.hasVideo ? (
                  <RemoteUser
                    user={user}
                    playAudio={true}
                    playVideo={true}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <>
                    <RemoteUser user={user} playAudio={true} playVideo={false} />
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-500">Camera Off</span>
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <span className="text-gray-500">Waiting...</span>
          )}
        </div>
      </div>
    </>
  );
}

export default function CommunicationPanel() {
  const { roomDetails, agoraToken } = useCollaborationStore();
  const { fetchAgoraToken } = useCollaborationActions();
  const { user } = useAuthContext();
  const userId = user?.username;

  useEffect(() => {
    if (roomDetails?.roomId && userId && !agoraToken) {
      fetchAgoraToken(roomDetails.roomId, userId);
    }
  }, [roomDetails?.roomId, userId, agoraToken, fetchAgoraToken]);

  return (
    <Card className="rounded-none min-h-full h-auto w-full flex flex-col">
      {/* Header */}
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Communication</CardTitle>
      </CardHeader>
      <Separator />

      {/* Video + Chat Section */}
      <CardContent className="flex flex-row gap-4 h-full relative p-2">
        {/* Video Feeds stacked vertically */}
        {AGORA_APP_ID && roomDetails && userId && agoraToken ? (
          <AgoraRTCProvider client={client}>
            <AgoraVideoCall userId={userId} />
          </AgoraRTCProvider>
        ) : (
          <div className="flex items-center justify-center w-full h-48">
            <span className="text-gray-500">Loading video</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
