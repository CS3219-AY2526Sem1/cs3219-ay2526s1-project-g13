"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { DIFFICULTY } from "@/utils/enums";
import { useMatchingState, useMatchingActions } from "@/stores/matching-store";
import { useAuth } from "@/hooks/use-auth";
import { clsx } from "clsx";
import { LeafIcon, FlameIcon, LightningIcon } from "./difficulty-icons";
import { topics } from "./topic-icons";

const MatchMake = () => {
  const { refreshToken } = useAuth();
  const { isMatching, selectedTopic } = useMatchingState();
  const { startMatch, setSelectedTopic } = useMatchingActions();
  const [selectedDifficulty, setSelectedDifficulty] = useState<DIFFICULTY>(DIFFICULTY.EASY);

  const chunkTopics = (topicList: typeof topics, size: number) => {
    const chunks = [];
    for (let i = 0; i < topicList.length; i += size) {
      chunks.push(topicList.slice(i, i + size));
    }
    return chunks;
  };

  const topicChunks = chunkTopics(topics, 8);

  const findMatch = async () => {
    await refreshToken(() => startMatch(selectedDifficulty, selectedTopic || undefined));
  };

  if (isMatching) {
    return (
      <div className="max-w-4xl mx-auto px-6 pt-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#20222E] mb-4">
            Finding your practice partner...
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Please wait while we search for a match. You can navigate to other pages while waiting.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-blue-800">
              💡 The timer will stay visible on all pages until a match is found or you cancel the
              search.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6">
      {/* Main Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#20222E] mb-2">Find your practice partner</h1>
        <p className="text-lg text-gray-600">
          Connect with peers to practice technical interviews together
        </p>
      </div>

      {/* Main Card */}
      <Card className="bg-white p-8 rounded-2xl shadow-lg">
        {/* Difficulty Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[#20222E] mb-4">Select difficulty level</h2>
          <div className="flex gap-4 justify-between">
            {Object.values(DIFFICULTY).map((difficulty) => {
              const isSelected = selectedDifficulty === difficulty;
              const getIcon = () => {
                switch (difficulty) {
                  case DIFFICULTY.EASY:
                    return (
                      <>
                        <LeafIcon />
                      </>
                    );
                  case DIFFICULTY.MEDIUM:
                    return <FlameIcon />;
                  case DIFFICULTY.HARD:
                    return <LightningIcon />;
                  default:
                    return null;
                }
              };

              return (
                <button
                  key={difficulty}
                  onClick={() => setSelectedDifficulty(difficulty)}
                  disabled={isMatching}
                  className={clsx(
                    "w-80 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all",
                    {
                      "bg-[#4A5568] text-white": isSelected,
                      "bg-gray-100 text-gray-700 hover:bg-gray-200": !isSelected,
                      "opacity-50 cursor-not-allowed": isMatching,
                    },
                  )}
                >
                  {getIcon()}
                  {difficulty.charAt(0) + difficulty.slice(1).toLowerCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Topic Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[#20222E] mb-4">Choose Topic</h2>
          <div className="relative">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {topicChunks.map((chunk, chunkIndex) => (
                  <CarouselItem key={chunkIndex} className="pl-2 md:pl-4">
                    <div className="grid grid-cols-4 gap-3">
                      {chunk.map((topic: (typeof topics)[0]) => {
                        const IconComponent = topic.icon;
                        const isSelected = selectedTopic === topic.id;

                        return (
                          <button
                            key={topic.id}
                            onClick={() => setSelectedTopic(topic.id)}
                            disabled={isMatching}
                            className={clsx("p-3 rounded-lg text-center transition-all", {
                              "bg-blue-50 border-2 border-blue-500": isSelected,
                              "bg-white border border-gray-200 hover:border-gray-300": !isSelected,
                              "opacity-50 cursor-not-allowed": isMatching,
                            })}
                          >
                            <div className="flex justify-center mb-2">
                              <IconComponent />
                            </div>
                            <p className="text-xs font-medium text-gray-700 leading-tight">
                              {topic.name}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0 bg-[#20222E] text-white hover:bg-gray-700 border-none" />
              <CarouselNext className="right-0 bg-[#20222E] text-white hover:bg-gray-700 border-none" />
            </Carousel>
          </div>
        </div>

        <div className="text-center">
          <Button
            onClick={findMatch}
            disabled={isMatching}
            className={clsx("px-8 py-3 rounded-lg font-medium transition-colors", {
              "bg-[#20222E] text-white hover:bg-gray-700": !isMatching,
              "bg-gray-400 text-gray-200 cursor-not-allowed": isMatching,
            })}
          >
            {isMatching ? "Searching..." : "Find your practice partner"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default MatchMake;
