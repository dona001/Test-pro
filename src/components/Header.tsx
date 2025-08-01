
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, FileText } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';


export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isManualTesting = location.pathname === '/';
  const isCollectionTesting = location.pathname === '/collection';

  return (
    <header className="bg-background border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">API Tester Pro</h1>
                <p className="text-xs text-muted-foreground">Professional API Testing Suite</p>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex items-center space-x-1">
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className={`flex items-center space-x-2 rounded-lg px-4 py-2 transition-all duration-200 ${
                  isManualTesting 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Manual Testing</span>
                {isManualTesting && (
                  <Badge variant="secondary" className="ml-1 text-xs bg-green-200 text-green-800">
                    Active
                  </Badge>
                )}
              </Button>
              
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => navigate('/collection')}
                className={`flex items-center space-x-2 rounded-lg px-4 py-2 transition-all duration-200 ${
                  isCollectionTesting 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Collections</span>
                {isCollectionTesting && (
                  <Badge variant="secondary" className="ml-1 text-xs bg-green-200 text-green-800">
                    Active
                  </Badge>
                )}
              </Button>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Ready
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
};
