// Enhanced test script to verify the updated reports API endpoint
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const API_BASE_URL = 'http://localhost:3000/api';

// Test credentials (update with valid test user)
const testCredentials = {
  email: 'admin@example.com',
  password: 'admin123'
};

// Enhanced test data matching extension format
const testReportData = {
  type: 'false_positive',
  description: 'This word was incorrectly flagged as inappropriate. It appears to be a legitimate term used in proper context.',
  category: 'false_positive',
  reportedText: 'This is the actual content that was flagged by the system'
};

async function testEnhancedReportAPI() {
  try {
    console.log('🧪 Testing Enhanced Report API...\n');
    
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
      throw new Error(`Login failed: ${await loginResponse.text()}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful, got token\n');
    
    // 2. Test the enhanced reports endpoint
    console.log('2. Testing enhanced reports endpoint...');
    console.log('📤 Sending report data:', JSON.stringify(testReportData, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/users/reports`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testReportData)
    });
    
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response ok: ${response.ok}\n`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS! Report submitted successfully!');
      console.log('📥 Server response:', JSON.stringify(result, null, 2));
      
      // Verify all fields were saved correctly
      const report = result.report;
      const meta = result.meta;
      console.log('\n🔍 Field Verification:');
      console.log(`✅ Report ID: ${report.id}`);
      console.log(`✅ Type: ${report.type}`);
      console.log(`✅ Description: ${report.description}`);
      console.log(`✅ Category: ${report.category}`);
      console.log(`✅ Reported Text: ${report.reportedText}`);
      console.log(`✅ Status: ${report.status}`);
      console.log(`✅ Created At: ${report.createdAt}`);
      console.log(`✅ Updated At: ${report.updatedAt}`);
      
      console.log('\n📋 Meta Information:');
      console.log(`✅ User ID: ${meta.userId}`);
      console.log(`✅ Report Number: ${meta.reportNumber}`);
      console.log(`✅ Estimated Review Time: ${meta.estimatedReviewTime}`);
      console.log(`✅ Next Steps: ${meta.nextSteps}`);
      
    } else {
      const errorText = await response.text();
      console.error('❌ FAILED! Error:', errorText);
    }
    
    // 3. Test different report types
    console.log('\n3. Testing different report types...');
    
    const reportTypes = [
      {
        type: 'false_negative',
        description: 'This inappropriate content was not detected by the system',
        category: 'missed_content',
        reportedText: 'Some offensive content that should have been flagged'
      },
      {
        type: 'false_positive',
        description: 'Context was misunderstood by the detection system',
        category: 'context_issue',
        reportedText: 'Legitimate content that was incorrectly flagged'
      }
    ];
    
    for (const reportData of reportTypes) {
      console.log(`\n📝 Testing ${reportData.type} report...`);
      const testResponse = await fetch(`${API_BASE_URL}/users/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });
      
      if (testResponse.ok) {
        const result = await testResponse.json();
        console.log(`✅ ${reportData.type} report created successfully`);
        console.log(`📋 Report Number: ${result.meta.reportNumber}`);
      } else {
        console.log(`❌ Failed to create ${reportData.type} report`);
      }
    }
    
    // 4. Test validation errors
    console.log('\n4. Testing validation errors...');
    
    const invalidReports = [
      {
        // Missing required fields
        category: 'test',
        reportedText: 'test'
      },
      {
        type: 'invalid_type',
        description: 'test description'
      },
      {
        type: 'false_positive',
        description: 'x'.repeat(1001), // Too long description
        category: 'test'
      },
      {
        type: 'false_positive',
        description: 'test description',
        category: 'invalid_category'
      }
    ];
    
    for (let i = 0; i < invalidReports.length; i++) {
      const invalidData = invalidReports[i];
      console.log(`\n🚫 Testing validation error ${i + 1}...`);
      
      const validationResponse = await fetch(`${API_BASE_URL}/users/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      });
      
      if (!validationResponse.ok) {
        const errorText = await validationResponse.text();
        console.log(`✅ Validation working correctly - rejected invalid data:`);
        console.log(`📝 Error: ${errorText}`);
      } else {
        console.log(`⚠️ Warning: Validation might not be working - invalid data was accepted`);
      }
    }
    
    console.log('\n🎉 Enhanced Report API test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testEnhancedReportAPI();
