import fetch from 'node-fetch';
import { db } from '../src/lib/database/client';

const BASE_URL = 'http://localhost:3000/api';

async function testAuth() {
  console.log('Testing authentication system...\n');
  
  try {
    // Test 1: Login with default admin
    console.log('Test 1: Login with default admin...');
    const adminLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@rag-platform.local',
        password: 'admin123',
      }),
    });
    
    if (!adminLoginResponse.ok) {
      throw new Error(`Admin login failed: ${adminLoginResponse.statusText}`);
    }
    
    const adminAuth = await adminLoginResponse.json();
    console.log('✓ Admin login successful');
    console.log('  Token:', adminAuth.token.substring(0, 20) + '...');
    console.log('  Role:', adminAuth.role);
    
    // Test 2: Create new partner using admin token
    console.log('\nTest 2: Create new partner...');
    const createPartnerResponse = await fetch(`${BASE_URL}/admin/partners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAuth.token}`,
      },
      body: JSON.stringify({
        partnerId: 'test_partner',
        email: 'test.partner@example.com',
        password: 'partner123',
        displayName: 'Test Partner',
      }),
    });
    
    if (!createPartnerResponse.ok) {
      throw new Error(`Partner creation failed: ${createPartnerResponse.statusText}`);
    }
    
    const partnerCreated = await createPartnerResponse.json();
    console.log('✓ Partner created:', partnerCreated.partner.email);
    
    // Test 3: List partners using admin token
    console.log('\nTest 3: List partners...');
    const listPartnersResponse = await fetch(`${BASE_URL}/admin/partners`, {
      headers: {
        'Authorization': `Bearer ${adminAuth.token}`,
      },
    });
    
    if (!listPartnersResponse.ok) {
      throw new Error(`List partners failed: ${listPartnersResponse.statusText}`);
    }
    
    const partnersList = await listPartnersResponse.json();
    console.log('✓ Partners listed:', partnersList.partners.length, 'partners found');
    
    // Test 4: Login as new partner
    console.log('\nTest 4: Partner login...');
    const partnerLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test.partner@example.com',
        password: 'partner123',
      }),
    });
    
    if (!partnerLoginResponse.ok) {
      throw new Error(`Partner login failed: ${partnerLoginResponse.statusText}`);
    }
    
    const partnerAuth = await partnerLoginResponse.json();
    console.log('✓ Partner login successful');
    console.log('  Token:', partnerAuth.token.substring(0, 20) + '...');
    console.log('  Role:', partnerAuth.role);
    
    // Test 5: Partner tries to access admin endpoint (should fail)
    console.log('\nTest 5: Testing role-based access...');
    const unauthorizedResponse = await fetch(`${BASE_URL}/admin/partners`, {
      headers: {
        'Authorization': `Bearer ${partnerAuth.token}`,
      },
    });
    
    if (unauthorizedResponse.status === 403) {
      console.log('✓ Partner correctly denied access to admin endpoint');
    } else {
      throw new Error('Partner was not denied access to admin endpoint!');
    }
    
    // Test 6: Invalid login attempts
    console.log('\nTest 6: Testing invalid logins...');
    
    const wrongPasswordResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test.partner@example.com',
        password: 'wrongpass',
      }),
    });
    
    const nonexistentUserResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'anypass',
      }),
    });
    
    console.log('Wrong password:', wrongPasswordResponse.status === 401 ? '✓ Rejected' : '✗ Not rejected');
    console.log('Nonexistent user:', nonexistentUserResponse.status === 401 ? '✓ Rejected' : '✗ Not rejected');
    
    // Test 7: Invalid tokens
    console.log('\nTest 7: Testing invalid tokens...');
    
    const invalidTokenResponse = await fetch(`${BASE_URL}/admin/partners`, {
      headers: {
        'Authorization': 'Bearer invalid.token.here',
      },
    });
    
    const noTokenResponse = await fetch(`${BASE_URL}/admin/partners`);
    
    console.log('Invalid token:', invalidTokenResponse.status === 401 ? '✓ Rejected' : '✗ Not rejected');
    console.log('No token:', noTokenResponse.status === 401 ? '✓ Rejected' : '✗ Not rejected');
    
    console.log('\n✓ All authentication tests completed successfully!');
    
  } catch (error) {
    console.error('\n✗ Test failed:', error);
    process.exit(1);
  } finally {
    // Clean up test data
    console.log('\nCleaning up test data...');
    db.close();
  }
}

// Run tests
testAuth().catch(console.error);
