import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { RequestList } from "@/models";
import { ErList } from "@/models";
import { TestingSample } from "@/models";

// GET endpoint to retrieve all requests with filters
export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");
    
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter: any = {};
    
    if (status && status !== "all") {
      filter.status = status;
    }
    
    if (priority && priority !== "all") {
      filter.priority = priority;
    }
    
    if (type && type !== "all") {
      filter.type = type;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { requester: { $regex: search, $options: 'i' } },
        { request_number: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Fetch data from the appropriate collections based on request type
    let regularRequests = [];
    let erRequests = [];
    
    // If type is "all" or "ntr" or "asr", fetch from RequestList
    if (type === "all" || type === "ntr" || type === "asr") {
      const regularFilter = { ...filter };
      if (type === "ntr") {
        regularFilter.request_number = { $regex: /-NTR-/ };
      } else if (type === "asr") {
        regularFilter.request_number = { $regex: /-ASR-/ };
      }
      
      regularRequests = await RequestList.find(regularFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
        
      // Transform the data to match the expected format
      regularRequests = regularRequests.map(req => ({
        id: req.request_number,
        title: req.title || "Untitled Request",
        type: req.request_number.includes("-NTR-") ? "NTR" : "ASR",
        capability: req.capability?.name || "Unknown",
        status: req.status || "pending",
        priority: req.priority || "medium",
        requester: req.requester_name || "Unknown",
        requestDate: req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "Unknown",
        dueDate: req.due_date ? new Date(req.due_date).toLocaleDateString() : "",
        assignedTo: req.assigned_to || "Unassigned",
        progress: req.progress || 0,
        samples: req.sample_count || 0,
        department: req.department || "Unknown",
        description: req.description || "No description",
        rejectReason: req.rejectReason || "",
      }));
    }
    
    // If type is "all" or "er", fetch from ErList
    if (type === "all" || type === "er") {
      const erFilter = { ...filter };
      if (type === "er") {
        erFilter.request_number = { $regex: /-ER-/ };
      } else if (type === "all") {
        erFilter.request_number = { $regex: /-ER-/ };
      }
      
      erRequests = await ErList.find(erFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
        
      // Transform the data to match the expected format
      erRequests = erRequests.map(req => ({
        id: req.request_number,
        title: req.title || `${req.equipment_name} Reservation`,
        type: "ER",
        capability: req.capability_name || "Unknown",
        status: req.status || "pending",
        priority: req.priority || "medium",
        requester: req.requester_name || "Unknown",
        requestDate: req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "Unknown",
        dueDate: req.reservation_date ? new Date(req.reservation_date).toLocaleDateString() : "",
        assignedTo: req.assigned_to || "Unassigned",
        progress: 0, // ER requests don't have progress
        samples: 0, // ER requests don't have samples
        department: req.department || "Unknown",
        description: req.description || "No description",
        equipment: req.equipment_name || "Unknown Equipment",
        rejectReason: req.rejectReason || "",
      }));
    }
    
    // Combine and sort the results
    const combinedRequests = [...regularRequests, ...erRequests]
      .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
    
    // Get total count for pagination
    const totalRegularCount = type === "er" ? 0 : await RequestList.countDocuments(filter);
    const totalErCount = type === "ntr" || type === "asr" ? 0 : await ErList.countDocuments(filter);
    const totalCount = totalRegularCount + totalErCount;
    
    return NextResponse.json({
      success: true,
      data: combinedRequests,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update a request's status
export async function PATCH(request: Request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { id, status, note } = body;
    
    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "Request ID and status are required" },
        { status: 400 }
      );
    }
    
    // Determine if it's an ER request or regular request
    const isErRequest = id.includes("-ER-");
    
    let updatedRequest;
    
    if (isErRequest) {
      updatedRequest = await ErList.findOneAndUpdate(
        { request_number: id },
        {
          status,
          ...(note && { note }),
          ...(status === "rejected" && note ? { rejectReason: note } : {}),
        },
        { new: true }
      );
    } else {
      updatedRequest = await RequestList.findOneAndUpdate(
        { request_number: id },
        {
          status,
          ...(note && { note }),
          ...(status === "rejected" && note ? { rejectReason: note } : {}),
        },
        { new: true }
      );
    }
    
    if (!updatedRequest) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: updatedRequest
    });
  } catch (error) {
    console.error("Error updating request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update request" },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update multiple requests' statuses
export async function PUT(request: Request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { ids, status, note } = body;
    
    if (!ids || !ids.length || !status) {
      return NextResponse.json(
        { success: false, error: "Request IDs and status are required" },
        { status: 400 }
      );
    }
    
    // Split IDs into ER and regular requests
    const erIds = ids.filter((id: string) => id.includes("-ER-"));
    const regularIds = ids.filter((id: string) => !id.includes("-ER-"));
    
    let erUpdates = { count: 0 };
    let regularUpdates = { count: 0 };
    
    // Update ER requests
    if (erIds.length > 0) {
      const result = await ErList.updateMany(
        { request_number: { $in: erIds } },
        {
          status,
          ...(note && { note }),
          ...(status === "rejected" && note ? { rejectReason: note } : {}),
          updatedAt: new Date()
        }
      );
      erUpdates = { count: result.modifiedCount };
    }
    
    // Update regular requests
    if (regularIds.length > 0) {
      const result = await RequestList.updateMany(
        { request_number: { $in: regularIds } },
        {
          status,
          ...(note && { note }),
          ...(status === "rejected" && note ? { rejectReason: note } : {}),
          updatedAt: new Date()
        }
      );
      regularUpdates = { count: result.modifiedCount };
    }
    
    return NextResponse.json({
      success: true,
      data: {
        erUpdates,
        regularUpdates,
        totalUpdated: erUpdates.count + regularUpdates.count
      }
    });
  } catch (error) {
    console.error("Error updating requests:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update requests" },
      { status: 500 }
    );
  }
}
