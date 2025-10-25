import { columns } from "@/components/question/columns";
import { DataTable } from "@/components/question/question-table";
import Navbar from "@/components/ui/nav-bar";
import { Question } from "@/types/question";
import { QuestionForm } from "@/components/question/question-form";

async function getData(): Promise<Question[]> {
  // Fetch data from your API here.
  return [
    {
      id: "1",
      title: "Question 1",
      topic: "Strings",
      difficulty: "Easy",
    },
    {
      id: "2",
      title: "Question 2",
      topic: "Strings",
      difficulty: "Medium",
    },
    {
      id: "3",
      title: "Question 3",
      topic: "Strings",
      difficulty: "Hard",
    },
  ];
}

export default async function QuestionPage() {
  const data = await getData();

  return (
    <div>
      <Navbar />
      <div className="container mx-auto py-10">
        <h1 className="mb-4 text-2xl font-bold text-center">Question Bank</h1>
        <QuestionForm />
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  );
}
