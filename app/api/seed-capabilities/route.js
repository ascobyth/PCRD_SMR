import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Capability from '@/models/Capability';

export async function GET() {
  try {
    await dbConnect();
    
    // Check if there are already capabilities
    const existingCapabilities = await Capability.countDocuments();
    
    if (existingCapabilities > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Capabilities already exist', 
        count: existingCapabilities 
      }, { status: 200 });
    }
    
    // Sample capabilities
    const sampleCapabilities = [
      {
        capabilityName: 'Microstructure Analysis',
        shortName: 'Micro',
        capabilityDesc: 'Analysis of material microstructure using various techniques'
      },
      {
        capabilityName: 'Mechanical Testing',
        shortName: 'Mech',
        capabilityDesc: 'Testing of mechanical properties of materials'
      },
      {
        capabilityName: 'Chemical Analysis',
        shortName: 'Chem',
        capabilityDesc: 'Analysis of chemical composition of materials'
      },
      {
        capabilityName: 'Thermal Analysis',
        shortName: 'Therm',
        capabilityDesc: 'Analysis of thermal properties of materials'
      },
      {
        capabilityName: 'Surface Analysis',
        shortName: 'Surf',
        capabilityDesc: 'Analysis of surface properties of materials'
      }
    ];
    
    // Insert sample capabilities
    const result = await Capability.insertMany(sampleCapabilities);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Sample capabilities created', 
      data: result 
    }, { status: 201 });
  } catch (error) {
    console.error('Error seeding capabilities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed capabilities' },
      { status: 500 }
    );
  }
}
