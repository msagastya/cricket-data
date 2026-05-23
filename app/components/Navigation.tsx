'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Users, Shield, BarChart3 } from 'lucide-react';

const navItems = [
  { name: 'Matches', href: '/matches', icon: Trophy },
  { name: 'Players', href: '/players', icon: Users },
  { name: 'Teams', href: '/teams', icon: Shield },
  { name: 'Leaderboards', href: '/leaderboards', icon: BarChart3 },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-lg border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Trophy className="h-8 w-8 text-blue-600" />
            <span className="font-bold text-xl text-slate-900">Cricket Analysis</span>
          </Link>

          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                    }
                  `}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
