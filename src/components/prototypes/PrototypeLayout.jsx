import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { prototypes } from '../../data/prototypes';

const PrototypeLayout = () => {
  const location = useLocation();

  const prototype = prototypes.find(p => p.route === location.pathname)
    || prototypes.find(p => location.pathname.endsWith(`/${p.id}`));

  if (!prototype) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Prototype Not Found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex-shrink-0 sticky top-0 z-30">
        <div className="flex items-center">
          <div>
            <h1 className="text-base font-semibold text-gray-900">{prototype.title}</h1>
            <p className="text-xs text-gray-500">{prototype.description}</p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default PrototypeLayout;
