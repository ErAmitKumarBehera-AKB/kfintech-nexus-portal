import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Pagination from './Pagination';

const UserTable = ({ data, page, totalPages, setPage, handleToggleUserStatus }) => {
    
    const maskData = (str, type) => {
        if(!str) return 'N/A';
        if(type === 'email') return str.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length));
        return str;
    };

    return (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="border-b border-zinc-100 px-6 py-5">
                <h2 className="text-base font-semibold text-zinc-950">User Directory</h2>
                <p className="text-sm text-zinc-500 mt-0.5">Manage investors and internal staff access.</p>
            </div>
            
            <div className="flex-1 overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-zinc-200 bg-zinc-50/50">
                            <TableHead className="text-xs font-semibold text-zinc-500 h-11 px-6">User Profile</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-500 h-11">Role Level</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-500 h-11">Account Status</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-500 h-11 text-right px-6">Management</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map(u => (
                            <TableRow key={u._id} className="border-zinc-100 hover:bg-zinc-50 transition-colors">
                                <TableCell className="px-6 py-4">
                                    <div className="text-sm font-semibold text-zinc-950">{u.name}</div>
                                    <div className="text-xs text-zinc-500 font-mono mt-0.5">{maskData(u.email, 'email')}</div>
                                </TableCell>
                                <TableCell className="py-4">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-300 text-zinc-950 bg-zinc-100">
                                        {u.role.replace('ADMIN_', '')}
                                    </span>
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${u.isActive ? 'bg-zinc-900' : 'bg-zinc-300'}`}></div>
                                        <span className="text-sm text-zinc-700 font-medium">{u.isActive ? 'Active' : 'Suspended'}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleToggleUserStatus(u._id, u.isActive)}
                                        className="text-xs font-medium border border-zinc-200 rounded px-3 py-1.5 hover:bg-zinc-100 hover:border-black transition-all text-zinc-950"
                                    >
                                        {u.isActive ? "Revoke Access" : "Restore Access"}
                                    </button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-16 text-zinc-400 text-sm">
                                    No records found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            
            <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>
    );
};

export default UserTable;
