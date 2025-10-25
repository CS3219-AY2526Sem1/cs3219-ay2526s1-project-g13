"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import { Question } from "@/types/question";
import clsx from "clsx";
import { useRouter } from "next/navigation";

function ActionCell({ question }: { question: Question }) {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/question/${question.id}`);
  };

  const handleDelete = () => {
    console.log("Delete clicked:", question);
  };

  return (
    <div className="flex space-x-4">
      <Button variant="outline" size="sm" className="w-20" onClick={handleEdit}>
        <Pencil className="h-4 w-4 mr-1" />
        Edit
      </Button>
      <Button variant="destructive" size="sm" className="w-20" onClick={handleDelete}>
        <Trash className="h-4 w-4 mr-1" />
        Delete
      </Button>
    </div>
  );
}

export const columns: ColumnDef<Question>[] = [
  {
    accessorKey: "title",
    header: "Question Title",
  },
  {
    accessorKey: "topic",
    header: "Topic",
  },
  {
    accessorKey: "difficulty",
    header: "Difficulty",
    cell: ({ getValue }) => {
      const difficulty = getValue() as Question["difficulty"];

      const colorClass = clsx("px-2 py-1 rounded-full text-center font-medium w-fit", {
        "bg-green-100 text-green-800": difficulty === "Easy",
        "bg-yellow-100 text-yellow-800": difficulty === "Medium",
        "bg-red-100 text-red-800": difficulty === "Hard",
      });

      return <span className={colorClass}>{difficulty}</span>;
    },
  },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionCell question={row.original} />,
  },
];
