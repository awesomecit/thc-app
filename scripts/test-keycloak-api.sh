#!/bin/bash
# Test Keycloak Admin API per setup realm ticops
# Rispetta YAGNI: solo operazioni necessarie per auth flow

set -e

# Load .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

KC_URL="${KEYCLOAK_URL:-http://localhost:8081}"
KC_ADMIN="${KEYCLOAK_ADMIN:-admin}"
KC_ADMIN_PWD="${KEYCLOAK_ADMIN_PASSWORD:-admin}"
REALM="ticops"

echo "🔐 Testing Keycloak API at $KC_URL"
echo ""

# Step 1: Get admin token
echo "1️⃣  Getting admin token..."
ADMIN_TOKEN=$(curl -s -X POST "$KC_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$KC_ADMIN" \
  -d "password=$KC_ADMIN_PWD" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

if [ "$ADMIN_TOKEN" == "null" ] || [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Failed to get admin token"
  exit 1
fi
echo "✅ Admin token obtained"
echo ""

# Step 2: Check if realm exists
echo "2️⃣  Checking if realm '$REALM' exists..."
REALM_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
  "$KC_URL/admin/realms/$REALM" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if [ "$REALM_EXISTS" == "200" ]; then
  echo "✅ Realm '$REALM' already exists"
else
  echo "📝 Creating realm '$REALM'..."
  curl -s -X POST "$KC_URL/admin/realms" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"realm\": \"$REALM\",
      \"enabled\": true,
      \"displayName\": \"TICOps Platform\",
      \"registrationAllowed\": false,
      \"loginWithEmailAllowed\": true,
      \"duplicateEmailsAllowed\": false
    }"
  echo "✅ Realm '$REALM' created"
fi
echo ""

# Step 3: Create backend client (confidential)
echo "3️⃣  Creating backend client 'thc-backend'..."
CLIENT_EXISTS=$(curl -s "$KC_URL/admin/realms/$REALM/clients?clientId=thc-backend" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[0].id // empty')

if [ -n "$CLIENT_EXISTS" ]; then
  echo "✅ Client 'thc-backend' already exists (ID: $CLIENT_EXISTS)"
else
  curl -s -X POST "$KC_URL/admin/realms/$REALM/clients" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "clientId": "thc-backend",
      "protocol": "openid-connect",
      "publicClient": false,
      "serviceAccountsEnabled": true,
      "authorizationServicesEnabled": true,
      "directAccessGrantsEnabled": true,
      "standardFlowEnabled": false
    }'
  echo "✅ Client 'thc-backend' created"
fi
echo ""

# Step 4: Create frontend client (public)
echo "4️⃣  Creating frontend client 'thc-frontend'..."
FRONTEND_CLIENT_EXISTS=$(curl -s "$KC_URL/admin/realms/$REALM/clients?clientId=thc-frontend" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[0].id // empty')

if [ -n "$FRONTEND_CLIENT_EXISTS" ]; then
  echo "✅ Client 'thc-frontend' already exists (ID: $FRONTEND_CLIENT_EXISTS)"
else
  curl -s -X POST "$KC_URL/admin/realms/$REALM/clients" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "clientId": "thc-frontend",
      "protocol": "openid-connect",
      "publicClient": true,
      "redirectUris": ["http://localhost:*"],
      "webOrigins": ["http://localhost:*"],
      "standardFlowEnabled": true,
      "directAccessGrantsEnabled": true
    }'
  echo "✅ Client 'thc-frontend' created"
fi
echo ""

# Step 5: Get public key for JWT validation
echo "5️⃣  Getting realm public key..."
PUBLIC_KEY=$(curl -s "$KC_URL/realms/$REALM" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.public_key')

if [ -n "$PUBLIC_KEY" ] && [ "$PUBLIC_KEY" != "null" ]; then
  echo "✅ Public key obtained"
  echo ""
  echo "📋 Add this to your .env file:"
  echo "PLT_KEYCLOAK_PUBLIC_KEY=\"-----BEGIN PUBLIC KEY-----"
  echo "$PUBLIC_KEY" | fold -w 64
  echo "-----END PUBLIC KEY-----\""
else
  echo "⚠️  Could not retrieve public key"
fi
echo ""

# Step 6: Test user creation
echo "6️⃣  Testing user creation..."
TEST_USER="test-$(date +%s)@ticops.local"
USER_CREATE=$(curl -s -X POST "$KC_URL/admin/realms/$REALM/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$TEST_USER\",
    \"email\": \"$TEST_USER\",
    \"enabled\": true,
    \"emailVerified\": true,
    \"credentials\": [{
      \"type\": \"password\",
      \"value\": \"Test123!\",
      \"temporary\": false
    }]
  }")

# Get user UUID
USER_UUID=$(curl -s "$KC_URL/admin/realms/$REALM/users?email=$TEST_USER" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[0].id')

if [ -n "$USER_UUID" ] && [ "$USER_UUID" != "null" ]; then
  echo "✅ Test user created with UUID: $USER_UUID"
  
  # Test login with created user
  echo ""
  echo "7️⃣  Testing user login..."
  USER_TOKEN=$(curl -s -X POST "$KC_URL/realms/$REALM/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=$TEST_USER" \
    -d "password=Test123!" \
    -d "grant_type=password" \
    -d "client_id=thc-frontend" | jq -r '.access_token')
  
  if [ -n "$USER_TOKEN" ] && [ "$USER_TOKEN" != "null" ]; then
    echo "✅ User login successful"
    echo ""
    echo "📋 Token payload:"
    echo "$USER_TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null | jq . || echo "(could not decode)"
  else
    echo "❌ User login failed"
  fi
  
  # Cleanup test user
  echo ""
  echo "🧹 Cleaning up test user..."
  curl -s -X DELETE "$KC_URL/admin/realms/$REALM/users/$USER_UUID" \
    -H "Authorization: Bearer $ADMIN_TOKEN"
  echo "✅ Test user deleted"
else
  echo "❌ Failed to create test user"
fi

echo ""
echo "✨ Keycloak setup complete!"
echo ""
echo "Next steps:"
echo "  1. Update PLT_KEYCLOAK_PUBLIC_KEY in .env"
echo "  2. Re-enable web/thc-db/plugins/auth.ts.disabled"
echo "  3. Re-enable web/thc-db/routes/auth.ts.disabled"
echo "  4. Re-enable web/thc-db/routes/users.ts.disabled"
echo "  5. Restart npm run dev"
