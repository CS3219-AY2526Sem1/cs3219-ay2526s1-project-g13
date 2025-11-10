"use client";
import { useState } from "react";
import { CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Question } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { editQuestion } from "@/hooks/use-question";
import TopicSelect from "./topic-select";

type EditQuestionProps = {
  question: Question;
  setQuestion: (q: Question) => void;
  onCancel: () => void;
  onSaveChanges: () => void;
};

export function QuestionEdit({
  question,
  setQuestion,
  onCancel,
  onSaveChanges,
}: EditQuestionProps) {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!question.title.trim()) newErrors.title = "Title is required";
    if (!question.topic.trim()) newErrors.topic = "Topic is required";
    if (!question.difficulty.trim()) newErrors.difficulty = "Difficulty is required";
    if (!question.description?.trim()) newErrors.details = "Question details is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      console.log(question);
      const response = await editQuestion(question);
      console.log(response);
      onSaveChanges();
    } catch (error) {
      console.error("Failed to save question:", error);
    }
  };

  return (
    <form onSubmit={handleSaveChanges}>
      <CardHeader className="flex-col gap-2">
        <div>
          <Label htmlFor="title">Question Title</Label>
          <Input
            id="title"
            className="w-full border rounded p-1 mt-2"
            value={question.title}
            onChange={(e) => setQuestion({ ...question, title: e.target.value })}
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        <div className="flex gap-2">
          <div>
            <Label htmlFor="topic" className="mt-2 mb-2">
              Topic
            </Label>
            <TopicSelect
              value={question.topic}
              onChange={(val) => setQuestion({ ...question, topic: val })}
            />
            {errors.topic && <p className="text-red-500 text-sm mt-1">{errors.topic}</p>}
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
            {errors.difficulty && <p className="text-red-500 text-sm mt-1">{errors.difficulty}</p>}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Label htmlFor="details" className="mt-2 mb-2">
          Question Details
        </Label>
        <textarea
          className="w-full border rounded p-2"
          value={question.description}
          onChange={(e) => setQuestion({ ...question, description: e.target.value })}
        />
        {errors.details && <p className="text-red-500 text-sm mt-1">{errors.details}</p>}
      </CardContent>

      {/* <CardContent>
        <Label htmlFor="suggestedSolution" className="mt-2 mb-2">
          Suggested Solution
        </Label>
        <textarea
          className="w-full border rounded p-2"
          value={question.suggestedSolution}
          onChange={(e) => setQuestion({ ...question, suggestedSolution: e.target.value })}
        />
        {errors.solution && <p className="text-red-500 text-sm mt-1">{errors.solution}</p>}
      </CardContent> */}

      <CardFooter className="flex gap-2 flex-col">
        <Button variant="destructive" className="w-full mt-2" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="outline" className="w-full" type="submit">
          Save Changes
        </Button>
      </CardFooter>
    </form>
  );
}
