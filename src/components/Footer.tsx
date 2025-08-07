import React from 'react';
import { FeedbackModal } from './FeedbackModal';

export const Footer = () => {
  return (
    <footer className="bg-background border-t border-border py-4 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>Developed by</span>
            <span className="font-medium text-foreground">API Tester Pro Team</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <FeedbackModal 
              trigger={
                <button className="text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                  Feedback
                </button>
              }
              currentPage="Quick API Testing"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}; 