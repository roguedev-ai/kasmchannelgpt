import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import type { PartnerWithStats } from '@/lib/database';

type Partner = {
  id: string;
  email: string;
  role: 'admin' | 'partner';
  status: 'active' | 'inactive';
  name: string | null;
  collectionsCount: number;
  documentsCount: number;
  createdAt: string;
  updatedAt: string;
};

const columnHelper = createColumnHelper<Partner>();

const columns = [
  columnHelper.accessor(row => row.id, {
    id: 'id',
    header: 'Partner ID',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor(row => row.email, {
    id: 'email',
    header: 'Email',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor(row => row.role, {
    id: 'role',
    header: 'Role',
    cell: info => <span className="capitalize">{info.getValue()}</span>,
  }),
  columnHelper.accessor(row => row.collectionsCount, {
    id: 'collectionsCount',
    header: 'Collections',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor(row => row.documentsCount, {
    id: 'documentsCount',
    header: 'Documents',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor(row => row.createdAt, {
    id: 'createdAt',
    header: 'Created',
    cell: info => new Date(info.getValue()).toLocaleDateString(),
  }),
  columnHelper.accessor(row => row.status, {
    id: 'status',
    header: 'Status',
    cell: info => (
      <span className={`capitalize ${info.getValue() === 'active' ? 'text-green-600' : 'text-red-600'}`}>
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: info => (
      <div className="flex space-x-2">
        <button
          onClick={() => {/* TODO: View details */}}
          className="text-blue-600 hover:text-blue-800"
        >
          View
        </button>
        <button
          onClick={() => {/* TODO: Edit partner */}}
          className="text-gray-600 hover:text-gray-800"
        >
          Edit
        </button>
        <button
          onClick={() => {/* TODO: Delete partner */}}
          className="text-red-600 hover:text-red-800"
        >
          Delete
        </button>
      </div>
    ),
  }),
];

export function PartnerList() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const { data: partners = [], isLoading, error } = useQuery<Partner[]>({
    queryKey: ['partners'],
    queryFn: async () => {
      const response = await fetch('/api/admin/partners');
      if (!response.ok) {
        throw new Error('Failed to fetch partners');
      }
      return response.json();
    },
  });

  const table = useReactTable({
    data: partners,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error instanceof Error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center">
        <input
          type="text"
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder="Search partners..."
          className="px-4 py-2 border rounded-lg"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: ' 🔼',
                      desc: ' 🔽',
                    }[header.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
