"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";

import { QuestionView } from "./question-view";
import { QuestionEdit } from "./question-edit";
import { Question } from "@/types/question";
import { fetchQuestion } from "@/hooks/use-question";
import { useParams } from "next/navigation";

export default function QuestionCard() {
  const [editMode, setEditMode] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const { id } = useParams();

  useEffect(() => {
    if (!id) return;

    let mounted = true;

    async function load() {
      try {
        const q = await fetchQuestion(id as string);
        if (mounted) setQuestion(q);
      } catch (err) {
        console.error("Error loading question:", err);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [id]);

  async function handleCancel() {
    if (!id) {
      setEditMode(false);
      return;
    }
    try {
      const q = await fetchQuestion(id as string);
      setQuestion(q);
    } catch (err) {
      console.error("Failed to refetch on cancel:", err);
    } finally {
      setEditMode(false);
    }
  }

  if (!question) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h2 className="text-xl font-semibold">Loading...</h2>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl">
        {editMode ? (
          <QuestionEdit question={question} setQuestion={setQuestion} />
        ) : (
          <QuestionView question={question} onEdit={() => setEditMode(true)} />
        )}

        {editMode && (
          <CardFooter className="flex gap-2 flex-col">
            <Button variant="destructive" className="w-full" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // TODO: call backend save API here; for now just close edit mode
                setEditMode(false);
              }}
            >
              Save Changes
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
