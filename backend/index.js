import express from "express";
import session from "express-session";
import cors from "cors";
import { generatePKCE } from "./pkce.js";
import axios from "axios";
import dotenv from "dotenv";
import connectDB from "./db.js";
import { User, Form, Response } from "./models.js";
import { shouldShowQuestion } from "./conditionalLogic.js";
import { randomBytes } from "crypto";

dotenv.config();

connectDB();

const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(session({ secret: "dev-secret", resave: false, saveUninitialized: true }));

let code_verifier_permanent;

const mapAirtableFieldType = (airtableType) => {
  const typeMap = {
    'singleLineText': 'singleLineText',
    'multilineText': 'multilineText',
    'singleSelect': 'singleSelect',
    'multipleSelect': 'multipleSelect',
    'attachment': 'attachment'
  };
  return typeMap[airtableType] || null;
};

const generateFormId = () => randomBytes(16).toString('hex');

app.get("/auth/airtable", async (req, res) => {
  const { code_verifier, code_challenge } = await generatePKCE();
  req.session.code_verifier = code_verifier;
  code_verifier_permanent = code_verifier;
  const authURL = new URL("https://airtable.com/oauth2/v1/authorize");
  authURL.searchParams.set("client_id", process.env.AIRTABLE_CLIENT_ID);
  authURL.searchParams.set("redirect_uri", process.env.AIRTABLE_REDIRECT_URI);
  authURL.searchParams.set("response_type", "code");
  authURL.searchParams.set("scope", "data.records:read data.records:write schema.bases:read webhook:manage");
  authURL.searchParams.set("state", cryptoRandomHex(16));
  authURL.searchParams.set("code_challenge", code_challenge);
  authURL.searchParams.set("code_challenge_method", "S256");

  res.redirect(authURL.toString());
});

function cryptoRandomHex(len = 16) {
  try {
    if (typeof nodeRandomBytes === "function") return nodeRandomBytes(len).toString("hex");
  } catch {}
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  return Math.random().toString(16).slice(2, 2 + len * 2);
}

app.get("/oauth/callback", async (req, res) => {
  const { code } = req.query;
  const code_verifier = req.session.code_verifier || code_verifier_permanent;
  
  if (!code_verifier) {
    return res.status(400).send("Missing code_verifier");
  }

  try {
    const response = await axios.post(
      "https://airtable.com/oauth2/v1/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.AIRTABLE_CLIENT_ID,
        redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
        code_verifier,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const tokens = response.data;
    
    const userResponse = await axios.get("https://api.airtable.com/v0/meta/whoami", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const airtableUser = userResponse.data;
    
    let user = await User.findOne({ airtableUserId: airtableUser.id });
    if (!user) {
      user = new User({
        airtableUserId: airtableUser.id,
        email: airtableUser.email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        profile: airtableUser
      });
    } else {
      user.accessToken = tokens.access_token;
      user.refreshToken = tokens.refresh_token;
      user.loginTimestamp = new Date();
      user.profile = airtableUser;
    }
    await user.save();

    req.session.accessToken = tokens.access_token;
    req.session.userId = user._id;
    
    console.log("User saved:", user._id);

    res.redirect(`http://localhost:3000/dashboard`);
  } catch (err) {
    console.error("TOKEN ERROR:", err.response?.data || err);
    res.status(500).send("Failed to exchange token");
  }
});

app.get("/auth/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    const user = await User.findById(req.session.userId);
    res.json({ user: { email: user.email, id: user._id } });
  } catch (error) {
    res.status(500).json({ error: "Failed to get user info" });
  }
});

app.get("/api/bases", async (req, res) => {
  const accessToken = req.session.accessToken;
  
  if (!accessToken) {
    return res.status(401).json({ error: "No access token found" });
  }

  try {
    const response = await axios.get("https://api.airtable.com/v0/meta/bases", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    res.json(response.data);
  } catch (err) {
    console.error("BASES ERROR:", err.response?.data || err);
    res.status(500).json({ error: "Failed to fetch bases" });
  }
});

app.get("/api/bases/:baseId/tables", async (req, res) => {
  const { baseId } = req.params;
  const accessToken = req.session.accessToken;
  
  if (!accessToken) {
    return res.status(401).json({ error: "No access token found" });
  }

  try {
    const response = await axios.get(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    res.json(response.data);
  } catch (err) {
    console.error("TABLES ERROR:", err.response?.data || err);
    res.status(500).json({ error: "Failed to fetch tables" });
  }
});

app.get("/api/bases/:baseId/:tableId/records", async (req, res) => {
  const { baseId, tableId } = req.params;
  const accessToken = req.session.accessToken;
  
  if (!accessToken) {
    return res.status(401).json({ error: "No access token found" });
  }

  try {
    const response = await axios.get(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    res.json(response.data);
  } catch (err) {
    console.error("RECORDS ERROR:", err.response?.data || err);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

app.get("/api/bases/:baseId/:tableId/fields", async (req, res) => {
  const { baseId, tableId } = req.params;
  const accessToken = req.session.accessToken;
  
  if (!accessToken) {
    return res.status(401).json({ error: "No access token found" });
  }

  try {
    const response = await axios.get(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    const table = response.data.tables.find(t => t.id === tableId);
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }

    const supportedFields = table.fields.filter(field => {
      return mapAirtableFieldType(field.type) !== null;
    }).map(field => ({
      id: field.id,
      name: field.name,
      type: mapAirtableFieldType(field.type),
      options: field.options
    }));

    res.json({ fields: supportedFields });
  } catch (err) {
    console.error("FIELDS ERROR:", err.response?.data || err);
    res.status(500).json({ error: "Failed to fetch fields" });
  }
});

app.post("/api/forms", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { title, airtableBaseId, airtableTableId, questions } = req.body;
    
    const form = new Form({
      formId: generateFormId(),
      owner: req.session.userId,
      airtableBaseId,
      airtableTableId,
      title,
      questions
    });

    await form.save();
    res.json({ form });
  } catch (error) {
    console.error("Form creation error:", error);
    res.status(500).json({ error: "Failed to create form" });
  }
});

app.get("/api/forms", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const forms = await Form.find({ owner: req.session.userId });
    res.json({ forms });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch forms" });
  }
});

app.get("/api/forms/:formId", async (req, res) => {
  try {
    const form = await Form.findOne({ formId: req.params.formId });
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }
    res.json({ form });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch form" });
  }
});

app.post("/api/forms/:formId/submit", async (req, res) => {
  try {
    const { formId } = req.params;
    const { answers } = req.body;

    const form = await Form.findOne({ formId });
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    const requiredQuestions = form.questions.filter(q => q.required);
    for (const question of requiredQuestions) {
      if (!shouldShowQuestion(question.conditionalRules, answers)) {
        continue;
      }
      
      if (!answers[question.questionKey] || answers[question.questionKey] === '') {
        return res.status(400).json({ 
          error: `Required field "${question.label}" is missing` 
        });
      }
    }

    const formOwner = await User.findById(form.owner);
    if (!formOwner) {
      return res.status(500).json({ error: "Form owner not found" });
    }

    const airtableData = {};
    form.questions.forEach(question => {
      if (answers[question.questionKey] !== undefined) {
        airtableData[question.airtableFieldId] = answers[question.questionKey];
      }
    });

    const airtableResponse = await axios.post(
      `https://api.airtable.com/v0/${form.airtableBaseId}/${form.airtableTableId}`,
      {
        fields: airtableData
      },
      {
        headers: {
          Authorization: `Bearer ${formOwner.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const response = new Response({
      formId,
      airtableRecordId: airtableResponse.data.id,
      answers
    });
    await response.save();

    res.json({ 
      success: true, 
      responseId: response._id,
      airtableRecordId: airtableResponse.data.id 
    });

  } catch (error) {
    console.error("Form submission error:", error);
    res.status(500).json({ error: "Failed to submit form" });
  }
});

app.get("/api/forms/:formId/responses", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { formId } = req.params;
    
    const form = await Form.findOne({ formId, owner: req.session.userId });
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    const responses = await Response.find({ formId }).sort({ createdAt: -1 });
    res.json({ responses });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch responses" });
  }
});

app.post("/webhooks/airtable", async (req, res) => {
  try {
    const { webhook } = req.body;
    
    if (webhook && webhook.payloads) {
      for (const payload of webhook.payloads) {
        if (payload.actionMetadata) {
          const { recordId } = payload.actionMetadata;
          
          if (payload.actionType === 'delete') {
            await Response.updateMany(
              { airtableRecordId: recordId },
              { deletedInAirtable: true }
            );
          } else if (payload.actionType === 'update') {
            console.log(`Record ${recordId} was updated in Airtable`);
          }
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

app.listen(4000, () => console.log("Server running on http://localhost:4000"));