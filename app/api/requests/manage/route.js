import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import RequestList from "@/models/RequestList";
import AsrList from "@/models/AsrList";
import ErList from "@/models/ErList";
import Capability from "@/models/Capability";
import TestingSampleList from "@/models/TestingSampleList";

// Define capability categories directly in the file to avoid TypeScript import issues
const CAPABILITY_CATEGORIES = [
  { id: "rheology", name: "Rheology", shortName: "RE", icon: "Layers" },
  { id: "microstructure", name: "Microstructure", shortName: "MC", icon: "Microscope" },
  { id: "smallmolecules", name: "Small molecules", shortName: "SM", icon: "FlaskConical" },
  { id: "mesostructure", name: "Mesostructure", shortName: "ME", icon: "FlaskConical" },
  { id: "imaging", name: "Imaging", shortName: "IM", icon: "Beaker" }
];

// Constants for mapping request types
const REQUEST_TYPES = {
  NTR: "Standard Testing Request",
  ASR: "Advanced Service Request",
  ER: "Equipment Reservation"
};

/**
 * GET - Fetch requests with filters for the request management interface
 * Combines RequestList, AsrList, and ErList into a unified response
 */
export async function GET(request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const priority = searchParams.get("priority") || "all";
    const type = searchParams.get("type") || "all";
    const capability = searchParams.get("capability") || "all";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    await dbConnect();
    
    // Fetch capabilities for reference
    const capabilities = await Capability.find().lean();
    
    // Create capability map with predefined categories and from database
    const capabilityMap = {};
    
    // Add categories from predefined list
    CAPABILITY_CATEGORIES.forEach(cap => {
      capabilityMap[cap.id] = {
        id: cap.id,
        name: cap.name,
        shortName: cap.shortName,
        icon: cap.icon,
        isFromTS: true
      };
    });
    
    // Add capabilities from database
    capabilities.forEach(cap => {
      const capId = cap._id.toString();
      // Only add if not already exists
      if (!capabilityMap[capId]) {
        capabilityMap[capId] = {
          id: capId,
          name: cap.capabilityName,
          shortName: cap.shortName,
          isFromDB: true
        };
      }
    });

    // Prepare common filter object
    const getStatusFilter = (status) => {
      if (status === "all") return {};
      
      // Handle status filtering for different models
      if (status.toLowerCase() === "pending receive sample") {
        return { 
          $or: [
            { requestStatus: { $regex: "pending receive sample", $options: "i" } },
            { requestStatus: "submitted" }, // For ASR, 'submitted' is equivalent to 'pending receive sample'
            { asrStatus: "submitted" }
          ] 
        };
      }
      
      // For other statuses, check in both RequestList and AsrList fields
      return { 
        $or: [
          { requestStatus: { $regex: status, $options: "i" } },
          { asrStatus: { $regex: status, $options: "i" } }
        ] 
      };
    };

    const getPriorityFilter = (priority) => {
      if (priority === "all") return {};
      return { priority: { $regex: priority, $options: "i" } };
    };
    
    const getCapabilityFilter = (capability) => {
      if (capability === "all") return {};
      
      // For RequestList, we need to check the jsonTestingList for the capability
      // For AsrList, we need to check the capabilityId field
      return {
        $or: [
          { capabilityId: capability }, // For AsrList
          // We'll handle RequestList capability filtering after fetching the data
        ]
      };
    };

    const getSearchFilter = (search) => {
      if (!search) return {};
      return {
        $or: [
          { requestNumber: { $regex: search, $options: "i" } },
          { requestTitle: { $regex: search, $options: "i" } },
          { requesterName: { $regex: search, $options: "i" } },
          { requesterEmail: { $regex: search, $options: "i" } }
        ]
      };
    };

    // Get data based on request type
    let requestsData = [];
    let total = 0;
    let typeCounts = { ntr: 0, asr: 0, er: 0 };
    let capabilityCounts = {};

    // Get search filter
    const searchFilter = getSearchFilter(search);

    // Get RequestList data (NTR)
    if (type === "all" || type === "ntr") {
      let ntrFilter = {};
      
      // Apply search filter if provided
      if (Object.keys(searchFilter).length > 0) {
        ntrFilter = { ...ntrFilter, ...searchFilter };
      }
      
      // Apply status filter if provided
      if (status !== "all") {
        const statusRegex = { $regex: status, $options: "i" };
        ntrFilter.requestStatus = statusRegex;
      }
      
      // Apply priority filter if provided
      if (priority !== "all") {
        const priorityRegex = { $regex: priority, $options: "i" };
        ntrFilter.priority = priorityRegex;
      }
      
      // Add filter to exclude ASR requests
      ntrFilter.isAsrRequest = { $ne: true };
      
      const [ntrRequests, ntrCount] = await Promise.all([
        RequestList.find(ntrFilter)
          .sort({ createdAt: -1 })
          .skip(type === "ntr" ? skip : 0)
          .limit(type === "ntr" ? limit : 100)
          .lean(),
        RequestList.countDocuments(ntrFilter)
      ]);

      typeCounts.ntr = ntrCount;
      
      if (type === "ntr" || type === "all") {
        requestsData = [
          ...requestsData,
          ...ntrRequests.map(req => {
            // Try to extract capability information from jsonTestingList if available
            let capability = "Unknown";
            let capabilityId = null;
            
            if (req.jsonTestingList) {
              try {
                const testingList = JSON.parse(req.jsonTestingList || "[]");
                if (testingList.length > 0 && testingList[0].capabilityId) {
                  const capId = testingList[0].capabilityId.toString();
                  capability = capabilityMap[capId]?.name || "Unknown";
                  capabilityId = capId;
                }
              } catch (err) {
                console.error("Error parsing jsonTestingList:", err);
              }
            }
            
            return {
              id: req.requestNumber,
              type: "NTR",
              title: req.requestTitle,
              status: req.requestStatus,
              priority: req.priority || "normal",
              requester: req.requesterName,
              requestDate: req.createdAt ? new Date(req.createdAt).toISOString().split('T')[0] : "",
              dueDate: "", // To be filled in future enhancement
              assignedTo: req.supportStaff || "Unassigned",
              progress: req.requestStatus === "completed" ? 100 : 
                      req.requestStatus === "in-progress" ? 50 : 
                      req.requestStatus === "draft" ? 0 : 
                      req.requestStatus === "Pending Receive Sample" ? 10 : 25,
              samples: req.jsonSampleList ? JSON.parse(req.jsonSampleList || "[]").length : 0,
              department: req.requesterCostCenter || "",
              description: "",
              capability,
              capabilityId,
              originalData: req
            };
          })
        ];
      }
    }

    // Get AsrList data
    if (type === "all" || type === "asr") {
      let asrFilter = {};
      
      // Apply search filter
      if (Object.keys(searchFilter).length > 0) {
        // Translate RequestList field names to AsrList field names
        asrFilter = {
          $or: [
            { asrNumber: searchFilter.$or ? searchFilter.$or[0].requestNumber : { $regex: search, $options: "i" } },
            { asrName: searchFilter.$or ? searchFilter.$or[1].requestTitle : { $regex: search, $options: "i" } },
            { requesterName: searchFilter.$or ? searchFilter.$or[2].requesterName : { $regex: search, $options: "i" } },
            { requesterEmail: searchFilter.$or ? searchFilter.$or[3].requesterEmail : { $regex: search, $options: "i" } }
          ]
        };
      }
      
      // Apply status filter
      if (status !== "all") {
        // Map RequestList status to AsrList status
        if (status.toLowerCase() === "pending receive sample") {
          asrFilter.asrStatus = "submitted";
        } else {
          asrFilter.asrStatus = { $regex: status, $options: "i" };
        }
      }
      
      // Apply priority filter
      if (priority !== "all") {
        asrFilter.priority = { $regex: priority, $options: "i" };
      }
      
      // Apply capability filter if provided
      if (capability !== "all") {
        // Check if this is a predefined capability ID
        const predefinedCap = CAPABILITY_CATEGORIES.find(cap => cap.id === capability);
        if (predefinedCap) {
          // Try to match by name instead of ID for predefined capabilities
          asrFilter.capabilityName = { $regex: predefinedCap.name, $options: "i" };
        } else {
          // Otherwise filter by capability ID
          asrFilter.capabilityId = capability;
        }
      }
      
      const [asrRequests, asrCount] = await Promise.all([
        AsrList.find(asrFilter)
          .sort({ createdAt: -1 })
          .skip(type === "asr" ? skip : 0)
          .limit(type === "asr" ? limit : 100)
          .lean(),
        AsrList.countDocuments(asrFilter)
      ]);

      typeCounts.asr = asrCount;
      
      if (type === "asr" || type === "all") {
        requestsData = [
          ...requestsData,
          ...asrRequests.map(asr => ({
            id: asr.asrNumber,
            type: "ASR",
            title: asr.asrName,
            status: asr.asrStatus === "submitted" ? "Pending Receive Sample" : asr.asrStatus,
            priority: asr.priority || "normal",
            requester: asr.requesterName,
            requestDate: asr.createdAt ? new Date(asr.createdAt).toISOString().split('T')[0] : "",
            dueDate: asr.asrEstCompletedDate ? new Date(asr.asrEstCompletedDate).toISOString().split('T')[0] : "",
            assignedTo: asr.asrOwnerName || "Unassigned",
            progress: asr.asrStatus === "completed" ? 100 : 
                     asr.asrStatus === "in-progress" ? 50 : 
                     asr.asrStatus === "draft" ? 0 : 
                     asr.asrStatus === "submitted" ? 10 : 25,
            samples: asr.asrSampleList ? JSON.parse(asr.asrSampleList || "[]").length : 0,
            department: asr.requesterCostCenter || "",
            description: asr.asrDetail || "",
            capability: asr.capabilityId ? (capabilityMap[asr.capabilityId.toString()]?.name || "R&D") : "R&D",
            capabilityId: asr.capabilityId ? asr.capabilityId.toString() : null,
            originalData: asr
          }))
        ];
      }
    }

    // Get ErList data
    if (type === "all" || type === "er") {
      let erFilter = {};
      
      // Apply search filter
      if (Object.keys(searchFilter).length > 0) {
        erFilter = { ...erFilter, ...searchFilter };
      }
      
      // Apply status filter
      if (status !== "all") {
        erFilter.requestStatus = { $regex: status, $options: "i" };
      }
      
      // Apply priority filter
      if (priority !== "all") {
        erFilter.priority = { $regex: priority, $options: "i" };
      }
      
      const [erRequests, erCount] = await Promise.all([
        ErList.find(erFilter)
          .sort({ createdAt: -1 })
          .skip(type === "er" ? skip : 0)
          .limit(type === "er" ? limit : 100)
          .lean(),
        ErList.countDocuments(erFilter)
      ]);

      typeCounts.er = erCount;
      
      if (type === "er" || type === "all") {
        requestsData = [
          ...requestsData,
          ...erRequests.map(er => ({
            id: er.requestNumber,
            type: "ER",
            title: er.requestTitle,
            status: er.requestStatus,
            priority: er.priority || "normal",
            requester: er.requesterName,
            requestDate: er.createdAt ? new Date(er.createdAt).toISOString().split('T')[0] : "",
            dueDate: er.reservationEndDate ? new Date(er.reservationEndDate).toISOString().split('T')[0] : "",
            assignedTo: er.supportStaff || "Unassigned",
            progress: er.requestStatus === "completed" ? 100 : 
                     er.requestStatus === "in-progress" ? 50 : 
                     er.requestStatus === "draft" ? 0 : 
                     er.requestStatus === "Pending Receive Sample" ? 10 : 25,
            samples: 0, // Equipment reservations don't have samples
            department: er.requesterCostCenter || "",
            description: er.notes || "",
            capability: "", // No specific capability - leave blank
            capabilityId: "", // No specific capability ID
            originalData: er
          }))
        ];
      }
    }

    // Calculate total for pagination
    if (type === "all") {
      total = typeCounts.ntr + typeCounts.asr + typeCounts.er;
      
      // Filter by capability if selected
      if (capability !== "all") {
        requestsData = requestsData.filter(req => 
          req.capabilityId === capability || 
          req.capability?.toLowerCase() === capability.toLowerCase()
        );
        
        // Recalculate total for pagination
        total = requestsData.length;
      }
    } else {
      total = type === "ntr" ? typeCounts.ntr : 
              type === "asr" ? typeCounts.asr : 
              type === "er" ? typeCounts.er : 0;
    }
    
    // Get capability counts for UI
    capabilityCounts = {};
    requestsData.forEach(req => {
      const cap = req.capability || "Unknown";
      capabilityCounts[cap] = (capabilityCounts[cap] || 0) + 1;
    });
    
    // If type is "all", we need to implement manual pagination since we're combining data
    if (type === "all") {
      requestsData = requestsData
        .sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate))
        .slice(skip, skip + limit);
    }
    
    // Calculate total pages
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: requestsData,
      pagination: {
        total,
        pages,
        page,
        limit
      },
      typeCounts,
      capabilityCounts,
      capabilities: Object.values(capabilityMap)
    });
  } catch (error) {
    console.error("Error in request management API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An error occurred while fetching requests" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update request status in batch
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const { ids, status } = body;

    if (!ids || !Array.isArray(ids) || !status) {
      return NextResponse.json(
        { success: false, error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Separate IDs by request type
    const ntrIds = ids.filter(id => id.startsWith("REQ") || id.startsWith("NTR") || id.startsWith("RE-"));
    const asrIds = ids.filter(id => id.startsWith("ASR"));
    const erIds = ids.filter(id => id.startsWith("ER"));

    let totalUpdated = 0;

    // Update RequestList (NTR)
    if (ntrIds.length > 0) {
      const ntrResult = await RequestList.updateMany(
        { requestNumber: { $in: ntrIds } },
        { 
          $set: { 
            requestStatus: status,
            // Set appropriate date field based on status
            ...(status === "in-progress" && { receiveDate: new Date() }),
            ...(status === "completed" && { completeDate: new Date() }),
            ...(status === "rejected" && { terminateDate: new Date() }),
            ...(status === "terminated" && { terminateDate: new Date() }),
            updatedAt: new Date()
          } 
        }
      );
      totalUpdated += ntrResult.modifiedCount;
      
      // If we're updating to in-progress, also update any related samples
      if (status === "in-progress") {
        try {
          await TestingSampleList.updateMany(
            {
              requestNumber: { $in: ntrIds },
              sampleStatus: { $ne: "in-progress" }
            },
            {
              $set: {
                sampleStatus: "in-progress",
                receiveDate: new Date(),
                receiveBy: "System",
                updatedAt: new Date()
              }
            }
          );
        } catch (sampleError) {
          console.error("Error updating samples:", sampleError);
          // Continue with the request update even if sample update fails
        }
      }
    }

    // Update AsrList
    if (asrIds.length > 0) {
      const asrResult = await AsrList.updateMany(
        { asrNumber: { $in: asrIds } },
        { 
          $set: { 
            asrStatus: status,
            updatedAt: new Date() 
          } 
        }
      );
      totalUpdated += asrResult.modifiedCount;
    }

    // Update ErList
    if (erIds.length > 0) {
      const erResult = await ErList.updateMany(
        { requestNumber: { $in: erIds } },
        { 
          $set: { 
            requestStatus: status,
            updatedAt: new Date() 
          } 
        }
      );
      totalUpdated += erResult.modifiedCount;
    }

    return NextResponse.json({
      success: true,
      data: { totalUpdated }
    });
  } catch (error) {
    console.error("Error updating requests:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An error occurred while updating requests" },
      { status: 500 }
    );
  }
}
