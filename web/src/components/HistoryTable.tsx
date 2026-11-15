import React from 'react';
import type { HistoryEntry } from '../lib/types';

interface HistoryTableProps {
  entries: HistoryEntry[];
  onClose?: () => void;
  onClearAll?: () => void;
  onDeleteEntry?: (id: number) => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  entries,
  onClose,
  onClearAll,
  onDeleteEntry,
}) => {
  // Compute mean μs across currently displayed entries (max 5)
  const meanMu =
    entries.length > 0
      ? (entries.reduce((acc, curr) => acc + curr.mu, 0) / entries.length).toFixed(3)
      : '--';

  const exportCsv = () => {
    if (entries.length === 0) return;
    const rows = [
      ['Run', 'Slip_Angle_deg', 'Mu_Static', 'Displacement_mm', 'Timestamp'],
      ...entries.map((e) => [
        `#${String(e.id).padStart(2, '0')}`,
        e.slipAngle,
        e.mu,
        e.displacement,
        e.timestamp,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.join(',')).join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Wedge_Repose_History_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#D9E1DC] rounded-lg p-4 card-shadow flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-[#16322F]">
          <span className="material-symbols-outlined text-[18px] text-[#8A6A1F]">history_edu</span>
          <span className="font-serif text-sm font-bold uppercase tracking-wider">
            RECENT RUN LOGS ({entries.length} / 5 MAX)
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-mono tabular-nums text-xs font-bold text-[#1F8A5B]">
            MEAN μs: {meanMu}
          </span>

          {entries.length > 0 && onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="flex items-center gap-1 px-2 py-0.5 rounded border border-[#C73A32]/40 bg-[#FBEBEB] text-[#C73A32] hover:bg-[#C73A32] hover:text-white transition-colors text-[10px] font-bold uppercase cursor-pointer"
              title="Erase all history records"
            >
              <span className="material-symbols-outlined text-[13px]">delete_sweep</span>
              <span>Clear All</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-[#8A9C98] hover:text-[#16322F] rounded cursor-pointer"
              title="Close drawer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Content or Empty State */}
      {entries.length === 0 ? (
        <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[32px] text-[#8A9C98]">science</span>
          <p className="font-script text-xl text-[#8A6A1F]">
            “Place the specimen block and run a test to record friction measurements…”
          </p>
          <span className="text-xs text-[#4A6460]">
            The last 5 slip events are tracked here. You can erase them at any time.
          </span>
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-[#EEF2EF] text-[#16322F] uppercase text-[10px] tracking-wider border-b border-[#D9E1DC]">
                <tr>
                  <th className="p-2 font-bold">Run</th>
                  <th className="p-2 font-bold">Slip Angle θ</th>
                  <th className="p-2 font-bold">μs (tan θ)</th>
                  <th className="p-2 font-bold">Δd (mm)</th>
                  <th className="p-2 font-bold">Time</th>
                  <th className="p-2 font-bold">Status</th>
                  {onDeleteEntry && <th className="p-2 font-bold text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E1DC]">
                {entries.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className={`hover:bg-[#EEF2EF]/40 transition-colors ${
                      idx === 0 ? 'bg-[#EEF2EF]/60 border-l-4 border-[#16322F]' : ''
                    }`}
                  >
                    <td className="p-2 font-mono tabular-nums font-bold text-[#16322F]">
                      #{String(entry.id).padStart(2, '0')}
                      {idx === 0 && <span className="ml-1 text-[10px] text-[#8A6A1F]">(Latest)</span>}
                    </td>
                    <td className="p-2 font-mono tabular-nums font-semibold text-[#16322F]">
                      {entry.slipAngle}°
                    </td>
                    <td className="p-2 font-mono tabular-nums font-bold text-[#8A6A1F]">
                      {entry.mu.toFixed(3)}
                    </td>
                    <td className="p-2 font-mono tabular-nums text-[#4A6460]">
                      +{entry.displacement.toFixed(1)} mm
                    </td>
                    <td className="p-2 font-mono tabular-nums text-[#4A6460]">
                      {entry.timestamp}
                    </td>
                    <td className="p-2">
                      <span className="px-1.5 py-0.5 rounded bg-[rgba(31,138,91,0.12)] border border-[#1F8A5B]/30 text-[#1F8A5B] text-[10px] font-bold">
                        VALID
                      </span>
                    </td>
                    {onDeleteEntry && (
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteEntry(entry.id)}
                          className="p-1 text-[#8A9C98] hover:text-[#C73A32] rounded transition-colors cursor-pointer"
                          title="Erase this reading"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-[11px] font-sans text-[#4A6460] pt-1">
            <span className="font-mono">Retaining last {entries.length} of 5 max</span>
            <button
              type="button"
              onClick={exportCsv}
              className="text-[#8A6A1F] hover:underline flex items-center gap-1 font-bold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">download</span>
              <span>EXPORT CSV LOG</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
