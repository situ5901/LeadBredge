'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function Page() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<{name: string, email: string} | null>(null);
  const [formData, setFormData] = useState({
    Agentname: '',
    AgentMail: '',
    AgentPassword: '',
  });
  const [agents, setAgents] = useState([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchAgents = async () => {
    try {
      const res = await fetch('https://keshvacredit.com/api/v1/agent/getAgents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setAgents(data);
    } catch {
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!token) {
      toast.error('No token found in localStorage.');
      return;
    }

    try {
      const res = await fetch('https://keshvacredit.com/api/v1/admin/create/agent', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success('Agent created successfully!');
        setIsModalOpen(false);
        setFormData({ Agentname: '', AgentMail: '', AgentPassword: '' });
        fetchAgents();
      } else {
        toast.error(result.message || 'Failed to create agent.');
      }
    } catch {
      toast.error('Something went wrong.');
    }
  };

  const confirmDelete = (agent: {Agentname: string, AgentMail: string}) => {
    setAgentToDelete({name: agent.Agentname, email: agent.AgentMail});
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!agentToDelete || !token) return;

    try {
      const res = await fetch('https://keshvacredit.com/api/v1/admin/delete/agent', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          Agentname: agentToDelete.name, 
          AgentMail: agentToDelete.email 
        }),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success('Agent deleted successfully!');
        fetchAgents();
      } else {
        toast.error(result.message || 'Failed to delete agent');
      }
    } catch {
      toast.error('Error deleting agent');
    } finally {
      setIsDeleteModalOpen(false);
      setAgentToDelete(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-xl font-bold text-gray-800">Agent Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white text-sm font-semibold py-2 px-4 sm:px-6 rounded-lg mt-4 sm:mt-0 shadow-lg transition-all duration-300 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Agent
        </button>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {agents.map((agent: any, index: number) => (
          <div key={agent._id} className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            <span className="text-lg sm:text-2xl font-bold text-gray-700 w-10 sm:w-12 mb-2 sm:mb-0 shrink-0">
              {index + 1}.
            </span>
            <div className="flex-1 bg-white rounded-2xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-all duration-300 border border-gray-100 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg sm:text-xl font-semibold">
                    {getInitials(agent.Agentname)}
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">{agent.Agentname}</h2>
                    <p className="text-sm text-gray-500 truncate">{agent.AgentMail}</p>
                  </div>
                </div>
                <button
                  onClick={() => confirmDelete(agent)}
                  className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg text-xs font-medium shadow-sm transition-colors duration-200 self-end sm:self-center flex items-center"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {agents.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm w-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-700">No agents found</h3>
            <p className="mt-1 text-gray-500">Add your first agent by clicking the button above</p>
          </div>
        )}
      </div>

      {/* Add Agent Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Add New Agent
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <input
                  type="text"
                  name="Agentname"
                  placeholder="Username"
                  value={formData.Agentname}
                  onChange={handleChange}
                  className="w-full border border-gray-200 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 text-sm sm:text-base"
                />
              </div>
              <div>
                <input
                  type="email"
                  name="AgentMail"
                  placeholder="Email"
                  value={formData.AgentMail}
                  onChange={handleChange}
                  className="w-full border border-gray-200 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 text-sm sm:text-base"
                />
              </div>
              <div>
                <input
                  type="text"
                  name="AgentPassword"
                  placeholder="Set a password"
                  value={formData.AgentPassword}
                  onChange={handleChange}
                  className="w-full border border-gray-200 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 sm:px-6 rounded-lg transition-colors duration-200 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-2 px-4 sm:px-6 rounded-lg transition-all duration-200 text-sm sm:text-base"
              >
                Create Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && agentToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-fadeIn">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-3">Delete Agent</h3>
              <div className="mt-2 text-sm text-gray-500">
                <p>Are you sure you want to delete <span className="font-semibold">{agentToDelete.name}</span>?</p>
                <p className="mt-1">This action cannot be undone.</p>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg text-sm sm:text-base transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm sm:text-base transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}