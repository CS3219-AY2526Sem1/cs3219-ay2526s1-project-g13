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
import { useRouter } from "next/navigation";

interface ActiveRoomsPanelProps {
  rooms: RoomDetails[];
}

const programmingLanguageDisplayMap: Record<ProgrammingLanguage, string> = {
  [ProgrammingLanguage.CPP]: "C++",
  [ProgrammingLanguage.JAVA]: "Java",
  [ProgrammingLanguage.JAVASCRIPT]: "JavaScript",
  [ProgrammingLanguage.PYTHON]: "Python",
};

export default function ActiveRoomsPanel({ rooms }: ActiveRoomsPanelProps) {
  const router = useRouter();

  const handleJoinRoom = (roomId: string) => {
    router.push(`/practice/${roomId}`);
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Active Rooms</CardTitle>
        <CardDescription>Rooms you are currently participating in</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rooms.map((room) => (
          <Card key={room.roomId} className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Room: {room.roomId}</CardTitle>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              <CardDescription>
                {room.question ? room.question.title : room.questionId || "No question assigned"}
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                      <span className="text-sm text-muted-foreground">{room.question.topic}</span>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-sm font-medium">Language: </span>
                  <span className="text-sm text-muted-foreground">
                    {programmingLanguageDisplayMap[room.programmingLanguage]}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Participants: </span>
                  <span className="text-sm text-muted-foreground">{room.userIds.length}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleJoinRoom(room.roomId)} className="w-full">
                Join Room
              </Button>
            </CardFooter>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
