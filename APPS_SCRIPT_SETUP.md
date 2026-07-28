# Google Apps Script Setup for Nilgiri Community Join Forms

Complete guide to deploy the Apps Script Web App for reliable 24/7 Google Form submissions.

---

## 📋 Prerequisites

- Google Account (form owner's account preferred)
- 6 Google Forms created with their Form IDs

---

## 🔧 Step 1: Extract Form IDs

From each form URL, the **Form ID** is the string after `/forms/d/e/`:

| Community | Form ID |
|-----------|---------|
| Technicals | `1FAIpQLScGdGnwxm8HQTMVHYFD2nQFDDeAHWU6wbOb5dzPCQtw77taYg` |
| Statistic | `1FAIpQLScaM2V41DUPuc_k-PGv_r4RrVccmRELMbe2vhZBidQfysDDrw` |
| Sports | `1FAIpQLSexkgd1LSPg30abrMbdE11MnR8y6WQ37alQxWPImwraSSwcWQ` |
| Quiz | `1FAIpQLSdOX_L4iDTUKkb__VPlHFz_ddWjfHP7-q0w4bD5bV0vbKHicw` |
| Esport | `1FAIpQLSfcfZCP2r4o4elWZydlmW9om_bHUdTcjf1ZnhMAoe2DOX33yw` |
| Culturals | `1FAIpQLSclWlpbCVugdFar6TkBtJfYQ_w8owmpQq-zL4VpDOWlQKWDuQ` |

---

## 📝 Step 2: Create Apps Script Project

1. Go to **[script.google.com](https://script.google.com)**
2. Click **New Project** → Name: `Nilgiri Join Form Handler`
3. Delete starter code in `Code.gs`
4. Paste the **complete code below**
5. Save (⌘+S / Ctrl+S)

---

## 💻 Apps Script Code (`Code.gs`)

```javascript
/**
 * Nilgiri Community Join Form Handler
 * Google Apps Script Web App for reliable form submissions
 * Deploy: Execute as "Me", Access "Anyone"
 */

// ============================================
// CONFIGURATION - UPDATE FORM IDs HERE
// ============================================
const FORM_ID_MAP = {
  'technicals': '1FAIpQLScGdGnwxm8HQTMVHYFD2nQFDDeAHWU6wbOb5dzPCQtw77taYg',
  'statistic': '1FAIpQLScaM2V41DUPuc_k-PGv_r4RrVccmRELMbe2vhZBidQfysDDrw',
  'sports': '1FAIpQLSexkgd1LSPg30abrMbdE11MnR8y6WQ37alQxWPImwraSSwcWQ',
  'quiz': '1FAIpQLSdOX_L4iDTUKkb__VPlHFz_ddWjfHP7-q0w4bD5bV0vbKHicw',
  'esport': '1FAIpQLSfcfZCP2r4o4elWZydlmW9om_bHUdTcjf1ZnhMAoe2DOX33yw',
  'culturals': '1FAIpQLSclWlpbCVugdFar6TkBtJfYQ_w8owmpQq-zL4VpDOWlQKWDuQ'
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// ============================================
// MAIN ENTRY POINT
// ============================================
function doPost(e) {
  if (e && e.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  try {
    const payload = JSON.parse(e.postData.contents);
    const { communityKey, answers } = payload;
    
    if (!communityKey || !answers) {
      return createResponse(false, null, 'Missing communityKey or answers');
    }

    const formId = FORM_ID_MAP[communityKey.toLowerCase()];
    if (!formId) {
      return createResponse(false, null, `Unknown community: ${communityKey}`);
    }

    const result = submitToGoogleForm(formId, answers);
    return createResponse(true, result, null);
    
  } catch (error) {
    console.error('doPost error:', error);
    return createResponse(false, null, error.toString());
  }
}

function handleOptions() {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders(CORS_HEADERS);
}

function createResponse(success, data, error) {
  const response = { success };
  if (data) response.data = data;
  if (error) response.error = error;
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(CORS_HEADERS);
}

// ============================================
// GOOGLE FORM SUBMISSION
// ============================================
function submitToGoogleForm(formId, answers) {
  const form = FormApp.openById(formId);
  const formResponse = form.createResponse();
  
  // Build entryId -> item map
  const items = form.getItems();
  const itemMap = {};
  items.forEach(item => {
    itemMap[item.getId().toString()] = item;
  });

  // Fill responses
  Object.entries(answers).forEach(([entryId, value]) => {
    const item = itemMap[entryId];
    if (!item) return;
    
    const type = item.getType();
    const values = Array.isArray(value) ? value : [value];
    
    try {
      switch (type) {
        case FormApp.ItemType.TEXT:
        case FormApp.ItemType.PARAGRAPH_TEXT:
          formResponse.withItemResponse(item.asTextItem().createResponse(values[0]));
          break;
        case FormApp.ItemType.MULTIPLE_CHOICE:
          formResponse.withItemResponse(item.asMultipleChoiceItem().createResponse(values[0]));
          break;
        case FormApp.ItemType.CHECKBOX:
          formResponse.withItemResponse(item.asCheckboxItem().createResponse(values));
          break;
        case FormApp.ItemType.LIST:
          formResponse.withItemResponse(item.asListItem().createResponse(values[0]));
          break;
        case FormApp.ItemType.DATE:
          formResponse.withItemResponse(item.asDateItem().createResponse(new Date(values[0])));
          break;
        case FormApp.ItemType.TIME:
          formResponse.withItemResponse(item.asTimeItem().createResponse(values[0]));
          break;
        default:
          formResponse.withItemResponse(item.createResponse(values[0]));
      }
    } catch (err) {
      console.log('Field error:', entryId, err);
    }
  });

  const submittedResponse = formResponse.submit();
  
  // Get confirmation message from form settings
  const confirmationMessage = form.getConfirmationMessage();
  
  return {
    responseId: submittedResponse.getId(),
    confirmationMessage: confirmationMessage,
    editUrl: submittedResponse.getEditResponseUrl(),
    timestamp: new Date().toISOString()
  };
}

// ============================================
// TEST FUNCTION (Run manually in Apps Script)
// ============================================
function testSubmission() {
  const testPayload = {
    communityKey: 'technicals',
    answers: {
      // Add actual entryIds from your form schema
      // '123456789': 'Test User',
      // '987654321': 'test@example.com'
    }
  };
  
  const mockEvent = { 
    postData: { contents: JSON.stringify(testPayload) },
    httpMethod: 'POST'
  };
  
  const result = doPost(mockEvent);
  console.log('Test Result:', result.getContent());
}
```

---

## 🚀 Step 3: Deploy as Web App

1. Click **Deploy** → **New Deployment**
2. Click **gear icon** → Select **Web App**
3. Configuration:
   - **Description**: `Nilgiri Join Form Handler v1`
   - **Execute as**: **Me** (your Google account)
   - **Who has access**: **Anyone** (critical for 24/7 public access)
4. Click **Deploy**
5. **Authorize** when prompted (choose your account → Advanced → "Go to Nilgiri Join Form Handler (unsafe)")
6. Copy the **Web App URL** (format: `https://script.google.com/macros/s/AKfycb.../exec`)

---

## 🔗 Step 4: Configure Frontend & Backend

Add to your **Vercel/Netlify environment variables** and **backend `.env`**:

```env
APPS_SCRIPT_WEBAPP_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

**Restart your backend server** after adding the env var:
```bash
cd backend && npm run dev
```

**Frontend changes already implemented** (no further action needed):
- `api/_handlers/google-forms/submit.ts` - Proxies to Apps Script Web App
- `backend/routes/google-forms.js` - Proxies to Apps Script Web App  
- `src/pages/JoinPage.jsx` - Renders Google Form confirmation message after submission
- `src/pages/JoinPage.css` - Community-specific themes (6 themes)
- `index.html` - Added Google Fonts for all 6 themes

---

## ✅ Step 5: Test End-to-End

1. **Test Apps Script directly**:
   ```bash
   curl -X POST "YOUR_WEBAPP_URL" \
     -H "Content-Type: application/json" \
     -d '{"communityKey":"technicals","answers":{"ENTRY_ID_1":"Test User","ENTRY_ID_2":"test@example.com"}}'
   ```
   Should return: `{"success":true,"data":{"responseId":"...","confirmationMessage":"..."}}`

2. **Test from website**:
   - Go to `/community` → Click "Join Community" on Technicals
   - Fill form → Submit
   - Check Google Form responses → New entry appears
   - Success message shows form's confirmation text

---

## 🔒 24/7 Availability Guarantee

| Factor | Status |
|--------|--------|
| **Infrastructure** | Google's global servers (99.9%+ uptime) |
| **Execution** | Runs as your account - no cold starts |
| **Quota** | 30,000 executions/day (free tier) |
| **Persistence** | Survives indefinitely unless deleted |
| **Cost** | **Free** (within quotas) |

**No server maintenance needed.** The Web App URL works globally, 24/7, forever (or until you delete it).

---

## 🛠 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Script function not found: doPost" | Save project, redeploy as Web App |
| "Authorization required" | Re-deploy → authorize as yourself |
| CORS errors | Ensure `Access-Control-Allow-Origin: *` in headers |
| Form not found | Verify Form ID in `FORM_ID_MAP` matches exactly |
| Fields not submitting | Check entryIds match form schema (use `/api/google-forms/schema`) |
| Quota exceeded | Rare (30k/day) - request quota increase or optimize |

---

## 📞 Support

- Apps Script logs: **Executions** tab in script.google.com
- Frontend logs: Browser DevTools Network tab
- API logs: Vercel/Netlify function logs

---

*Generated for Nilgiri House Website - Community Join Integration*