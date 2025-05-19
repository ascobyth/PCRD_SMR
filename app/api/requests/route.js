import { NextResponse } from 'next/server';
import connectToDatabase, { mongoose } from '@/lib/db';

// Use the RequestList model instead of Request
const RequestList = mongoose.models.RequestList || require('@/models/RequestList');

export async function GET() {
  try {
    await connectToDatabase();
    const requests = await RequestList.find({})
      .sort({ requestNumber: 1 });

    return NextResponse.json({ success: true, data: requests }, { status: 200 });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    console.log('API received request data:', body);

    // Create a new request
    const newRequest = await RequestList.create(body);
    console.log('Created request:', newRequest);

    return NextResponse.json({ success: true, data: newRequest }, { status: 201 });
  } catch (error) {
    console.error('Error creating request:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { success: false, error: validationErrors.join(', ') },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'A request with that number already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create request' },
      { status: 500 }
    );
  }
}
