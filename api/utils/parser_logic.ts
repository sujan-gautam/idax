import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { logger } from '@project-ida/logger';

/**
 * Infer schema from data
 */
function inferSchema(data: any[], columnNames: string[]): any {
    const columns = columnNames.map(name => {
        const values = data.map(row => row[name]).filter(v => v !== null && v !== undefined && v !== '');

        const types = {
            number: 0,
            boolean: 0,
            date: 0,
            string: 0
        };

        let nullCount = 0;

        for (const row of data) {
            const value = row[name];

            if (value === null || value === undefined || value === '') {
                nullCount++;
                continue;
            }

            if (value === true || value === false || value === 'true' || value === 'false') {
                types.boolean++;
                continue;
            }

            if (!isNaN(Number(value)) && value !== '') {
                types.number++;
                continue;
            }

            if (isValidDate(value)) {
                types.date++;
                continue;
            }

            types.string++;
        }

        const total = data.length - nullCount;
        let inferredType = 'string';

        if (total > 0) {
            if (types.number > total * 0.8) {
                inferredType = 'number';
            } else if (types.boolean > total * 0.8) {
                inferredType = 'boolean';
            } else if (types.date > total * 0.8) {
                inferredType = 'date';
            }
        }

        const uniqueValues = new Set(values);
        const cardinality = uniqueValues.size;
        const nullRatio = nullCount / data.length;

        return {
            name,
            type: inferredType,
            nullable: nullCount > 0,
            nullCount,
            nullRatio: Math.round(nullRatio * 10000) / 100,
            cardinality,
            uniqueRatio: Math.round((cardinality / Math.max(data.length - nullCount, 1)) * 10000) / 100,
            sampleValues: Array.from(uniqueValues).slice(0, 5)
        };
    });

    return {
        columns,
        rowCount: data.length,
        columnCount: columns.length
    };
}

function isValidDate(value: any): boolean {
    if (typeof value !== 'string') return false;
    const datePatterns = [
        /^\d{4}-\d{2}-\d{2}$/,
        /^\d{2}\/\d{2}\/\d{4}$/,
        /^\d{2}-\d{2}-\d{4}$/,
    ];
    if (!datePatterns.some(pattern => pattern.test(value))) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
}

export function parseCSV(content: string): { data: any[], schema: any } {
    const parseResult = Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false
    });
    const data = parseResult.data;
    const columns = parseResult.meta.fields || [];
    return { data, schema: inferSchema(data, columns) };
}

export function parseXLSX(buffer: Buffer): { data: any[], schema: any } {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet);
    const columns = Object.keys(data[0] || {});
    return { data, schema: inferSchema(data, columns) };
}

export function parseJSON(content: string): { data: any[], schema: any } {
    let parsed = JSON.parse(content);
    if (!Array.isArray(parsed) && typeof parsed === 'object' && parsed !== null) {
        const dataKeys = ['rawData', 'data', 'results', 'rows', 'preprocessedData', 'items'];
        for (const key of dataKeys) {
            const val = parsed[key];
            if (Array.isArray(val) && val.length > 0) {
                parsed = val;
                break;
            }
        }
    }
    const data = Array.isArray(parsed) ? parsed : [parsed];
    const columns = Object.keys(data[0] || {});
    return { data, schema: inferSchema(data, columns) };
}
