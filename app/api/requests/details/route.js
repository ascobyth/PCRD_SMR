import { NextResponse } from 'next/server';
import connectToDatabase, { mongoose } from '@/lib/db';

/**
 * API route handler for fetching request details by request number
 * @param {Request} request - The HTTP request object
 * @returns {Promise<NextResponse>} The HTTP response
 */
export async function GET(request) {
  try {
    // Connect to the database
    await connectToDatabase();

    // Get the request number from the URL query parameters
    const { searchParams } = new URL(request.url);
    const requestNumber = searchParams.get('requestNumber');

    if (!requestNumber) {
      return NextResponse.json(
        { success: false, error: 'Request number is required' },
        { status: 400 }
      );
    }

    console.log('Fetching request details for:', requestNumber);

    // Get the RequestList model
    const RequestList = mongoose.models.RequestList || require('@/models/RequestList');
    const TestingSampleList = mongoose.models.TestingSampleList || require('@/models/TestingSampleList');

    // Find the request by request number
    const requestData = await RequestList.findOne({ requestNumber }).lean();

    if (!requestData) {
      console.log('Request not found in database:', requestNumber);

      // For development purposes, return mock data
      return NextResponse.json({
        success: true,
        data: {
          originalRequestId: requestNumber,
          requestId: 'mock-id',
          requestTitle: 'Mock Request Title',
          submissionDate: new Date().toISOString().split('T')[0],
          requester: {
            name: 'John Doe',
            department: 'R&D',
            email: 'john.doe@example.com',
            phone: '123-456-7890'
          },
          splitRequests: [
            {
              requestId: `${requestNumber}-1`,
              capability: 'Mock Capability',
              methods: [
                {
                  id: 'mock-method-id',
                  name: 'Mock Method',
                  samples: ['Mock Sample 1', 'Mock Sample 2']
                }
              ],
              estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              capabilityInfo: {
                address: 'Laboratory Building',
                contactPerson: 'Lab Manager',
                contactEmail: 'lab@example.com',
                contactPhone: '123-456-7890'
              }
            }
          ],
          samples: [
            {
              id: 'mock-sample-id-1',
              name: 'Mock Sample 1',
              generatedName: 'Mock Sample 1',
              category: 'Mock Category'
            },
            {
              id: 'mock-sample-id-2',
              name: 'Mock Sample 2',
              generatedName: 'Mock Sample 2',
              category: 'Mock Category'
            }
          ],
          testMethods: [
            {
              id: 'mock-method-id',
              name: 'Mock Method',
              methodCode: 'MOCK-001',
              category: 'Mock Category',
              price: 100,
              turnaround: 7,
              samples: ['Mock Sample 1', 'Mock Sample 2']
            }
          ]
        }
      }, { status: 200 });
    }

    // Find all testing samples for this request
    const testingSamples = await TestingSampleList.find({
      requestNumber
    }).lean();

    // Parse the JSON strings in the request data
    let samples = [];
    let testMethods = [];

    try {
      if (requestData.jsonSampleList) {
        samples = JSON.parse(requestData.jsonSampleList);
      }

      if (requestData.jsonTestingList) {
        testMethods = JSON.parse(requestData.jsonTestingList);
      }
    } catch (error) {
      console.error('Error parsing JSON data:', error);
    }

    // Group testing samples by capability
    const capabilitiesMap = new Map();

    testingSamples.forEach(sample => {
      const capabilityId = sample.capabilityId ? sample.capabilityId.toString() : 'unknown';

      if (!capabilitiesMap.has(capabilityId)) {
        capabilitiesMap.set(capabilityId, {
          capabilityId,
          capability: 'Unknown Capability', // Will be updated if we have capability data
          methods: [],
          samples: new Set(),
          estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
          capabilityInfo: {
            address: 'Laboratory Building',
            contactPerson: 'Lab Manager',
            contactEmail: 'lab@example.com',
            contactPhone: '123-456-7890'
          }
        });
      }

      const capabilityGroup = capabilitiesMap.get(capabilityId);

      // Add the sample to the capability group
      capabilityGroup.samples.add(sample.sampleName);

      // Find the method in the capability group or add it
      let method = capabilityGroup.methods.find(m => m.id === sample.methodId);

      if (!method) {
        method = {
          id: sample.methodId,
          name: sample.methodCode || 'Unknown Method',
          samples: []
        };
        capabilityGroup.methods.push(method);
      }

      // Add the sample to the method if it's not already there
      if (!method.samples.includes(sample.sampleName)) {
        method.samples.push(sample.sampleName);
      }
    });

    // Convert the capabilities map to an array of split requests
    const splitRequests = Array.from(capabilitiesMap.values()).map((capabilityGroup, index) => {
      return {
        requestId: `${requestNumber}-${index + 1}`,
        capability: capabilityGroup.capability,
        methods: capabilityGroup.methods,
        estimatedCompletion: capabilityGroup.estimatedCompletion,
        capabilityInfo: capabilityGroup.capabilityInfo
      };
    });

    // Format the response
    const response = {
      originalRequestId: requestNumber,
      requestId: requestData._id.toString(),
      requestTitle: requestData.requestTitle,
      submissionDate: requestData.createdAt ? new Date(requestData.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      requester: {
        name: requestData.requesterName,
        department: 'R&D', // Default department
        email: requestData.requesterEmail,
        phone: '123-456-7890' // Default phone
      },
      splitRequests,
      samples,
      testMethods: testMethods.filter(method => !method.isDeleted)
    };

    return NextResponse.json({ success: true, data: response }, { status: 200 });
  } catch (error) {
    console.error('Error fetching request details:', error);

    // Log detailed error information
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch request details',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
