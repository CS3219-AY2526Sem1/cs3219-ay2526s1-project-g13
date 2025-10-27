"use client";

import { useEffect, useState } from "react";
import { useMatchingStore } from "@/stores/matching-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const TimerOverlay = () => {
  const { isMatching, isRoomPreparing, count, stopQueuing } = useMatchingStore();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (isMatching && count !== null) {
      setTimeLeft(count);
    } else {
      setTimeLeft(null);
    }
  }, [isMatching, count]);

  useEffect(() => {
    if (timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleCancel = () => {
    stopQueuing();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isMatching && timeLeft === null) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <Card className="bg-white shadow-lg border-2 border-blue-200 p-4 min-w-[280px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Sending your match request...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (isRoomPreparing) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <Card className="bg-white shadow-lg border-2 border-green-200 p-4 min-w-[280px]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">
              Match found! Preparing your room...
            </span>
          </div>
        </Card>
      </div>
    );
  }

  if (!isMatching || timeLeft === null) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <Card className="bg-white shadow-lg border-2 border-blue-200 p-4 min-w-[280px]">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Finding a match...</span>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{formatTime(timeLeft)}</div>
            </div>
          </div>

          <div className="ml-4">
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
