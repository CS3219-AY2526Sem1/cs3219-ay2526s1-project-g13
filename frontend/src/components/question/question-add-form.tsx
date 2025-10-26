"use client";

import { useState, useEffect } from "react";
import { Question, emptyQuestionState } from "@/types/question";
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
import { addQuestion } from "@/hooks/use-question";

export function QuestionForm() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState<Question>(emptyQuestionState);

  // Image upload states
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const imageOnly = files.filter((file) => file.type.startsWith("image/"));
    setImageFiles(imageOnly);
  };

  // Generate image previews whenever imageFiles changes
  useEffect(() => {
    if (imageFiles.length < 1) {
      setPreviews([]);
      return;
    }

    const newPreviews = imageFiles.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);

    // Revoke object URLs on cleanup to avoid memory leaks
    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

  const handleSubmit = async () => {
    try {
      const response = await addQuestion(question);
      console.log(response);
      setQuestion(emptyQuestionState);
      setImageFiles([]);
      setOpen(false);
    } catch (error) {
      console.error("Failed to save question:", error);
    }
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
        <form onSubmit={handleSubmit}>
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

            {/* Image upload */}
            <div>
              <Label htmlFor="images">Images (Optional)</Label>
              <Input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="mt-2 bg-white"
              />
              {previews.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {previews.map((src, idx) => (
                    <img
                      key={idx}
                      src={src}
                      alt={`preview-${idx}`}
                      className="h-24 w-24 object-cover border rounded"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>

        <DialogFooter className="mt-4 flex justify-end gap-2">
          <Button type="submit">Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
