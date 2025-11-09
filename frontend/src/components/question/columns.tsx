"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Eye, Archive, ArchiveRestore } from "lucide-react";
import { Question } from "@/lib/api-client";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { archiveQuestion, restoreQuestion } from "@/hooks/use-question";

function ActionCell({ question }: { question: Question }) {
  const router = useRouter();

  const handleView = () => {
    router.push(`/question/${question.questionID}`);
  };

  const handleArchive = () => {
    archiveQuestion(question.questionID);
    window.location.reload();
  };

  return (
    <div className="flex space-x-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button className="w-15" variant="outline" size="sm" onClick={handleView}>
            <Eye className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>View</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button className="w-15" variant="default" size="sm" onClick={handleArchive}>
            <Archive className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Archive</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function RestoreActionCell({ question }: { question: Question }) {
  const handleRestore = () => {
    restoreQuestion(question.questionID);
    window.location.reload();
  };

  return (
    <div className="flex space-x-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button className="w-15" variant="default" size="sm" onClick={handleRestore}>
            <ArchiveRestore className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Restore</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

const difficultyOrder: Record<string, number> = {
  Easy: 0,
  Medium: 1,
  Hard: 2,
};

export const columns: ColumnDef<Question>[] = [
  {
    id: "index",
    header: "No.",
    cell: ({ row }) => <span>{row.index + 1}</span>,
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    accessorKey: "title",
    header: "Question Title",
    enableSorting: true,
  },
  {
    accessorKey: "topic",
    header: "Topic",
    enableSorting: true,
  },
  {
    accessorKey: "difficulty",
    header: "Difficulty",
    enableSorting: true,
    sortingFn: (rowA, rowB, columnId) => {
      const a = String(rowA.getValue(columnId));
      const b = String(rowB.getValue(columnId));
      const ai = difficultyOrder[a] ?? Number.POSITIVE_INFINITY;
      const bi = difficultyOrder[b] ?? Number.POSITIVE_INFINITY;
      return ai - bi;
    },
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
    enableSorting: false,
    cell: ({ row }) => <ActionCell question={row.original} />,
  },
];

export const restoreColumns: ColumnDef<Question>[] = [
  {
    id: "index",
    header: "No.",
    cell: ({ row }) => <span>{row.index + 1}</span>,
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    accessorKey: "title",
    header: "Question Title",
    enableSorting: true,
  },
  {
    accessorKey: "topic",
    header: "Topic",
    enableSorting: true,
  },
  {
    accessorKey: "difficulty",
    header: "Difficulty",
    enableSorting: true,
    sortingFn: (rowA, rowB, columnId) => {
      const a = String(rowA.getValue(columnId));
      const b = String(rowB.getValue(columnId));
      const ai = difficultyOrder[a] ?? Number.POSITIVE_INFINITY;
      const bi = difficultyOrder[b] ?? Number.POSITIVE_INFINITY;
      return ai - bi;
    },
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
    enableSorting: false,
    cell: ({ row }) => <RestoreActionCell question={row.original} />,
  },
];
