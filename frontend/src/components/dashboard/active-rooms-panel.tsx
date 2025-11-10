"use client";

import { RoomDetails } from "@/lib/api-client";
import { ProgrammingLanguage } from "@/utils/enums";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/auth-context";
import { useMatchingStore } from "@/stores/matching-store";

interface ActiveRoomsPanelProps {
  rooms: RoomDetails[];
}

const programmingLanguageDisplayMap: Record<ProgrammingLanguage, string> = {
  [ProgrammingLanguage.CPP]: "C++",
  [ProgrammingLanguage.JAVA]: "Java",
  [ProgrammingLanguage.JAVASCRIPT]: "JavaScript",
  [ProgrammingLanguage.PYTHON]: "Python",
};

const formatDate = (date: Date | null): string => {
  if (!date) return "Unknown";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ActiveRoomsPanel({ rooms }: ActiveRoomsPanelProps) {
  const router = useRouter();
  const { user } = useAuthContext();
  const isMatching = useMatchingStore((state) => state.isMatching);
  const isRoomPreparing = useMatchingStore((state) => state.isRoomPreparing);

  const handleJoinRoom = (roomId: string) => {
    router.push(`/practice/${roomId}`);
  };

  const getPartnerUsername = (room: RoomDetails): string => {
    if (!user) return "Unknown";
    const partnerUsername = room.userIds.filter((userId) => userId !== user.username);
    return partnerUsername.length > 0 ? partnerUsername[0] : "Unknown";
  };

  if (rooms.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Active Rooms</CardTitle>
          <CardDescription>Rooms you are currently participating in</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full min-h-[400px]">
          <p className="text-muted-foreground">No active rooms at the moment</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Active Rooms</CardTitle>
        <CardDescription>Rooms you are currently participating in</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {rooms.map((room) => (
            <Card key={room.roomId} className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Partner: {getPartnerUsername(room)}</CardTitle>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                <CardDescription className="flex items-center gap-2">
                  {room.question ? room.question.title : room.questionId || "No question assigned"}
                  {room.question?.status === "Archived" && (
                    <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                      Archived
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    {room.question && (
                      <>
                        <div>
                          <span className="text-sm font-medium">Difficulty: </span>
                          <span className="text-sm text-muted-foreground">
                            {room.question.difficulty}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Topic: </span>
                          <span className="text-sm text-muted-foreground">
                            {room.question.topic}
                          </span>
                        </div>
                      </>
                    )}
                    <div>
                      <span className="text-sm font-medium">Language: </span>
                      <span className="text-sm text-muted-foreground">
                        {programmingLanguageDisplayMap[room.programmingLanguage]}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {room.createdAt && (
                      <div>
                        <span className="text-sm font-medium">Created At: </span>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(room.createdAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleJoinRoom(room.roomId)}
                  className="w-full"
                  disabled={isMatching || isRoomPreparing}
                >
                  Join Room
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
