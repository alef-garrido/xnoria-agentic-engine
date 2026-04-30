// Test script to verify the enhanced legacy function parser
const testContent = 'Some text <function=sal_contact_prioritize={"contact_id":"217718725285","priority":"high","reason":"Incoming lead from operator message"}</function> more text';

// Simulate the enhanced parseLegacyFunctionCalls function
function parseLegacyFunctionCalls(content) {
  if (!content) return [];

  const calls = [];
  
  // Pattern: Groq llama-3.3-70b variants - <function=name,{args}</function> or <function=name({args})</function>
  const patterns = [
    /<function=([^,(>]+)[\s,]*\(?(\{[\s\S]*?\})\)?><\/function>/g,
    /<function\s+([^=]+)\s*=\s*([^>]+)><\/function>/g,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      try {
        const name = match[1].trim();
        let argsStr = match[2].trim();
        
        // Handle different argument formats
        if (argsStr.startsWith('{') && argsStr.endsWith('}')) {
          // Standard JSON object format
          JSON.parse(argsStr); // Validate JSON
          calls.push({
            id: `legacy-${Date.now()}-${calls.length}-${name}`,
            type: 'function',
            function: { name, arguments: argsStr },
          });
          console.log(`✓ Parsed legacy <function> call: ${name}`);
        } else if (!argsStr.includes('{') && !argsStr.includes('}')) {
          // Simple string arguments - create a basic JSON object
          const simpleArgs = { value: argsStr };
          calls.push({
            id: `legacy-${Date.now()}-${calls.length}-${name}`,
            type: 'function',
            function: { name, arguments: JSON.stringify(simpleArgs) },
          });
          console.log(`✓ Parsed simple legacy call: ${name} with args: ${argsStr}`);
        }
      } catch (err) {
        console.error(`✗ Failed to parse legacy function call: ${match[0]}`, err.message);
      }
    }
  }
  
  return calls;
}

// Test the function
console.log('Testing enhanced parser with content:');
console.log(testContent);
console.log('\nResults:');
const results = parseLegacyFunctionCalls(testContent);
console.log(JSON.stringify(results, null, 2));