"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Language } from "@/types/solution";

type SelectLanguageProps = {
  selectedLang: Language;
  onChange: (lang: Language) => void;
};

export function LanguageSelector({ selectedLang, onChange }: SelectLanguageProps) {
  return (
    <div className="mt-4 flex items-center gap-3">
      <Label htmlFor="language-select" className="whitespace-nowrap">
        Language
      </Label>
      <Select value={selectedLang} onValueChange={(v) => onChange(v as Language)}>
        <SelectTrigger id="language-select" className="w-56">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {(["JavaScript", "Python", "C++", "Java"] as Language[]).map((lang) => (
            <SelectItem key={lang} value={lang}>
              {lang}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
