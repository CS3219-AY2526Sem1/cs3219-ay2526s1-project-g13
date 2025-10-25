import QuestionCard from "@/components/question/question-card";
import Navbar from "@/components/ui/nav-bar";

export default async function QuestionViewPage() {
  return (
    <div>
      <Navbar />
      <QuestionCard />
    </div>
  );
}
