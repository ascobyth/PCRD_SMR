import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import TestingMethod from '@/models/TestingMethod';

export async function GET() {
  try {
    await dbConnect();
    // Try to fetch test methods with population, but handle the case where related models don't exist
    let testMethods;
    try {
      testMethods = await TestingMethod.find({})
        .populate({
          path: 'locationId',
          select: 'locationId sublocation contactPerson'
        })
        .populate({
          path: 'capabilityId',
          select: 'capabilityName shortName'
        })
        .sort({ methodCode: 1 });
    } catch (error) {
      console.warn('Error populating test methods:', error.message);
      // Fall back to fetching without population
      testMethods = await TestingMethod.find({}).sort({ methodCode: 1 });
    }

    // Log the image data for debugging
    testMethods.forEach(method => {
      // Ensure the images object exists
      if (!method.images) {
        method.images = { description: '', keyResult: '' };
      }

      // If descriptionImg exists but images.description doesn't, copy it over
      if (method.descriptionImg && !method.images.description) {
        method.images.description = method.descriptionImg;
      }

      // If keyResultImg exists but images.keyResult doesn't, copy it over
      if (method.keyResultImg && !method.images.keyResult) {
        method.images.keyResult = method.keyResultImg;
      }

      console.log(`API: Test method ${method.methodCode} image data:`, {
        descriptionImg: method.descriptionImg,
        keyResultImg: method.keyResultImg,
        images: method.images
      });
    });

    return NextResponse.json({ success: true, data: testMethods }, { status: 200 });
  } catch (error) {
    console.error('Error fetching test methods:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch test methods' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    console.log('API received test method data:', body);

    // Log the capability field
    console.log('API: Capability field in request:', {
      capabilityId: body.capabilityId,
      capabilityIdType: typeof body.capabilityId
    });

    // Ensure the images object exists
    if (!body.images) {
      body.images = { description: '', keyResult: '' };
    }

    // If descriptionImg exists but images.description doesn't, copy it over
    if (body.descriptionImg && !body.images.description) {
      body.images.description = body.descriptionImg;
    }

    // If keyResultImg exists but images.keyResult doesn't, copy it over
    if (body.keyResultImg && !body.images.keyResult) {
      body.images.keyResult = body.keyResultImg;
    }

    // Handle empty capability field
    if (body.capabilityId === "" || body.capabilityId === "none") {
      console.log('API: Setting empty or "none" capabilityId to null');
      body.capabilityId = null;
    }

    // Create a new test method
    const testMethod = await TestingMethod.create(body);
    console.log('Created test method:', testMethod);

    return NextResponse.json({ success: true, data: testMethod }, { status: 201 });
  } catch (error) {
    console.error('Error creating test method:', error);

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
        { success: false, error: 'A test method with that code already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create test method' },
      { status: 500 }
    );
  }
}
