import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  airtableUserId: String,
  email: String,
  accessToken: String,
  refreshToken: String,
  loginTimestamp: { type: Date, default: Date.now },
  profile: Object
}, { timestamps: true });

const conditionSchema = new mongoose.Schema({
  questionKey: String,
  operator: { 
    type: String, 
    enum: ['equals', 'notEquals', 'contains'] 
  },
  value: mongoose.Schema.Types.Mixed
});

const conditionalRulesSchema = new mongoose.Schema({
  logic: { 
    type: String, 
    enum: ['AND', 'OR'] 
  },
  conditions: [conditionSchema]
});

const questionSchema = new mongoose.Schema({
  questionKey: String,
  airtableFieldId: String,
  label: String,
  type: { 
    type: String, 
    enum: ['singleLineText', 'multilineText', 'singleSelect', 'multipleSelect', 'attachment']
  },
  required: { type: Boolean, default: false },
  conditionalRules: conditionalRulesSchema,
  options: [String]
});

const formSchema = new mongoose.Schema({
  formId: { type: String, unique: true, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  airtableBaseId: String,
  airtableTableId: String,
  title: String,
  questions: [questionSchema]
}, { timestamps: true });

const responseSchema = new mongoose.Schema({
  formId: String,
  airtableRecordId: String,
  answers: Object,
  deletedInAirtable: { type: Boolean, default: false }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
export const Form = mongoose.model('Form', formSchema);
export const Response = mongoose.model('Response', responseSchema);