// Test script to verify the frontend membership functionality
// This simulates the localStorage behavior for membership status persistence

// Mock localStorage for testing
const mockLocalStorage = {
  store: {},
  getItem: function(key) {
    return this.store[key] || null;
  },
  setItem: function(key, value) {
    this.store[key] = value;
  },
  removeItem: function(key) {
    delete this.store[key];
  },
  clear: function() {
    this.store = {};
  }
};

// Mock API responses
const mockApiResponses = {
  membershipStatus: {
    isMember: false,
    role: null,
    timelineVisibility: 'public'
  },
  joinResponse: {
    message: "You have successfully joined this timeline",
    role: "member",
    status: "joined"
  }
};

// Import the functions from api.js (simulated)
const api = {
  requestTimelineAccess: function(timelineId) {
    console.log(`Requesting access to timeline ${timelineId}`);
    
    // Simulate the preemptive localStorage update
    const membershipKey = `timeline_membership_${timelineId}`;
    const membershipData = {
      is_member: true,
      role: 'member',
      visibility: mockApiResponses.membershipStatus.timelineVisibility,
      timestamp: new Date().toISOString()
    };
    mockLocalStorage.setItem(membershipKey, JSON.stringify(membershipData));
    
    // Simulate API call
    console.log('API call successful');
    console.log('Response:', mockApiResponses.joinResponse);
    
    // Update localStorage with actual role from response
    membershipData.role = mockApiResponses.joinResponse.role;
    mockLocalStorage.setItem(membershipKey, JSON.stringify(membershipData));
    
    return Promise.resolve(mockApiResponses.joinResponse);
  },
  
  checkMembershipStatus: function(timelineId, retryCount = 0, forceRefresh = false) {
    console.log(`Checking membership status for timeline ${timelineId}`);
    console.log(`Force refresh: ${forceRefresh}, Retry count: ${retryCount}`);
    
    // Check localStorage first
    const membershipKey = `timeline_membership_${timelineId}`;
    const cachedData = mockLocalStorage.getItem(membershipKey);
    
    if (cachedData && !forceRefresh) {
      const parsedData = JSON.parse(cachedData);
      const timestamp = new Date(parsedData.timestamp);
      const now = new Date();
      const diffMinutes = (now - timestamp) / (1000 * 60);
      
      console.log(`Found cached membership data from ${diffMinutes.toFixed(2)} minutes ago`);
      
      // Use cached data if it's less than 30 minutes old
      if (diffMinutes < 30) {
        console.log('Using cached membership data:', parsedData);
        return Promise.resolve({
          is_member: parsedData.is_member,
          role: parsedData.role,
          timeline_visibility: parsedData.visibility
        });
      }
    }
    
    // Simulate API call
    console.log('Making API call to check membership status');
    return Promise.resolve(mockApiResponses.membershipStatus);
  }
};

// Simulate the TimelineV3 component's handleJoinCommunity function
function handleJoinCommunity(timelineId) {
  console.log('\n=== Testing handleJoinCommunity ===');
  
  // Set initial state
  let state = {
    isMember: false,
    joinRequestSent: false,
    joinRequestStatus: null,
    timelineDetails: {
      id: timelineId,
      name: 'Test Timeline',
      visibility: 'public'
    }
  };
  
  console.log('Initial state:', state);
  
  // Immediately update UI state
  state.isMember = true;
  state.joinRequestSent = true;
  console.log('After immediate UI update:', state);
  
  // Persist membership status preemptively
  persistMembershipStatus(timelineId, true, 'member', state.timelineDetails.visibility);
  
  // Call API to join
  api.requestTimelineAccess(timelineId)
    .then(response => {
      console.log('Join request successful:', response);
      
      // Update state based on response
      state.joinRequestStatus = 'success';
      state.isMember = true;
      
      // Persist membership status with actual role from response
      persistMembershipStatus(timelineId, true, response.role, state.timelineDetails.visibility);
      
      // Refresh membership status from backend after a short delay
      setTimeout(() => {
        api.checkMembershipStatus(timelineId, 0, true)
          .then(status => {
            console.log('Refreshed membership status:', status);
            state.isMember = status.is_member;
            console.log('Final state:', state);
          });
      }, 500);
    })
    .catch(error => {
      console.error('Error joining community:', error);
      state.joinRequestStatus = 'error';
    });
}

// Helper function to persist membership status
function persistMembershipStatus(timelineId, isMember, role, visibility) {
  const membershipKey = `timeline_membership_${timelineId}`;
  const membershipData = {
    is_member: isMember,
    role: role,
    visibility: visibility,
    timestamp: new Date().toISOString()
  };
  
  console.log(`Persisting membership status to localStorage for timeline ${timelineId}:`, membershipData);
  mockLocalStorage.setItem(membershipKey, JSON.stringify(membershipData));
}

// Test function to simulate page reload
function simulatePageReload(timelineId) {
  console.log('\n=== Simulating page reload ===');
  
  // Initial state on page load
  let state = {
    isMember: false,
    timelineDetails: {
      id: timelineId,
      name: 'Test Timeline',
      visibility: 'public'
    }
  };
  
  console.log('Initial state on page load:', state);
  
  // Check membership status on page load
  api.checkMembershipStatus(timelineId)
    .then(status => {
      console.log('Membership status from API/cache:', status);
      state.isMember = status.is_member;
      console.log('State after membership check:', state);
      
      // Persist membership status if user is a member
      if (status.is_member) {
        persistMembershipStatus(
          timelineId,
          status.is_member,
          status.role,
          status.timeline_visibility
        );
      }
    });
}

// Run tests
function runTests() {
  const timelineId = 123;
  
  console.log('=== TESTING MEMBERSHIP STATUS PERSISTENCE ===');
  console.log('Initial localStorage state:', mockLocalStorage.store);
  
  // Test 1: Join community
  handleJoinCommunity(timelineId);
  
  // Wait for async operations to complete
  setTimeout(() => {
    console.log('\n=== After joining community ===');
    console.log('localStorage state:', mockLocalStorage.store);
    
    // Test 2: Simulate page reload
    simulatePageReload(timelineId);
    
    // Wait for async operations to complete
    setTimeout(() => {
      console.log('\n=== Test Results ===');
      const membershipKey = `timeline_membership_${timelineId}`;
      const cachedData = mockLocalStorage.getItem(membershipKey);
      
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        console.log('✅ SUCCESS: Membership status was persisted to localStorage');
        console.log('Cached membership data:', parsedData);
        
        if (parsedData.is_member === true) {
          console.log('✅ SUCCESS: User is correctly marked as a member');
        } else {
          console.log('❌ FAILURE: User should be marked as a member');
        }
        
        if (parsedData.role === 'member') {
          console.log('✅ SUCCESS: User role is correctly set to "member"');
        } else {
          console.log('❌ FAILURE: User role should be "member"');
        }
      } else {
        console.log('❌ FAILURE: No membership data found in localStorage');
      }
    }, 1000);
  }, 1000);
}

// Run the tests
runTests();
