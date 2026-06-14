import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderKanban, 
  Layers, 
  FileText, 
  Plus, 
  Trash2, 
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { projectAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalProjects: 0, savedDecisions: 0, generatedReports: 0 });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // New project form state
  const [title, setTitle] = useState('');
  const [ideaText, setIdeaText] = useState('');

  const { showToast } = useToast();
  const navigate = useNavigate();

  const loadDashboardData = async () => {
    try {
      const [statsRes, projectsRes] = await Promise.all([
        projectAPI.getStats(),
        projectAPI.getAll()
      ]);
      setStats(statsRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!title.trim() || !ideaText.trim()) {
      showToast('Title and product idea are required', 'error');
      return;
    }

    setCreateLoading(true);
    try {
      const res = await projectAPI.create({ title, ideaText });
      showToast('Project created successfully!', 'success');
      setShowModal(false);
      setTitle('');
      setIdeaText('');
      // Navigate straight to the project details workspace
      navigate(`/projects/${res.data._id}`);
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to create project', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteProject = async (id, e) => {
    e.stopPropagation(); // Prevent navigation on click
    if (!window.confirm('Are you sure you want to delete this project and all associated requirements, architectures, tradeoffs, decisions, and reports?')) {
      return;
    }

    try {
      await projectAPI.delete(id);
      showToast('Project deleted', 'success');
      loadDashboardData(); // Refresh list & counts
    } catch (error) {
      showToast('Failed to delete project', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-3">
        <Loader2 className="animate-spin text-accentTeal" size={40} />
        <p className="text-gray-400 text-sm font-medium">Loading workspace data...</p>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Projects', value: stats.totalProjects, icon: FolderKanban, color: 'text-blue-400' },
    { title: 'Saved Decisions', value: stats.savedDecisions, icon: Layers, color: 'text-purple-400' },
    { title: 'Generated Reports', value: stats.generatedReports, icon: FileText, color: 'text-accentTeal' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Architecture Console
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Build robust requirements, designs, tradeoffs, and decision logs.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-accentTeal to-teal-600 hover:from-teal-400 hover:to-teal-700 text-darkBg font-semibold rounded-xl text-sm transition-all shadow-lg shadow-teal-900/20"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="glass-card p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.title}</p>
              <h3 className="text-3xl font-bold mt-2 text-white">{card.value}</h3>
            </div>
            <div className={`p-4 bg-gray-900/60 rounded-2xl border border-gray-800 ${card.color}`}>
              <card.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-200">Active Workspaces</h2>
        
        {projects.length === 0 ? (
          <div className="glass-card p-12 text-center flex flex-col items-center justify-center border-dashed">
            <AlertCircle className="text-gray-500 mb-3" size={36} />
            <h3 className="text-gray-300 font-semibold mb-1">No active workspaces</h3>
            <p className="text-xs text-gray-500 mb-6 max-w-xs">
              Start by creating a new project draft and feeding your product idea to the discovery agent.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-accentNavy border border-teal-800 hover:bg-teal-950 text-accentTeal text-xs font-bold rounded-lg transition-all"
            >
              Initialize Workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div
                key={proj._id}
                onClick={() => navigate(`/projects/${proj._id}`)}
                className="glass-card p-5 cursor-pointer flex flex-col justify-between hover:scale-[1.01] hover:border-teal-950 transition-all border border-gray-800"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="font-bold text-gray-200 text-base line-clamp-1 truncate group-hover:text-white">
                      {proj.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      proj.status === 'complete' 
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/60'
                        : proj.status === 'active'
                        ? 'bg-teal-950/60 text-accentTeal border border-teal-900/60'
                        : 'bg-gray-950/60 text-gray-400 border border-gray-900'
                    }`}>
                      {proj.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed h-8 overflow-hidden">
                    {proj.ideaText}
                  </p>
                </div>
                <div className="flex justify-between items-center border-t border-gray-850 pt-3 text-[10px] text-gray-500 font-medium">
                  <span>Created: {new Date(proj.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDeleteProject(proj._id, e)}
                      className="p-1.5 bg-gray-900 hover:bg-rose-950/35 text-gray-500 hover:text-rose-400 rounded-lg border border-gray-800 transition-all"
                      title="Delete Project"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="flex items-center gap-1 text-accentTeal font-bold hover:underline">
                      Open <ArrowRight size={10} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05070c]/80 backdrop-blur-sm">
          <div className="w-full max-w-xl p-8 glass-card bg-[#161c2a] border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-2">Initialize Product Workspace</h3>
            <p className="text-xs text-gray-400 mb-6">
              Name your project and state a rough product description. The Discovery Agent will draft targeted questions.
            </p>
            <form onSubmit={handleCreateProject} className="space-y-4">
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
                  placeholder="e.g. I want to build a job portal where employers can post jobs, job seekers can upload resumes, and they can chat with each other in real-time."
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
