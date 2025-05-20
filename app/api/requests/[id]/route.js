import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import mongoose from 'mongoose';

// Import models directly from the models directory
const RequestList = mongoose.models.RequestList || require('@/models/RequestList');
const ErList = mongoose.models.ErList || require('@/models/ErList');

export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    
    // Try to find in RequestList first
    let requestData = await RequestList.findById(id);
    
    // If not found, try in ErList
    if (!requestData) {
      requestData = await ErList.findById(id);
    }

    if (!requestData) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: requestData }, { status: 200 });
  } catch (error) {
    console.error('Error fetching request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch request' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    const body = await request.json();
    
    // Determine which model to use based on the request type
    const isErRequest = body.requestNumber && body.requestNumber.includes('-ER-');
    const Model = isErRequest ? ErList : RequestList;

    const updatedRequest = await Model.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true
    });

    if (!updatedRequest) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedRequest }, { status: 200 });
  } catch (error) {
    console.error('Error updating request:', error);

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
      { success: false, error: 'Failed to update request' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    
    // Try to delete from RequestList first
    let deletedRequest = await RequestList.findByIdAndDelete(id);
    
    // If not found, try in ErList
    if (!deletedRequest) {
      deletedRequest = await ErList.findByIdAndDelete(id);
    }

    if (!deletedRequest) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: {} }, { status: 200 });
  } catch (error) {
    console.error('Error deleting request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete request' },
      { status: 500 }
    );
  }
}
