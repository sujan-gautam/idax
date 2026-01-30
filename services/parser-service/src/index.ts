import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import express from 'express';
import { logger } from '@project-ida/logger';
import { prisma } from '@project-ida/db';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const app = express();
const PORT = process.env.PORT || 8003;

app.use(express.json());

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.AWS_S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'password'
    }
});
const BUCKET = process.env.S3_BUCKET_NAME || 'project-ida-uploads';

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'parser' });
});

// ============================================================================
// PARSER - REAL ALGORITHMS
// ============================================================================

/**
 * Parse uploaded file and create dataset version
 * Supports: CSV, XLSX, JSON
 */
app.post('/jobs/parse', async (req, res) => {
    try {
        const { uploadId } = req.body;

        if (!uploadId) {
            return res.status(400).json({ error: 'Upload ID required' });
        }

        // Get upload record
        const upload = await prisma.upload.findUnique({
            where: { id: uploadId },
            include: { dataset: true }
        });

        if (!upload) {
            return res.status(404).json({ error: 'Upload not found' });
        }

        logger.info({ uploadId, s3Key: upload.s3Key }, 'Starting parse job');

        // Download file from S3 with local fallback
        let fileBuffer: Uint8Array | undefined;
        try {
            const getCommand = new GetObjectCommand({
                Bucket: BUCKET,
                Key: upload.s3Key
            });
            const s3Response = await s3Client.send(getCommand);
            fileBuffer = await s3Response.Body?.transformToByteArray();
            logger.info({ s3Key: upload.s3Key }, 'Downloaded from S3');
        } catch (s3Err: any) {
            logger.warn({ s3Key: upload.s3Key }, 'S3 download failed, trying local fallback');
            try {
                // Try to get from upload-service local storage
                const uploadUrl = process.env.UPLOAD_SERVICE_URL || 'http://localhost:8002';
                const localRes = await fetch(`${uploadUrl}/local-s3/${upload.s3Key}`);
                if (!localRes.ok) throw new Error(`Local fallback failed: ${localRes.statusText}`);
                fileBuffer = new Uint8Array(await localRes.arrayBuffer());
                logger.info({ s3Key: upload.s3Key }, 'Downloaded from local storage fallback');
            } catch (fallbackErr: any) {
                logger.error({ fallbackErr }, 'Local fallback also failed');
                throw new Error(`S3 download and local fallback failed: ${s3Err.message}`);
            }
        }

        if (!fileBuffer) {
            throw new Error('Failed to download file: Body is empty');
        }

        // Parse based on content type
        let parsedData: any[];
        let schema: any;

        if (upload.contentType.includes('csv') || upload.filename.endsWith('.csv')) {
            const result = parseCSV(Buffer.from(fileBuffer).toString('utf-8'));
            parsedData = result.data;
            schema = result.schema;
        } else if (upload.contentType.includes('spreadsheet') || upload.filename.endsWith('.xlsx')) {
            const result = parseXLSX(fileBuffer);
            parsedData = result.data;
            schema = result.schema;
        } else if (upload.contentType.includes('json') || upload.filename.endsWith('.json')) {
            const result = parseJSON(Buffer.from(fileBuffer).toString('utf-8'));
            parsedData = result.data;
            schema = result.schema;
        } else {
            logger.error({ contentType: upload.contentType, filename: upload.filename }, 'Unsupported file type');
            throw new Error(`Unsupported file type: ${upload.contentType}`);
        }

        if (!parsedData || parsedData.length === 0) {
            logger.warn({ uploadId }, 'Parsed data is empty');
        }

        logger.info({
            uploadId,
            rowCount: parsedData.length,
            columnCount: schema.columns.length
        }, 'File parsed successfully');

        // Store parsed data in S3 with local fallback
        const artifactKey = `tenants/${upload.tenantId}/parsed/${upload.datasetId}/${Date.now()}.json`;

        try {
            const putCommand = new PutObjectCommand({
                Bucket: BUCKET,
                Key: artifactKey,
                Body: JSON.stringify(parsedData),
                ContentType: 'application/json'
            });
            await s3Client.send(putCommand);
            logger.info({ artifactKey }, 'Parsed data stored in S3');
        } catch (putErr: any) {
            logger.warn({ artifactKey }, 'S3 store failed, trying local fallback');
            try {
                const uploadUrl = process.env.UPLOAD_SERVICE_URL || 'http://localhost:8002';
                const localRes = await fetch(`${uploadUrl}/local-s3/${artifactKey}`, {
                    method: 'PUT',
                    body: JSON.stringify(parsedData)
                });
                if (!localRes.ok) throw new Error(`Local store failed: ${localRes.statusText}`);
                logger.info({ artifactKey }, 'Parsed data stored in local storage fallback');
            } catch (fallbackErr: any) {
                logger.error({ fallbackErr }, 'Local store fallback failed');
                throw new Error(`S3 store and local fallback failed: ${putErr.message}`);
            }
        }

        if (!upload.datasetId) {
            throw new Error('Upload is not associated with a dataset');
        }

        // Create dataset version
        const latestVersion = await prisma.datasetVersion.findFirst({
            where: { datasetId: upload.datasetId },
            orderBy: { versionNumber: 'desc' }
        });

        const versionNumber = (latestVersion?.versionNumber || 0) + 1;

        const version = await prisma.datasetVersion.create({
            data: {
                datasetId: upload.datasetId,
                versionNumber,
                artifactS3Key: artifactKey,
                schemaJson: schema,
                sourceType: 'UPLOAD',
                sourceId: uploadId,
                rowCount: parsedData.length,
                columnCount: schema.columns.length
            }
        });

        // Update dataset active version
        await prisma.dataset.update({
            where: { id: upload.datasetId },
            data: { activeVersionId: version.id }
        });

        logger.info({
            uploadId,
            versionId: version.id,
            versionNumber
        }, 'Dataset version created');

        // Trigger EDA service
        const edaUrl = process.env.EDA_SERVICE_URL || 'http://localhost:8004';
        fetch(`${edaUrl}/jobs/eda`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ versionId: version.id })
        }).catch(err => logger.error({ err }, 'Failed to trigger EDA'));

        res.json({
            success: true,
            versionId: version.id,
            rowCount: parsedData.length,
            columnCount: schema.columns.length
        });

    } catch (error: any) {
        logger.error({ error: error.message, uploadId: req.body.uploadId }, 'Parse job failed');
        res.status(500).json({ error: 'Parse failed', message: error.message });
    }
});

// ============================================================================
// PARSING FUNCTIONS - REAL ALGORITHMS
// ============================================================================

/**
 * Parse CSV with schema inference
 */
function parseCSV(content: string): { data: any[], schema: any } {
    const parseResult = Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false // We'll do our own type inference
    });

    if (parseResult.errors.length > 0) {
        logger.warn({ errors: parseResult.errors }, 'CSV parse warnings');
    }

    const data = parseResult.data;
    const columns = parseResult.meta.fields || [];

    // Infer schema
    const schema = inferSchema(data, columns);

    return { data, schema };
}

/**
 * Parse XLSX with schema inference
 */
function parseXLSX(buffer: Uint8Array): { data: any[], schema: any } {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

    const data = XLSX.utils.sheet_to_json(firstSheet);
    const columns = Object.keys(data[0] || {});

    // Infer schema
    const schema = inferSchema(data, columns);

    return { data, schema };
}

/**
 * Parse JSON with schema inference
 */
function parseJSON(content: string): { data: any[], schema: any } {
    let parsed = JSON.parse(content);

    // Intelligent Unwrapping for Project IDA / MongoDB / Mongoose exports
    // If we have a single object with internal data arrays, use those instead
    if (!Array.isArray(parsed) && typeof parsed === 'object' && parsed !== null) {
        const dataKeys = ['rawData', 'data', 'results', 'rows', 'preprocessedData', 'items'];
        for (const key of dataKeys) {
            const val = parsed[key];

            // Handle actual arrays
            if (Array.isArray(val) && val.length > 0) {
                logger.info({ key }, 'Unwrapped nested JSON array');
                parsed = val;
                break;
            }

            // Handle stringified arrays (common in Mongoose/IDA exports)
            if (typeof val === 'string' && (val.trim().startsWith('[') || val.trim().startsWith('{'))) {
                try {
                    const nested = JSON.parse(val);
                    if (Array.isArray(nested) && nested.length > 0) {
                        logger.info({ key }, 'Parsed and unwrapped stringified JSON array');
                        parsed = nested;
                        break;
                    }
                } catch (e) {
                    // Not valid JSON or not an array, continue
                }
            }
        }
    }

    const data = Array.isArray(parsed) ? parsed : [parsed];
    const columns = Object.keys(data[0] || {});

    // Infer schema
    const schema = inferSchema(data, columns);

    return { data, schema };
}

/**
 * REAL SCHEMA INFERENCE ALGORITHM
 * Detects: string, number, boolean, date, null
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

            // Check boolean
            if (value === true || value === false || value === 'true' || value === 'false') {
                types.boolean++;
                continue;
            }

            // Check number
            if (!isNaN(Number(value)) && value !== '') {
                types.number++;
                continue;
            }

            // Check date
            if (isValidDate(value)) {
                types.date++;
                continue;
            }

            // Default to string
            types.string++;
        }

        // Determine dominant type
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

        // Calculate statistics
        const uniqueValues = new Set(values);
        const cardinality = uniqueValues.size;
        const nullRatio = nullCount / data.length;

        return {
            name,
            type: inferredType,
            nullable: nullCount > 0,
            nullCount,
            nullRatio: Math.round(nullRatio * 10000) / 100, // percentage
            cardinality,
            uniqueRatio: Math.round((cardinality / (data.length - nullCount)) * 10000) / 100,
            sampleValues: Array.from(uniqueValues).slice(0, 5)
        };
    });

    return {
        columns,
        rowCount: data.length,
        columnCount: columns.length
    };
}

/**
 * Check if value is a valid date
 */
function isValidDate(value: any): boolean {
    if (typeof value !== 'string') return false;

    // Common date patterns
    const datePatterns = [
        /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
        /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
        /^\d{2}-\d{2}-\d{4}$/,  // DD-MM-YYYY
    ];

    if (!datePatterns.some(pattern => pattern.test(value))) {
        return false;
    }

    const date = new Date(value);
    return !isNaN(date.getTime());
}

app.listen(PORT, () => {
    logger.info(`Parser Service running on port ${PORT}`);
});
