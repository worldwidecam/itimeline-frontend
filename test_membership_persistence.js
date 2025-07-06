/**
 * Test script for the community timeline membership persistence system
 * This script tests the new membership persistence features that store user memberships
 * and verify they are correctly maintained across sessions
 */

// Utility function to make API calls
async function callApi(endpoint, method = 'GET', token = null, body = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`http://localhost:5000/api/v1${endpoint}`, options);
    return await response.json();
  } catch (error) {
    console.error(`Error calling API ${endpoint}:`, error);
    return { error: true, message: error.message };
  }
}

// Test user login
async function testLogin(email, password) {
  console.log(`\n=== Testing login for ${email} ===`);
  
  try {
    const response = await callApi('/auth/login', 'POST', null, { email, password });
    
    if (response.access_token) {
      console.log('✅ Login successful');
      return response.access_token;
    } else {
      console.error('❌ Login failed:', response);
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    return null;
  }
}

// Test fetching user memberships
async function testFetchUserMemberships(token) {
  console.log('\n=== Testing fetch user memberships ===');
  
  try {
    const response = await callApi('/user/memberships', 'GET', token);
    
    if (response.error) {
      console.error('❌ Failed to fetch user memberships:', response);
      return null;
    }
    
    console.log(`✅ Successfully fetched ${response.length} memberships`);
    console.log(response);
    return response;
  } catch (error) {
    console.error('❌ Error fetching user memberships:', error);
    return null;
  }
}

// Test checking membership status for a specific timeline
async function testCheckMembershipStatus(token, timelineId) {
  console.log(`\n=== Testing membership status for timeline ${timelineId} ===`);
  
  try {
    const response = await callApi(`/timelines/${timelineId}/membership-status`, 'GET', token);
    
    if (response.error) {
      console.error(`❌ Failed to check membership status for timeline ${timelineId}:`, response);
      return null;
    }
    
    console.log(`✅ Membership status for timeline ${timelineId}:`, response);
    return response;
  } catch (error) {
    console.error(`❌ Error checking membership status for timeline ${timelineId}:`, error);
    return null;
  }
}

// Test joining a community timeline
async function testJoinCommunity(token, timelineId) {
  console.log(`\n=== Testing joining community timeline ${timelineId} ===`);
  
  try {
    const response = await callApi(`/timelines/${timelineId}/access-requests`, 'POST', token);
    
    if (response.error) {
      console.error(`❌ Failed to join timeline ${timelineId}:`, response);
      return false;
    }
    
    console.log(`✅ Successfully joined timeline ${timelineId}:`, response);
    return true;
  } catch (error) {
    console.error(`❌ Error joining timeline ${timelineId}:`, error);
    return false;
  }
}

// Test localStorage caching
function testLocalStorageCaching() {
  console.log('\n=== Testing localStorage caching ===');
  
  try {
    // Check if user memberships are cached in localStorage
    const cachedMemberships = localStorage.getItem('user_memberships');
    
    if (cachedMemberships) {
      const parsedData = JSON.parse(cachedMemberships);
      console.log(`✅ Found cached memberships from ${new Date(parsedData.timestamp).toLocaleString()}`);
      console.log(`✅ Cached ${parsedData.data.length} memberships`);
      return parsedData.data;
    } else {
      console.log('❌ No cached memberships found in localStorage');
      return null;
    }
  } catch (error) {
    console.error('❌ Error checking localStorage cache:', error);
    return null;
  }
}

// Test clearing localStorage cache
function testClearCache() {
  console.log('\n=== Testing clearing localStorage cache ===');
  
  try {
    localStorage.removeItem('user_memberships');
    console.log('✅ Cleared user memberships cache');
    
    // Check if it was actually cleared
    const cachedMemberships = localStorage.getItem('user_memberships');
    if (!cachedMemberships) {
      console.log('✅ Verified cache was cleared');
      return true;
    } else {
      console.error('❌ Failed to clear cache');
      return false;
    }
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    return false;
  }
}

// Test simulating a page refresh
function testSimulatePageRefresh() {
  console.log('\n=== Simulating page refresh ===');
  console.log('⚠️ This would normally clear in-memory state but keep localStorage');
  console.log('⚠️ In this test script, we\'re just verifying localStorage persistence');
  
  const cachedMemberships = testLocalStorageCaching();
  return cachedMemberships !== null;
}

// Test full workflow
async function testFullWorkflow() {
  console.log('\n=== STARTING FULL WORKFLOW TEST ===\n');
  
  // Step 1: Login
  const token = await testLogin('user1@example.com', 'password');
  if (!token) return;
  
  // Step 2: Clear any existing cache
  testClearCache();
  
  // Step 3: Fetch user memberships (should store in localStorage)
  const memberships = await testFetchUserMemberships(token);
  if (!memberships) return;
  
  // Step 4: Verify localStorage caching
  const cachedMemberships = testLocalStorageCaching();
  
  // Step 5: Check membership status for a specific timeline
  // Use the first timeline from the memberships list
  if (memberships.length > 0) {
    const timelineId = memberships[0].timeline_id;
    await testCheckMembershipStatus(token, timelineId);
  } else {
    console.log('⚠️ No memberships found to test membership status');
  }
  
  // Step 6: Simulate page refresh
  const refreshResult = testSimulatePageRefresh();
  console.log(refreshResult ? '✅ Membership data persisted after page refresh' : '❌ Failed to persist membership data');
  
  console.log('\n=== FULL WORKFLOW TEST COMPLETED ===\n');
}

// Run the test
testFullWorkflow().catch(error => {
  console.error('Test failed with error:', error);
});
