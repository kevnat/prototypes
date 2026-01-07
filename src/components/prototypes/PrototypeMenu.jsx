import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight, MoreVertical } from 'lucide-react';
import { prototypes, PROTOTYPE_STATUSES, updatePrototypeStatus } from '../../data/prototypes';

const PrototypeMenu = () => {
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState(null);

  const handlePrototypeClick = (prototype) => {
    navigate(`/prototypes/${prototype.id}`);
  };

  const filteredPrototypes = prototypes;

  const handleStatusChange = (prototypeId, newStatus) => {
    updatePrototypeStatus(prototypeId, newStatus);
    setActiveDropdown(null);
  };

  const getStatusInfo = (status) => {
    return PROTOTYPE_STATUSES[status] || PROTOTYPE_STATUSES.early;
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portfolio */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Portfolio</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredPrototypes.map((prototype) => (
              <div key={prototype.id} className="bg-white rounded-2xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
                <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                  <img
                    src={prototype.screenshot}
                    alt={prototype.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Transparency overlay */}
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusInfo(prototype.status).color}`}>
                      {getStatusInfo(prototype.status).label}
                    </span>
                  </div>
                  <div className="absolute top-4 left-4">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === prototype.id ? null : prototype.id);
                        }}
                        className="p-1 hover:bg-slate-100 rounded transition-colors bg-white/90 hover:bg-white rounded-full shadow-sm"
                      >
                        <MoreVertical className="h-4 w-4 text-slate-600" />
                      </button>
                      {activeDropdown === prototype.id && (
                        <div className="absolute left-0 top-8 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 min-w-[140px]">
                          {Object.entries(PROTOTYPE_STATUSES).map(([status, info]) => (
                            <button
                              key={status}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(prototype.id, status);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-900 ${
                                prototype.status === status ? 'bg-slate-50 font-semibold' : ''
                              }`}
                            >
                              <div className={`w-2 h-2 rounded-full ${info.color.split(' ')[0]}`}></div>
                              {info.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-white/95 backdrop-blur rounded-lg p-3 border border-white/50 shadow-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-600 font-medium">Progress</span>
                        <span className="text-xs text-slate-700 font-semibold">{prototype.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mt-2 border border-slate-300/50 shadow-sm overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-300 shadow-sm"
                          style={{ width: `${prototype.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer"
                        onClick={() => handlePrototypeClick(prototype)}>
                      {prototype.title}
                    </h3>
                  </div>
                  <p className="text-slate-600 mb-4 line-clamp-2">{prototype.description}</p>
                  {prototype.insights && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                      <p className="text-blue-800 text-sm font-medium">💡 {prototype.insights}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Updated {prototype.lastUpdated}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePrototypeClick(prototype)}
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
                    >
                      Explore <ArrowRight className="h-3 w-3 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrototypeMenu;