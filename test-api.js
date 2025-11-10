const axios = require('axios');

// Configuration
const KM_RES_IP = '192.168.1.72';
const PORT = 10870;
const BASE_URL = `http://${KM_RES_IP}:${PORT}`;
const AMR_BASE_URL = `${BASE_URL}/interfaces/api/amr`;

// Store auth token
let authToken = null;

// Helper function to get URL for endpoint
function get_URL(endpoint) {
    return `${AMR_BASE_URL}/${endpoint}`;
}

// Login function
async function login(username = 'admin', password = 'Admin') {
    console.log('\n=== Testing Login ===');
    const url = `${BASE_URL}/api/login`;
    const body = { username, password };
    
    try {
        const response = await axios.post(url, body, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('Login response:', JSON.stringify(response.data, null, 2));
        
        // Try to extract token from response
        if (response.data && response.data.data) {
            // Token might be nested in data.token or just be data itself
            if (typeof response.data.data === 'string') {
                authToken = response.data.data;
            } else if (response.data.data.token) {
                authToken = response.data.data.token;
            } else {
                authToken = response.data.data;
            }
            console.log('Auth token obtained:', authToken ? 'Yes' : 'No');
            if (authToken) {
                console.log('Token preview:', authToken.substring(0, 20) + '...');
            }
        }
        
        return response.data;
    } catch (error) {
        console.error('Login error:', error.message);
        if (error.response) {
            console.error('Response:', JSON.stringify(error.response.data, null, 2));
        }
        return null;
    }
}

// Main fetch function similar to appFetchSubMissions
const appFetchSubMissions = async (url, data, method) => {
    try {
        console.log(`\n[${method}] ${url}`);
        console.log('Request data:', JSON.stringify(data, null, 2));

        const headers = { 'Content-Type': 'application/json' };
        if (authToken) {
            // Handle both string token and object with token property
            const token = typeof authToken === 'string' ? authToken : (authToken.token || authToken);
            if (token) {
                // Use Bearer format (standard JWT format)
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        let response;
        if (method === 'GET') {
            response = await axios.get(url, { headers });
        } else {
            response = await axios({
                method: method,
                url: url,
                headers: headers,
                data: data
            });
        }

        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        return { success: false, error: error.message };
    }
};

// Test functions for different endpoints

async function testContainerQuery() {
    console.log('\n=== Testing containerQuery ===');
    const url = get_URL('containerQuery');
    const body = {
        containerCode: '',
        nodeCode: '',
        containerModelCode: '',
        areaCode: '',
        emptyFullStatus: ''
    };
    return await appFetchSubMissions(url, body, 'POST');
}

async function testJobQuery(jobCode = '') {
    console.log('\n=== Testing jobQuery ===');
    const url = get_URL('jobQuery');
    const body = {
        workflowId: '',
        containerCode: '',
        createUsername: '',
        jobCode: jobCode,
        limit: '1',
        maps: [],
        robotId: '',
        sourceValue: '',
        status: '',
        targetCellCode: '',
        workflowCode: '',
        workflowName: ''
    };
    return await appFetchSubMissions(url, body, 'POST');
}

async function testSubmitMission() {
    console.log('\n=== Testing submitMission ===');
    const url = get_URL('submitMission');
    
    const now = new Date();
    const time = `${now.getMilliseconds()} ${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
    const missionCode = `M--TEST-${time}`;
    const requestId = `RM-TEST-${time}`;

    const body = {
        orgId: 'Lab-D1-',
        requestId: requestId,
        missionCode: missionCode,
        missionType: 'MOVE',
        viewBoardType: '',
        robotModels: [],
        robotIds: [],
        robotType: 'LIFT',
        priority: 1,
        containerType: '',
        containerCode: '',
        templateCode: '',
        lockRobotAfterFinish: false,
        unlockRobotId: '',
        unlockMissionCode: '',
        idleNode: '',
        missionData: [
            {
                sequence: 1,
                position: 'NODE1',
                type: 'NODE_POINT',
                putDown: true,
                passStrategy: 'AUTO',
                waitingMillis: 0
            }
        ]
    };
    return await appFetchSubMissions(url, body, 'POST');
}

async function testContainerIn() {
    console.log('\n=== Testing containerIn ===');
    const url = get_URL('containerIn');
    
    const now = new Date();
    const time = `${now.getMilliseconds()} ${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
    const containerCode = `C-TEST-${time}`;

    const body = {
        containerCode: containerCode,
        containerModelCode: '',
        containerType: '',
        enterOrientation: '',
        isNew: 'true',
        position: 'NODE1',
        requestId: `request${now.getTime()}`
    };
    return await appFetchSubMissions(url, body, 'POST');
}

async function testContainerOut(containerCode) {
    console.log('\n=== Testing containerOut ===');
    const url = get_URL('containerOut');
    
    const body = {
        containerCode: containerCode,
        containerType: '',
        isDelete: 'false',
        position: '',
        requestId: `request${new Date().getTime()}`
    };
    return await appFetchSubMissions(url, body, 'POST');
}

// Check if plugins are available
async function checkPlugins() {
    console.log('\n=== Checking Available Plugins ===');
    const url = `${BASE_URL}/api/plugin/listPlugins`;
    
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (authToken) {
            const token = typeof authToken === 'string' ? authToken : (authToken.token || authToken);
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        const response = await axios.get(url, { headers });
        console.log('Plugins:', JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.error('Error checking plugins:', error.message);
        if (error.response) {
            console.error('Response:', JSON.stringify(error.response.data, null, 2));
        }
        return null;
    }
}

// Test alternative endpoint paths
async function testAlternativePaths() {
    console.log('\n=== Testing Alternative Endpoint Paths ===');
    
    const endpoints = [
        '/interfaces/api/amr/containerQuery',
        '/api/amr/containerQuery',
        '/amr/containerQuery',
        '/containerQuery'
    ];
    
    const body = {
        containerCode: '',
        nodeCode: '',
        containerModelCode: '',
        areaCode: '',
        emptyFullStatus: ''
    };
    
    for (const endpoint of endpoints) {
        const url = `${BASE_URL}${endpoint}`;
        console.log(`\nTrying: ${url}`);
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (authToken) {
                const token = typeof authToken === 'string' ? authToken : (authToken.token || authToken);
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
            }
            
            const response = await axios.post(url, body, {
                headers: headers,
                timeout: 5000
            });
            console.log(`✓ SUCCESS! Status: ${response.status}`);
            console.log('Response:', JSON.stringify(response.data, null, 2));
            return url; // Return the working URL
        } catch (error) {
            if (error.response) {
                console.log(`✗ Status: ${error.response.status}`);
                if (error.response.data) {
                    console.log(`  Message: ${JSON.stringify(error.response.data)}`);
                }
            } else {
                console.log(`✗ Error: ${error.message}`);
            }
        }
    }
    return null;
}

// Main test runner
async function runTests() {
    console.log('='.repeat(60));
    console.log(`Testing API at ${KM_RES_IP}:${PORT}`);
    console.log('='.repeat(60));

    try {
        // Step 1: Try to login first
        await login();
        
        // Step 2: Check available plugins (AMR endpoints might be from a plugin)
        await checkPlugins();
        
        // Step 3: Test alternative paths to find correct endpoint structure
        const workingPath = await testAlternativePaths();
        
        if (workingPath) {
            console.log(`\nFound working path: ${workingPath}`);
        }
        
        // Test 1: Container Query
        await testContainerQuery();
        
        // Test 2: Job Query
        await testJobQuery();
        
        // Test 3: Submit Mission (commented out by default as it creates actual missions)
        // await testSubmitMission();
        
        // Test 4: Container In (commented out by default as it creates containers)
        // await testContainerIn();
        
        console.log('\n' + '='.repeat(60));
        console.log('Tests completed!');
        console.log('='.repeat(60));
    } catch (error) {
        console.error('Test execution error:', error);
    }
}

// Run tests if executed directly
if (require.main === module) {
    runTests();
}

module.exports = {
    appFetchSubMissions,
    get_URL,
    login,
    testContainerQuery,
    testJobQuery,
    testSubmitMission,
    testContainerIn,
    testContainerOut,
    testAlternativePaths
};

