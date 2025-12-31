// Test Claude API
async function testClaude() {
  const apiKey = process.env.ANTHROPIC_API_KEY || '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';
  
  console.log('🧪 Testing Claude API...\n');
  console.log('API Key:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4));
  console.log('---\n');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: 'Say "Hello! I am Claude and I am working perfectly!" in a fun way.'
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:', data);
      console.error('\nStatus:', response.status);
      console.error('Error Type:', data.error?.type);
      console.error('Error Message:', data.error?.message);
      return;
    }

    console.log('✅ Success! Claude responded:\n');
    console.log('Model:', data.model);
    console.log('Role:', data.content[0].type);
    console.log('\n📝 Response:');
    console.log('---');
    console.log(data.content[0].text);
    console.log('---\n');
    console.log('📊 Usage:');
    console.log('  Input tokens:', data.usage.input_tokens);
    console.log('  Output tokens:', data.usage.output_tokens);
    console.log('  Total tokens:', data.usage.input_tokens + data.usage.output_tokens);
    console.log('\n✨ Your Claude API is working perfectly!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  }
}

// Run test
testClaude();