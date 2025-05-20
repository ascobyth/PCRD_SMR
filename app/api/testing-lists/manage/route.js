import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import TestingSampleList from "@/models/TestingSampleList";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    const capability = searchParams.get("capability") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    await dbConnect();

    const filter = {};

    if (status !== "all") {
      filter.sampleStatus = { $regex: status, $options: "i" };
    }

    if (search) {
      filter.$or = [
        { sampleId: { $regex: search, $options: "i" } },
        { requestNumber: { $regex: search, $options: "i" } },
        { sampleName: { $regex: search, $options: "i" } },
      ];
    }

    if (capability !== "all") {
      filter.$or = filter.$or || [];
      filter.$or.push({ capabilityName: { $regex: capability, $options: "i" } });
      filter.$or.push({ capabilityId: capability });
    }

    const [samples, total] = await Promise.all([
      TestingSampleList.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TestingSampleList.countDocuments(filter),
    ]);

    const data = samples.map((sample) => ({
      id: sample.sampleId,
      title: sample.sampleName,
      type: sample.requestNumber,
      capability: sample.capabilityName,
      status: sample.sampleStatus,
      priority: "-",
      dueDate: sample.dueDate ? new Date(sample.dueDate).toISOString().split("T")[0] : "",
      progress: 0,
    }));

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data,
      pagination: { total, pages, page, limit },
    });
  } catch (error) {
    console.error("Error in testing list manage API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch testing lists" },
      { status: 500 }
    );
  }
}
