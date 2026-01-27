import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand, CreateBucketCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '@project-ida/logger';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'password'
    },
    // For local dev with LocalStack or MinIO, use endpoint
    endpoint: process.env.AWS_S3_ENDPOINT,
    forcePathStyle: true, // MinIO requires this
    requestChecksumCalculation: "WHEN_REQUIRED", // Avoid automatic checksums that cause 403
    responseChecksumValidation: "WHEN_REQUIRED",
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'project-ida-uploads';

/**
 * INITIALIZE BUCKET - Create if not exists and set CORS
 */
export const initS3 = async () => {
    try {
        // Check if bucket exists
        try {
            await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
            logger.info({ bucket: BUCKET_NAME }, 'S3 Bucket already exists');
        } catch (err: any) {
            if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
                logger.info({ bucket: BUCKET_NAME }, 'S3 Bucket not found, creating...');
                await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
                logger.info({ bucket: BUCKET_NAME }, 'S3 Bucket created successfully');
            } else {
                throw err;
            }
        }

        // Set CORS policy (Crucial for browser uploads)
        await s3Client.send(new PutBucketCorsCommand({
            Bucket: BUCKET_NAME,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: ['*'],
                        AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                        AllowedOrigins: ['*'], // In production, restrict this to your domain
                        ExposeHeaders: ['ETag'],
                        MaxAgeSeconds: 3600
                    }
                ]
            }
        }));
        logger.info({ bucket: BUCKET_NAME }, 'S3 CORS policy applied');
        logger.info('S3 Gateway Initialization Complete');

    } catch (error) {
        logger.error({ error, bucket: BUCKET_NAME }, 'Failed to initialize S3');
    }
};

export const generatePresignedUploadUrl = async (key: string, _contentType: string) => {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });
    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

export const generatePresignedDownloadUrl = async (key: string) => {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
    });
    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
