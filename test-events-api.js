// Test script to check events API and seed sample data
const baseUrl = 'http://localhost:5174';

async function testEventsAPI() {
  console.log('Testing /api/events endpoint...\n');
  
  try {
    // Test GET
    console.log('1. Testing GET /api/events');
    const getResponse = await fetch(`${baseUrl}/api/events`);
    const getData = await getResponse.json();
    console.log('Status:', getResponse.status);
    console.log('Response:', JSON.stringify(getData, null, 2));
    console.log('Number of events:', Array.isArray(getData) ? getData.length : getData.events?.length || 0);
    
    // If no events, try to create one
    if (!getData.events || getData.events.length === 0) {
      console.log('\n2. No events found. Attempting to create sample event...');
      
      const sampleEvent = {
        title: 'Sample Tech Workshop',
        date: '2026-02-15',
        time: '10:00 AM',
        location: 'Room 101',
        description: 'Learn about web development',
        is_past: false
      };
      
      console.log('Creating event:', sampleEvent);
      
      const postResponse = await fetch(`${baseUrl}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token' // You may need to adjust this
        },
        body: JSON.stringify(sampleEvent)
      });
      
      const postData = await postResponse.json();
      console.log('POST Status:', postResponse.status);
      console.log('POST Response:', JSON.stringify(postData, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEventsAPI();
