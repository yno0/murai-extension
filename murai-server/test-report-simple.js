// Simple test script to verify report creation is working
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const API_BASE_URL = 'http://localhost:3000/api';

// Test credentials - update these with valid credentials
const testCredentials = {
  email: 'admin@example.com',
  password: 'admin123'
};

async function testReportCreation() {
  try {
    console.log('🧪 Testing Report Creation...\n');
    
    // 1. Login to get token
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCredentials)
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(`Login failed (${loginResponse.status}): ${errorText}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log('Token:', loginData.token ? `${loginData.token.substring(0, 20)}...` : 'NO TOKEN');
    
    // 2. Test simple report creation
    console.log('\n2. Creating test report...');
    
    const reportData = {
      type: 'false_positive',
      description: 'Test report from simple test script',
      category: 'false_positive',
      reportedText: 'This is test content that was flagged'
    };
    
    console.log('Report data:', reportData);
    
    const reportResponse = await fetch(`${API_BASE_URL}/users/reports`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData)
    });
    
    console.log('Response status:', reportResponse.status);
    console.log('Response headers:', Object.fromEntries(reportResponse.headers.entries()));
    
    if (reportResponse.ok) {
      const result = await reportResponse.json();
      console.log('\n✅ SUCCESS! Report created successfully!');
      console.log('Response:', JSON.stringify(result, null, 2));
      
      // 3. Verify the report was saved by checking the database
      console.log('\n3. Verifying report was saved...');
      
      const getReportsResponse = await fetch(`${API_BASE_URL}/users/reports`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        }
      });
      
      if (getReportsResponse.ok) {
        const reports = await getReportsResponse.json();
        console.log('✅ Reports retrieved successfully');
        console.log(`Total reports: ${reports.pagination?.totalReports || reports.reports?.length || 0}`);
        
        // Find our test report
        const testReport = reports.reports?.find(r => r.description === reportData.description);
        if (testReport) {
          console.log('✅ Test report found in database!');
          console.log('Report details:', {
            id: testReport.id,
            type: testReport.type,
            category: testReport.category,
            status: testReport.status,
            createdAt: testReport.createdAt
          });
        } else {
          console.log('⚠️ Test report not found in retrieved reports');
        }
      } else {
        console.log('⚠️ Failed to retrieve reports for verification');
      }
      
    } else {
      const errorText = await reportResponse.text();
      console.error('\n❌ FAILED! Report creation failed');
      console.error('Status:', reportResponse.status);
      console.error('Error:', errorText);
      
      // Try to parse error as JSON for better formatting
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Parsed error:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.error('Raw error text:', errorText);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
console.log('Starting simple report test...');
testReportCreation();
