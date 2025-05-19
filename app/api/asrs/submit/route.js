import { NextResponse } from 'next/server';
import connectToDatabase, { mongoose } from '@/lib/db';

const AsrList = mongoose.models.AsrList || require('@/models/AsrList');
const Capability = mongoose.models.Capability || require('@/models/Capability');

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const currentYear = new Date().getFullYear();
    const latest = await AsrList.findOne({ asrNumber: { $regex: `ASR-${currentYear}-` } })
      .sort({ asrNumber: -1 });
    let asrNumber;
    if (latest) {
      const last = parseInt(latest.asrNumber.split('-')[2]);
      asrNumber = `ASR-${currentYear}-${(last + 1).toString().padStart(4, '0')}`;
    } else {
      asrNumber = `ASR-${currentYear}-0001`;
    }

    // Resolve capabilityId if it's provided as a short name or capability name
    let capabilityId = body.capabilityId || null;
    if (
      capabilityId &&
      typeof capabilityId === 'string' &&
      !mongoose.Types.ObjectId.isValid(capabilityId)
    ) {
      const found = await Capability.findOne({
        $or: [
          { shortName: capabilityId },
          { capabilityName: capabilityId },
        ],
      }).select('_id');
      capabilityId = found ? found._id : null;
    }

    const asrData = {
      asrNumber,
      asrName: body.asrName || body.requestTitle || 'ASR Project',
      asrType: body.asrType || 'project',
      asrStatus: 'submitted',
      asrDetail: body.asrDetail || '',
      requesterName: body.requesterName,
      requesterEmail: body.requesterEmail,
      asrRequireDate: body.asrRequireDate ? new Date(body.asrRequireDate) : null,
      asrMethodology: body.asrMethodology || '',
      capabilityId,
      asrSampleList: JSON.stringify(body.asrSampleList || []),
      asrOwnerName: body.asrOwnerName || '',
      asrOwnerEmail: body.asrOwnerEmail || '',
      useIoNumber: body.useIoNumber || false,
      ioCostCenter: body.ioCostCenter || '',
      requesterCostCenter: body.requesterCostCenter || '',
      isOnBehalf: body.isOnBehalf || false,
      onBehalfInformation: body.onBehalfInformation || {},
      asrPpcMemberList: JSON.stringify(body.asrPpcMemberList || []),
    };

    const newAsr = await AsrList.create(asrData);

    return NextResponse.json({ success: true, data: { asrNumber, asrId: newAsr._id.toString() } }, { status: 201 });
  } catch (error) {
    console.error('Error submitting ASR:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to submit ASR' }, { status: 500 });
  }
}
