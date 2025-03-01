import React from 'react';
import { BookOpen, ExternalLink, Search, Filter, ArrowRight, CheckCircle } from 'lucide-react';

const securityTips = [
  {
    id: 1,
    title: 'Preventing SQL Injection',
    category: 'Injection',
    description: 'SQL injection is a code injection technique that might destroy your database. Learn how to prevent it by using parameterized queries and input validation.',
    level: 'Beginner',
    tags: ['sql', 'injection', 'database'],
    link: 'https://owasp.org/www-community/attacks/SQL_Injection'
  },
  {
    id: 2,
    title: 'Cross-Site Scripting (XSS) Prevention',
    category: 'Injection',
    description: 'XSS attacks occur when an attacker can inject malicious scripts into web pages viewed by other users. Learn how to prevent XSS by properly escaping output and using Content Security Policy.',
    level: 'Intermediate',
    tags: ['xss', 'javascript', 'web'],
    link: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html'
  },
  {
    id: 3,
    title: 'Secure Password Storage',
    category: 'Authentication',
    description: 'Never store passwords in plain text. Learn how to properly hash and salt passwords using modern algorithms like bcrypt, Argon2, or PBKDF2.',
    level: 'Beginner',
    tags: ['authentication', 'passwords', 'hashing'],
    link: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html'
  },
  {
    id: 4,
    title: 'Implementing JWT Authentication',
    category: 'Authentication',
    description: 'JSON Web Tokens (JWT) provide a secure way to transmit information between parties. Learn how to implement JWT authentication properly and avoid common pitfalls.',
    level: 'Advanced',
    tags: ['jwt', 'authentication', 'tokens'],
    link: 'https://jwt.io/introduction/'
  },
  {
    id: 5,
    title: 'Secure File Uploads',
    category: 'Input Validation',
    description: 'File uploads can be a significant security risk. Learn how to validate file types, scan for malware, and store uploaded files securely.',
    level: 'Intermediate',
    tags: ['uploads', 'validation', 'files'],
    link: 'https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html'
  },
  {
    id: 6,
    title: 'Content Security Policy (CSP)',
    category: 'Headers',
    description: 'Content Security Policy is an added layer of security that helps to detect and mitigate certain types of attacks, including XSS and data injection attacks.',
    level: 'Advanced',
    tags: ['csp', 'headers', 'xss'],
    link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP'
  },
  {
    id: 7,
    title: 'HTTPS Everywhere',
    category: 'Transport',
    description: 'Always use HTTPS to encrypt data in transit. Learn how to properly implement HTTPS and configure secure TLS settings.',
    level: 'Beginner',
    tags: ['https', 'tls', 'encryption'],
    link: 'https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html'
  },
  {
    id: 8,
    title: 'Preventing Command Injection',
    category: 'Injection',
    description: 'Command injection attacks are possible when an application passes unsafe user supplied data to a system shell. Learn how to prevent these attacks.',
    level: 'Intermediate',
    tags: ['command', 'injection', 'shell'],
    link: 'https://owasp.org/www-community/attacks/Command_Injection'
  }
];

const SecurityTips: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = React.useState<string | null>(null);
  const [bookmarkedTips, setBookmarkedTips] = React.useState<number[]>([]);
  
  const categories = Array.from(new Set(securityTips.map(tip => tip.category)));
  const levels = Array.from(new Set(securityTips.map(tip => tip.level)));
  
  const filteredTips = securityTips.filter(tip => {
    const matchesSearch = searchTerm === '' || 
      tip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tip.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tip.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesCategory = selectedCategory === null || tip.category === selectedCategory;
    const matchesLevel = selectedLevel === null || tip.level === selectedLevel;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });
  
  const toggleBookmark = (id: number) => {
    if (bookmarkedTips.includes(id)) {
      setBookmarkedTips(bookmarkedTips.filter(tipId => tipId !== id));
    } else {
      setBookmarkedTips([...bookmarkedTips, id]);
    }
  };
  
  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedLevel(null);
    setSearchTerm('');
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Injection':
        return 'bg-red-500/20 text-red-400';
      case 'Authentication':
        return 'bg-blue-500/20 text-blue-400';
      case 'Input Validation':
        return 'bg-amber-500/20 text-amber-400';
      case 'Headers':
        return 'bg-purple-500/20 text-purple-400';
      case 'Transport':
        return 'bg-emerald-500/20 text-emerald-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };
  
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'Intermediate':
        return 'bg-amber-500/20 text-amber-400';
      case 'Advanced':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Security Tips</h1>
        <p className="text-gray-400 mt-2">Learn best practices to improve your code security</p>
      </header>
      
      {/* Search and Filters */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search security tips..."
              className="bg-gray-700 text-white w-full pl-10 pr-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          <div className="flex space-x-2">
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={selectedLevel || ''}
              onChange={(e) => setSelectedLevel(e.target.value || null)}
              className="bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
            >
              <option value="">All Levels</option>
              {levels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            
            <button
              onClick={clearFilters}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center"
            >
              <Filter className="h-4 w-4 mr-1" />
              Clear
            </button>
          </div>
        </div>
      </div>
      
      {/* Tips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredTips.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="bg-gray-700 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">No tips found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your search or filters</p>
            <button 
              onClick={clearFilters}
              className="inline-flex items-center bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          filteredTips.map(tip => (
            <div key={tip.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(tip.category)}`}>
                    {tip.category}
                  </span>
                  <button 
                    onClick={() => toggleBookmark(tip.id)}
                    className={`text-gray-400 hover:text-yellow-400 ${bookmarkedTips.includes(tip.id) ? 'text-yellow-400' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={bookmarkedTips.includes(tip.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>
                
                <h3 className="text-lg font-bold mb-2">{tip.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{tip.description}</p>
                
                <div className="flex justify-between items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(tip.level)}`}>
                    {tip.level}
                  </span>
                  
                  <a 
                    href={tip.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 flex items-center text-sm"
                  >
                    Learn more
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
              
              <div className="bg-gray-700 px-6 py-3">
                <div className="flex flex-wrap gap-2">
                  {tip.tags.map(tag => (
                    <span key={tag} className="bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Newsletter Signup */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0 md:mr-8">
            <h2 className="text-xl font-bold mb-2">Stay Updated on Security</h2>
            <p className="text-gray-400">Get the latest security tips and vulnerability alerts delivered to your inbox.</p>
          </div>
          
          <div className="w-full md:w-auto flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <input
              type="email"
              placeholder="Your email address"
              className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
            />
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center justify-center">
              Subscribe
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Featured Resources */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-6">Featured Security Resources</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <a 
            href="https://owasp.org/www-project-top-ten/" 
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <h3 className="font-medium mb-2">OWASP Top 10</h3>
            <p className="text-gray-400 text-sm">The standard awareness document for developers about the most critical security risks.</p>
            <div className="flex items-center mt-3 text-emerald-400">
              <span className="text-sm">View resource</span>
              <ExternalLink className="h-3 w-3 ml-1" />
            </div>
          </a>
          
          <a 
            href="https://cheatsheetseries.owasp.org/" 
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <h3 className="font-medium mb-2">OWASP Cheat Sheets</h3>
            <p className="text-gray-400 text-sm">A collection of high value information on specific application security topics.</p>
            <div className="flex items-center mt-3 text-emerald-400">
              <span className="text-sm">View resource</span>
              <ExternalLink className="h-3 w-3 ml-1" />
            </div>
          </a>
          
          <a 
            href="https://snyk.io/learn/" 
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <h3 className="font-medium mb-2">Snyk Learn</h3>
            <p className="text-gray-400 text-sm">Free developer security education with hands-on lessons and interactive examples.</p>
            <div className="flex items-center mt-3 text-emerald-400">
              <span className="text-sm">View resource</span>
              <ExternalLink className="h-3 w-3 ml-1" />
            </div>
          </a>
          
          <a 
            href="https://portswigger.net/web-security" 
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <h3 className="font-medium mb-2">Web Security Academy</h3>
            <p className="text-gray-400 text-sm">Free online training for web application security from the creators of Burp Suite.</p>
            <div className="flex items-center mt-3 text-emerald-400">
              <span className="text-sm">View resource</span>
              <ExternalLink className="h-3 w-3 ml-1" />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default SecurityTips;