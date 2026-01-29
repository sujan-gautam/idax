/**
 * PREVIEW TAB - Raw Data Table Preview
 * Standard tier feature, but accessible for basic inspection
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table as TableIcon, Search, FileJson, FileSpreadsheet } from 'lucide-react';
import { api } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface PreviewTabProps {
    datasetId: string;
}

export const PreviewTab: React.FC<PreviewTabProps> = ({ datasetId }) => {
    const { data: preview, isLoading, error } = useQuery<any[]>({
        queryKey: ['dataset-preview', datasetId],
        queryFn: async () => {
            const response = await api.get(`/datasets/${datasetId}/preview`);
            return response.data;
        }
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="skeleton-loader h-8 w-64" />
                <div className="skeleton-loader h-[500px] w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-64 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/10">
                <div className="text-center">
                    <p className="text-red-600 dark:text-red-400 font-medium">Failed to load data preview</p>
                    <p className="text-sm text-neutral-500">The file might be corrupted or inaccessible.</p>
                </div>
            </div>
        );
    }

    if (!preview || preview.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <div className="text-center">
                    <TableIcon className="mx-auto h-12 w-12 text-neutral-400" />
                    <p className="mt-4 text-neutral-600 dark:text-neutral-400">No data available to preview</p>
                </div>
            </div>
        );
    }

    const headers = Object.keys(preview[0]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-0">Data Preview</h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        First 100 rows of the processed dataset
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <FileJson className="h-4 w-4" />
                        Export JSON
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            <Card className="border-none bg-white dark:bg-neutral-900 overflow-hidden">
                <CardHeader className="border-b border-neutral-200 dark:border-neutral-800 flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <TableIcon className="h-5 w-5 text-indigo-600" />
                        Raw Data Inspection
                    </CardTitle>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Filter rows..."
                            className="h-9 w-64 rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="max-h-[600px] overflow-auto">
                        <table className="data-table w-full text-left text-sm">
                            <thead className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-950">
                                <tr>
                                    {headers.map(header => (
                                        <th key={header} className="whitespace-nowrap px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-0 border-b border-neutral-200 dark:border-neutral-800">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {preview.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                        {headers.map(header => (
                                            <td key={`${idx}-${header}`} className="whitespace-nowrap px-4 py-3 text-neutral-600 dark:text-neutral-400">
                                                {row[header] === null || row[header] === undefined ?
                                                    <span className="text-neutral-300 italic">null</span> :
                                                    String(row[header])
                                                }
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
