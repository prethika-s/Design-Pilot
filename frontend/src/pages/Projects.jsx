import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Plus, Trash2, ArrowRight, Loader2, Search } from 'lucide-react';
import { projectAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [ideaText, setIdeaText] = useState('');

  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchProjects = async () => {
    try {
      const res = await projectAPI.getAll();
      setProjects(res.data);
    } catch (e) {
      showToast('Failed to fetch projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !ideaText.trim()) return;

    setCreateLoading(true);
    try {
      const res = await projectAPI.create({ title, ideaText });
      showToast('Project created successfully!', 'success');
      setShowModal(false);
      navigate(`/projects/${res.data._id}`);
    } catch (error) {
      showToast('Failed to create project', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project permanently?')) return;
    try {
      await projectAPI.delete(id);
      showToast('Project deleted', 'success');
      fetchProjects();
    } catch (error) {
      showToast('Failed to delete project', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-3">
        <Loader2 className="animate-spin text-accentTeal" size={40} />
        <p className="text-gray-400 text-sm font-medium">Loading projects list...</p>
      </div>
    );
  }

  const filtered = projects.filter((p) => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.ideaText.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Workspaces</h1>
          <p className="text-xs text-gray-500 mt-1">Manage and access your design contexts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-accentTeal to-teal-600 hover:from-teal-400 hover:to-teal-700 text-darkBg font-bold rounded-xl text-xs transition-all shadow-md shadow-teal-900/20"
        >
          <Plus size={14} /> New Project
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-550 pointer-events-none">
          <Search size={16} />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-[#161c2a]/60 border border-gray-805 rounded-xl text-xs focus:outline-none focus:border-accentTeal text-white"
          placeholder="Filter workspaces by title or keywords..."
        />
      </div>

      {/* Grid List */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center text-xs text-gray-650 italic">
          No workspaces match your query.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((proj) => (
            <div
              key={proj._id}
              onClick={() => navigate(`/projects/${proj._id}`)}
              className="glass-card p-5 cursor-pointer flex items-center justify-between hover:scale-[1.005] hover:border-teal-950 transition-all border border-gray-800"
            >
              <div className="flex items-center gap-4 truncate mr-6">
                <div className="p-3 bg-gray-900 rounded-xl text-accentTeal border border-gray-850 flex-shrink-0">
                  <FolderKanban size={20} />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-200 text-sm truncate">{proj.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                      proj.status === 'complete' 
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/60'
                        : proj.status === 'active'
                        ? 'bg-teal-950/60 text-accentTeal border border-teal-900/60'
                        : 'bg-gray-950/60 text-gray-400 border border-gray-900'
                    }`}>
                      {proj.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{proj.ideaText}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[10px] text-gray-500 font-semibold flex-shrink-0">
                <span>Updated: {new Date(proj.updatedAt || proj.createdAt).toLocaleDateString()}</span>
                <button
                  onClick={(e) => handleDelete(proj._id, e)}
                  className="p-1.5 bg-gray-900 hover:bg-rose-950/30 text-gray-500 hover:text-rose-400 rounded-lg border border-gray-800 transition-all"
                >
                  <Trash2 size={12} />
                </button>
                <span className="text-accentTeal flex items-center gap-0.5 hover:underline">
                  Open <ArrowRight size={10} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05070c]/80 backdrop-blur-sm">
          <div className="w-full max-w-xl p-8 glass-card bg-[#161c2a] border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-2">Initialize Product Workspace</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0b0f19] border border-gray-800 focus:border-accentTeal rounded-xl text-sm focus:outline-none transition-all text-white"
                  placeholder="e.g. Cloud Job Portal"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Rough Product Idea / Description
                </label>
                <textarea
                  required
                  rows={4}
                  value={ideaText}
                  onChange={(e) => setIdeaText(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0b0f19] border border-gray-800 focus:border-accentTeal rounded-xl text-sm focus:outline-none transition-all text-white resize-none"
                  placeholder="e.g. Describe your product idea..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-850">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-gray-800/50 hover:bg-gray-800 text-gray-300 text-sm font-semibold rounded-xl transition-all border border-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-accentTeal to-teal-600 hover:from-teal-400 hover:to-teal-700 text-darkBg font-semibold rounded-xl text-sm transition-all shadow-lg"
                >
                  {createLoading ? 'Creating...' : 'Create Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
