/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, Code, Github, Loader } from 'lucide-react';

// OpenRouter API key and endpoint
const OPENROUTER_API_KEY = "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";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface Vulnerability {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  line: number;
  description: string;
  recommendation: string;
}

const CodeScanner: React.FC = () => {
  const [scanMode, setScanMode] = useState<'repo' | 'code'>('code');
  const [repoUrl, setRepoUrl] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [scanning, setScanning] = useState(false);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadingRepo, setLoadingRepo] = useState(false);
  
  const handleScan = async () => {
    try {
      setScanning(true);
      setVulnerabilities([]);
      setError(null);
      
      let codeToAnalyze = '';
      
      if (scanMode === 'repo') {
        if (!repoUrl) {
          setError('Please enter a GitHub repository URL');
          setScanning(false);
          return;
        }
        
        // Extract owner and repo from GitHub URL
        const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) {
          setError('Invalid GitHub URL');
          setScanning(false);
          return;
        }
        
        const [_, owner, repo] = match;
        
        // Fetch repository content (simplified to fetch main file)
        try {
          setLoadingRepo(true);
          const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
          if (!response.ok) {
            throw new Error(`Failed to fetch repository: ${response.statusText}`);
          }
          
          const files = await response.json();
          const mainFile = files.find((f: any) => 
            f.type === 'file' && /\.(js|jsx|ts|tsx|py|java|go|rb|php|c|cpp)$/i.test(f.name)
          );
          
          if (!mainFile) {
            throw new Error('No suitable code files found');
          }
          
          const contentResponse = await fetch(mainFile.download_url);
          if (!contentResponse.ok) {
            throw new Error(`Failed to fetch file content: ${contentResponse.statusText}`);
          }
          
          codeToAnalyze = await contentResponse.text();
          setFileContent(codeToAnalyze);
        } catch (e: any) {
          setError(e.message);
          setScanning(false);
          return;
        } finally {
          setLoadingRepo(false);
        }
      } else {
        if (!codeSnippet.trim()) {
          setError('Please paste some code to analyze');
          setScanning(false);
          return;
        }
        codeToAnalyze = codeSnippet;
      }
      
      // Analyze with OpenRouter API
      try {
        const vulnerabilities = await analyzeCodeWithOpenRouter(codeToAnalyze);
        setVulnerabilities(vulnerabilities);
      } catch (e: any) {
        setError(`Analysis failed: ${e.message}`);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setScanning(false);
    }
  };
  
  const analyzeCodeWithOpenRouter = async (code: string): Promise<Vulnerability[]> => {
    const prompt = `
      Analyze this code for security vulnerabilities, bugs, and bad practices.
      Return results as JSON array with this format:
      [{"type": "vulnerability-type", "severity": "high|medium|low|critical", "line": line-number, "description": "description", "recommendation": "how to fix"}]
      Only include these exact JSON fields with no additional fields.
      Return empty array if no issues found.
      
      Code:
      \`\`\`
      ${code}
      \`\`\`
    `;

    console.log("Sending request to OpenRouter API...");
    
    // Retry logic
    const maxRetries = 3;
    let retryCount = 0;
    let lastError;
    
    while (retryCount < maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.2,
            max_tokens: 2000
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`OpenRouter API Error (Attempt ${retryCount + 1}/${maxRetries}):`, errorBody);
          
          // Don't retry for auth errors
          if (response.status === 401) {
            throw new Error(`Authentication error: Invalid API key`);
          }
          
          // For rate limiting or server errors, retry
          if (response.status === 429 || response.status >= 500) {
            retryCount++;
            lastError = new Error(`API error (${response.status}): ${response.statusText}`);
            
            // Wait longer between retries
            const delay = retryCount * 2000;
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          throw new Error(`API error (${response.status}): ${response.statusText}`);
        }

        const data = await response.json();
        console.log("OpenRouter API Response received successfully");
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
          console.error("Invalid OpenRouter API response format", data);
          throw new Error("Invalid response format from API");
        }
        
        const text = data.choices[0].message.content;
        
        // Extract JSON from response with better error handling
        try {
          // First try: Direct JSON parse if it's clean JSON
          if (text.trim().startsWith('[') && text.trim().endsWith(']')) {
            try {
              return JSON.parse(text);
            } catch (e) {
              console.log("Direct JSON parse failed, trying alternatives");
            }
          }
          
          // Second try: Find JSON array with regex
          const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s);
          if (jsonMatch) {
            try {
              return JSON.parse(jsonMatch[0]);
            } catch (e) {
              console.log("JSON regex extraction failed, trying next method");
            }
          }
          
          // Third try: More general array extraction
          if (text.includes('[') && text.includes(']')) {
            const startIdx = text.indexOf('[');
            const endIdx = text.lastIndexOf(']') + 1;
            const jsonStr = text.substring(startIdx, endIdx);
            try {
              return JSON.parse(jsonStr);
            } catch (e) {
              console.log("General array extraction failed, trying fallback parsing");
            }
          }
          
          // Final attempt: Try to manually extract and construct vulnerability objects
          console.log("Attempting manual extraction as last resort");
          
          // If the response mentions "no vulnerabilities" or similar
          if (text.toLowerCase().includes("no vulnerabilities") || 
              text.toLowerCase().includes("no issues") || 
              text.toLowerCase().includes("empty array")) {
            return [];
          }
          
          // If we got this far but still couldn't parse, return an empty array
          console.warn("Could not extract valid vulnerabilities from response");
          return [];
        } catch (e) {
          console.error("Failed to parse response:", e);
          throw new Error("Failed to parse vulnerability data");
        }
      } catch (error: any) {
        console.error(`Error during attempt ${retryCount + 1}/${maxRetries}:`, error);
        
        // For timeout errors, retry
        if (error.name === 'AbortError') {
          retryCount++;
          lastError = new Error("Request timeout. Try again with a simpler or shorter code sample.");
          
          if (retryCount < maxRetries) {
            const delay = retryCount * 2000;
            console.log(`Request timed out. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        } 
        // For network errors, retry
        else if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          retryCount++;
          lastError = new Error("Network error. Please check your internet connection.");
          
          if (retryCount < maxRetries) {
            const delay = retryCount * 2000;
            console.log(`Network error. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        } 
        // Don't retry for other errors
        else {
          throw error;
        }
      }
    }
    
    // If we exhausted all retries
    if (lastError) {
      throw lastError;
    }
    
    // This should never happen, but just in case
    throw new Error("Failed to analyze code after multiple attempts");
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Code Security Scanner</h1>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setScanMode('code')}
          className={`px-4 py-2 rounded ${scanMode === 'code' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          <Code className="h-4 w-4 inline mr-1" />
          Paste Code
        </button>
        <button
          onClick={() => setScanMode('repo')}
          className={`px-4 py-2 rounded ${scanMode === 'repo' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          <Github className="h-4 w-4 inline mr-1" />
          GitHub Repository
        </button>
      </div>
      
      <div className="mb-4">
        {scanMode === 'repo' ? (
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="w-full p-2 border rounded"
          />
        ) : (
          <textarea
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            placeholder="Paste your code here..."
            className="w-full h-60 p-2 font-mono border rounded text-black bg-white dark:text-white dark:bg-gray-800"
          />
        )}
      </div>
      
      <button
        onClick={handleScan}
        disabled={scanning}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {scanning ? (
          <>
            <Loader className="h-4 w-4 inline animate-spin mr-1" />
            Scanning...
          </>
        ) : (
          <>Scan Code</>
        )}
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {vulnerabilities.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4">Found {vulnerabilities.length} issues</h2>
          <div className="space-y-4">
            {vulnerabilities.map((vuln, index) => (
              <div key={index} className="border rounded p-4 bg-white dark:bg-gray-700 shadow-sm">
                <div className="flex justify-between">
                  <div className="font-bold flex items-center">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mr-1" />
                    {vuln.type}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs ${getSeverityColor(vuln.severity)}`}>
                    {vuln.severity}
                  </span>
                </div>
                <div className="text-sm mt-1">Line: {vuln.line}</div>
                <div className="mt-2 text-black dark:text-white">{vuln.description}</div>
                <div className="mt-2 text-sm">
                  <strong>Recommendation:</strong> {vuln.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {scanning === false && vulnerabilities.length === 0 && !error && (
        <div className="mt-6 text-center p-6 bg-gray-100 dark:bg-gray-700 rounded">
          {scanMode === 'repo' ? 'Enter a GitHub URL and scan to find issues' : 'Paste code and scan to find issues'}
        </div>
      )}
      
      {scanMode === 'repo' && fileContent && (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-2">Repository Code</h3>
          <div className="w-full max-h-96 bg-gray-100 text-black p-4 rounded-md font-mono text-sm overflow-auto border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
            <pre>{fileContent}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeScanner;