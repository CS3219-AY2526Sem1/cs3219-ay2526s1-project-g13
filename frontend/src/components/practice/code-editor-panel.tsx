"use client";

import { useRef, useState } from "react";
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
import Editor, { OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

export default function CodeEditorPanel() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const onMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    editor.focus();
    monacoInstance.editor.defineTheme("myCustomTheme", {
      base: "vs-dark", // "vs" | "vs-dark" | "hc-black"
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#242739", // <-- your background color
        "editor.foreground": "#CED5F4",
        "editorLineNumber.foreground": "#80869E", // line number color
        "editorLineNumber.activeForeground": "#d4eaf8",
        "editorCursor.foreground": "#d4eaf8",
        "editor.lineHighlightBackground": "#80869e30",
        editorLineHighlightBorder: "#242739",
      },
    });

    monacoInstance.editor.setTheme("myCustomTheme");
  };

  const languages = ["c", "java", "javascript", "python", "typescript"];

  return (
    <Card className="rounded-none min-h-full h-auto w-full">
      <CardHeader>
        <CardTitle>Editor</CardTitle>
      </CardHeader>

      <Separator />

      <CardContent className="p-0 h-full">
        <div className="flex gap-5 ml-[35px] mb-[20px]">
          <Select value={language} onValueChange={(val) => setLanguage(val)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto">
              <SelectGroup>
                {languages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <Editor
          height="60vh"
          language={language}
          value={code}
          onMount={onMount}
          onChange={(val) => val !== undefined && setCode(val)}
        />
      </CardContent>
    </Card>
  );
}
