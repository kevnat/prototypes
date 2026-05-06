import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const sections = [
  {
    title: 'Payments Epic Board',
    description: 'Live Jira kanban board tracking D - Payments epics across lifecycle lanes',
    thumbnail: '🔄',
    route: '/payments',
  },
  {
    title: 'Prototypes',
    description: 'Product prototypes and design explorations',
    thumbnail: '🧪',
    route: '/prototypes',
  },
];

const HomeMenu = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold text-slate-900 mb-8">Home</h1>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          {sections.map((section, i) => (
            <div
              key={section.route}
              onClick={() => navigate(section.route)}
              className={`group flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                i < sections.length - 1 ? 'border-b border-slate-100' : ''
              }`}
            >
              <span className="text-2xl leading-none">{section.thumbnail}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                  {section.title}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{section.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeMenu;
