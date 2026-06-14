import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  HelpCircle, 
  CheckSquare, 
  Milestone, 
  Scale, 
  Bookmark, 
  FileDown, 
  Loader2, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X,
  Star,
  ExternalLink
} from 'lucide-react';
import { projectAPI, decisionAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);

  // Discovery / QA State
  const [answers, setAnswers] = useState([]); // { question, answer }

  // Requirements State
  const [requirements, setRequirements] = useState([]);

  // Architecture State
  const [architectures, setArchitectures] = useState([]);

  // Tradeoff State
  const [tradeoffs, setTradeoffs] = useState(null);

  // Decision State
  const [decisions, setDecisions] = useState([]);
  const [newDecision, setNewDecision] = useState('');
  const [newAlternatives, setNewAlternatives] = useState('');
  const [newDecidedBy, setNewDecidedBy] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ decision: '', rationale: '', alternatives: '', decidedBy: '' });

  // Report State
  const [reports, setReports] = useState([]);

  const loadProjectData = async () => {
    try {
      const res = await projectAPI.getById(id);
      setProject(res.data);

      // Pre-populate discovery answers with empty strings if questions exist
      if (res.data.discoveryQuestions && res.data.discoveryQuestions.length > 0) {
        setAnswers(
          res.data.discoveryQuestions.map((q) => ({ question: q, answer: '' }))
        );
      }
    } catch (error) {
      showToast('Error loading project details', 'error');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [id]);

  // Load step-specific data on step activation
  useEffect(() => {
    if (!project) return;

    const fetchStepData = async () => {
      try {
        if (step === 2) {
          setActionLoading(true);
          const reqsRes = await projectAPI.processRequirements(id, answers.length > 0 ? answers : [{question: 'default', answer: 'default'}]); // Fetch if answers submitted, or trigger placeholder
          setRequirements(reqsRes.data.requirements || []);
        } else if (step === 3) {
          setActionLoading(true);
          const archRes = await projectAPI.generateArchitecture(id);
          setArchitectures(archRes.data);
        } else if (step === 4) {
          setActionLoading(true);
          const tradRes = await projectAPI.analyzeTradeoffs(id);
          setTradeoffs(tradRes.data);
        } else if (step === 5) {
          setActionLoading(true);
          const decsRes = await decisionAPI.getByProject(id);
          setDecisions(decsRes.data);
        } else if (step === 6) {
          setActionLoading(true);
          const repRes = await projectAPI.getReports(id);
          setReports(repRes.data);
        }
      } catch (e) {
        console.error('Error fetching step data', e);
      } finally {
        setActionLoading(false);
      }
    };

    fetchStepData();
  }, [step, project]);

  // --- ACTIONS ---
  const handleRunDiscovery = async () => {
    setActionLoading(true);
    try {
      const res = await projectAPI.runDiscovery(id, project.ideaText);
      setProject((prev) => ({ ...prev, discoveryQuestions: res.data.questions }));
      setAnswers(res.data.questions.map((q) => ({ question: q, answer: '' })));
      showToast('Questions generated successfully!', 'success');
    } catch (error) {
      showToast('Failed to run discovery agent', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnswerChange = (idx, value) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[idx].answer = value;
      return copy;
    });
  };

  const handleProcessRequirements = async () => {
    const uncompleted = answers.some((a) => !a.answer.trim());
    if (uncompleted) {
      showToast('Please provide answers for all clarification questions.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const res = await projectAPI.processRequirements(id, answers);
      setRequirements(res.data.requirements || []);
      showToast('Structured requirements generated!', 'success');
      setStep(2);
    } catch (error) {
      showToast('Failed to process requirements', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateDecision = async (e) => {
    e.preventDefault();
    if (!newDecision.trim() || !newDecidedBy.trim()) {
      showToast('Decision text and author name are required', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const res = await decisionAPI.create({
        projectId: id,
        decision: newDecision,
        alternatives: newAlternatives.split(',').map((a) => a.trim()).filter(Boolean),
        decidedBy: newDecidedBy,
        rationale: '', // Let backend auto-populate this from tradeoff logs!
      });
      showToast('Decision log added successfully!', 'success');
      setDecisions((prev) => [res.data, ...prev]);
      setNewDecision('');
      setNewAlternatives('');
      setNewDecidedBy('');
    } catch (error) {
      showToast('Failed to log decision', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDecision = async (decId) => {
    if (!window.confirm('Delete this decision log?')) return;
    try {
      await decisionAPI.delete(decId);
      showToast('Decision removed', 'success');
      setDecisions((prev) => prev.filter((d) => d._id !== decId));
    } catch (e) {
      showToast('Failed to delete decision', 'error');
    }
  };

  const startEditDecision = (dec) => {
    setEditingId(dec._id);
    setEditForm({
      decision: dec.decision,
      rationale: dec.rationale,
      alternatives: dec.alternatives.join(', '),
      decidedBy: dec.decidedBy,
    });
  };

  const handleUpdateDecision = async (decId) => {
    try {
      const res = await decisionAPI.update(decId, {
        decision: editForm.decision,
        rationale: editForm.rationale,
        alternatives: editForm.alternatives.split(',').map((a) => a.trim()).filter(Boolean),
        decidedBy: editForm.decidedBy,
      });
      showToast('Decision log updated', 'success');
      setDecisions((prev) => prev.map((d) => (d._id === decId ? res.data : d)));
      setEditingId(null);
    } catch (e) {
      showToast('Failed to update decision', 'error');
    }
  };

  const handleGenerateReport = async () => {
    setActionLoading(true);
    try {
      const res = await projectAPI.generateReport(id);
      showToast('PDF report generated successfully!', 'success');
      setReports((prev) => [res.data, ...prev]);
      // Set project complete status
      await projectAPI.update(id, { status: 'complete' });
      setProject(prev => ({ ...prev, status: 'complete' }));
    } catch (error) {
      showToast('Failed to generate report PDF', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-3">
        <Loader2 className="animate-spin text-accentTeal" size={40} />
        <p className="text-gray-400 text-sm font-medium">Loading project workspace...</p>
      </div>
    );
  }

  const stepsList = [
    { num: 1, label: 'Discovery', icon: HelpCircle },
    { num: 2, label: 'Requirements', icon: CheckSquare },
    { num: 3, label: 'Architecture', icon: Milestone },
    { num: 4, label: 'Tradeoffs', icon: Scale },
    { num: 5, label: 'Decisions', icon: Bookmark },
    { num: 6, label: 'PDF Report', icon: FileDown },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Back button & title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2.5 bg-gray-900 border border-gray-800 hover:border-gray-700 hover:text-white text-gray-400 rounded-xl transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{project.title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">Status: <span className="text-accentTeal uppercase font-bold">{project.status}</span></p>
        </div>
      </div>

      {/* Steps Progress Indicator */}
      <div className="glass-card p-4 flex justify-between gap-2 overflow-x-auto">
        {stepsList.map((s, idx) => (
          <button
            key={s.num}
            onClick={() => setStep(s.num)}
            disabled={
              // Disable forwarding past step 1 if questions aren't generated or answered
              (s.num > 1 && (!project.discoveryQuestions || project.discoveryQuestions.length === 0)) ||
              (s.num > 2 && requirements.length === 0)
            }
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
              step === s.num
                ? 'bg-teal-950/40 border-teal-850 text-accentTeal font-bold shadow shadow-teal-950/20'
                : 'border-transparent text-gray-400 hover:text-gray-200 disabled:opacity-35 disabled:hover:text-gray-400'
            }`}
          >
            <s.icon size={14} />
            <span>{s.num}. {s.label}</span>
          </button>
        ))}
      </div>

      {/* Active step display */}
      <div className="min-h-[50vh]">
        {actionLoading && (
          <div className="flex flex-col items-center justify-center p-20 gap-3">
            <Loader2 className="animate-spin text-accentTeal" size={32} />
            <p className="text-xs text-gray-500 font-semibold tracking-wider uppercase pulse-glow">
              AI Copilot is processing details...
            </p>
          </div>
        )}

        {!actionLoading && (
          <div className="space-y-6">
            {/* STEP 1: REQUIREMENT DISCOVERY AGENT */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="glass-card p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">Original Product Idea</h3>
                  <p className="text-sm leading-relaxed text-gray-300">{project.ideaText}</p>
                </div>

                {(!project.discoveryQuestions || project.discoveryQuestions.length === 0) ? (
                  <div className="glass-card p-12 text-center flex flex-col items-center border-dashed">
                    <HelpCircle className="text-gray-500 mb-3" size={36} />
                    <h4 className="text-gray-300 font-semibold mb-1">Generate Clarification Questions</h4>
                    <p className="text-xs text-gray-500 max-w-sm mb-6 leading-relaxed">
                      The discovery agent will analyze your idea and propose 5-10 targeted questions to clarify scope, constraints, and technologies.
                    </p>
                    <button
                      onClick={handleRunDiscovery}
                      className="px-5 py-2.5 bg-gradient-to-r from-accentTeal to-teal-600 hover:from-teal-400 hover:to-teal-700 text-darkBg font-semibold rounded-xl text-xs transition-all shadow-md"
                    >
                      Run Discovery Agent
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-gray-300">Discovery Questions ({answers.length})</h4>
                      <button
                        onClick={handleRunDiscovery}
                        className="text-xs text-accentTeal font-bold hover:underline"
                      >
                        Regenerate Questions
                      </button>
                    </div>

                    <div className="space-y-4">
                      {answers.map((qa, idx) => (
                        <div key={idx} className="glass-card p-5 space-y-3">
                          <label className="block text-sm font-semibold text-gray-300">
                            {idx + 1}. {qa.question}
                          </label>
                          <textarea
                            rows={2}
                            required
                            value={qa.answer}
                            onChange={(e) => handleAnswerChange(idx, e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#0b0f19] border border-gray-800 focus:border-accentTeal rounded-lg text-sm focus:outline-none transition-all text-white resize-none"
                            placeholder="Type your answer here..."
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        onClick={handleProcessRequirements}
                        className="px-5 py-3 bg-gradient-to-r from-accentTeal to-teal-600 hover:from-teal-400 hover:to-teal-700 text-darkBg font-semibold rounded-xl text-sm transition-all shadow-lg"
                      >
                        Save Answers & Process Requirements
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: REQUIREMENT PROCESSOR */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">Structured Requirements</h3>
                    <p className="text-xs text-gray-500">AI-generated product backlog categorized by MoSCoW priorities</p>
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    className="px-4 py-2.5 bg-gradient-to-r from-accentTeal to-teal-600 hover:from-teal-400 text-darkBg text-xs font-bold rounded-xl transition-all shadow"
                  >
                    Proceed to Architecture Recomendations
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['Must Have', 'Should Have', 'Nice To Have', 'Out Of Scope'].map((priority) => {
                    const filtered = requirements.filter((r) => r.priority === priority);
                    const colorMap = {
                      'Must Have': 'border-rose-900/60 bg-rose-950/10 text-rose-300',
                      'Should Have': 'border-amber-900/60 bg-amber-950/10 text-amber-300',
                      'Nice To Have': 'border-teal-900/60 bg-teal-950/10 text-accentTeal',
                      'Out Of Scope': 'border-gray-900 bg-gray-950/15 text-gray-500',
                    };

                    return (
                      <div key={priority} className={`glass-card p-6 border-l-4 ${colorMap[priority] || 'border-gray-800 bg-gray-900/10 text-gray-300'}`}>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-sm uppercase tracking-wider">{priority}</h4>
                          <span className="text-xs bg-black/40 px-2 py-0.5 rounded font-bold">{filtered.length} items</span>
                        </div>
                        {filtered.length === 0 ? (
                          <p className="text-xs text-gray-600 italic">No items generated for this priority.</p>
                        ) : (
                          <div className="space-y-3">
                            {filtered.map((r, i) => (
                              <div key={i} className="bg-black/20 p-3 rounded-lg border border-gray-850 space-y-1">
                                <h5 className="font-semibold text-xs text-gray-200">{r.title}</h5>
                                <p className="text-[11px] text-gray-500 leading-relaxed">{r.description}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: ARCHITECTURE RECOMMENDATION ENGINE */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">Architectural Options</h3>
                    <p className="text-xs text-gray-500">Evaluations for Monolith, Microservices, and Serverless options</p>
                  </div>
                  <button
                    onClick={() => setStep(4)}
                    className="px-4 py-2.5 bg-gradient-to-r from-accentTeal to-teal-600 hover:from-teal-400 text-darkBg text-xs font-bold rounded-xl transition-all shadow"
                  >
                    Proceed to Technology Tradeoffs
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {architectures.map((opt, idx) => (
                    <div
                      key={idx}
                      className={`glass-card p-6 flex flex-col justify-between border ${
                        opt.recommended 
                          ? 'border-teal-700/80 shadow-lg shadow-teal-950/20 bg-teal-950/5' 
                          : 'border-gray-800'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-base text-gray-200">{opt.type}</h4>
                          {opt.recommended && (
                            <span className="flex items-center gap-1 bg-teal-950/80 text-accentTeal px-2 py-0.5 rounded text-[10px] font-bold border border-teal-800">
                              <Star size={10} fill="currentColor" /> RECOMMENDED
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-400 leading-relaxed">{opt.rationale}</p>
                        
                        {/* Pros */}
                        <div className="space-y-1.5">
                          <h5 className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Pros</h5>
                          <ul className="text-xs text-gray-400 space-y-1 list-inside list-disc">
                            {opt.pros.map((p, i) => <li key={i} className="leading-snug">{p}</li>)}
                          </ul>
                        </div>

                        {/* Cons */}
                        <div className="space-y-1.5">
                          <h5 className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Cons</h5>
                          <ul className="text-xs text-gray-400 space-y-1 list-inside list-disc">
                            {opt.cons.map((c, i) => <li key={i} className="leading-snug">{c}</li>)}
                          </ul>
                        </div>
                      </div>

                      <div className="border-t border-gray-850 mt-6 pt-4 space-y-2 text-[10px] text-gray-500">
                        <p><strong className="text-gray-400">Team Fit:</strong> {opt.teamFit}</p>
                        <p><strong className="text-gray-400">Scalability:</strong> {opt.scalability}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: TRADEOFF ANALYZER */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">Technology Tradeoffs</h3>
                    <p className="text-xs text-gray-500">Scorecard evaluation for core product technology alternatives</p>
                  </div>
                  <button
                    onClick={() => setStep(5)}
                    className="px-4 py-2.5 bg-gradient-to-r from-accentTeal to-teal-600 hover:from-teal-400 text-darkBg text-xs font-bold rounded-xl transition-all shadow"
                  >
                    Proceed to Decision Log
                  </button>
                </div>

                {tradeoffs && tradeoffs.comparisons && (
                  <div className="space-y-6">
                    {tradeoffs.comparisons.map((comp, idx) => (
                      <div key={idx} className="glass-card p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Title & scores */}
                        <div className="space-y-4 md:border-r border-gray-850 pr-6">
                          <h4 className="font-bold text-base text-gray-200 border-b border-gray-850 pb-2">
                            {comp.technology}
                          </h4>
                          
                          {/* Scores List */}
                          <div className="space-y-2 text-xs">
                            {[
                              { label: 'Cost efficiency', val: comp.costScore },
                              { label: 'Scalability potential', val: comp.scalabilityScore },
                              { label: 'Complexity overhead', val: comp.complexityScore },
                              { label: 'Performance speed', val: comp.performanceScore },
                            ].map((s, i) => (
                              <div key={i} className="flex justify-between items-center">
                                <span className="text-gray-500">{s.label}</span>
                                <div className="flex gap-0.5 text-accentTeal">
                                  {Array.from({ length: 5 }).map((_, dotIdx) => (
                                    <Star 
                                      key={dotIdx} 
                                      size={11} 
                                      fill={dotIdx < s.val ? 'currentColor' : 'transparent'} 
                                      className={dotIdx < s.val ? 'text-accentTeal' : 'text-gray-800'}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* AI Recommendation */}
                        <div className="flex flex-col justify-center gap-1.5 md:border-r border-gray-850 pr-6">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Recommendation</span>
                          <span className="text-lg font-bold text-accentTeal">{comp.recommendation}</span>
                        </div>

                        {/* Reasoning */}
                        <div className="flex flex-col justify-center gap-1.5">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Reasoning Justification</span>
                          <p className="text-xs text-gray-400 leading-relaxed">{comp.reasoning}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: DECISION MEMORY */}
            {step === 5 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">Decision Memory Log</h3>
                    <p className="text-xs text-gray-500">Record architectural decisions with auto-populated rationales from tradeoffs</p>
                  </div>
                  <button
                    onClick={() => setStep(6)}
                    className="px-4 py-2.5 bg-gradient-to-r from-accentTeal to-teal-600 hover:from-teal-400 text-darkBg text-xs font-bold rounded-xl transition-all shadow"
                  >
                    Proceed to PDF Report
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Create Form */}
                  <div className="glass-card p-6 h-fit bg-[#161c2a]/80 md:col-span-1">
                    <h4 className="font-bold text-sm text-gray-300 mb-4 border-b border-gray-850 pb-2">Log Decision</h4>
                    <form onSubmit={handleCreateDecision} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                          Decision Title / Statement
                        </label>
                        <input
                          type="text"
                          required
                          value={newDecision}
                          onChange={(e) => setNewDecision(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0b0f19] border border-gray-800 focus:border-accentTeal rounded-lg text-xs focus:outline-none text-white"
                          placeholder="e.g. Use MongoDB for projects data store"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                          Decided By
                        </label>
                        <input
                          type="text"
                          required
                          value={newDecidedBy}
                          onChange={(e) => setNewDecidedBy(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0b0f19] border border-gray-800 focus:border-accentTeal rounded-lg text-xs focus:outline-none text-white"
                          placeholder="e.g. Staff Architect"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                          Rejected Alternatives (comma separated)
                        </label>
                        <input
                          type="text"
                          value={newAlternatives}
                          onChange={(e) => setNewAlternatives(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0b0f19] border border-gray-800 focus:border-accentTeal rounded-lg text-xs focus:outline-none text-white"
                          placeholder="e.g. PostgreSQL, MySQL"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-accentTeal to-teal-600 hover:from-teal-400 hover:to-teal-700 text-darkBg font-bold rounded-lg text-xs transition-all"
                      >
                        <Plus size={14} /> Log Decision
                      </button>
                    </form>
                  </div>

                  {/* List Decisions */}
                  <div className="md:col-span-2 space-y-4">
                    <h4 className="font-bold text-sm text-gray-300">Logged Decisions ({decisions.length})</h4>
                    {decisions.length === 0 ? (
                      <div className="glass-card p-12 text-center text-xs text-gray-600 italic">
                        No decisions logged yet. Use the sidebar form to log your first database, router, or hosting decision.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {decisions.map((dec) => (
                          <div key={dec._id} className="glass-card p-5 space-y-3 relative">
                            {editingId === dec._id ? (
                              // Edit Mode
                              <div className="space-y-3">
                                <div>
                                  <label className="text-[10px] text-gray-500 font-bold uppercase">Decision</label>
                                  <input
                                    type="text"
                                    value={editForm.decision}
                                    onChange={(e) => setEditForm({ ...editForm, decision: e.target.value })}
                                    className="w-full px-2 py-1.5 bg-[#0b0f19] border border-gray-800 focus:border-accentTeal rounded text-xs text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-500 font-bold uppercase">Decided By</label>
                                  <input
                                    type="text"
                                    value={editForm.decidedBy}
                                    onChange={(e) => setEditForm({ ...editForm, decidedBy: e.target.value })}
                                    className="w-full px-2 py-1.5 bg-[#0b0f19] border border-gray-800 focus:border-accentTeal rounded text-xs text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-500 font-bold uppercase">Alternatives</label>
                                  <input
                                    type="text"
                                    value={editForm.alternatives}
                                    onChange={(e) => setEditForm({ ...editForm, alternatives: e.target.value })}
                                    className="w-full px-2 py-1.5 bg-[#0b0f19] border border-gray-800 focus:border-accentTeal rounded text-xs text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-500 font-bold uppercase">Rationale</label>
                                  <textarea
                                    rows={3}
                                    value={editForm.rationale}
                                    onChange={(e) => setEditForm({ ...editForm, rationale: e.target.value })}
                                    className="w-full px-2 py-1.5 bg-[#0b0f19] border border-gray-800 focus:border-accentTeal rounded text-xs text-white resize-none"
                                  />
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => handleUpdateDecision(dec._id)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-950/80 text-emerald-400 border border-emerald-900 rounded text-xs font-bold"
                                  >
                                    <Check size={12} /> Save
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-950/80 text-gray-400 border border-gray-800 rounded text-xs font-bold"
                                  >
                                    <X size={12} /> Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // View Mode
                              <>
                                <div className="flex justify-between items-start gap-4 pr-16">
                                  <div>
                                    <h5 className="font-bold text-sm text-gray-200">{dec.decision}</h5>
                                    <span className="text-[10px] text-gray-500 font-semibold uppercase">
                                      Decided by: {dec.decidedBy} | Date: {new Date(dec.createdAt).toLocaleDateString()}
                                      {dec.editedAt && ` (Edited: ${new Date(dec.editedAt).toLocaleDateString()})`}
                                    </span>
                                  </div>
                                  
                                  {/* Edit / Delete overlay controls */}
                                  <div className="absolute top-4 right-4 flex gap-1.5">
                                    <button
                                      onClick={() => startEditDecision(dec)}
                                      className="p-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-850 hover:text-white rounded text-gray-400 transition-all"
                                      title="Edit Decision"
                                    >
                                      <Edit3 size={11} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteDecision(dec._id)}
                                      className="p-1.5 bg-gray-900 hover:bg-rose-950/30 border border-gray-850 text-gray-400 hover:text-rose-400 rounded transition-all"
                                      title="Delete Decision"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>

                                <div className="p-3 bg-black/30 rounded-lg border border-gray-850 text-xs text-gray-400 leading-relaxed whitespace-pre-line">
                                  <strong className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Rationale</strong>
                                  {dec.rationale}
                                </div>

                                {dec.alternatives && dec.alternatives.length > 0 && (
                                  <div className="text-[10px] text-gray-500 leading-relaxed font-semibold">
                                    Rejected Alternatives:{' '}
                                    <span className="text-gray-400 font-normal">{dec.alternatives.join(', ')}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: PDF REPORT GENERATOR */}
            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Generate Architecture Report</h3>
                  <p className="text-xs text-gray-500">Compile all discovery answers, MoSCoW requirements, tech scorecards, and audit logs into a PDF.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Actions card */}
                  <div className="glass-card p-6 flex flex-col items-center justify-center text-center gap-4 bg-[#161c2a]/80 border border-gray-800">
                    <div className="p-4 bg-teal-950/50 text-accentTeal rounded-full border border-teal-800 mb-2">
                      <FileDown size={36} className="text-glow" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-white">Compile Project Report</h4>
                      <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
                        Compiles the final executive summary and bundles requirements and decisions.
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateReport}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-accentTeal to-teal-600 hover:from-teal-400 hover:to-teal-700 text-darkBg font-bold rounded-xl text-sm transition-all"
                    >
                      <Plus size={16} /> Compile & Generate PDF
                    </button>
                  </div>

                  {/* Metadata history card */}
                  <div className="md:col-span-2 space-y-4">
                    <h4 className="font-bold text-sm text-gray-300">Generated Downloads ({reports.length})</h4>
                    {reports.length === 0 ? (
                      <div className="glass-card p-12 text-center text-xs text-gray-600 italic">
                        No PDF reports compiled yet. Click compile to trigger pdf-lib document building.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reports.map((rep) => (
                          <div key={rep._id} className="glass-card p-5 flex items-center justify-between border border-gray-800">
                            <div className="space-y-1 truncate pr-6">
                              <h5 className="font-bold text-xs text-gray-200 truncate">{rep.summary}</h5>
                              <p className="text-[10px] text-gray-500">Compiled: {new Date(rep.createdAt || rep.generatedAt).toLocaleString()}</p>
                            </div>
                            {/* Standard href pointing to backend served static file */}
                            <a
                              href={rep.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-4 py-2 bg-accentNavy border border-teal-800 hover:bg-teal-950 text-accentTeal text-xs font-bold rounded-lg transition-all"
                            >
                              Download PDF <ExternalLink size={12} />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
