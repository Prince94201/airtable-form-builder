# Airtable Form Builder

A MERN stack application for creating dynamic forms with Airtable integration and conditional logic.

## Tech Stack
React.js • Node.js • MongoDB • Airtable API

## Quick Setup

1. **Install dependencies**
```bash
# Backend
cd backend && npm install

# Frontend  
cd ../frontend && npm install
```

2. **Environment Setup**
Create `backend/.env`:
```env
MONGODB_URI=mongodb://username:password@cluster0/airtable_form_builder
AIRTABLE_CLIENT_ID=your_client_id
AIRTABLE_CLIENT_SECRET=your_client_secret
AIRTABLE_REDIRECT_URI=WEB_SERVER_URL/oauth/callback
```

3. **Airtable OAuth**
- Go to [Airtable Developer Hub](https://airtable.com/developers/web)
- Create OAuth integration with redirect URI: `${process.env.WEB_SERVER_URL}/oauth/callback`
- Add scopes: `data.records:read`, `data.records:write`, `schema.bases:read`, `webhook:manage`

## Run

```bash
# Start MongoDB
mongod

# Start backend (terminal 1)
cd backend && npm start

# Start frontend (terminal 2)  
cd frontend && npm start
```

Visit `http://localhost:3000`

## Data Model

**User**: `airtableUserId`, `email`, `accessToken`, `refreshToken`
**Form**: `formId`, `title`, `owner`, `airtableBaseId`, `airtableTableId`, `questions[]`
**Response**: `formId`, `airtableRecordId`, `answers`, `deletedInAirtable`

## Conditional Logic

Questions can show/hide based on previous answers using:
- **Operators**: `equals`, `notEquals`, `contains`
- **Logic**: `AND`/`OR` for multiple conditions

Example: Show field only if role = "Developer"
```json
{
  "logic": "AND",
  "conditions": [{"questionKey": "role", "operator": "equals", "value": "Developer"}]
}
```

## Webhook Configuration

- Auto-registered when forms are created
- Syncs Airtable changes to MongoDB in real-time
- Deleted records marked as `deletedInAirtable: true`
- For local dev: use `ngrok http 4000` to expose webhook endpoint

## Features
- OAuth authentication with Airtable
- Dynamic form creation from Airtable fields
- Conditional question logic
- Dual storage (Airtable + MongoDB)
- Real-time webhook sync