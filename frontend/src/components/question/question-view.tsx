// question-view.tsx
import {
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Question } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SolutionView } from "./solution-view";

// NEW imports for selector + type
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Language } from "@/types/solution";

type ViewQuestionProps = {
  question: Question;
  onEdit: () => void;
};

export function QuestionView({ question, onEdit }: ViewQuestionProps) {
  const router = useRouter();
  const id = question.questionID;
  console.log(question);
  console.log(id);

  const [selectedLang, setSelectedLang] = useState<Language>("Python");

  return (
    <Tabs defaultValue="question">
      <TabsList className="flex justify-center items-center gap-4 mx-auto w-auto">
        <TabsTrigger value="question">Question</TabsTrigger>
        <TabsTrigger value="solution">Solution</TabsTrigger>
      </TabsList>

      {/* Question Tab */}
      <TabsContent value="question">
        <CardHeader>
          <CardAction>
            <Button variant="link" onClick={() => router.push("/question")}>
              Back
            </Button>
            <Button variant="link" onClick={onEdit}>
              Edit
            </Button>
          </CardAction>

          <CardTitle>{question.title}</CardTitle>
          <CardDescription>
            {question.topic} • {question.difficulty}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <p>{question.description}</p>
          {question.examples && question.examples.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Example{question.examples.length > 1 ? "s" : ""}
              </h3>
              <div className="space-y-4">
                {question.examples.map((example, idx) => (
                  <div key={idx} className="border rounded-md p-3 bg-gray-50 text-sm space-y-1">
                    <p>
                      <span className="font-medium text-gray-800">Input:</span>{" "}
                      <code className="bg-gray-100 px-1 py-0.5 rounded">{example.input}</code>
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Output:</span>{" "}
                      <code className="bg-gray-100 px-1 py-0.5 rounded">{example.output}</code>
                    </p>
                    {example.explanation && (
                      <p>
                        <span className="font-medium text-gray-800">Explanation:</span>{" "}
                        {example.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </TabsContent>

      {/* Solution Tab */}
      <TabsContent value="solution">
        <CardHeader>
          <CardTitle>Solutions</CardTitle>

          <div className="mt-4 flex items-center gap-3">
            <Label htmlFor="language-select" className="whitespace-nowrap">
              Language
            </Label>
            <Select value={selectedLang} onValueChange={(v) => setSelectedLang(v as Language)}>
              <SelectTrigger id="language-select" className="w-56">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {(["JavaScript", "Python", "C++", "Java"] as Language[]).map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <SolutionView questionId={id} selectedLang={selectedLang} />
        </CardContent>
      </TabsContent>
    </Tabs>
  );
}
