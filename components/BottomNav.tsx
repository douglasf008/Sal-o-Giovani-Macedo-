import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  path?: string;
  onClick?: () => void;
  label: string;
  icon: React.ReactNode;
}

interface BottomNavProps {
  items: NavItem[];
}

const BottomNav: React.FC<BottomNavProps> = ({ items }) => {
  const location = useLocation();

  return (
    <div className="fixed inset-x-0 bottom-4 mx-auto flex h-16 w-[calc(100%-2rem)] max-w-sm items-center justify-around rounded-2xl border border-gray-700 bg-gray-800/80 shadow-lg backdrop-blur-sm">
        {items.map((item) => {
          if (item.path) {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center space-y-1 ${
                  isActive ? 'text-white' : 'text-gray-400'
                } transition-colors duration-200`}
              >
                {item.icon}
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          }
          if (item.onClick) {
            return (
                <button
                    key={item.label}
                    onClick={item.onClick}
                    className="flex flex-col items-center justify-center space-y-1 text-gray-400 transition-colors duration-200 hover:text-white"
                >
                    {item.icon}
                    <span className="text-xs">{item.label}</span>
                </button>
            );
          }
          return null;
        })}
    </div>
  );
};

export default BottomNav;