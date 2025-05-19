import { NextResponse } from 'next/server';
import connectToDatabase, { mongoose } from '@/lib/db';

const AsrList = mongoose.models.AsrList || require('@/models/AsrList');
const Capability = mongoose.models.Capability || require('@/models/Capability');

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Predeclare ASR number to avoid reference errors in case generation fails
    let asrNumber = '';

    let capabilityId = body.capabilityId || null;
    let capabilityDoc = null;

    if (capabilityId) {
      if (typeof capabilityId === 'string' && !mongoose.Types.ObjectId.isValid(capabilityId)) {
        capabilityDoc = await Capability.findOne({
          $or: [
            { shortName: capabilityId },
            { capabilityName: capabilityId },
          ],
        });
      } else {
        capabilityDoc = await Capability.findById(capabilityId);
      }
    }

    if (!capabilityDoc || !capabilityDoc.shortName) {
      return NextResponse.json(
        { success: false, error: 'Invalid capability' },
        { status: 400 }
      );
    }

    capabilityId = capabilityDoc._id;

    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const runNo = parseInt(capabilityDoc.reqAsrRunNo, 10);
    const seq = Number.isNaN(runNo) ? 1 : runNo + 1;
    const shortName = capabilityDoc.shortName || 'UNK';
    asrNumber = `${shortName}-A-${mm}${yy}-${seq.toString().padStart(5, '0')}`;

    // update run number
    capabilityDoc.reqAsrRunNo = seq.toString();
    await capabilityDoc.save();


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
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit ASR' },
      { status: 500 }
    );
  }
}
