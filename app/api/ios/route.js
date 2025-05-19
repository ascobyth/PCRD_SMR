import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Io from '@/models/Io';

export async function GET() {
  try {
    await dbConnect();
    const ios = await Io.find({})
      .sort({ ioNo: 1 });

    return NextResponse.json({ success: true, data: ios }, { status: 200 });
  } catch (error) {
    console.error('Error fetching IOs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch IOs' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();

    // Create a new IO
    const io = await Io.create(body);

    return NextResponse.json({ success: true, data: io }, { status: 201 });
  } catch (error) {
    console.error('Error creating IO:', error);

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
        { success: false, error: 'An IO with that number already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create IO' },
      { status: 500 }
    );
  }
}
