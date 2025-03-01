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
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      console.error("OpenRouter API Error Status:", response.status, response.statusText);
      const errorBody = await response.text();
      console.error("OpenRouter API Error Body:", errorBody);
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("OpenRouter API Response:", data);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error("Invalid OpenRouter API response format", data);
      throw new Error("Invalid response format from OpenRouter API");
    }
    
    const text = data.choices[0].message.content;
    console.log("OpenRouter text response:", text);
    
    // Extract JSON from response
    try {
      const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON match with regex, try to find anything that looks like an array
      if (text.includes('[') && text.includes(']')) {
        const startIdx = text.indexOf('[');
        const endIdx = text.lastIndexOf(']') + 1;
        const jsonStr = text.substring(startIdx, endIdx);
        return JSON.parse(jsonStr);
      }
      
      // If still no JSON found, return empty array
      console.warn("No valid JSON found in API response");
      return [];
    } catch (e) {
      console.error("Failed to parse OpenRouter response:", e);
      console.error("Response text:", text);
      throw new Error("Failed to parse vulnerability data from API response");
    }
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
      
      {scanMode === 'repo' ? (
        <div className="mb-4">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="w-full p-2 border rounded"
          />
        </div>
      ) : (
        <div className="mb-4">
          <textarea
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            placeholder="Paste your code here..."
            className="w-full h-60 p-2 font-mono border rounded text-black bg-white dark:text-white dark:bg-gray-800"
          />
        </div>
      )}
      
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
              <div key={index} className="border rounded p-4">
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
                <div className="mt-2">{vuln.description}</div>
                <div className="mt-2 text-sm">
                  <strong>Recommendation:</strong> {vuln.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {scanning === false && vulnerabilities.length === 0 && (
        <div className="mt-6 text-center p-6 bg-gray-100 rounded">
          {scanMode === 'repo' ? 'Enter a GitHub URL and scan to find issues' : 'Paste code and scan to find issues'}
        </div>
      )}
      
      {/* Code display section */}
      {(scanMode === 'code' && codeSnippet) || (scanMode === 'repo' && fileContent) ? (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-2">Code Preview</h3>
          <div className="w-full h-96 bg-gray-100 text-black p-4 rounded-md font-mono text-sm overflow-auto border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
            <pre>{scanMode === 'repo' ? fileContent : codeSnippet}</pre>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CodeScanner;