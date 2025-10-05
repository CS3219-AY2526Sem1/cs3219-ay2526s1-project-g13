import { Separator } from "@/components/ui/separator";
import { Card, CardTitle, CardContent, CardHeader } from "@/components/ui/card";

export default function QuestionPanel() {
  return (
    <Card className={"rounded-none min-h-full h-auto w-full"}>
      <CardHeader>
        <CardTitle>Question</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent>Question title</CardContent>

      <CardContent>
        Etiam vulputate, mauris quis commodo aliquam, tortor mi eleifend nulla, eu viverra justo
        diam sit amet penti.
      </CardContent>
    </Card>
  );
}
