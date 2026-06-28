import React from 'react';

const Pagination = ({ page, totalPages, setPage }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-zinc-200">
            <span className="text-sm text-zinc-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
                <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))} 
                    disabled={page === 1} 
                    className="h-8 px-3 text-sm font-medium border border-zinc-200 rounded-md bg-white hover:bg-zinc-100 disabled:opacity-50 transition-all duration-200 hover:border-black text-zinc-950"
                >
                    Previous
                </button>
                <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                    disabled={page >= totalPages} 
                    className="h-8 px-3 text-sm font-medium border border-zinc-200 rounded-md bg-white hover:bg-zinc-100 disabled:opacity-50 transition-all duration-200 hover:border-black text-zinc-950"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default Pagination;
