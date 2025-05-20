import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import mongoose from 'mongoose';

// Import models directly from the models directory
const ErList = mongoose.models.ErList || require('@/models/ErList');
const TestingERList = mongoose.models.TestingERList || require('@/models/TestingERList');

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    console.log('API received ER submission data:', body);

    // Generate a unique request number (format: xx-ER-xxxx-000X)
    const currentYear = new Date().getFullYear();
    const year2Digits = currentYear.toString().slice(-2);
    const latestRequest = await ErList.findOne({
      requestNumber: { $regex: `${year2Digits}-ER-` }
    }).sort({ requestNumber: -1 });

    let requestNumber;
    if (latestRequest) {
      const parts = latestRequest.requestNumber.split('-');
      const lastPart = parts[3];
      const lastNumber = parseInt(lastPart);
      requestNumber = `${year2Digits}-ER-${currentYear}-${(lastNumber + 1).toString().padStart(4, '0')}`;
    } else {
      requestNumber = `${year2Digits}-ER-${currentYear}-0001`;
    }

    // Start a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create the main request entry
      const requestData = {
        requestNumber,
        requestStatus: 'submitted',
        requestTitle: body.requestTitle,
        useIoNumber: body.useIONumber === 'yes',
        ioCostCenter: body.ioNumber,
        requesterCostCenter: body.costCenter,
        priority: body.priority,
        urgentType: body.urgentType,
        urgencyReason: body.urgencyReason,
        requesterName: body.requester.name,
        requesterEmail: body.requester.email,
        jsonEquipmentList: JSON.stringify(body.equipment),
        reservationStartDate: body.reservationStartDate,
        reservationEndDate: body.reservationEndDate,
        notes: body.notes,
        submissionDate: new Date(),
      };

      const newRequest = await ErList.create([requestData], { session });
      const requestId = newRequest[0]._id;

      // Create testing ER entries for each equipment
      const testingERPromises = [];

      // Only process active (non-deleted) equipment
      const activeEquipment = body.equipment.filter(eq => !eq.isDeleted);

      for (const equipment of activeEquipment) {
        const testingERData = {
          requestId,
          requestNumber,
          equipmentId: equipment.id,
          equipmentName: equipment.name,
          reservationStartTime: new Date(equipment.startTime || body.reservationStartDate),
          reservationEndTime: new Date(equipment.endTime || body.reservationEndDate),
          reservationDuration: equipment.duration,
          reservationStatus: 'scheduled',
          reservedBy: body.requester.name,
          operatedBy: body.requester.name,
          remarks: equipment.remarks || '',
        };

        testingERPromises.push(TestingERList.create([testingERData], { session }));
      }

      // Wait for all testing ER entries to be created
      await Promise.all(testingERPromises);

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      return NextResponse.json({
        success: true,
        data: {
          requestNumber,
          requestId: requestId.toString()
        }
      }, { status: 201 });
    } catch (error) {
      // Abort the transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error submitting ER request:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

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

    // Handle model compilation errors
    if (error.message && error.message.includes('Schema hasn\'t been registered')) {
      return NextResponse.json(
        { success: false, error: 'Database schema error: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit ER request',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}