import { supabase } from './supabase';

export interface ScanResult {
  id: string;
  vulnerabilities: any[];
  status: string;
}

export const scanCode = async (code: string, language: string): Promise<ScanResult> => {
  try {
    const user = await supabase.auth.getUser();
    
    if (!user.data.user) {
      throw new Error('User not authenticated');
    }
    
    // Create a new scan record
    const { data: scan, error: scanError } = await supabase
      .from('code_scans')
      .insert({
        user_id: user.data.user.id,
        code_snippet: code,
        language,
        status: 'pending'
      })
      .select()
      .single();
      
    if (scanError) throw scanError;
    
    // Simulate API call to analyze code
    // In a real implementation, this would be a call to your backend service
    const results = await analyzeCodeWithAI(code, language);
    
    // Update the scan with results
    const { error: updateError } = await supabase
      .from('code_scans')
      .update({
        vulnerabilities: results,
        status: 'completed'
      })
      .eq('id', scan.id);
      
    if (updateError) throw updateError;
    
    return {
      id: scan.id,
      vulnerabilities: results,
      status: 'completed'
    };
  } catch (error) {
    console.error('Error scanning code:', error);
    throw error;
  }
};

export const generateFix = async (scanId: string, vulnerabilityIndex: number): Promise<string> => {
  try {
    // Get the scan details
    const { data: scan, error: scanError } = await supabase
      .from('code_scans')
      .select('*')
      .eq('id', scanId)
      .single();
      
    if (scanError) throw scanError;
    
    if (!scan.vulnerabilities || !scan.vulnerabilities[vulnerabilityIndex]) {
      throw new Error('Vulnerability not found');
    }
    
    // Simulate AI fix generation
    const fixedCode = await generateFixWithAI(scan.code_snippet, scan.vulnerabilities[vulnerabilityIndex]);
    
    // Save the fix
    await supabase
      .from('vulnerability_fixes')
      .insert({
        scan_id: scanId,
        vulnerability_index: vulnerabilityIndex,
        fix_code: fixedCode,
        applied: false
      });
    
    return fixedCode;
  } catch (error) {
    console.error('Error generating fix:', error);
    throw error;
  }
};

export const applyFix = async (scanId: string, vulnerabilityIndex: number): Promise<void> => {
  try {
    // Get the fix
    const { data: fix, error: fixError } = await supabase
      .from('vulnerability_fixes')
      .select('*')
      .eq('scan_id', scanId)
      .eq('vulnerability_index', vulnerabilityIndex)
      .single();
      
    if (fixError) throw fixError;
    
    // Mark the fix as applied
    await supabase
      .from('vulnerability_fixes')
      .update({ applied: true })
      .eq('scan_id', scanId)
      .eq('vulnerability_index', vulnerabilityIndex);
      
  } catch (error) {
    console.error('Error applying fix:', error);
    throw error;
  }
};

// API functions for VS Code extension
export const scanCodeWithApiKey = async (code: string, language: string, apiKey: string): Promise<ScanResult> => {
  try {
    // Validate API key
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key', apiKey)
      .single();
      
    if (apiKeyError || !apiKeyData) {
      throw new Error('Invalid API key');
    }
    
    // Create a new scan record
    const { data: scan, error: scanError } = await supabase
      .from('code_scans')
      .insert({
        user_id: apiKeyData.user_id,
        code_snippet: code,
        language,
        status: 'pending',
        source: 'vscode_extension'
      })
      .select()
      .single();
      
    if (scanError) throw scanError;
    
    // Analyze code
    const results = await analyzeCodeWithAI(code, language);
    
    // Update the scan with results
    const { error: updateError } = await supabase
      .from('code_scans')
      .update({
        vulnerabilities: results,
        status: 'completed'
      })
      .eq('id', scan.id);
      
    if (updateError) throw updateError;
    
    return {
      id: scan.id,
      vulnerabilities: results,
      status: 'completed'
    };
  } catch (error) {
    console.error('Error scanning code with API key:', error);
    throw error;
  }
};

export const generateFixWithApiKey = async (scanId: string, vulnerabilityIndex: number, apiKey: string): Promise<string> => {
  try {
    // Validate API key
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key', apiKey)
      .single();
      
    if (apiKeyError || !apiKeyData) {
      throw new Error('Invalid API key');
    }
    
    // Get the scan details
    const { data: scan, error: scanError } = await supabase
      .from('code_scans')
      .select('*')
      .eq('id', scanId)
      .eq('user_id', apiKeyData.user_id)
      .single();
      
    if (scanError) throw scanError;
    
    if (!scan.vulnerabilities || !scan.vulnerabilities[vulnerabilityIndex]) {
      throw new Error('Vulnerability not found');
    }
    
    // Generate fix
    const fixedCode = await generateFixWithAI(scan.code_snippet, scan.vulnerabilities[vulnerabilityIndex]);
    
    // Save the fix
    await supabase
      .from('vulnerability_fixes')
      .insert({
        scan_id: scanId,
        vulnerability_index: vulnerabilityIndex,
        fix_code: fixedCode,
        applied: false
      });
    
    return fixedCode;
  } catch (error) {
    console.error('Error generating fix with API key:', error);
    throw error;
  }
};

// Mock function to simulate AI analysis
const analyzeCodeWithAI = async (code: string, language: string) => {
  return new Promise<any[]>((resolve) => {
    setTimeout(() => {
      // Simulate finding vulnerabilities
      if (code.includes('exec(') || code.includes('eval(')) {
        resolve([{
          type: 'command-injection',
          severity: 'high',
          line: code.split('\n').findIndex(line => line.includes('exec(') || line.includes('eval(')) + 1,
          description: 'Potential command injection vulnerability detected',
          recommendation: 'Avoid using exec() or eval() with user input',
          cwe: 'CWE-78',
          resources: [
            { title: 'OWASP Command Injection', url: 'https://owasp.org/www-community/attacks/Command_Injection' }
          ]
        }]);
      } else if (code.includes('password') && !code.includes('hash')) {
        resolve([{
          type: 'insecure-auth',
          severity: 'medium',
          line: code.split('\n').findIndex(line => line.includes('password')) + 1,
          description: 'Storing passwords without hashing',
          recommendation: 'Use a secure hashing algorithm like bcrypt',
          cwe: 'CWE-256',
          resources: [
            { title: 'OWASP Password Storage', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html' }
          ]
        }]);
      } else if (code.includes('SELECT') && !code.includes('?')) {
        resolve([{
          type: 'sql-injection',
          severity: 'high',
          line: code.split('\n').findIndex(line => line.includes('SELECT')) + 1,
          description: 'Potential SQL injection vulnerability',
          recommendation: 'Use parameterized queries instead of string concatenation',
          cwe: 'CWE-89',
          resources: [
            { title: 'OWASP SQL Injection', url: 'https://owasp.org/www-community/attacks/SQL_Injection' }
          ]
        }]);
      } else if (code.includes('innerHTML')) {
        resolve([{
          type: 'xss',
          severity: 'high',
          line: code.split('\n').findIndex(line => line.includes('innerHTML')) + 1,
          description: 'Potential Cross-Site Scripting (XSS) vulnerability',
          recommendation: 'Use textContent instead of innerHTML or sanitize input',
          cwe: 'CWE-79',
          resources: [
            { title: 'OWASP XSS Prevention', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html' }
          ]
        }]);
      } else if (code.includes('http://')) {
        resolve([{
          type: 'insecure-communication',
          severity: 'medium',
          line: code.split('\n').findIndex(line => line.includes('http://')) + 1,
          description: 'Using insecure HTTP protocol',
          recommendation: 'Use HTTPS instead of HTTP for secure communication',
          cwe: 'CWE-319',
          resources: [
            { title: 'OWASP Transport Layer Protection', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html' }
          ]
        }]);
      } else {
        resolve([]);
      }
    }, 1500);
  });
};

// Mock function to generate fixes
const generateFixWithAI = async (code: string, vulnerability: any) => {
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
      } else if (vulnerability.type === 'xss') {
        const lineIndex = vulnerability.line - 1;
        lines[lineIndex] = lines[lineIndex].replace(/innerHTML/, 'textContent');
        resolve(lines.join('\n'));
      } else if (vulnerability.type === 'insecure-communication') {
        const lineIndex = vulnerability.line - 1;
        lines[lineIndex] = lines[lineIndex].replace(/http:\/\//, 'https://');
        resolve(lines.join('\n'));
      } else {
        resolve(code);
      }
    }, 1000);
  });
};