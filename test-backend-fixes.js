#!/usr/bin/env node

// Test script to verify backend fixes for upload paths and CRUD operations
import jwt from 'jsonwebtoken';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

// Mock user token for testing
const mockUser = {
  id: 'test-user-1',
  email: 'test@nilgiri.club',
  role: 'club'
};

const testToken = jwt.sign(mockUser, JWT_SECRET, { expiresIn: '1h' });

console.log('🧪 Backend Fixes Test Suite');
console.log('============================\n');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Test Token Role: ${mockUser.role}\n`);

// Test 1: Upload with correct folder path
async function testUploadPath() {
  console.log('Test 1: Upload Path Structure');
  console.log('-----------------------------');
  
  try {
    // Create a simple test image
    const testImagePath = '/tmp/test-image.jpg';
    // Note: In real scenario, you'd create an actual image file
    
    const formData = new FormData();
    formData.append('bucket', 'nilgiri_media');
    formData.append('category', 'Events'); // Should create: nilgiri_website/Events/
    formData.append('file', Buffer.from('fake image data'), { filename: 'test.jpg', contentType: 'image/jpeg' });
    
    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      console.log(`✅ Upload successful`);
      console.log(`   Filepath: ${data.filepath}`);
      
      // Verify path structure
      if (data.filepath?.includes('nilgiri_website/Events')) {
        console.log(`✅ PASS: Path structure correct (contains 'nilgiri_website/Events')`);
      } else {
        console.log(`❌ FAIL: Expected path to contain 'nilgiri_website/Events', got: ${data.filepath}`);
      }
    } else {
      console.log(`❌ Upload failed: ${data.error}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  console.log();
}

// Test 2: Test CRUD with proper authentication
async function testCrudOperations() {
  console.log('Test 2: CRUD Operations (Events)');
  console.log('--------------------------------');
  
  try {
    // Create Event
    console.log('\n2.1 CREATE Event');
    const createResponse = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify({
        title: 'Test Event',
        description: 'This is a test event',
        date: '2026-03-15',
        time: '10:00 AM',
        location: 'Nilgiri HQ',
        category: 'Workshop'
      })
    });

    const createData = await createResponse.json();
    console.log(`Status: ${createResponse.status}`);
    
    if (createResponse.ok) {
      console.log(`✅ PASS: Event created with ID ${createData.event.id}`);
      const eventId = createData.event.id;

      // Read Event
      console.log('\n2.2 READ Event');
      const readResponse = await fetch(`${BASE_URL}/api/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });

      if (readResponse.ok) {
        console.log(`✅ PASS: Event retrieved successfully`);
      } else {
        console.log(`❌ FAIL: Could not read event - ${readResponse.status}`);
      }

      // Update Event
      console.log('\n2.3 UPDATE Event');
      const updateResponse = await fetch(`${BASE_URL}/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`
        },
        body: JSON.stringify({
          title: 'Updated Test Event',
          description: 'Updated description'
        })
      });

      if (updateResponse.ok) {
        console.log(`✅ PASS: Event updated successfully`);
      } else {
        const err = await updateResponse.json();
        console.log(`❌ FAIL: Could not update event - ${err.error}`);
      }

      // Delete Event
      console.log('\n2.4 DELETE Event');
      const deleteResponse = await fetch(`${BASE_URL}/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });

      if (deleteResponse.ok) {
        console.log(`✅ PASS: Event deleted successfully`);
      } else {
        const err = await deleteResponse.json();
        console.log(`❌ FAIL: Could not delete event - ${err.error}`);
      }
    } else {
      console.log(`❌ FAIL: Could not create event - ${createData.error}`);
      console.log(`   Response:`, createData);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  console.log();
}

// Test 3: Test authentication middleware
async function testAuthMiddleware() {
  console.log('Test 3: Authentication Middleware');
  console.log('--------------------------------');
  
  try {
    // Test without token
    console.log('\n3.1 Request WITHOUT token');
    const noTokenResponse = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: 'Test' })
    });

    const noTokenData = await noTokenResponse.json();
    if (noTokenResponse.status === 401) {
      console.log(`✅ PASS: Properly rejected (401) - ${noTokenData.error}`);
    } else {
      console.log(`❌ FAIL: Expected 401, got ${noTokenResponse.status}`);
    }

    // Test with invalid token
    console.log('\n3.2 Request with INVALID token');
    const invalidTokenResponse = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      },
      body: JSON.stringify({ title: 'Test' })
    });

    if (invalidTokenResponse.status === 401) {
      console.log(`✅ PASS: Properly rejected invalid token (401)`);
    } else {
      console.log(`❌ FAIL: Expected 401, got ${invalidTokenResponse.status}`);
    }

    // Test with valid token but insufficient role
    console.log('\n3.3 Request with VALID token but insufficient role');
    const lowRoleUser = { email: 'user@test.com', role: 'viewer' };
    const lowRoleToken = jwt.sign(lowRoleUser, JWT_SECRET, { expiresIn: '1h' });

    const lowRoleResponse = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lowRoleToken}`
      },
      body: JSON.stringify({
        title: 'Test Event',
        date: '2026-03-15'
      })
    });

    const lowRoleData = await lowRoleResponse.json();
    if (lowRoleResponse.status === 403) {
      console.log(`✅ PASS: Properly rejected insufficient role (403) - ${lowRoleData.error}`);
    } else {
      console.log(`❌ FAIL: Expected 403, got ${lowRoleResponse.status}`);
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  console.log();
}

// Run all tests
async function runAllTests() {
  console.log('Starting tests...\n');
  
  // Uncomment to run specific tests
  // await testUploadPath();
  await testCrudOperations();
  await testAuthMiddleware();
  
  console.log('============================');
  console.log('✅ Tests completed!\n');
}

runAllTests().catch(console.error);
