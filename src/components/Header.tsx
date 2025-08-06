
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

export const Header = () => {
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
          </div>

          <div className="flex items-center space-x-4">
            {/*<Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">*/}
            {/*  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>*/}
            {/*  Ready*/}
            {/*</Badge>*/}
          </div>
        </div>
      </div>
    </header>
  );
};
