import React from 'react';
import { Code, Copy, CheckCircle, ExternalLink, Key, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked: boolean;
}

const ApiDocs: React.FC = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = React.useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = React.useState('');
  const [copySuccess, setCopySuccess] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadingKeys, setLoadingKeys] = React.useState(true);
  const [showNewKeyModal, setShowNewKeyModal] = React.useState(false);
  const [newKeyValue, setNewKeyValue] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchApiKeys();
  }, [user]);

  const fetchApiKeys = async () => {
    if (!user) return;
    
    try {
      setLoadingKeys(true);
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('revoked', false)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setApiKeys(data || []);
    } catch (err) {
      console.error('Error fetching API keys:', err);
    } finally {
      setLoadingKeys(false);
    }
  };

  const generateApiKey = async () => {
    if (!user || !newKeyName.trim()) {
      setError('Please enter a name for your API key');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Generate a random API key
      const key = `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      // Save to database
      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          key,
          name: newKeyName.trim()
        });
        
      if (error) throw error;
      
      // Show the new key to the user (only time they'll see the full key)
      setNewKeyValue(key);
      setNewKeyName('');
      
      // Refresh the list
      fetchApiKeys();
    } catch (err) {
      console.error('Error generating API key:', err);
      setError('Failed to generate API key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const revokeApiKey = async (id: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ revoked: true })
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Refresh the list
      fetchApiKeys();
    } catch (err) {
      console.error('Error revoking API key:', err);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(type);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const codeExamples = {
    curl: `curl -X POST https://api.securescript.ai/v1/scan \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "code": "const userInput = req.body.input;\\nconst query = \\"SELECT * FROM users WHERE id = '\\" + userInput + \\"'\\";\\ndb.query(query);",
    "language": "javascript"
  }'`,
    node: `const axios = require('axios');

async function scanCode() {
  try {
    const response = await axios.post('https://api.securescript.ai/v1/scan', {
      code: 'const userInput = req.body.input;\\nconst query = "SELECT * FROM users WHERE id = \'" + userInput + "\'";\\ndb.query(query);',
      language: 'javascript'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
      }
    });
    
    console.log(response.data);
  } catch (error) {
    console.error('Error scanning code:', error);
  }
}

scanCode();`,
    python: `import requests

url = "https://api.securescript.ai/v1/scan"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
}
payload = {
    "code": 'const userInput = req.body.input;\\nconst query = "SELECT * FROM users WHERE id = \'" + userInput + "\'";\\ndb.query(query);',
    "language": "javascript"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`
  };

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">API Documentation</h1>
        <p className="text-gray-400 mt-2">Integrate SecureScript AI into your development workflow</p>
      </header>
      
      {/* API Key Management Section */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">API Keys</h2>
          <button 
            onClick={() => setShowNewKeyModal(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center"
          >
            <Key className="h-4 w-4 mr-2" />
            Create New API Key
          </button>
        </div>
        
        {loadingKeys ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="bg-gray-700 p-6 rounded-lg text-center">
            <Key className="h-12 w-12 mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400 mb-4">You don't have any API keys yet</p>
            <button 
              onClick={() => setShowNewKeyModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Create Your First API Key
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Key</th>
                  <th className="pb-3 font-medium">Created</th>
                  <th className="pb-3 font-medium">Last Used</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((apiKey) => (
                  <tr key={apiKey.id} className="border-b border-gray-700">
                    <td className="py-4">{apiKey.name}</td>
                    <td className="py-4">
                      <div className="flex items-center">
                        <code className="font-mono text-emerald-400">{apiKey.key.substring(0, 8)}•••••••••••••••</code>
                        <button 
                          onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                          className="ml-2 text-gray-400 hover:text-white"
                        >
                          {copySuccess === apiKey.id ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 text-gray-400 text-sm">
                      {new Date(apiKey.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-gray-400 text-sm">
                      {apiKey.last_used_at ? new Date(apiKey.last_used_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-4 text-right">
                      <button 
                        onClick={() => revokeApiKey(apiKey.id)}
                        className="text-red-400 hover:text-red-300 flex items-center ml-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="ml-1">Revoke</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* API Reference */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-6">API Reference</h2>
        
        <div className="space-y-8">
          {/* Scan Endpoint */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="bg-emerald-500 text-white px-2 py-1 rounded text-sm font-mono">POST</span>
              <code className="font-mono text-gray-300">/v1/scan</code>
            </div>
            
            <p className="text-gray-400 mb-4">Scan code for security vulnerabilities</p>
            
            <h3 className="text-lg font-medium mb-2">Request Body</h3>
            <div className="bg-gray-700 p-4 rounded-lg mb-4">
              <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap">{`{
  "code": string,    // Required: The code to scan
  "language": string // Required: The programming language (e.g., "javascript", "python")
}`}</pre>
            </div>
            
            <h3 className="text-lg font-medium mb-2">Response</h3>
            <div className="bg-gray-700 p-4 rounded-lg">
              <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap">{`{
  "id": string,           // The scan ID
  "status": string,       // "completed", "pending", or "failed"
  "vulnerabilities": [    // Array of detected vulnerabilities
    {
      "type": string,     // The vulnerability type (e.g., "sql-injection")
      "severity": string, // "high", "medium", or "low"
      "line": number,     // The line number where the vulnerability was found
      "description": string,
      "recommendation": string,
      "cwe": string,      // Common Weakness Enumeration identifier
      "resources": [      // Additional resources
        {
          "title": string,
          "url": string
        }
      ]
    }
  ]
}`}</pre>
            </div>
          </div>
          
          {/* Generate Fix Endpoint */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="bg-emerald-500 text-white px-2 py-1 rounded text-sm font-mono">POST</span>
              <code className="font-mono text-gray-300">/v1/fix</code>
            </div>
            
            <p className="text-gray-400 mb-4">Generate a fix for a detected vulnerability</p>
            
            <h3 className="text-lg font-medium mb-2">Request Body</h3>
            <div className="bg-gray-700 p-4 rounded-lg mb-4">
              <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap">{`{
  "scan_id": string,           // Required: The scan ID
  "vulnerability_index": number // Required: The index of the vulnerability in the scan results
}`}</pre>
            </div>
            
            <h3 className="text-lg font-medium mb-2">Response</h3>
            <div className="bg-gray-700 p-4 rounded-lg">
              <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap">{`{
  "fixed_code": string,  // The code with the vulnerability fixed
  "applied": boolean     // Whether the fix has been applied
}`}</pre>
            </div>
          </div>
        </div>
      </div>
      
      {/* Code Examples */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-6">Code Examples</h2>
        
        <div className="space-y-6">
          {/* cURL Example */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">cURL</h3>
              <button 
                onClick={() => copyToClipboard(codeExamples.curl, 'curl')}
                className="bg-gray-700 hover:bg-gray-600 p-1.5 rounded-md text-gray-300 hover:text-white transition-colors"
              >
                {copySuccess === 'curl' ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">{codeExamples.curl}</pre>
            </div>
          </div>
          
          {/* Node.js Example */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Node.js</h3>
              <button 
                onClick={() => copyToClipboard(codeExamples.node, 'node')}
                className="bg-gray-700 hover:bg-gray-600 p-1.5 rounded-md text-gray-300 hover:text-white transition-colors"
              >
                {copySuccess === 'node' ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">{codeExamples.node}</pre>
            </div>
          </div>
          
          {/* Python Example */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Python</h3>
              <button 
                onClick={() => copyToClipboard(codeExamples.python, 'python')}
                className="bg-gray-700 hover:bg-gray-600 p-1.5 rounded-md text-gray-300 hover:text-white transition-colors"
              >
                {copySuccess === 'python' ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">{codeExamples.python}</pre>
            </div>
          </div>
        </div>
      </div>
      
      {/* VS Code Extension */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">VS Code Extension</h2>
          <a 
            href="https://marketplace.visualstudio.com/items?itemName=securescript-ai.securescript-ai-extension" 
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center"
          >
            Install Extension
            <ExternalLink className="h-4 w-4 ml-1" />
          </a>
        </div>
        
        <p className="text-gray-400 mb-4">
          Scan your code for security vulnerabilities directly from VS Code. The SecureScript AI extension integrates seamlessly with your development workflow.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Features</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start">
                <span className="text-emerald-400 mr-2">•</span>
                Scan the current file for vulnerabilities
              </li>
              <li className="flex items-start">
                <span className="text-emerald-400 mr-2">•</span>
                Scan selected code snippets
              </li>
              <li className="flex items-start">
                <span className="text-emerald-400 mr-2">•</span>
                View detailed vulnerability reports
              </li>
              <li className="flex items-start">
                <span className="text-emerald-400 mr-2">•</span>
                Generate and apply fixes for detected vulnerabilities
              </li>
            </ul>
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Setup</h3>
            <ol className="space-y-2 text-gray-300 list-decimal list-inside">
              <li>Install the extension from the VS Code Marketplace</li>
              <li>Open VS Code settings and search for "SecureScript AI"</li>
              <li>Enter your API URL and API key</li>
              <li>Right-click on a file or selection and choose "SecureScript AI: Scan"</li>
            </ol>
          </div>
        </div>
      </div>
      
      {/* New API Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Create New API Key</h2>
            
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            {newKeyValue ? (
              <div>
                <div className="bg-amber-500/20 border border-amber-500 text-amber-200 px-4 py-3 rounded mb-4">
                  <p className="font-medium mb-2">Important: Copy your API key now!</p>
                  <p className="text-sm">This is the only time you'll see the full key. It cannot be displayed again.</p>
                </div>
                
                <div className="bg-gray-700 p-4 rounded-lg mb-4 flex items-center justify-between">
                  <code className="font-mono text-emerald-400 break-all">{newKeyValue}</code>
                  <button 
                    onClick={() => copyToClipboard(newKeyValue, 'newKey')}
                    className="ml-2 bg-gray-600 hover:bg-gray-500 p-2 rounded-md text-gray-300 hover:text-white transition-colors flex-shrink-0"
                  >
                    {copySuccess === 'newKey' ? <CheckCircle className="h-5 w-5 text-emerald-400" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
                
                <div className="flex justify-end">
                  <button 
                    onClick={() => {
                      setShowNewKeyModal(false);
                      setNewKeyValue(null);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    I've Copied My Key
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <label htmlFor="keyName" className="block text-gray-300 mb-2">Key Name</label>
                  <input
                    id="keyName"
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., VS Code Extension"
                    className="bg-gray-700 text-white w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={() => setShowNewKeyModal(false)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={generateApiKey}
                    disabled={loading || !newKeyName.trim()}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        Generate Key
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiDocs;