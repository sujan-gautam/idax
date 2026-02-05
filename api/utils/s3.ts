import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand, CreateBucketCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '@project-ida/logger';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'password'
    },
    endpoint: process.env.AWS_S3_ENDPOINT,
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'project-ida-uploads';

export let s3Available = false; // Default to false until proven otherwise

const getBaseUrl = () => {
    if (process.env.NODE_ENV === 'production') {
        const frontendUrl = process.env.FRONTEND_URL || '';
        return frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;
    }
    return `http://localhost:${process.env.PORT || 3000}`;
}

export const initS3 = async () => {
    try {
        await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
        logger.info({ bucket: BUCKET_NAME }, 'S3 Bucket connected');
        s3Available = true;
    } catch (err: any) {
        if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
            try {
                await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
                logger.info({ bucket: BUCKET_NAME }, 'S3 Bucket created');
                s3Available = true;
            } catch (createErr) {
                logger.error({ createErr }, 'S3 Bucket creation failed.');
                s3Available = false;
            }
        } else {
            logger.error({ err }, 'S3 is not available.');
            s3Available = false;
        }
    }

    if (s3Available) {
        try {
            await s3Client.send(new PutBucketCorsCommand({
                Bucket: BUCKET_NAME,
                CORSConfiguration: {
                    CORSRules: [
                        {
                            AllowedHeaders: ['*'],
                            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                            AllowedOrigins: ['*'],
                            ExposeHeaders: ['ETag'],
                            MaxAgeSeconds: 3600
                        }
                    ]
                }
            }));
            logger.info({ bucket: BUCKET_NAME }, 'S3 CORS policy applied');
        } catch (error) {
            logger.error({ error, bucket: BUCKET_NAME }, 'Failed to initialize S3 CORS');
        }
    } else {
        logger.warn('--- RUNNING IN LOCAL STORAGE MODE ---');
        logger.warn('Files will be saved to the local server disk.');
    }
};

export const generatePresignedUploadUrl = async (key: string, _contentType: string) => {
    if (!s3Available) {
        // Fallback to our own API
        const baseUrl = getBaseUrl();
        return `${baseUrl}/api/v1/uploads/local-s3/${key}`;
    }
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });
    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

export const generatePresignedDownloadUrl = async (key: string) => {
    if (!s3Available) {
        const baseUrl = getBaseUrl();
        return `${baseUrl}/api/v1/uploads/local-s3/${key}`;
    }
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
    });
    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
