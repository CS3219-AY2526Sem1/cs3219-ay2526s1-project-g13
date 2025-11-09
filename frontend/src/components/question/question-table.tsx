"use client";

import { useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  ColumnDef,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";
import { ArrowDownUp, MoveUp, MoveDown } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { fetchQuestionList, fetchArchivedQuestionList } from "@/hooks/use-question";
import { columns, restoreColumns } from "@/components/question/columns";
import { Question } from "@/lib/api-client";

type TableSectionProps = {
  data: Question[];
  isLoading: boolean;
  columns: ColumnDef<Question, unknown>[];
  sorting: SortingState;
  setSorting: (updater: SortingState | ((old: SortingState) => SortingState)) => void;
};

function TableSection({ data, isLoading, columns, sorting, setSorting }: TableSectionProps) {
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // safely get the "title" column for filtering if present
  const titleCol = table.getColumn("title");

  return (
    <div className="overflow-hidden rounded-md border bg-white p-4">
      {/* Filter input */}
      <Input
        placeholder="Filter questions..."
        value={(titleCol?.getFilterValue() as string) ?? ""}
        onChange={(event) => titleCol?.setFilterValue(event.target.value)}
        className="max-w-sm mb-4"
      />

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                return (
                  <TableHead
                    key={header.id}
                    className={canSort ? "cursor-pointer select-none" : "select-none"}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}

                    {canSort &&
                      (header.column.getIsSorted() === "asc" ? (
                        <MoveUp className="inline w-4 h-4 ml-1 text-gray-600" />
                      ) : header.column.getIsSorted() === "desc" ? (
                        <MoveDown className="inline w-4 h-4 ml-1 text-gray-600" />
                      ) : (
                        <ArrowDownUp className="inline w-4 h-4 ml-1 text-gray-400" />
                      ))}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default function DataTable() {
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  // active
  const [activeData, setActiveData] = useState<Question[]>([]);
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(true);
  const [sortingCurrent, setSortingCurrent] = useState<SortingState>([]);

  // Archived
  const [archivedData, setArchivedData] = useState<Question[]>([]);
  const [isLoadingArchived, setIsLoadingArchived] = useState(false);
  const [archivedLoaded, setArchivedLoaded] = useState(false);
  const [sortingArchived, setSortingArchived] = useState<SortingState>([]);

  // Fetch active on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoadingCurrent(true);
        const list = await fetchQuestionList();
        if (!mounted) return;
        setActiveData(list);
      } catch (err) {
        console.error("Failed to fetch questions", err);
        if (mounted) setActiveData([]);
      } finally {
        if (mounted) setIsLoadingCurrent(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Lazy-load archived when the tab is first opened
  useEffect(() => {
    let mounted = true;
    if (activeTab === "archived" && !archivedLoaded) {
      (async () => {
        try {
          setIsLoadingArchived(true);
          const list = await fetchArchivedQuestionList();
          if (!mounted) return;
          setArchivedData(list);
          setArchivedLoaded(true);
        } catch (err) {
          console.error("Failed to fetch archived questions", err);
          if (mounted) setArchivedData([]);
        } finally {
          if (mounted) setIsLoadingArchived(false);
        }
      })();
    }
    return () => {
      mounted = false;
    };
  }, [activeTab, archivedLoaded]);

  const cols = useMemo(() => columns, []);
  const restoreCols = useMemo(() => restoreColumns, []);

  return (
    <div>
      <Tabs
        value={activeTab}
        defaultValue="active"
        onValueChange={(v) => setActiveTab(v as "active" | "archived")}
      >
        <TabsList>
          <TabsTrigger value="active">Active questions</TabsTrigger>
          <TabsTrigger value="archived">Archived questions</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <TableSection
            data={activeData}
            isLoading={isLoadingCurrent}
            columns={cols}
            sorting={sortingCurrent}
            setSorting={setSortingCurrent}
          />
        </TabsContent>

        <TabsContent value="archived" className="mt-4">
          <TableSection
            data={archivedData}
            isLoading={isLoadingArchived}
            columns={restoreCols}
            sorting={sortingArchived}
            setSorting={setSortingArchived}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
