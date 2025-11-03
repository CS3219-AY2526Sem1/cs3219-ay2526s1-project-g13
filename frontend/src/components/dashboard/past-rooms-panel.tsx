"use client";

import { useState, useMemo, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/auth-context";

interface PastRoomsPanelProps {
  rooms: RoomDetails[];
}

// Mock data for difficulty levels - TODO: Fetch from question service
const MOCK_DIFFICULTIES = ["Easy", "Medium", "Hard"];

// Mock data for topics - TODO: Fetch from question service
const MOCK_TOPICS = [
  "String",
  "Algorithms",
  "Data Structures",
  "Databases",
  "Bit Manipulation",
  "Recursion",
  "Arrays",
  "Brainteaser",
];

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

export default function PastRoomsPanel({ rooms }: PastRoomsPanelProps) {
  const router = useRouter();
  const { user } = useAuthContext();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm]);

  const handleViewRoom = (roomId: string) => {
    router.push(`/practice/${roomId}`);
  };

  const getPartnerUsername = (room: RoomDetails): string => {
    if (!user) return "Unknown";
    const partnerUsername = room.userIds.filter((userId) => userId !== user.username);
    return partnerUsername.length > 0 ? partnerUsername[0] : "Unknown";
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (!room.question) {
        return false;
      }

      const matchesDifficulty =
        selectedDifficulty === "all" || room.question.difficulty === selectedDifficulty;

      const matchesTopic = selectedTopic === "all" || room.question.topic === selectedTopic;

      const matchesSearch =
        debouncedSearchTerm === "" ||
        room.question.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      return matchesDifficulty && matchesTopic && matchesSearch;
    });
  }, [rooms, selectedDifficulty, selectedTopic, debouncedSearchTerm]);

  if (rooms.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Past Room History</CardTitle>
          <CardDescription>Your completed practice sessions</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full min-h-[400px]">
          <p className="text-muted-foreground">No past rooms yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Past Room History</CardTitle>
        <CardDescription>Your completed practice sessions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label htmlFor="search-input" className="text-sm font-medium">
              Search:
            </label>
            <Input
              id="search-input"
              type="text"
              placeholder="Search by question title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 max-w-md"
            />
          </div>

          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <label htmlFor="difficulty-filter" className="text-sm font-medium">
                Difficulty:
              </label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger id="difficulty-filter" className="w-[150px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {MOCK_DIFFICULTIES.map((difficulty) => (
                    <SelectItem key={difficulty} value={difficulty}>
                      {difficulty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="topic-filter" className="text-sm font-medium">
                Topic:
              </label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger id="topic-filter" className="w-[180px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {MOCK_TOPICS.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-auto space-y-4">
          {filteredRooms.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No rooms match the selected filters</p>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <Card key={room.roomId} className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Partner: {getPartnerUsername(room)}</CardTitle>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      Completed
                    </span>
                  </div>
                  <CardDescription>
                    {room.question
                      ? room.question.title
                      : room.questionId || "No question assigned"}
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
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => handleViewRoom(room.roomId)}
                    variant="outline"
                    className="w-full"
                  >
                    View Room
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
