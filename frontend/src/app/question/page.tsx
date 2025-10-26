import { columns } from "@/components/question/columns";
import { DataTable } from "@/components/question/question-table";
import Navbar from "@/components/ui/nav-bar";
import { QuestionForm } from "@/components/question/question-add-form";
import { fetchQuestionList } from "@/hooks/use-question";

export default async function QuestionPage() {
  const data = await fetchQuestionList();

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
