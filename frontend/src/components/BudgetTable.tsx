import React, { useMemo, useState, useRef, useCallback } from 'react';
import type { ExpenseRow, CellEdit } from '../types';
import { getCellKey, calculateTotal } from '../utils/budgetEditHelpers';
import { fmt } from '../utils/formatters';
import EditableCell from './EditableCell';
import { HiOutlineTrash } from 'react-icons/hi2';

interface BudgetTableProps {
  expenses: ExpenseRow[];
  editedCells: Map<string, CellEdit>;
  validationErrors: Map<string, string>;
  canEdit: boolean;
  onCellEdit: (expenseId: string, month: number, value: string) => void;
  onRemoveRow: (expenseId: string) => void;
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

type SortField = 'code' | 'description' | 'total' | `month-${number}`;
type SortDir = 'asc' | 'desc';

export default function BudgetTable({ expenses, editedCells, validationErrors, canEdit, onCellEdit, onRemoveRow }: BudgetTableProps) {
  const [descWidth, setDescWidth] = useState(180);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const resizing = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);
