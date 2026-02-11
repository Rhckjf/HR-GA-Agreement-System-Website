#!/usr/bin/env python3
"""
HR & GA Agreement Management System - Backend API Testing
Tests all CRUD operations, authentication, file uploads, and dashboard stats
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from pathlib import Path
import tempfile
import os

class HRSystemAPITester:
    def __init__(self, base_url="https://docvault-110.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data storage
        self.created_vendor_id = None
        self.created_agreement_id = None

    def log_test(self, name, success, details="", response_data=None):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        if files:
            # Remove Content-Type for file uploads
            headers.pop('Content-Type', None)

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers)

            success = response.status_code == expected_status
            response_data = None
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            details = f"Status: {response.status_code}, Expected: {expected_status}"
            if not success and response_data:
                details += f", Response: {response_data}"

            self.log_test(name, success, details, response_data)
            return success, response_data

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_auth_login(self):
        """Test login with default admin credentials"""
        print("\n🔐 Testing Authentication...")
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@company.com", "password": "Admin123!"}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_auth_register(self):
        """Test user registration"""
        test_email = f"test_user_{datetime.now().strftime('%H%M%S')}@company.com"
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": test_email,
                "password": "TestPass123!",
                "name": "Test User"
            }
        )
        return success

    def test_auth_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_vendor_crud(self):
        """Test complete vendor CRUD operations"""
        print("\n🏢 Testing Vendor Management...")
        
        # Create vendor
        vendor_data = {
            "name": "Test Vendor Corp",
            "contact_person": "John Doe",
            "email": "john@testvendor.com",
            "phone": "+1-555-0123",
            "address": "123 Business St, City, State 12345"
        }
        
        success, response = self.run_test(
            "Create Vendor",
            "POST",
            "vendors",
            200,
            data=vendor_data
        )
        
        if success and 'id' in response:
            self.created_vendor_id = response['id']
            print(f"   Created vendor ID: {self.created_vendor_id}")
        
        # Get all vendors
        self.run_test(
            "Get All Vendors",
            "GET",
            "vendors",
            200
        )
        
        # Update vendor
        if self.created_vendor_id:
            updated_data = {
                "name": "Updated Test Vendor Corp",
                "contact_person": "Jane Smith",
                "email": "jane@testvendor.com",
                "phone": "+1-555-0124",
                "address": "456 Updated St, City, State 12345"
            }
            
            self.run_test(
                "Update Vendor",
                "PUT",
                f"vendors/{self.created_vendor_id}",
                200,
                data=updated_data
            )
        
        return success

    def test_agreement_crud(self):
        """Test complete agreement CRUD operations"""
        print("\n📄 Testing Agreement Management...")
        
        if not self.created_vendor_id:
            print("   ⚠️  No vendor available for agreement testing")
            return False
        
        # Create agreement
        start_date = datetime.now().isoformat()
        expiry_date = (datetime.now() + timedelta(days=45)).isoformat()
        
        agreement_data = {
            "title": "Test Service Agreement",
            "vendor_id": self.created_vendor_id,
            "category": "Service Agreement",
            "start_date": start_date,
            "expiry_date": expiry_date,
            "description": "This is a test agreement for API testing purposes"
        }
        
        success, response = self.run_test(
            "Create Agreement",
            "POST",
            "agreements",
            200,
            data=agreement_data
        )
        
        if success and 'id' in response:
            self.created_agreement_id = response['id']
            print(f"   Created agreement ID: {self.created_agreement_id}")
        
        # Get all agreements
        self.run_test(
            "Get All Agreements",
            "GET",
            "agreements",
            200
        )
        
        # Get agreement by ID
        if self.created_agreement_id:
            self.run_test(
                "Get Agreement by ID",
                "GET",
                f"agreements/{self.created_agreement_id}",
                200
            )
        
        # Test agreement filtering
        self.run_test(
            "Filter Agreements by Category",
            "GET",
            "agreements?category=Service Agreement",
            200
        )
        
        self.run_test(
            "Filter Agreements by Status",
            "GET",
            "agreements?status=active",
            200
        )
        
        self.run_test(
            "Search Agreements",
            "GET",
            "agreements?search=Test",
            200
        )
        
        # Update agreement
        if self.created_agreement_id:
            updated_agreement = {
                "title": "Updated Test Service Agreement",
                "description": "Updated description for testing"
            }
            
            self.run_test(
                "Update Agreement",
                "PUT",
                f"agreements/{self.created_agreement_id}",
                200,
                data=updated_agreement
            )
        
        return success

    def test_file_upload(self):
        """Test file upload functionality"""
        print("\n📎 Testing File Upload...")
        
        if not self.created_agreement_id:
            print("   ⚠️  No agreement available for file upload testing")
            return False
        
        # Create a temporary test file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.pdf', delete=False) as f:
            f.write("This is a test PDF content for agreement upload testing.")
            temp_file_path = f.name
        
        try:
            with open(temp_file_path, 'rb') as f:
                files = {'file': ('test_agreement.pdf', f, 'application/pdf')}
                
                success, response = self.run_test(
                    "Upload Agreement File",
                    "POST",
                    f"agreements/{self.created_agreement_id}/upload",
                    200,
                    files=files
                )
            
            return success
        
        finally:
            # Clean up temp file
            os.unlink(temp_file_path)

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        print("\n📊 Testing Dashboard Stats...")
        
        success, response = self.run_test(
            "Get Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        
        if success and response:
            expected_fields = ['total_agreements', 'active_agreements', 'expiring_soon', 'expired_agreements', 'total_vendors']
            missing_fields = [field for field in expected_fields if field not in response]
            
            if missing_fields:
                self.log_test(
                    "Dashboard Stats Fields",
                    False,
                    f"Missing fields: {missing_fields}"
                )
            else:
                self.log_test(
                    "Dashboard Stats Fields",
                    True,
                    f"All required fields present: {expected_fields}"
                )
                print(f"   Stats: {response}")
        
        return success

    def test_notifications(self):
        """Test notification system"""
        print("\n🔔 Testing Notifications...")
        
        # Get notifications
        success, response = self.run_test(
            "Get Notifications",
            "GET",
            "notifications",
            200
        )
        
        # Test marking notification as read (if any exist)
        if success and response and len(response) > 0:
            notification_id = response[0]['id']
            self.run_test(
                "Mark Notification as Read",
                "PATCH",
                f"notifications/{notification_id}/read",
                200
            )
        
        return success

    def test_expiry_agreement(self):
        """Test creating an expiring soon agreement to trigger notifications"""
        print("\n⏰ Testing Expiry Logic...")
        
        if not self.created_vendor_id:
            return False
        
        # Create agreement expiring in 15 days (should trigger expiring_soon status)
        start_date = datetime.now().isoformat()
        expiry_date = (datetime.now() + timedelta(days=15)).isoformat()
        
        agreement_data = {
            "title": "Expiring Soon Agreement",
            "vendor_id": self.created_vendor_id,
            "category": "NDA",
            "start_date": start_date,
            "expiry_date": expiry_date,
            "description": "Agreement that should be marked as expiring soon"
        }
        
        success, response = self.run_test(
            "Create Expiring Agreement",
            "POST",
            "agreements",
            200,
            data=agreement_data
        )
        
        if success and response:
            expected_status = "expiring_soon"
            actual_status = response.get('status')
            
            if actual_status == expected_status:
                self.log_test(
                    "Expiry Status Calculation",
                    True,
                    f"Status correctly set to: {actual_status}"
                )
            else:
                self.log_test(
                    "Expiry Status Calculation",
                    False,
                    f"Expected: {expected_status}, Got: {actual_status}"
                )
        
        return success

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete created agreement
        if self.created_agreement_id:
            self.run_test(
                "Delete Test Agreement",
                "DELETE",
                f"agreements/{self.created_agreement_id}",
                200
            )
        
        # Delete created vendor
        if self.created_vendor_id:
            self.run_test(
                "Delete Test Vendor",
                "DELETE",
                f"vendors/{self.created_vendor_id}",
                200
            )

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting HR & GA Agreement Management System API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Authentication tests
        if not self.test_auth_login():
            print("❌ Authentication failed - stopping tests")
            return False
        
        self.test_auth_register()
        self.test_auth_me()
        
        # Core functionality tests
        self.test_vendor_crud()
        self.test_agreement_crud()
        self.test_file_upload()
        self.test_dashboard_stats()
        self.test_notifications()
        self.test_expiry_agreement()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = HRSystemAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results_file = "/app/test_reports/backend_api_results.json"
    with open(results_file, 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
            "test_results": tester.test_results
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: {results_file}")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())