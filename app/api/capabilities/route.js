import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Capability from '@/models/Capability';

export async function GET() {
  try {
    await dbConnect();
    const capabilities = await Capability.find({})
      .populate({
        path: 'capHeadGroup',
        select: 'name username email position department division'
      })
      .populate('locationId') // Populate the locationId field
      .sort({ capabilityName: 1 });

    return NextResponse.json({ success: true, data: capabilities }, { status: 200 });
  } catch (error) {
    console.error('Error fetching capabilities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch capabilities' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();

    // Create a new capability
    const capability = await Capability.create(body);

    return NextResponse.json({ success: true, data: capability }, { status: 201 });
  } catch (error) {
    console.error('Error creating capability:', error);

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
        { success: false, error: 'A capability with that name already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create capability' },
      { status: 500 }
    );
  }
}
