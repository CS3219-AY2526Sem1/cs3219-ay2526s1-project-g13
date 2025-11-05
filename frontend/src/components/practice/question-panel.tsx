import { Separator } from "@/components/ui/separator";
import { Card, CardTitle, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useCollaborationState } from "@/stores/collaboration-store";
import { Difficulty } from "@/utils/enums";

export default function QuestionPanel() {
  const { questionDetails, isQuestionLoading, questionError } = useCollaborationState();

  // Loading state
  if (isQuestionLoading) {
    return (
      <Card className={"rounded-none min-h-full h-auto w-full"}>
        <CardHeader>
          <CardTitle>Question</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="flex flex-col items-center justify-center gap-4">
          <Spinner />
          <p className="text-muted-foreground">Loading question...</p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (questionError) {
    return (
      <Card className={"rounded-none min-h-full h-auto w-full"}>
        <CardHeader>
          <CardTitle>Question</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent>
          <p className="text-destructive font-semibold">Failed to load question</p>
          <p className="text-muted-foreground mt-2">{questionError}</p>
        </CardContent>
      </Card>
    );
  }

  // No question available
  if (!questionDetails) {
    return (
      <Card className={"rounded-none min-h-full h-auto w-full"}>
        <CardHeader>
          <CardTitle>Question</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent>
          <p className="text-muted-foreground">No question available for this session.</p>
        </CardContent>
      </Card>
    );
  }

  // Difficulty badge color
  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case Difficulty.EASY:
        return "bg-green-100 text-green-800";
      case Difficulty.MEDIUM:
        return "bg-yellow-100 text-yellow-800";
      case Difficulty.HARD:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className={"rounded-none min-h-full h-auto w-full"}>
      <CardHeader>
        <CardTitle>Question</CardTitle>
      </CardHeader>
      <Separator />

      {/* Title and metadata */}
      <CardContent>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-2xl font-bold">{questionDetails.title}</h2>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className={getDifficultyColor(questionDetails.difficulty)}>
              {questionDetails.difficulty}
            </Badge>
            <Badge variant="outline">{questionDetails.topic}</Badge>
          </div>
        </div>
      </CardContent>

      {/* Description */}
      <CardContent>
        <p className="whitespace-pre-wrap">{questionDetails.description}</p>
      </CardContent>

      {/* Examples */}
      {questionDetails.examples && questionDetails.examples.length > 0 && (
        <CardContent>
          <h3 className="text-lg font-semibold mb-3">Examples</h3>
          <div className="space-y-4">
            {questionDetails.examples.map((example, index) => (
              <div key={index} className="border rounded-lg p-4 bg-muted/30">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold">Input:</span>
                    <code className="ml-2 bg-muted px-2 py-1 rounded">{example.input}</code>
                  </div>
                  <div>
                    <span className="font-semibold">Output:</span>
                    <code className="ml-2 bg-muted px-2 py-1 rounded">{example.output}</code>
                  </div>
                  {example.explanation && (
                    <div>
                      <span className="font-semibold">Explanation: </span>
                      <span>{example.explanation}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}

      {/* Link to original problem */}
      {questionDetails.link && (
        <CardContent>
          <a
            href={questionDetails.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm"
          >
            View original problem →
          </a>
        </CardContent>
      )}
    </Card>
  );
}
