"use client";

import { useEffect, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
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
import { fetchQuestionList } from "@/hooks/use-question";
import { columns } from "@/components/question/columns";
import { Question } from "@/types/question";

export default function DataTable() {
  const [data, setData] = useState<Question[]>([]); // use a concrete type when available
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const list = await fetchQuestionList();
        if (!mounted) return;
        setData(list);
      } catch (err) {
        console.error("Failed to fetch questions", err);
        if (mounted) setData([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // helper to safely get filter value (in case column isn't present)
  const titleCol = table.getColumn("title");

  return (
    <div>
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
    </div>
  );
}
