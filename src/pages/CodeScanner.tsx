import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Code, ArrowRight, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// Mock function to simulate AI analysis
const analyzeCode = async (code: string, language: string) => {
  // In a real app, this would call the Google Gemini API
  return new Promise<any[]>((resolve) => {
    setTimeout(() => {
      // Simulate finding vulnerabilities
      if (code.includes('exec(') || code.includes('eval(')) {
        resolve([{
          type: 'command-injection',
          severity: 'high',
          line: code.split('\n').findIndex(line => line.includes('exec(') || line.includes('eval(')) + 1,
          description: 'Potential command injection vulnerability detected',
          recommendation: 'Avoid using exec() or eval() with user input'
        }]);
      } else if (code.includes('password') && !code.includes('hash')) {
        resolve([{
          type: 'insecure-auth',
          severity: 'medium',
          line: code.split('\n').findIndex(line => line.includes('password')) + 1,
          description: 'Storing passwords without hashing',
          recommendation: 'Use a secure hashing algorithm like bcrypt'
        }]);
      } else if (code.includes('SELECT') && !code.includes('?')) {
        resolve([{
          type: 'sql-injection',
          severity: 'high',
          line: code.split('\n').findIndex(line => line.includes('SELECT')) + 1,
          description: 'Potential SQL injection vulnerability',
          recommendation: 'Use parameterized queries instead of string concatenation'
        }]);
      } else {
        resolve([]);
      }
    }, 1500);
  });
};

// Mock function to generate fixes
const generateFix = async (code: string, vulnerability: any) => {
  // In a real app, this would call the Google Gemini API
  return new Promise<string>((resolve) => {
    setTimeout(() => {
      const lines = code.split('\n');
      
      if (vulnerability.type === 'command-injection') {
        const lineIndex = vulnerability.line - 1;
        lines[lineIndex] = lines[lineIndex].replace(/exec\((.*?)\)/, 'execFile($1, { shell: false })');
        resolve(lines.join('\n'));
      } else if (vulnerability.type === 'insecure-auth') {
        const lineIndex = vulnerability.line - 1;
        if (lines[lineIndex].includes('=')) {
          lines[lineIndex] = lines[lineIndex].replace(/password\s*=\s*['"](.*)['"]/, 'password = await bcrypt.hash("$1", 10)');
          // Add import at the top if not exists
          if (!code.includes('bcrypt')) {
            lines.unshift('const bcrypt = require("bcrypt");');
          }
        }
        resolve(lines.join('\n'));
      } else if (vulnerability.type === 'sql-injection') {
        const lineIndex = vulnerability.line - 1;
        if (lines[lineIndex].includes('SELECT')) {
          lines[lineIndex] = lines[lineIndex].replace(/['"](.*)['"]/, '?');
          // Add parameterized query handling
          const nextLine = 'db.query(query, [paramValue]);';
          lines.splice(lineIndex + 1, 0, nextLine);
        }
        resolve(lines.join('\n'));
      } else {
        resolve(code);
      }
    }, 1000);
  });
};

const CodeScanner: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const scanId = searchParams.get('id');
  
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [scanning, setScanning] = useState(false);
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [fixes, setFixes] = useState<{[key: number]: string}>({});
  const [generating, setGenerating] = useState<{[key: number]: boolean}>({});
  const [applying, setApplying] = useState<{[key: number]: boolean}>({});
  const [scanComplete, setScanComplete] = useState(false);
  
  useEffect(() => {
    const fetchScan = async () => {
      if (!scanId || !user) return;
      
      try {
        const { data, error } = await supabase
          .from('code_scans')
          .select('*')
          .eq('id', scanId)
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setCode(data.code_snippet);
          setLanguage(data.language);
          setVulnerabilities(data.vulnerabilities || []);
          setScanComplete(data.status === 'completed');
          
          // Fetch fixes
          const { data: fixesData, error: fixesError } = await supabase
            .from('vulnerability_fixes')
            .select('*')
            .eq('scan_id', scanId);
            
          if (fixesError) throw fixesError;
          
          if (fixesData) {
            const fixesMap: {[key: number]: string} = {};
            fixesData.forEach(fix => {
              fixesMap[fix.vulnerability_index] = fix.fix_code;
            });
            setFixes(fixesMap);
          }
        }
      } catch (error) {
        console.error('Error fetching scan:', error);
      }
    };
    
    fetchScan();
  }, [scanId, user]);

  const handleScan = async () => {
    if (!code || !user) return;
    
    try {
      setScanning(true);
      setVulnerabilities([]);
      setFixes({});
      setScanComplete(false);
      
      // Create a new scan record
      const { data: scan, error: scanError } = await supabase
        .from('code_scans')
        .insert({
          user_id: user.id,
          code_snippet: code,
          language,
          status: 'pending'
        })
        .select()
        .single();
        
      if (scanError) throw scanError;
      
      // Analyze the code
      const results = await analyzeCode(code, language);
      
      // Update the scan with results
      const { error: updateError } = await supabase
        .from('code_scans')
        .update({
          vulnerabilities: results,
          status: 'completed'
        })
        .eq('id', scan.id);
        
      if (updateError) throw updateError;
      
      setVulnerabilities(results);
      setScanComplete(true);
    } catch (error) {
      console.error('Error scanning code:', error);
    } finally {
      setScanning(false);
    }
  };

  const handleGenerateFix = async (index: number) => {
    if (!vulnerabilities[index] || !user) return;
    
    try {
      setGenerating({...generating, [index]: true});
      
      const fixedCode = await generateFix(code, vulnerabilities[index]);
      
      // Save the fix
      if (scanId) {
        await supabase
          .from('vulnerability_fixes')
          .insert({
            scan_id: scanId,
            vulnerability_index: index,
            fix_code: fixedCode,
            applied: false
          });
      }
      
      setFixes({...fixes, [index]: fixedCode});
    } catch (error) {
      console.error('Error generating fix:', error);
    } finally {
      setGenerating({...generating, [index]: false});
    }
  };

  const handleApplyFix = async (index: number) => {
    if (!fixes[index] || !scanId || !user) return;
    
    try {
      setApplying({...applying, [index]: true});
      
      // Update the code
      setCode(fixes[index]);
      
      // Mark the fix as applied
      await supabase
        .from('vulnerability_fixes')
        .update({ applied: true })
        .eq('scan_id', scanId)
        .eq('vulnerability_index', index);
        
    } catch (error) {
      console.error('Error applying fix:', error);
    } finally {
      setApplying({...applying, [index]: false});
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-400 bg-red-500/20';
      case 'medium':
        return 'text-amber-400 bg-amber-500/20';
      case 'low':
        return 'text-emerald-400 bg-emerald-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Code Scanner</h1>
        <p className="text-gray-400 mt-2">Scan your code for security vulnerabilities</p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Input */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Your Code</h2>
            <div className="flex items-center space-x-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-gray-700 text-white px-3 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={scanning}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="php">PHP</option>
                <option value="java">Java</option>
                <option value="csharp">C#</option>
              </select>
              <button
                onClick={handleScan}
                disabled={scanning || !code}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
               >
                {scanning ? 'Scanning...' : 'Scan Code'}
                {!scanning && <ArrowRight className="h-4 w-4 ml-1" />}
              </button>
            </div>
          </div>
          
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`// Paste your code here\n\n// Example vulnerable code:\nconst userInput = req.body.input;\nconst query = "SELECT * FROM users WHERE id = '" + userInput + "'";\ndb.query(query);`}
            className="w-full h-96 bg-gray-900 text-white p-4 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled={scanning}
          />
        </div>
        
        {/* Results */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Scan Results</h2>
          
          {scanning ? (
            <div className="flex flex-col items-center justify-center h-80">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
              <p className="text-gray-400">Scanning your code for vulnerabilities...</p>
            </div>
          ) : vulnerabilities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-center">
              {scanComplete ? (
                <>
                  <div className="bg-emerald-500/20 p-4 rounded-full mb-4">
                    <CheckCircle className="h-12 w-12 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No vulnerabilities found!</h3>
                  <p className="text-gray-400">Your code looks secure. Great job!</p>
                </>
              ) : (
                <>
                  <div className="bg-gray-700 p-4 rounded-full mb-4">
                    <Code className="h-12 w-12 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Ready to scan</h3>
                  <p className="text-gray-400">Paste your code and click "Scan Code" to begin</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
              {vulnerabilities.map((vulnerability, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(vulnerability.severity)}`}>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {vulnerability.severity.toUpperCase()}
                      </span>
                      <h3 className="text-lg font-medium mt-2">{vulnerability.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                    </div>
                    <span className="text-gray-400 text-sm">Line {vulnerability.line}</span>
                  </div>
                  
                  <p className="text-gray-300 mb-3">{vulnerability.description}</p>
                  
                  <div className="bg-gray-800 p-3 rounded-md mb-3">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Recommendation:</h4>
                    <p className="text-sm text-gray-300">{vulnerability.recommendation}</p>
                  </div>
                  
                  {fixes[index] ? (
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleApplyFix(index)}
                        disabled={applying[index]}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {applying[index] ? 'Applying...' : 'Apply Fix'}
                        {!applying[index] && <CheckCircle className="h-4 w-4 ml-1" />}
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleGenerateFix(index)}
                        disabled={generating[index]}
                        className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {generating[index] ? 'Generating...' : 'Generate Fix'}
                        {!generating[index] && <Code className="h-4 w-4 ml-1" />}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeScanner;