/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Code, AlertTriangle, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type CodeScan = {
  id: string;
  created_at: string;
  language: string;
  status: string;
  vulnerabilities: any[];
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [recentScans, setRecentScans] = useState<CodeScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalScans: 0,
    vulnerabilitiesFound: 0,
    vulnerabilitiesFixed: 0
  });

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
          .select('id, vulnerabilities')
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
        
        setStats({
          totalScans: allScans?.length || 0,
          vulnerabilitiesFound: totalVulnerabilities,
          vulnerabilitiesFixed: fixedVulnerabilities
        });
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
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
    </div>
  );
};

export default Dashboard;