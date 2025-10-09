import React, { useState, useEffect } from 'react';
import { useElectionData } from '../contexts/ElectionDataContext';
import { Edit2, Plus, Trash2, ExternalLink, AlertCircle } from 'lucide-react';

/**
 * Admin Dashboard for managing pledges and news
 * Features:
 * - List candidates with low pledge counts
 * - Edit/Add pledges
 * - Add related news to pledges
 */
const AdminDashboard = () => {
  const { dataSource } = useElectionData();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'low-pledges', 'no-news'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const officials = await dataSource.getAllOfficials();

      // Enrich with pledge counts
      const enriched = await Promise.all(
        officials.map(async (official) => {
          const pledges = await dataSource.getPledgesByOfficial(official.hubo_id);
          return {
            ...official,
            pledgeCount: pledges.length,
            pledges: pledges
          };
        })
      );

      setCandidates(enriched);
    } catch (error) {
      console.error('Failed to load candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter candidates
  const filteredCandidates = candidates.filter(candidate => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesName = candidate.name.toLowerCase().includes(search);
      const matchesRegion = candidate.sgg_name?.toLowerCase().includes(search);
      const matchesParty = candidate.party_name?.toLowerCase().includes(search);

      if (!matchesName && !matchesRegion && !matchesParty) {
        return false;
      }
    }

    // Category filter
    if (filter === 'low-pledges') {
      return candidate.pledgeCount <= 2;
    } else if (filter === 'no-news') {
      // TODO: Filter by candidates with pledges that have no news
      return true;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage pledges and news articles for all candidates
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Candidates</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {candidates.length}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Low Pledge Count</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {candidates.filter(c => c.pledgeCount <= 2).length}
                </p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-300" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Pledges</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {candidates.reduce((sum, c) => sum + c.pledgeCount, 0)}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                <svg className="w-6 h-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, region, or party..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('low-pledges')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'low-pledges'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                }`}
              >
                Low Pledges (≤2)
              </button>
            </div>
          </div>
        </div>

        {/* Candidates List */}
        <div className="space-y-4">
          {filteredCandidates.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">No candidates found</p>
            </div>
          ) : (
            filteredCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.hubo_id}
                candidate={candidate}
                onEdit={() => {/* TODO: Open edit modal */}}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Candidate Card Component
 */
const CandidateCard = ({ candidate, onEdit }) => {
  const [expanded, setExpanded] = useState(false);

  const getPartyColor = (partyName) => {
    if (partyName?.includes('국민의힘')) return 'text-red-600 dark:text-red-400';
    if (partyName?.includes('민주')) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
      {/* Card Header */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {candidate.name}
              </h3>
              {candidate.pledgeCount <= 2 && (
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs font-medium rounded">
                  Low Pledge Count
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span className={`font-medium ${getPartyColor(candidate.party_name)}`}>
                {candidate.party_name}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {candidate.sgg_name}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                공약 {candidate.pledgeCount}개
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                       transition-colors font-medium text-sm"
            >
              {expanded ? 'Collapse' : 'View Pledges'}
            </button>
            <button
              onClick={onEdit}
              className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600
                       text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              title="Edit pledges"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Pledges */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Pledges ({candidate.pledgeCount})
            </h4>
            <button
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700
                       text-white text-sm rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Pledge
            </button>
          </div>

          {candidate.pledges && candidate.pledges.length > 0 ? (
            <div className="space-y-3">
              {candidate.pledges.map((pledge, index) => (
                <div
                  key={pledge.pledge_id}
                  className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          #{index + 1}
                        </span>
                        {pledge.pledge_realm && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                            {pledge.pledge_realm}
                          </span>
                        )}
                      </div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                        {pledge.pledge_title}
                      </h5>
                      {pledge.pledge_content && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {pledge.pledge_content}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 ml-4">
                      <button
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-600 dark:text-gray-400"
                        title="Add news"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-600 dark:text-gray-400"
                        title="Edit pledge"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* News count placeholder */}
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <ExternalLink className="w-3 h-3" />
                    <span>0 related news articles</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No pledges found
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
