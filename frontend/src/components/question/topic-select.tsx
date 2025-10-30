"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Plus } from "lucide-react";
import { Spinner } from "../ui/spinner";
import { fetchTopics, addTopic } from "@/hooks/use-question-topic";

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
  const [addingError, setAddingError] = useState<string | null>(null);

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

  // whether typed value exactly matches an existing topic (case-insensitive)
  const hasExact = useMemo(() => {
    const q = (inputValue || "").trim().toLowerCase();
    if (!q) return false;
    return topics.some((t) => t.toLowerCase() === q);
  }, [inputValue, topics]);

  const displayLabel = value || "Select or type topic...";

  // create new topic and select it
  const handleCreateAndSelect = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setAddingError("Topic name is required");
      return;
    }

    // avoid duplicates client-side
    if (topics.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      onChange(topics.find((t) => t.toLowerCase() === trimmed.toLowerCase())!);
      setOpen(false);
      return;
    }

    setAddingError(null);
    try {
      // call user-provided addTopic hook
      const created = await addTopic(trimmed); // expect string returned
      // update local list and select
      setTopics((prev) => {
        // avoid double-insert if already present
        if (prev.some((t) => t.toLowerCase() === created.toLowerCase())) return prev;
        return [created, ...prev];
      });
      onChange(created);
      setInputValue(created);
      setOpen(false);
    } catch (err) {
      console.error("Failed to add topic:", err);
      setAddingError("Failed to add topic");
    }
  };

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

              {/* If there is typed input, no exact match, show Add option */}
              {!loading && inputValue.trim() && !hasExact && (
                <CommandItem
                  value={`__add__:${inputValue.trim()}`}
                  onSelect={() => handleCreateAndSelect(inputValue)}
                >
                  <Plus />
                  New topic: <strong className="ml-1">{inputValue.trim()}</strong>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>

        <div className="px-3 py-2">
          {addingError && <p className="text-red-500 text-sm">{addingError}</p>}
          {error && <p className="text-yellow-600 text-sm">{error}</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
