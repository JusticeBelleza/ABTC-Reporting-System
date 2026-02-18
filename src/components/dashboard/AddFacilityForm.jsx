import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

// Notice the 'export default' keywords here:
export default function AddFacilityForm({ onAdd, loading }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('RHU');
  const [barangays, setBarangays] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(name, type, barangays);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Facility Name</label>
        <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none" placeholder="e.g. Bangued RHU" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
        <select value={type} onChange={e => setType(e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none">
          <option value="RHU">RHU</option>
          <option value="Hospital">Hospital</option>
          <option value="Clinic">Clinic</option>
        </select>
      </div>
      {type === 'RHU' && (
        <div>
           <label className="block text-xs font-medium text-gray-700 mb-1">Barangays (comma separated)</label>
           <textarea value={barangays} onChange={e => setBarangays(e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none" rows={3} placeholder="Zone 1, Zone 2, ..."></textarea>
        </div>
      )}
      <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white p-2.5 rounded-lg hover:bg-zinc-800 transition text-sm font-medium flex items-center justify-center gap-2">
        {loading && <Loader2 size={16} className="animate-spin" />}
        Add Facility
      </button>
    </form>
  );
}