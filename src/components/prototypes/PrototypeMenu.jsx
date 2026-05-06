import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MoreVertical } from 'lucide-react';
import { prototypes, PROTOTYPE_STATUSES, updatePrototypeStatus } from '../../data/prototypes';

const PrototypeMenu = () => {
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [, forceUpdate] = useState(0);

  const sorted = [...prototypes].sort(
    (a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)
  );

  const handleStatusChange = (prototypeId, newStatus) => {
    updatePrototypeStatus(prototypeId, newStatus);
    setActiveDropdown(null);
    forceUpdate(n => n + 1);
  };

  const getStatusInfo = (status) => PROTOTYPE_STATUSES[status] || PROTOTYPE_STATUSES.early;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/home')} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-2xl font-semibold text-slate-900">Prototypes</h1>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500 w-full">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Updated</th>
                <th className="px-4 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((prototype, i) => {
                const statusInfo = getStatusInfo(prototype.status);
                return (
                  <tr
                    key={prototype.id}
                    onClick={() => navigate(`/prototypes/${prototype.id}`)}
                    className={`group cursor-pointer hover:bg-slate-50 transition-colors ${
                      i < sorted.length - 1 ? 'border-b border-slate-100' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="text-lg leading-none">{prototype.thumbnail}</span>
                        <div>
                          <span className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                            {prototype.title}
                          </span>
                          <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{prototype.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="relative" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === prototype.id ? null : prototype.id)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium border ${statusInfo.color} flex items-center gap-1`}
                        >
                          {statusInfo.label}
                          <MoreVertical className="h-3 w-3 opacity-50" />
                        </button>
                        {activeDropdown === prototype.id && (
                          <div className="absolute left-0 top-8 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 min-w-[150px]">
                            {Object.entries(PROTOTYPE_STATUSES).map(([status, info]) => (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(prototype.id, status)}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-800 ${
                                  prototype.status === status ? 'font-semibold bg-slate-50' : ''
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${info.color.split(' ')[0]}`} />
                                {info.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                      {formatDate(prototype.lastUpdated)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-300 group-hover:text-blue-500 transition-colors">
                      <ArrowRight className="h-4 w-4" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PrototypeMenu;
