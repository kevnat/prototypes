import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { prototypes } from '../../data/prototypes';

const PrototypeLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract prototype ID from the path
  const prototypeId = location.pathname.split('/').pop();
  const prototype = prototypes.find(p => p.id === prototypeId);
  
  if (!prototype) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Prototype Not Found</h2>
          <button
            onClick={() => navigate('/prototypes')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Prototypes
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header with Back Button */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex-shrink-0 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/prototypes')}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-gray-900">{prototype.title}</h1>
              <p className="text-xs text-gray-500">{prototype.description}</p>
            </div>
          </div>

        </div>
      </div>

      {/* Prototype Content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default PrototypeLayout;