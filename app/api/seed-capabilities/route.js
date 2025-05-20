import { NextResponse } from 'next/server';
import connectToDatabase, { mongoose } from '@/lib/db';

// Initialize capabilities data
const defaultCapabilities = [
  {
    capabilityName: "Rheology",
    shortName: "RHE",
    capabilityDesc: "Rheological characterization of polymer materials",
    reqRunNo: 1,
    reqAsrRunNo: "1"
  },
  {
    capabilityName: "Microstructure",
    shortName: "MIC",
    capabilityDesc: "Microstructure analysis of polymer materials",
    reqRunNo: 1,
    reqAsrRunNo: "1"
  },
  {
    capabilityName: "Small Molecule",
    shortName: "SMO",
    capabilityDesc: "Small molecule analysis and characterization",
    reqRunNo: 1,
    reqAsrRunNo: "1"
  },
  {
    capabilityName: "Mesostructure & Imaging",
    shortName: "MES",
    capabilityDesc: "Mesostructure analysis and imaging of polymer materials",
    reqRunNo: 1,
    reqAsrRunNo: "1"
  }
];

export async function GET() {
  try {
    await connectToDatabase();
    
    // Dynamically load the Capability model
    const Capability = mongoose.models.Capability || require('@/models/Capability');
    
    // Check for existing capabilities
    const existingCapabilities = await Capability.find({});
    console.log(`Found ${existingCapabilities.length} existing capabilities`);
    
    // If no capabilities exist, create the default ones
    if (existingCapabilities.length === 0) {
      console.log('No capabilities found. Creating default capabilities...');
      
      const createdCapabilities = await Capability.insertMany(defaultCapabilities);
      console.log(`Created ${createdCapabilities.length} default capabilities`);
      
      return NextResponse.json({
        success: true,
        message: 'Default capabilities created successfully',
        data: createdCapabilities
      }, { status: 201 });
    }
    
    // Create any missing capabilities based on shortName
    const missingCapabilities = [];
    for (const defaultCap of defaultCapabilities) {
      const existingCap = existingCapabilities.find(
        cap => cap.shortName.toUpperCase() === defaultCap.shortName.toUpperCase()
      );
      
      if (!existingCap) {
        missingCapabilities.push(defaultCap);
      }
    }
    
    if (missingCapabilities.length > 0) {
      console.log(`Creating ${missingCapabilities.length} missing capabilities...`);
      const createdMissingCapabilities = await Capability.insertMany(missingCapabilities);
      console.log(`Created ${createdMissingCapabilities.length} missing capabilities`);
      
      return NextResponse.json({
        success: true,
        message: 'Missing capabilities created successfully',
        data: [...existingCapabilities, ...createdMissingCapabilities]
      }, { status: 201 });
    }
    
    // Return all capabilities
    return NextResponse.json({
      success: true,
      data: existingCapabilities
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error seeding capabilities:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to seed capabilities'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    
    // Dynamically load the Capability model
    const Capability = mongoose.models.Capability || require('@/models/Capability');
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.capabilityName || !body.shortName) {
      return NextResponse.json({
        success: false,
        error: 'Capability name and shortName are required'
      }, { status: 400 });
    }
    
    // Prepare data with default values if not provided
    const capabilityData = {
      capabilityName: body.capabilityName,
      shortName: body.shortName.toUpperCase(), // Ensure uppercase shortName
      capabilityDesc: body.capabilityDesc || "",
      reqRunNo: body.reqRunNo || 1,
      reqAsrRunNo: body.reqAsrRunNo || "1"
    };
    
    // Check if capability with same shortName already exists
    const existingCapability = await Capability.findOne({ 
      shortName: { $regex: new RegExp(`^${capabilityData.shortName}$`, 'i') }
    });
    
    if (existingCapability) {
      return NextResponse.json({
        success: false,
        error: `Capability with shortName ${capabilityData.shortName} already exists`
      }, { status: 400 });
    }
    
    // Create new capability
    const newCapability = await Capability.create(capabilityData);
    console.log(`Created new capability: ${capabilityData.capabilityName} (${capabilityData.shortName})`);
    
    return NextResponse.json({
      success: true,
      data: newCapability
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating capability:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create capability'
    }, { status: 500 });
  }
}
