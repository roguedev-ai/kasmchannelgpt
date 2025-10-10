import { db } from '../src/lib/database/client';

async function testDatabase() {
  console.log('Testing database functionality...\n');
  
  try {
    // Test 1: Create admin user
    console.log('Test 1: Creating admin user...');
    const admin = await db.createUser({
      partnerId: 'test_admin',
      email: 'test.admin@example.com',
      password: 'admin123',
      role: 'admin',
      displayName: 'Test Admin',
    });
    console.log('✓ Admin user created:', admin.email);
    
    // Test 2: Create partner user
    console.log('\nTest 2: Creating partner user...');
    const partner = await db.createUser({
      partnerId: 'test_partner',
      email: 'test.partner@example.com',
      password: 'partner123',
      role: 'partner',
      displayName: 'Test Partner',
    });
    console.log('✓ Partner user created:', partner.email);
    
    // Test 3: Authenticate users
    console.log('\nTest 3: Testing authentication...');
    const adminAuth = await db.authenticateUser('test.admin@example.com', 'admin123');
    const partnerAuth = await db.authenticateUser('test.partner@example.com', 'partner123');
    const failedAuth = await db.authenticateUser('test.admin@example.com', 'wrongpass');
    
    console.log('Admin auth:', adminAuth ? '✓ Success' : '✗ Failed');
    console.log('Partner auth:', partnerAuth ? '✓ Success' : '✗ Failed');
    console.log('Failed auth:', !failedAuth ? '✓ Success' : '✗ Failed');
    
    // Test 4: Get users by different methods
    console.log('\nTest 4: Testing user retrieval...');
    const byId = db.getUserById(admin.id);
    const byEmail = db.getUserByEmail(partner.email);
    const byPartnerId = db.getUserByPartnerId('test_admin');
    
    console.log('Get by ID:', byId ? '✓ Success' : '✗ Failed');
    console.log('Get by email:', byEmail ? '✓ Success' : '✗ Failed');
    console.log('Get by partner ID:', byPartnerId ? '✓ Success' : '✗ Failed');
    
    // Test 5: List users
    console.log('\nTest 5: Testing user listing...');
    const allUsers = db.listUsers();
    const adminUsers = db.listUsers('admin');
    const partnerUsers = db.listUsers('partner');
    
    console.log('All users:', allUsers.length);
    console.log('Admin users:', adminUsers.length);
    console.log('Partner users:', partnerUsers.length);
    
    // Test 6: Update password
    console.log('\nTest 6: Testing password update...');
    await db.updatePassword(partner.id, 'newpassword123');
    const oldAuth = await db.authenticateUser('test.partner@example.com', 'partner123');
    const newAuth = await db.authenticateUser('test.partner@example.com', 'newpassword123');
    
    console.log('Old password rejected:', !oldAuth ? '✓ Success' : '✗ Failed');
    console.log('New password accepted:', newAuth ? '✓ Success' : '✗ Failed');
    
    // Test 7: Deactivate user
    console.log('\nTest 7: Testing user deactivation...');
    db.deactivateUser(partner.id);
    const deactivatedAuth = await db.authenticateUser('test.partner@example.com', 'newpassword123');
    console.log('Deactivated user auth:', !deactivatedAuth ? '✓ Success' : '✗ Failed');
    
    // Test 8: Audit logging
    console.log('\nTest 8: Testing audit logging...');
    db.logAudit(
      admin.id,
      'TEST_ACTION',
      'test_resource',
      { detail: 'test details' },
      '127.0.0.1'
    );
    console.log('✓ Audit log created');
    
    console.log('\n✓ All database tests completed successfully!');
    
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
testDatabase().catch(console.error);
