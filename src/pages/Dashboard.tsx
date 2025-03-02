import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Code, AlertTriangle, CheckCircle, Clock, ArrowRight, BarChart2, Shield, Zap, Download, ExternalLink, Terminal, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type CodeScan = {
  id: string;
  created_at: string;
  language: string;
  status: string;
  vulnerabilities: any[];
  source: string | null;
};

type SecurityScore = {
  score: number;
  grade: string;
  color: string;
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [recentScans, setRecentScans] = useState<CodeScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalScans: 0,
    vulnerabilitiesFound: 0,
    vulnerabilitiesFixed: 0,
    vscodeScanCount: 0
  });
  const [securityScore, setSecurityScore] = useState<SecurityScore>({
    score: 0,
    grade: 'N/A',
    color: 'text-gray-400'
  });
  const [vulnerabilityTrends, setVulnerabilityTrends] = useState<{[key: string]: number}>({});
  const [showVSCodeModal, setShowVSCodeModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch recent scans
        const { data: scans, error: scansError } = await supabase
          .from('code_scans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (scansError) throw scansError;
        
        setRecentScans(scans || []);
        
        // Fetch stats
        const { data: allScans, error: statsError } = await supabase
          .from('code_scans')
          .select('id, vulnerabilities, created_at, source')
          .eq('user_id', user.id);
          
        if (statsError) throw statsError;
        
        const { data: fixes, error: fixesError } = await supabase
          .from('vulnerability_fixes')
          .select('id, applied, scan_id')
          .in('scan_id', allScans?.map(scan => scan.id) || []);
          
        if (fixesError) throw fixesError;
        
        const totalVulnerabilities = allScans?.reduce((acc, scan) => 
          acc + (scan.vulnerabilities?.length || 0), 0) || 0;
          
        const fixedVulnerabilities = fixes?.filter(fix => fix.applied)?.length || 0;
        
        // Count VS Code scans
        const vscodeScanCount = allScans?.filter(scan => scan.source === 'vscode_extension')?.length || 0;
        
        setStats({
          totalScans: allScans?.length || 0,
          vulnerabilitiesFound: totalVulnerabilities,
          vulnerabilitiesFixed: fixedVulnerabilities,
          vscodeScanCount
        });

        // Calculate security score
        if (totalVulnerabilities > 0) {
          const fixRate = fixedVulnerabilities / totalVulnerabilities;
          const score = Math.round(fixRate * 100);
          
          let grade = 'F';
          let color = 'text-red-500';
          
          if (score >= 90) {
            grade = 'A';
            color = 'text-emerald-400';
          } else if (score >= 80) {
            grade = 'B';
            color = 'text-emerald-300';
          } else if (score >= 70) {
            grade = 'C';
            color = 'text-yellow-400';
          } else if (score >= 60) {
            grade = 'D';
            color = 'text-orange-400';
          }
          
          setSecurityScore({ score, grade, color });
        }

        // Calculate vulnerability trends
        if (allScans && allScans.length > 0) {
          const trends: {[key: string]: number} = {};
          
          allScans.forEach(scan => {
            if (scan.vulnerabilities && Array.isArray(scan.vulnerabilities)) {
              scan.vulnerabilities.forEach((vuln: any) => {
                const type = vuln.type || 'unknown';
                trends[type] = (trends[type] || 0) + 1;
              });
            }
          });
          
          setVulnerabilityTrends(trends);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-400 mt-2">Welcome back! Here's an overview of your security scans.</p>
      </header>
      
      {/* Security Score */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Security Score</h2>
          <div className="flex items-center">
            <div className={`text-4xl font-bold ${securityScore.color}`}>{securityScore.grade}</div>
            <div className="ml-2 text-gray-400">({securityScore.score}%)</div>
          </div>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4">
          <div 
            className={`h-4 rounded-full ${
              securityScore.score >= 90 ? 'bg-emerald-400' : 
              securityScore.score >= 70 ? 'bg-yellow-400' : 
              'bg-red-400'
            }`} 
            style={{ width: `${securityScore.score}%` }}
          ></div>
        </div>
        <p className="text-gray-400 mt-2">
          {securityScore.score >= 90 
            ? 'Excellent! Your code is well-protected against vulnerabilities.' 
            : securityScore.score >= 70 
            ? 'Good progress, but there\'s room for improvement in your code security.' 
            : 'Your code needs attention to address security vulnerabilities.'}
        </p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-300">Total Scans</h3>
            <Code className="h-6 w-6 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold">{stats.totalScans}</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-300">Vulnerabilities Found</h3>
            <AlertTriangle className="h-6 w-6 text-amber-400" />
          </div>
          <p className="text-3xl font-bold">{stats.vulnerabilitiesFound}</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-300">Vulnerabilities Fixed</h3>
            <CheckCircle className="h-6 w-6 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold">{stats.vulnerabilitiesFixed}</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-300">VS Code Scans</h3>
            <Terminal className="h-6 w-6 text-blue-400" />
          </div>
          <p className="text-3xl font-bold">{stats.vscodeScanCount}</p>
        </div>
      </div>

      {/* Vulnerability Trends */}
      {Object.keys(vulnerabilityTrends).length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Vulnerability Trends</h2>
            <BarChart2 className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {Object.entries(vulnerabilityTrends)
              .sort(([, countA], [, countB]) => countB - countA)
              .map(([type, count]) => (
                <div key={type} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 capitalize">{type.replace(/-/g, ' ')}</span>
                    <span className="text-gray-400">{count}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        type.includes('injection') ? 'bg-red-400' : 
                        type.includes('auth') ? 'bg-amber-400' : 
                        'bg-emerald-400'
                      }`} 
                      style={{ width: `${(count / Math.max(...Object.values(vulnerabilityTrends))) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-emerald-500/20 p-3 rounded-full">
              <Zap className="h-6 w-6 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold">Quick Scan</h2>
          </div>
          <p className="text-gray-400 mb-4">Quickly scan a code snippet for security vulnerabilities.</p>
          <Link 
            to="/scanner" 
            className="inline-flex items-center bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Code className="h-5 w-5 mr-2" />
            New Scan
          </Link>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-blue-500/20 p-3 rounded-full">
              <Code className="h-6 w-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold">VS Code Extension</h2>
          </div>
          <p className="text-gray-400 mb-4">Scan your code directly from your editor with our VS Code extension.</p>
          <button 
            onClick={() => setShowVSCodeModal(true)}
            className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="h-5 w-5 mr-2" />
            Get Extension
          </button>
        </div>
      </div>
      
      {/* Recent Scans */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Recent Scans</h2>
          <Link to="/scanner" className="text-emerald-400 hover:text-emerald-300 flex items-center">
            <span className="mr-1">New Scan</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        {recentScans.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-gray-700 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <Code className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">No scans yet</h3>
            <p className="text-gray-400 mb-4">Start by scanning your code for vulnerabilities</p>
            <Link 
              to="/scanner" 
              className="inline-flex items-center bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Code className="h-5 w-5 mr-2" />
              Scan Code
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Language</th>
                  <th className="pb-3 font-medium">Source</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Vulnerabilities</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {recentScans.map((scan) => (
                  <tr key={scan.id} className="border-b border-gray-700">
                    <td className="py-4">
                      {new Date(scan.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 capitalize">{scan.language}</td>
                    <td className="py-4">
                      {scan.source === 'vscode_extension' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                          <Terminal className="h-3 w-3 mr-1" />
                          VS Code
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                          <Code className="h-3 w-3 mr-1" />
                          Web App
                        </span>
                      )}
                    </td>
                    <td className="py-4">
                      {scan.status === 'completed' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </span>
                      ) : scan.status === 'pending' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-4">
                      {scan.vulnerabilities?.length || 0}
                    </td>
                    <td className="py-4 text-right">
                      <Link 
                        to={`/scanner?id=${scan.id}`}
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* VS Code Extension Modal */}
      {showVSCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">SecureScript AI VS Code Extension</h2>
              <button 
                onClick={() => setShowVSCodeModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                Scan your code for security vulnerabilities directly from VS Code. The SecureScript AI extension integrates seamlessly with your development workflow.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                    <li>Enter your API URL and API key from the API & Integrations page</li>
                    <li>Right-click on a file or selection and choose "SecureScript AI: Scan"</li>
                  </ol>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center md:justify-center space-y-4 md:space-y-0 md:space-x-4">
                <a 
                  href="https://marketplace.visualstudio.com/items?itemName=securescript-ai.securescript-ai-extension" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  Download from VS Code Marketplace
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
                
                <a 
                  href="https://github.com/Pranavram22/vulnerable_vscode.git"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  Download from GitHub
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
                
                <Link 
                  to="/api-docs"
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                  onClick={() => setShowVSCodeModal(false)}
                >
                  Get API Key
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </div>
            </div>
            
            <div className="border-t border-gray-700 pt-4">
              <p className="text-gray-400 text-sm">
                Need help setting up the extension? Visit our <Link to="/api-docs" className="text-emerald-400 hover:text-emerald-300" onClick={() => setShowVSCodeModal(false)}>API & Integrations</Link> page for detailed instructions or download directly from <a href="https://github.com/Pranavram22/vulnerable_vscode.git" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">GitHub</a>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;