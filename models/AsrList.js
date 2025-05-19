const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * AsrList Schema - Database to keep ASR (Advanced Service Request) information
 * 
 * This schema stores all ASR project information including project details,
 * methodology, and evaluation data. ASR projects can contain multiple standard requests.
 */
const AsrListSchema = new Schema(
  {
    // Core ASR identification
    asrNumber: {
      type: String,
      required: [true, 'ASR number is required'],
      unique: true,
      trim: true,
      index: true,
      description: 'Number reference of ASR request'
    },
    
    // ASR details
    asrName: {
      type: String,
      required: [true, 'ASR name is required'],
      trim: true,
      description: 'Name of the ASR project'
    },
    asrType: {
      type: String,
      enum: ['project', 'data-analysis'],
      required: true,
      description: 'Type of ASR (project or data analysis)'
    },
    asrStatus: {
      type: String,
      enum: ['draft', 'submitted', 'in-progress', 'completed', 'rejected', 'terminated', 'cancelled'],
      default: 'draft',
      required: true,
      index: true,
      description: 'Current status of the ASR'
    },
    asrDetail: {
      type: String,
      description: 'Detailed description of the ASR'
    },
    
    // Requester information
    requesterName: {
      type: String,
      required: true,
      description: 'Name of the person requesting the ASR'
    },
    requesterEmail: {
      type: String,
      required: true,
      ref: 'User',
      description: 'Email of the requester'
    },
    
    // Dates and timelines
    asrRequireDate: {
      type: Date,
      description: 'Required completion date requested by requester'
    },
    asrEstCompletedDate: {
      type: Date,
      description: 'Estimated completion date set by staff'
    },
    completedDate: {
      type: Date,
      description: 'Actual completion date'
    },
    approveDate: {
      type: Date,
      description: 'Date when ASR was approved'
    },
    sampleReceiveDate: {
      type: Date,
      description: 'Date when samples were received'
    },
    addMemberDate: {
      type: Date,
      description: 'Date when members were added to the ASR'
    },
    
    // Methodology and technical details
    asrMethodology: {
      type: String,
      description: 'Methodology to be used for the ASR'
    },
    capabilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Capability',
      description: 'Reference to capability ID from Capability table'
    },
    asrSampleList: {
      type: String,
      description: 'JSON string containing sample list for the ASR'
    },
    
    // Project ownership
    asrOwnerName: {
      type: String,
      description: 'Name of person responsible for this ASR project'
    },
    asrOwnerEmail: {
      type: String,
      description: 'Email of person responsible for this ASR project'
    },
    
    // Cost information
    useIoNumber: {
      type: Boolean,
      default: false,
      description: 'Whether to use IO number for this ASR'
    },
    ioCostCenter: {
      type: String,
      ref: 'Io',
      description: 'IO number reference for cost tracking'
    },
    requesterCostCenter: {
      type: String,
      description: 'Requester cost center if not using IO number'
    },
    
    // On behalf information
    isOnBehalf: {
      type: Boolean,
      default: false,
      description: 'Whether this ASR is requested on behalf of another person'
    },
    onBehalfInformation: {
      name: {
        type: String,
        description: 'Name of person on whose behalf the ASR is requested'
      },
      email: {
        type: String,
        description: 'Email of person on whose behalf the ASR is requested'
      },
      costCenter: {
        type: String,
        description: 'Cost center of person on whose behalf the ASR is requested'
      }
    },
    
    // Evaluation and results
    asrEvaluationScore: {
      type: String,
      description: 'JSON string containing evaluation scores from requester'
    },
    asrLink: {
      type: String,
      description: 'Link to folder containing ASR results'
    },
    
    // Team members
    asrPpcMemberList: {
      type: String,
      description: 'JSON string containing list of members who joined this ASR'
    }
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt'
    },
    collection: 'asr_lists'
  }
);

// Add virtual for related requests
AsrListSchema.virtual('requests', {
  ref: 'RequestList',
  localField: 'asrNumber',
  foreignField: 'asrId'
});

module.exports = mongoose.models.AsrList || mongoose.model('AsrList', AsrListSchema);