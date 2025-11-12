export type Topic =
  | "Array"
  | "Algorithms"
  | "Backtracking"
  | "Binary search"
  | "Bit manipulation"
  | "Depth-first search"
  | "Dynamic programming"
  | "Linked list"
  | "Math"
  | "Sorting"
  | "Stack"
  | "String"
  | "Tree"
  | "Quickselect";

export type Language = "JavaScript" | "Python" | "C++" | "Java";

export type TimeComplexity =
  | "O(1)"
  | "O(log n)"
  | "O(n)"
  | "O(n log n)"
  | "O(n^2)"
  | "O(n^3)"
  | "O(2^n)"
  | "O(n!)";

export type SpaceComplexity = "O(1)" | "O(n)" | "O(n^2)" | "O(log n)" | "O(n log n)";

export type Status = "Active" | "Archived";
