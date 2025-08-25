#!/bin/bash

# Comprehensive API Endpoint Testing Script (dynamic, env-aware)

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "🚀 Starting Comprehensive API Endpoint Testing"
echo "=============================================="
command -v jq >/dev/null 2>&1 || { echo "❌ jq is required. Install jq and re-run."; exit 1; }
echo "Using BASE_URL=$BASE_URL"
echo ""

# 0) Health
echo "1️⃣ Health check"
curl -s "$BASE_URL/health" | jq '.' || echo "❌ Health check failed"
echo ""

# 1) Login as seeded admin to get TOKEN
echo "2️⃣ Admin login to obtain JWT"
TOKEN=$(curl -s -X POST "$BASE_URL/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123"}' | jq -r '.data.token')
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Failed to obtain admin token. Ensure server is running and seed data exists."
  exit 1
fi
echo "✅ Got admin token"
echo ""

# 2) Register a regular user (unique email each run)
echo "3️⃣ Register user (body validation)"
RAND=$RANDOM
curl -s -X POST "$BASE_URL/api/users/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User $RAND\",\"email\":\"test$RAND@example.com\",\"password\":\"password123\",\"role\":\"user\"}" | jq '.'
echo ""

# 3) Get all users (admin) with valid/invalid pagination
echo "4️⃣ Get all users (admin) - valid pagination"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/users/all?page=1&limit=5" | jq '.'
echo "   Invalid pagination (expect 400)"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/users/all?page=abc&limit=xyz" | jq '.'
echo ""

# 4) List documents, capture one id if available
echo "5️⃣ List documents (auth)"
DOCS=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/documents?page=1&limit=5")
echo "$DOCS" | jq '.'
FIRST_DOC_ID=$(echo "$DOCS" | jq -r '.data[0].id // empty')
echo "First document id: ${FIRST_DOC_ID:-none}"
echo "   Invalid pagination (expect 400)"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/documents?page=abc&limit=xyz" | jq '.'
echo ""

# 5) Search documents by description/tags
echo "6️⃣ Search documents by description (auth)"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/documents/search?description=seeded&page=1&limit=5" | jq '.'
echo "   Search with invalid pagination (expect 400)"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/documents/search?description=seeded&page=abc&limit=xyz" | jq '.'
echo ""

# 6) Upload a document (multipart)
echo "7️⃣ Upload document (multipart)"
TMPFILE="/tmp/dms-sample-$RAND.txt"
echo "Hello from test script $RAND" > "$TMPFILE"
UPLOAD_RES=$(curl -s -X POST "$BASE_URL/api/documents/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$TMPFILE;type=text/plain" \
  -F "filename=$(basename "$TMPFILE")" \
  -F "mimetype=text/plain" \
  -F 'tags=["test","script"]' \
  -F "description=Uploaded via script")
echo "$UPLOAD_RES" | jq '.'
UPLOADED_DOC_ID=$(echo "$UPLOAD_RES" | jq -r '.data.id // empty')
if [ -z "$UPLOADED_DOC_ID" ] || [ "$UPLOADED_DOC_ID" = "null" ]; then
  echo "⚠️ Upload did not return an id; continuing with existing doc id if any"
  UPLOADED_DOC_ID="$FIRST_DOC_ID"
fi
echo "Using document id: ${UPLOADED_DOC_ID:-none}"
echo ""

# 7) Get document by id (if we have one)
if [ -n "$UPLOADED_DOC_ID" ]; then
  echo "8️⃣ Get document by id"
  curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/documents/$UPLOADED_DOC_ID" | jq '.'
  echo ""
fi

# 8) Update document metadata (description/tags)
if [ -n "$UPLOADED_DOC_ID" ]; then
  echo "9️⃣ Update document metadata (auth)"
  curl -s -X PUT "$BASE_URL/api/documents/$UPLOADED_DOC_ID/metadata" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
    -d '{"description":"Updated from script","tags":["test","updated"]}' | jq '.'
  echo "   Invalid body (expect 400)"
  curl -s -X PUT "$BASE_URL/api/documents/$UPLOADED_DOC_ID/metadata" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
    -d '{"filename":"not-allowed-here"}' | jq '.'
  echo ""
fi

# 9) Generate download link and attempt download
if [ -n "$UPLOADED_DOC_ID" ]; then
  echo "🔟 Generate download link & fetch"
  DL=$(curl -s -X POST "$BASE_URL/api/documents/$UPLOADED_DOC_ID/download-link" -H "Authorization: Bearer $TOKEN")
  echo "$DL" | jq '.'
  URL=$(echo "$DL" | jq -r '.data.url // empty')
  if [ -n "$URL" ] && [ "$URL" != "null" ]; then
    echo "   GET $BASE_URL$URL"
    curl -s -I "$BASE_URL$URL" | sed -n '1,10p'
  fi
  echo ""
fi

# 10) Users update example (needs existing user id; optional)
echo "1️⃣1️⃣ Users update example is skipped (no GET /api/users/:id endpoint)."
echo ""

echo "✅ Endpoint testing completed"