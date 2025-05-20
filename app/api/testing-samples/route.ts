import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import TestingSampleList from "@/models/TestingSampleList";

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const capability = searchParams.get("capability");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const filter: any = {};

    if (status && status !== "all") {
      filter.sampleStatus = status;
    }

    if (capability && capability !== "all") {
      filter.capabilityName = capability;
    }

    if (search) {
      filter.$or = [
        { sampleName: { $regex: search, $options: "i" } },
        { requestNumber: { $regex: search, $options: "i" } },
        { sampleId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const samples = await TestingSampleList.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await TestingSampleList.countDocuments(filter);

    const data = samples.map((sample) => ({
      id: sample._id.toString(),
      sampleId: sample.sampleId,
      sampleName: sample.sampleName,
      requestNumber: sample.requestNumber,
      status: sample.sampleStatus,
      capability: sample.capabilityName,
      method: sample.methodCode,
      dueDate: sample.dueDate ? new Date(sample.dueDate).toLocaleDateString() : "",
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching testing samples:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch testing samples" },
      { status: 500 }
    );
  }
}
