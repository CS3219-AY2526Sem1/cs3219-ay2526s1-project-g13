"use client";

import { useState, useEffect } from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "../ui/spinner";
import { fetchTopics } from "@/hooks/use-question-topic";

export interface TopicSelectProps {
  value: string;
  onChange: (val: string) => void;
}

export default function TopicSelect({ value, onChange }: TopicSelectProps) {
  const [open, setOpen] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchTopics();
        if (!cancelled) setTopics(result ?? []);
      } catch (err) {
        console.error("Failed to load topics:", err);
        if (!cancelled) setError("Unable to load topics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayLabel = value || "Select or type topic...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between bg-white"
        >
          {displayLabel}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0">
        <Command>
          <CommandInput
            placeholder="Search or type topic..."
            onValueChange={(val) => setInputValue(val)}
            value={inputValue}
          />
          <CommandList>
            <CommandEmpty>No topic found.</CommandEmpty>

            <CommandGroup>
              {loading && <Spinner />}

              {!loading &&
                topics.map((topic) => (
                  <CommandItem
                    key={topic}
                    value={topic}
                    onSelect={(currentValue) => {
                      // select topic
                      onChange(currentValue);
                      setInputValue(currentValue);
                      setOpen(false);
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4",
                        (value || "").toLowerCase() === topic.toLowerCase()
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {topic}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>

        <div className="px-3 py-2">
          {error && <p className="text-yellow-600 text-sm">{error}</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
