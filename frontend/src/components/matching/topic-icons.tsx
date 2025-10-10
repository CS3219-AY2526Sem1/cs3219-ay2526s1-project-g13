import React from "react";
import {
  FaCode,
  FaLink,
  FaSitemap,
  FaCogs,
  FaSort,
  FaLayerGroup,
  FaDollarSign,
  FaCalculator,
  FaTable,
  FaSearch,
  FaProjectDiagram,
  FaStackOverflow,
  FaHashtag,
  FaBolt,
  FaTree,
  FaDatabase,
  FaNetworkWired,
  FaTh,
} from "react-icons/fa";

export const ArrayIcon = () => <FaCode className="w-6 h-6" />;
export const LinkedListIcon = () => <FaLink className="w-6 h-6" />;
export const TreeIcon = () => <FaSitemap className="w-6 h-6" />;
export const DPIcon = () => <FaCogs className="w-6 h-6" />;
export const SortIcon = () => <FaSort className="w-6 h-6" />;
export const HeapIcon = () => <FaLayerGroup className="w-6 h-6" />;
export const GreedyIcon = () => <FaDollarSign className="w-6 h-6" />;
export const MathIcon = () => <FaCalculator className="w-6 h-6" />;
export const MatrixIcon = () => <FaTable className="w-6 h-6" />;
export const BinarySearchIcon = () => <FaSearch className="w-6 h-6" />;
export const BacktrackingIcon = () => <FaProjectDiagram className="w-6 h-6" />;
export const StackIcon = () => <FaStackOverflow className="w-6 h-6" />;
export const HashTableIcon = () => <FaHashtag className="w-6 h-6" />;
export const BFSIcon = () => <FaBolt className="w-6 h-6" />;
export const DFSIcon = () => <FaTree className="w-6 h-6" />;
export const StringIcon = () => <FaDatabase className="w-6 h-6" />;
export const TwoPointersIcon = () => <FaNetworkWired className="w-6 h-6" />;
export const QueueIcon = () => <FaTh className="w-6 h-6" />;

export const topics = [
  { id: "ARRAY", name: "Arrays & Strings", icon: ArrayIcon },
  { id: "LINKEDLIST", name: "Linked Lists", icon: LinkedListIcon },
  { id: "TREE", name: "Trees & Graphs", icon: TreeIcon },
  { id: "DP", name: "Dynamic Programming", icon: DPIcon },
  { id: "SORTING", name: "Sorting & Searching", icon: SortIcon },
  { id: "HEAP", name: "Heap", icon: HeapIcon },
  { id: "GREEDY", name: "Greedy", icon: GreedyIcon },
  { id: "MATH", name: "Math", icon: MathIcon },
  { id: "MATRIX", name: "Matrix", icon: MatrixIcon },
  { id: "BINARYSEARCH", name: "Binary Search", icon: BinarySearchIcon },
  { id: "BACKTRACKING", name: "Backtracking", icon: BacktrackingIcon },
  { id: "STACK", name: "Stack", icon: StackIcon },
  { id: "HASHTABLE", name: "Hash Table", icon: HashTableIcon },
  { id: "BFS", name: "Breadth-First Search", icon: BFSIcon },
  { id: "DFS", name: "Depth-First Search", icon: DFSIcon },
  { id: "STRING", name: "String", icon: StringIcon },
  { id: "TWOPOINTERS", name: "Two Pointers", icon: TwoPointersIcon },
  { id: "QUEUE", name: "Queue", icon: QueueIcon },
];
