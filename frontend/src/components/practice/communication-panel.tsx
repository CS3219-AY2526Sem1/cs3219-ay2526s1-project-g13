import { Separator } from "@/components/ui/separator";
import { Card, CardTitle, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Video } from "lucide-react";

export default function CommunicationPanel() {
  return (
    <Card className="rounded-none min-h-full h-auto w-full flex flex-col">
      {/* Header */}
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Communication</CardTitle>
        <div className="flex gap-2">
          <Button variant="default" className="w-[100px] h-[35px]">
            <Mic />
          </Button>
          <Button variant="default" className="w-[100px] h-[35px]">
            <Video />
          </Button>
        </div>
      </CardHeader>

      <Separator />

      {/* Video + Chat Section */}
      <CardContent className="flex flex-col md:flex-row gap-4 h-full">
        {/* Video Feeds stacked vertically */}
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex-1 bg-gray-200 rounded-md h-48 flex items-center justify-center">
            <span className="text-gray-500">User 1</span>
          </div>
          <div className="flex-1 bg-gray-200 rounded-md h-48 flex items-center justify-center">
            <span className="text-gray-500">User 2</span>
          </div>
        </div>

        {/* Chat Section */}
        <div className="flex-1 bg-gray-50 rounded-md p-2 h-96 flex flex-col">
          {/* Chat Messages Placeholder */}
          <div className="flex-1 overflow-y-auto mb-2 flex flex-col gap-2">
            {/* User 1 (left) */}
            <div className="flex">
              <div className="bg-gray-200 p-2 rounded-md max-w-[70%]">{"Hello! How are you?"}</div>
            </div>

            {/* User 2 (right) */}
            <div className="flex justify-end">
              <div className="bg-accent p-2 rounded-md max-w-[70%]">{"I'm good, thanks!"}</div>
            </div>

            {/* User 1 */}
            <div className="flex">
              <div className="bg-gray-200 p-2 rounded-md max-w-[70%]">
                {"Ready for the meeting?"}
              </div>
            </div>

            {/* User 2 */}
            <div className="flex justify-end">
              <div className="bg-accent p-2 rounded-md max-w-[70%]">{"Yes, let's start."}</div>
            </div>
          </div>

          {/* Input Box */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 border rounded-md p-1"
            />
            <Button variant="default" className="w-[80px]">
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
