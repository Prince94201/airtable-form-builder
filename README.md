# Airtable-Connected Dynamic Form Builder

A full-stack MERN application that integrates with Airtable to create dynamic forms with conditional logic, OAuth authentication, and real-time synchronization.

## 🚀 Features

- **Airtable OAuth Integration**: Secure login using Airtable credentials
- **Dynamic Form Builder**: Create forms using fields from your Airtable bases
- **Conditional Logic**: Show/hide questions based on user responses
- **Dual Data Storage**: Save responses to both Airtable and MongoDB
- **Real-time Sync**: Webhook integration to keep data synchronized
- **Response Management**: View and manage all form submissions

## 📋 Tech Stack

- **Frontend**: React.js, React Router, Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: Airtable OAuth 2.0
- **Integration**: Airtable API, Webhooks

## ⚙️ Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Airtable account with developer access
- Git

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd airtable-form-builder
```

### 2. Backend Setup

Navigate to backend directory and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/airtable-form-builder
AIRTABLE_CLIENT_ID=your_airtable_client_id
AIRTABLE_CLIENT_SECRET=your_airtable_client_secret
AIRTABLE_REDIRECT_URI=http://localhost:3000/callback
```

### 3. Frontend Setup

Navigate to frontend directory and install dependencies:

```bash
cd ../frontend
npm install
```

### 4. Database Setup

**Option A: Local MongoDB**
- Install MongoDB on your machine
- Start MongoDB service
- The application will connect to `mongodb://localhost:27017/airtable-form-builder`

**Option B: MongoDB Atlas (Cloud)**
- Create a MongoDB Atlas account
- Create a new cluster
- Get your connection string
- Update `MONGODB_URI` in your `.env` file

## 🔐 Airtable OAuth Setup Guide

### Step 1: Create Airtable OAuth Application

1. Visit the [Airtable Developer Hub](https://airtable.com/developers/web)
2. Click on "Create new OAuth integration"
3. Fill in your application details:
   - **Name**: Your app name (e.g., "Dynamic Form Builder")
   - **Description**: Brief description of your application
   - **Redirect URI**: `http://localhost:3000/callback`

### Step 2: Configure OAuth Scopes

Select the following scopes for your OAuth application:
- `data.records:read` - Read records from Airtable
- `data.records:write` - Create new records in Airtable
- `schema.bases:read` - Access base and table structure
- `webhook:manage` - Create and manage webhooks

### Step 3: Get OAuth Credentials

After creating your OAuth app:
1. Copy the **Client ID**
2. Copy the **Client Secret**
3. Update your backend `.env` file with these credentials

### Step 4: Test OAuth Flow

1. Start your application
2. Visit the login page
3. Click "Login with Airtable"
4. You should be redirected to Airtable's authorization page
5. After approval, you'll be redirected back to your application

## 📊 Data Model Explanation

### User Collection
Stores authenticated user information from Airtable OAuth:
- **airtableUserId**: Unique identifier from Airtable
- **name**: User's display name
- **email**: User's email address
- **accessToken**: OAuth access token for API calls
- **refreshToken**: Token for refreshing access
- **loginTimestamp**: When user last logged in

### Form Collection
Stores form definitions created by users:
- **title**: Form name/title
- **owner**: Reference to User who created the form
- **airtableBaseId**: Which Airtable base this form connects to
- **airtableTableId**: Which table in the base to save responses
- **questions**: Array of form questions with:
  - Field mapping to Airtable columns
  - Custom labels and validation rules
  - Conditional logic configuration
- **createdAt**: Form creation timestamp

### Response Collection
Stores form submission data:
- **formId**: Reference to the Form
- **airtableRecordId**: ID of the record created in Airtable
- **answers**: JSON object containing all user responses
- **deletedInAirtable**: Flag indicating if Airtable record was deleted
- **createdAt/updatedAt**: Submission and modification timestamps

## 🎯 Conditional Logic Explanation

### How It Works

The conditional logic system allows form questions to be shown or hidden based on user's previous answers.

### Configuration

When building a form, you can set rules for each question:

1. **Conditions**: Define what triggers the rule
   - **Question Key**: Which previous question to check
   - **Operator**: How to compare (equals, not equals, contains)
   - **Value**: What value to compare against

2. **Logic**: How to combine multiple conditions
   - **AND**: All conditions must be true
   - **OR**: At least one condition must be true

### Supported Operators

- **equals**: Exact match (e.g., role = "Developer")
- **notEquals**: Does not match (e.g., experience ≠ "Beginner")
- **contains**: Text contains substring or array includes value

### Real-time Evaluation

- Conditions are evaluated as users fill out the form
- Questions appear/disappear immediately based on answers
- Missing or empty answers are treated as "false" for conditions
- System prevents crashes from invalid condition references

### Example Scenarios

- Show "GitHub URL" field only if role equals "Developer"
- Hide "Management Experience" unless position contains "Manager"
- Display "Portfolio" section when experience equals "Senior" OR "Expert"

## 🔄 Webhook Configuration

### Purpose

Webhooks keep your local database synchronized with changes made directly in Airtable.

### Automatic Setup

The application automatically registers webhooks when:
- A new form is created
- User grants necessary permissions through OAuth

### What Gets Synced

**Record Updates**: When someone edits a response in Airtable
- The corresponding MongoDB record is updated with new values
- All field changes are reflected immediately

**Record Deletions**: When a record is deleted from Airtable
- The MongoDB record is marked as `deletedInAirtable: true`
- Original data is preserved for audit purposes
- Record is not hard-deleted from your database

### Webhook Events Handled

1. **Table Data Changes**: New records, updates, deletions
2. **Field Value Modifications**: Any change to record data
3. **Bulk Operations**: Multiple records changed at once

### Local Development

For local development with webhooks:

1. **Install ngrok** (for public URL):
   ```bash
   npm install -g ngrok
   ngrok http 4000
   ```

2. **Update webhook URL** in your Airtable configuration to use the ngrok URL

3. **Test webhook delivery** using Airtable's webhook testing tools

### Manual Webhook Setup

If automatic registration fails, you can manually create webhooks using Airtable's API or through their web interface in the base settings.

## 🎮 How to Run the Project

### Development Mode

1. **Start MongoDB** (if using local installation):
   ```bash
   # macOS with Homebrew
   brew services start mongodb/brew/mongodb-community

   # Or start manually
   mongod
   ```

2. **Start the Backend Server**:
   ```bash
   cd backend
   npm start
   ```
   - Server will run on `http://localhost:4000`
   - Watch for "Connected to MongoDB" message
   - Check for any OAuth configuration errors

3. **Start the Frontend Application**:
   ```bash
   cd frontend
   npm start
   ```
   - Application will open automatically at `http://localhost:3000`
   - Hot reloading is enabled for development

### Production Deployment

1. **Build the frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy backend** with environment variables configured
3. **Update redirect URIs** in Airtable OAuth settings to production URLs
4. **Configure webhook URLs** to point to production backend

### Using the Application

1. **Login**: Visit the homepage and authenticate with Airtable
2. **Build Forms**:
   - Select an Airtable base from your account
   - Choose a table to store responses
   - Pick which fields to include in your form
   - Configure conditional logic rules
   - Save and get a shareable form URL

3. **Collect Responses**:
   - Share the form URL with respondents
   - Responses are automatically saved to both Airtable and your database
   - View real-time submissions in the responses dashboard

4. **Manage Data**:
   - Monitor all responses through the admin dashboard
   - Data stays synchronized between Airtable and your database
   - Edit responses directly in Airtable (changes sync automatically)

### Troubleshooting

**Common Issues**:
- **OAuth Redirect Errors**: Check redirect URI matches exactly in Airtable settings
- **Database Connection Issues**: Verify MongoDB is running and connection string is correct
- **API Rate Limits**: Airtable has rate limits; check for 429 errors in console
- **Webhook Delivery Failures**: Ensure webhook URL is publicly accessible

**Debug Mode**:
- Check browser console for frontend errors
- Monitor backend terminal for API errors
- Use MongoDB Compass to inspect database records
- Test Airtable API calls with your access token

---

**Project completed for MERN Stack Interview Task**