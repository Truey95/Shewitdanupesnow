// Debug helper utility for troubleshooting save button issues
// Based on debugging instructions for Printify integration

export const debugHelper = {
  // Step 1: Check if request hits backend
  logFrontendRequest: (endpoint: string, data: any) => {
    console.group('[DEBUG] Frontend → Backend Request');
    console.log('🔍 Endpoint:', endpoint);
    console.log('📤 Request data:', data);
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.groupEnd();
  },

  // Step 2: Check backend response
  logBackendResponse: (status: number, data: any) => {
    console.group('[DEBUG] Backend Response');
    console.log('📊 Status:', status);
    console.log('📨 Response data:', data);
    console.log('✅ Success:', status >= 200 && status < 300);
    console.groupEnd();
  },

  // Step 3: Check Printify API interaction
  logPrintifyRequest: (url: string, method: string, payload?: any) => {
    console.group('[DEBUG] Backend → Printify API');
    console.log('🌐 API URL:', url);
    console.log('🔧 Method:', method);
    if (payload) {
      console.log('📤 Payload:', payload);
    }
    console.groupEnd();
  },

  // Step 4: Check Printify API response
  logPrintifyResponse: (status: number, responseData: any, error?: any) => {
    console.group('[DEBUG] Printify API Response');
    console.log('📊 Status:', status);
    console.log('📨 Response:', responseData);
    if (error) {
      console.error('❌ Error:', error);
    }
    console.log('✅ Success:', status >= 200 && status < 300);
    console.groupEnd();
  },

  // Comprehensive error analysis
  analyzeError: (error: any, context: string) => {
    console.group(`[DEBUG] Error Analysis - ${context}`);
    console.error('❌ Error message:', error.message || error);
    console.error('📍 Error stack:', error.stack);
    console.error('🔍 Error type:', typeof error);
    console.error('📝 Context:', context);
    
    // Common issues checklist
    console.group('🔧 Troubleshooting Checklist:');
    console.log('1. ✓ Check network tab for failed requests');
    console.log('2. ✓ Verify backend logs for incoming requests'); 
    console.log('3. ✓ Check Printify API response status');
    console.log('4. ✓ Ensure loading state resets in finally block');
    console.log('5. ✓ Verify all await statements are properly handled');
    console.groupEnd();
    
    console.groupEnd();
  }
};