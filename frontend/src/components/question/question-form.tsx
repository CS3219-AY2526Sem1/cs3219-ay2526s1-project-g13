"use client";

import { useState } from "react";
import { Question } from "@/types/question";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export function QuestionForm() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState<Question>({
    id: "",
    title: "",
    topic: "",
    difficulty: "Easy",
    details: "",
    suggestedSolution: "",
  });

  const handleSubmit = () => {
    setQuestion({
      id: "",
      title: "",
      topic: "",
      difficulty: "Easy",
      details: "",
      suggestedSolution: "",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mb-4 w-40">
          <Plus /> Add Question
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Question</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          <div>
            <Label htmlFor="title">Question Title</Label>
            <Input
              id="title"
              className="w-full mt-2 bg-white"
              value={question.title}
              onChange={(e) => setQuestion({ ...question, title: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                className="w-full mt-2 bg-white"
                value={question.topic}
                onChange={(e) => setQuestion({ ...question, topic: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={question.difficulty}
                onValueChange={(value) =>
                  setQuestion({
                    ...question,
                    difficulty: value as Question["difficulty"],
                  })
                }
              >
                <SelectTrigger className="w-[140px] mt-2 bg-white">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="details">Question Details</Label>
            <Textarea
              id="details"
              className="w-full border rounded p-2 mt-2 bg-white"
              value={question.details}
              onChange={(e) => setQuestion({ ...question, details: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="suggestedSolution">Suggested Solution</Label>
            <Textarea
              id="suggestedSolution"
              className="w-full border rounded p-2 mt-2 bg-white"
              value={question.suggestedSolution}
              onChange={(e) => setQuestion({ ...question, suggestedSolution: e.target.value })}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="mt-4 flex justify-end gap-2">
          <Button onClick={handleSubmit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
