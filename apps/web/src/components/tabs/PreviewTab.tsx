import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
    getSortedRowModel,
    SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    Table as TableIcon,
    Search,
    Download,
    Filter,
    Loader2,
    ChevronDown,
    ChevronUp,
    Columns as ColumnsIcon,
    Info,
    PanelRight,
    Database
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';

interface PreviewTabProps {
    datasetId: string;
}

const PreviewTab: React.FC<PreviewTabProps> = ({ datasetId }) => {
    const { tenant } = useAuthStore();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showInspector, setShowInspector] = useState(false);
    const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

    const parentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadPreview();
    }, [datasetId, tenant?.id]);

    const loadPreview = async () => {
        if (!tenant?.id) return;
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/datasets/${datasetId}/preview`, {
                headers: { 'x-tenant-id': tenant.id }
            });
            setData(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load data preview');
        } finally {
            setLoading(false);
        }
    };

    const columns = useMemo(() => {
        if (data.length === 0) return [];
        const keys = Object.keys(data[0]);
        const columnHelper = createColumnHelper<any>();

        return keys.map(key => columnHelper.accessor(key, {
            header: key,
            cell: info => {
                const value = info.getValue();
                if (value === null || value === undefined) return <span className="text-slate-300 italic text-[10px]">NULL</span>;
                if (typeof value === 'boolean') return <span>{value ? 'True' : 'False'}</span>;
                return <span className="truncate max-w-[200px] block" title={String(value)}>{String(value)}</span>;
            },
        }));
    }, [data]);

    const table = useReactTable({
        data,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    const { rows } = table.getRowModel();

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 40,
        overscan: 10,
    });

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex h-full gap-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className={cn("flex-1 space-y-6 transition-all duration-300", showInspector ? "max-w-[calc(100%-350px)]" : "w-full")}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold tracking-tight">Data Preview</h2>
                        <p className="text-sm text-slate-500">Showing first {data.length} records. Performance optimized virtual table.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                            <Input placeholder="Filter preview..." className="pl-9 h-9 text-xs" />
                        </div>
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" /> Export
                        </Button>
                        <Button
                            variant={showInspector ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setShowInspector(!showInspector)}
                        >
                            <PanelRight className="mr-2 h-4 w-4" /> Inspector
                        </Button>
                    </div>
                </div>

                <Card className="border-none shadow-sm h-[600px] overflow-hidden bg-white dark:bg-slate-900 flex flex-col">
                    <div className="overflow-x-auto no-scrollbar border-b">
                        <table className="w-full border-collapse">
                            <thead>
                                {table.getHeaderGroups().map(headerGroup => (
                                    <tr key={headerGroup.id} className="bg-slate-50 dark:bg-slate-800">
                                        <th className="py-3 px-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-r w-12 shrink-0">#</th>
                                        {headerGroup.headers.map(header => (
                                            <th
                                                key={header.id}
                                                className="py-3 px-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-r cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                                                onClick={() => {
                                                    header.column.toggleSorting();
                                                    setSelectedColumn(header.id);
                                                }}
                                            >
                                                <div className="flex items-center justify-between gap-2 overflow-hidden">
                                                    <span className="truncate">{flexRender(header.column.columnDef.header, header.getContext())}</span>
                                                    <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {header.column.getIsSorted() === 'asc' ? <ChevronUp className="h-3 w-3" /> :
                                                            header.column.getIsSorted() === 'desc' ? <ChevronDown className="h-3 w-3" /> :
                                                                <Filter className="h-3 w-3 opacity-30" />}
                                                    </div>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                        </table>
                    </div>

                    <div
                        ref={parentRef}
                        className="flex-1 overflow-auto custom-scrollbar"
                    >
                        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                            {rowVirtualizer.getVirtualItems().map(virtualRow => {
                                const row = rows[virtualRow.index];
                                return (
                                    <table key={virtualRow.key} className="w-full border-collapse absolute top-0 left-0" style={{ transform: `translateY(${virtualRow.start}px)` }}>
                                        <tbody>
                                            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b">
                                                <td className="py-2 px-4 text-[10px] font-mono text-slate-400 border-r w-12 shrink-0">{virtualRow.index + 1}</td>
                                                {row.getVisibleCells().map(cell => (
                                                    <td key={cell.id} className="py-2 px-4 text-xs text-slate-700 dark:text-slate-300 border-r overflow-hidden">
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </table>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t flex justify-between items-center text-[10px] font-medium text-slate-500">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5">
                                <Database className="h-3 w-3" /> {data.length} Sample Rows
                            </span>
                            <span className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
                            <span>Virtual View Enabled</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>Page 1 of 1</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Right Panel - Column Inspector */}
            {showInspector && (
                <Card className="w-[300px] border-none shadow-lg animate-in slide-in-from-right-4 duration-300 bg-white dark:bg-slate-900 flex flex-col">
                    <CardHeader className="border-b pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Inspector</CardTitle>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowInspector(false)}>
                                <PanelRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-y-auto no-scrollbar">
                        {selectedColumn ? (
                            <div className="p-5 space-y-6">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold truncate">{selectedColumn}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold uppercase">String</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b pb-2">Quick insights</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500">Unique Values</span>
                                            <span className="font-semibold">Calculating...</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500">Missing Rate</span>
                                            <span className="font-semibold text-emerald-500">0.0%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-xs flex items-start gap-2 border border-indigo-100 dark:border-indigo-900/30">
                                    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                    <p>Detailed analysis for this column is available in the **Distributions** tab.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 text-center h-full space-y-3">
                                <ColumnsIcon className="h-10 w-10 text-slate-200" />
                                <p className="text-xs text-slate-400">Click a column header to inspect metadata and statistics.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default PreviewTab;
