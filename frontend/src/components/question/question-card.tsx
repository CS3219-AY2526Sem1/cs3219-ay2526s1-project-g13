"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

import { QuestionView } from "./question-view";
import { QuestionEdit } from "./question-edit-form";
import { Question, emptyQuestionState } from "@/types/question";
import { fetchQuestion } from "@/hooks/use-question";
import { useParams } from "next/navigation";

export default function QuestionCard() {
  const [editMode, setEditMode] = useState(false);
  const [question, setQuestion] = useState<Question>(emptyQuestionState);
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
          <QuestionEdit
            question={question}
            setQuestion={setQuestion}
            onCancel={handleCancel}
            onSaveChanges={() => setEditMode(false)}
          />
        ) : (
          <QuestionView question={question} onEdit={() => setEditMode(true)} />
        )}
      </Card>
    </div>
  );
}
