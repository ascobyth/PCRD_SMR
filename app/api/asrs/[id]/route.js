import { NextResponse } from 'next/server';
import connectToDatabase, { mongoose } from '@/lib/db';

// Import models
const AsrList = mongoose.models.AsrList || require('@/models/AsrList');
const Capability = mongoose.models.Capability || require('@/models/Capability');
const User = mongoose.models.User ? mongoose.models.User : require('@/models/User').User;

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = params;
    
    // Validate the ID
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ASR ID is required' },
        { status: 400 }
      );
    }
    
    // Log the ID we're looking up for debugging
    console.log('Looking up ASR with ID:', id);
    
    // Try to find by MongoDB ID first
    let asr;
    if (id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
      try {
        asr = await AsrList.findById(id);
        console.log('Search by MongoDB ID result:', asr ? 'Found' : 'Not found');
      } catch (e) {
        console.error('Error finding ASR by ID:', e);
      }
    }
    
    // If not found by ID, try to find by ASR number
    if (!asr) {
      try {
        asr = await AsrList.findOne({ asrNumber: id });
        console.log('Search by ASR number result:', asr ? 'Found' : 'Not found');
      } catch (e) {
        console.error('Error finding ASR by number:', e);
      }
    }
    
    // If still not found, try a case-insensitive search 
    if (!asr) {
      try {
        asr = await AsrList.findOne({ 
          asrNumber: { $regex: new RegExp('^' + id + '$', 'i') } 
        });
        console.log('Search by case-insensitive ASR number result:', asr ? 'Found' : 'Not found');
      } catch (e) {
        console.error('Error in case-insensitive search:', e);
      }
    }
    
    if (!asr) {
      return NextResponse.json(
        { success: false, error: 'ASR not found' },
        { status: 404 }
      );
    }
    
    // Fetch additional data
    let capabilityData = null;
    if (asr.capabilityId) {
      try {
        capabilityData = await Capability.findById(asr.capabilityId);
      } catch (e) {
        console.error('Error finding capability:', e);
      }
    }
    
    // Try to find experts for this capability
    let experts = [];
    if (capabilityData) {
      try {
        // Find users with this capability in their capabilities array
        experts = await User.find({
          capabilities: asr.capabilityId,
          role: { $in: ['EngineerResearcher', 'SeniorEngineerSeniorResearcher'] }
        })
        .select('name email position department')
        .limit(3);
      } catch (e) {
        console.error('Error finding experts:', e);
      }
    }
    
    // Parse the sample list from JSON string
    let samples = [];
    try {
      if (asr.asrSampleList) {
        samples = JSON.parse(asr.asrSampleList);
      }
    } catch (e) {
      console.error('Error parsing sample list:', e);
    }
    
    // Format the response
    const response = {
      asrId: asr._id.toString(),
      asrNumber: asr.asrNumber,
      asrName: asr.asrName,
      asrType: asr.asrType,
      asrStatus: asr.asrStatus,
      asrDetail: asr.asrDetail,
      requesterName: asr.requesterName,
      requesterEmail: asr.requesterEmail,
      submissionDate: asr.createdAt,
      capability: capabilityData ? {
        id: capabilityData._id.toString(),
        name: capabilityData.capabilityName,
        shortName: capabilityData.shortName
      } : null,
      samples,
      experts: experts.map(expert => ({
        name: expert.name,
        email: expert.email,
        position: expert.position || 'Researcher',
        department: expert.department || 'PCRD'
      })),
      estimatedReviewCompletion: new Date(asr.createdAt.getTime() + 2 * 24 * 60 * 60 * 1000) // 2 days after submission
    };
    
    return NextResponse.json({ success: true, data: response }, { status: 200 });
  } catch (error) {
    console.error('Error retrieving ASR:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve ASR details' },
      { status: 500 }
    );
  }
}
