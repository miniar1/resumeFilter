import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import PropTypes from 'prop-types';

const ResumeResultsTable = ({ results }) => {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Handle both array and object formats
  const resultArray = Array.isArray(results) ? results : Object.entries(results).map(([fileName, data]) => ({
    ...data,
    file_name: fileName
  }));

  // Sort by final_score descending
  const sortedResults = [...resultArray].sort((a, b) => (b.final_score || 0) - (a.final_score || 0));

  // Format score as percentage
  const formatScore = (score) => {
    if (score === undefined || score === null) return '-';
    return `${(score * 100).toFixed(1)}%`;
  };

  if (!sortedResults || sortedResults.length === 0) {
    return (
      <div className="results-section mt-6 bg-white shadow-lg p-6 rounded-lg mx-24 mb-12">
        <h2 className="text-2xl font-bold text-center mb-4">Resume Results</h2>
        <p className="text-center text-gray-500">No candidates found matching the criteria.</p>
      </div>
    );
  }

  return (
    <div className="results-section mt-6 bg-white shadow-lg p-6 rounded-lg mx-24 overflow-x-auto mb-12">
      <h2 className="text-2xl font-bold text-center mb-4">📊 Resume Screening Results</h2>
      <p className="text-center text-gray-600 mb-4">
        {sortedResults.length} candidate(s) analyzed and ranked by AI
      </p>
      <table className="w-full min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-blue-500 to-purple-600">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Rank</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">File Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Overall Score</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Category Match</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Similarity Score</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedResults.map((candidate, index) => {
            const id = candidate.candidate_id || candidate.file_name || index;
            const fileName = candidate.originalFileName || candidate.file_name || `Candidate ${id}`;

            return (
              <React.Fragment key={id}>
                <tr className={`hover:bg-gray-50 ${index === 0 ? 'bg-green-50' : index === 1 ? 'bg-blue-50' : index === 2 ? 'bg-yellow-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${index === 0 ? 'bg-green-500 text-white' :
                        index === 1 ? 'bg-blue-500 text-white' :
                          index === 2 ? 'bg-yellow-500 text-white' :
                            'bg-gray-200 text-gray-600'
                      }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {fileName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                        <div
                          className={`h-2.5 rounded-full ${(candidate.final_score || 0) >= 0.7 ? 'bg-green-500' :
                              (candidate.final_score || 0) >= 0.4 ? 'bg-yellow-500' : 'bg-red-400'
                            }`}
                          style={{ width: `${Math.min((candidate.final_score || 0) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatScore(candidate.final_score)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatScore(candidate.category_score)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatScore(candidate.similarity_score)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => toggleRow(id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {expandedRows.has(id) ? (
                        <>
                          Hide Details
                          <ChevronUp className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Show Details
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </button>
                  </td>
                </tr>
                {expandedRows.has(id) && (
                  <tr className="bg-gray-50">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-700 mb-2">📄 CV Preview</h3>
                          <p className="text-gray-600 text-sm bg-white p-3 rounded border">
                            {candidate.cv_preview || 'No preview available'}
                          </p>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-700 mb-2">📊 Score Breakdown</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Category Match:</span>
                              <span className="font-semibold">{formatScore(candidate.category_score)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Description Similarity:</span>
                              <span className="font-semibold">{formatScore(candidate.similarity_score)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span className="text-gray-600 font-semibold">Final Score:</span>
                              <span className="font-bold text-blue-600">{formatScore(candidate.final_score)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

ResumeResultsTable.propTypes = {
  results: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object
  ]).isRequired
};

export default ResumeResultsTable;