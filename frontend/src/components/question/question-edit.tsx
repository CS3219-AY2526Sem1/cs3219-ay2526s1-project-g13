"use client";
import { CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Question } from "@/types/question";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EditQuestionProps = {
  question: Question;
  setQuestion: (q: Question) => void;
};

export function QuestionEdit({ question, setQuestion }: EditQuestionProps) {
  return (
    <>
      <CardHeader className="flex-col gap-2">
        <div>
          <Label htmlFor="title">Question Title</Label>
          <Input
            id="title"
            className="w-full border rounded p-1 mt-2"
            value={question.title}
            onChange={(e) => setQuestion({ ...question, title: e.target.value })}
          />
        </div>

        <div className="flex gap-2">
          <div>
            <Label htmlFor="topic" className="mt-2 mb-2">
              Topic
            </Label>
            <Input
              id="topic"
              className="flex-1 border rounded p-1"
              value={question.topic}
              onChange={(e) => setQuestion({ ...question, topic: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="difficulty" className="mt-2 mb-2">
              Difficulty
            </Label>
            <Select
              value={question.difficulty}
              onValueChange={(value) =>
                setQuestion({ ...question, difficulty: value as Question["difficulty"] })
              }
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Label htmlFor="details" className="mt-2 mb-2">
          Question Details
        </Label>
        <textarea
          className="w-full border rounded p-2"
          value={question.details}
          onChange={(e) => setQuestion({ ...question, details: e.target.value })}
        />
      </CardContent>

      <CardContent>
        <Label htmlFor="suggestedSolution" className="mt-2 mb-2">
          Suggested Solution
        </Label>
        <textarea
          className="w-full border rounded p-2"
          value={question.suggestedSolution}
          onChange={(e) => setQuestion({ ...question, suggestedSolution: e.target.value })}
        />
      </CardContent>
    </>
  );
}
