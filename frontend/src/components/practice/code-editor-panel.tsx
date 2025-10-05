"use client";

import * as React from "react";
import { Separator } from "@/components/ui/separator";
import { Card, CardTitle, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CodeEditorPanel() {
  const [code, setCode] = React.useState<string>(
    `
function hello() {
  console.log('Hello, world!');
}

hello();
`.trimStart(),
  );

  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = React.useRef<HTMLDivElement | null>(null);

  const lines = React.useMemo(() => {
    // ensure there's at least one line
    return code.length === 0 ? [""] : code.split("\n");
  }, [code]);

  // keep gutter scroll synced with textarea
  React.useEffect(() => {
    const ta = textareaRef.current;
    const g = gutterRef.current;
    if (!ta || !g) return;
    const onScroll = () => (g.scrollTop = ta.scrollTop);
    ta.addEventListener("scroll", onScroll);
    return () => ta.removeEventListener("scroll", onScroll);
  }, []);

  // auto-resize textarea height to fit (optional)
  React.useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    // set height to match content (nice for embedding inside CardContent)
    ta.style.height = "0px";
    const height = Math.max(120, ta.scrollHeight);
    ta.style.height = `${height}px`;
  }, [code]);

  return (
    <Card className={"rounded-none min-h-full h-auto w-full"}>
      <CardHeader>
        <CardTitle>Editor</CardTitle>
      </CardHeader>

      <Separator />

      <CardContent className="p-0 h-full">
        <div className="flex gap-5 ml-[35] mb-[20]">
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="c">C</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-full border-t border-b border-muted/40">
          {/* Line numbers gutter */}
          <div
            ref={gutterRef}
            className="w-[3.5rem] select-none bg-muted/10 text-muted-foreground text-right text-sm font-mono px-2 py-3 overflow-auto bg-primary text-white ml-10"
            aria-hidden
          >
            {lines.map((_, i) => (
              <div key={i} className="leading-[1.6]">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code textarea */}
          <div className="flex-1 flex">
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="w-full h-full border-0 p-3 text-sm font-mono leading-[1.6] outline-none bg-primary text-white resize-none mr-10"
              aria-label="Code editor"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
