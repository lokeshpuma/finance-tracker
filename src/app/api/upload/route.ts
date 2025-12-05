import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { GridFSBucket, ObjectId } from 'mongodb';

// Configure route for file uploads (Next.js 15 App Router)
export const maxDuration = 60; // 60 seconds timeout for file uploads

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const transactionId = formData.get('transactionId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type (optional - allow common file types)
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'File type not allowed' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const bucket = new GridFSBucket(db, { bucketName: 'files' });

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload file to GridFS
    const uploadStream = bucket.openUploadStream(file.name, {
      metadata: {
        transactionId: transactionId || null,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        uploadedAt: new Date(),
      },
    });

    return new Promise((resolve) => {
      uploadStream.end(buffer);

      uploadStream.on('finish', () => {
        resolve(
          NextResponse.json({
            success: true,
            data: {
              fileId: uploadStream.id.toString(),
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
            },
          })
        );
      });

      uploadStream.on('error', (error) => {
        console.error('File upload error:', error);
        resolve(
          NextResponse.json(
            { success: false, error: 'Failed to upload file' },
            { status: 500 }
          )
        );
      });
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const bucket = new GridFSBucket(db, { bucketName: 'files' });

    // Check if file exists
    const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
    
    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    const file = files[0];
    const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    downloadStream.on('data', (chunk) => chunks.push(chunk));
    
    return new Promise((resolve) => {
      downloadStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(
          new NextResponse(buffer, {
            headers: {
              'Content-Type': file.metadata?.mimeType || 'application/octet-stream',
              'Content-Disposition': `inline; filename="${file.filename}"`,
              'Content-Length': file.length.toString(),
            },
          })
        );
      });

      downloadStream.on('error', (error) => {
        console.error('File download error:', error);
        resolve(
          NextResponse.json(
            { success: false, error: 'Failed to download file' },
            { status: 500 }
          )
        );
      });
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to download file' },
      { status: 500 }
    );
  }
}

