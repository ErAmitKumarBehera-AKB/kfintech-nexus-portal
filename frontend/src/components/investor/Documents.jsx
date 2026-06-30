import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, Eye, ShieldCheck, UploadCloud, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { Alert, AlertDescription } from "@/components/ui/alert";

const Documents = () => {
    const { user, updateSession } = useAuth();
    const [loading, setLoading] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    const kycDocs = user?.kyc || {};

    const docsConfig = [
        {
            id: 'aadhaar',
            title: 'Aadhaar Card',
            description: 'Provide your Aadhaar card for primary identity verification.',
            fieldName: 'aadhaarDoc',
            currentUrl: kycDocs.aadhaar
        },
        {
            id: 'pan',
            title: 'PAN Card',
            description: 'Provide your PAN card for financial compliance.',
            fieldName: 'panDoc',
            currentUrl: kycDocs.pan
        },
        {
            id: 'dl',
            title: 'Driving License',
            description: 'Provide your Driving License as a secondary proof of identity.',
            fieldName: 'dlDoc',
            currentUrl: kycDocs.dl
        }
    ];

    const handleUpload = async (e, docId, fieldName) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(docId);
        setMessage({ type: '', text: '' });
        
        try {
            const formData = new FormData();
            formData.append(fieldName, file);

            const res = await apiClient.post('/auth/profile/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            let messageText = 'Document uploaded successfully!';
            
            if (res.data.ocrResult) {
                if (res.data.ocrResult.match_found) {
                    messageText += " Documents uploaded and matched successfully! You may use them later.";
                } else {
                    messageText += " Warning: Documents uploaded but we couldn't confidently match your Name/DOB.";
                }
            }
            
            setMessage({ type: 'success', text: messageText });
            if (res.data.user) {
                if (typeof updateSession === 'function') {
                    updateSession(res.data.user);
                } else {
                    window.location.reload(); 
                }
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to upload document' });
        } finally {
            setLoading(null);
            e.target.value = null; // reset input
        }
    };

    const handleDelete = async (docId) => {
        if (!window.confirm("Are you sure you want to delete this document?")) return;
        
        setLoading(docId);
        setMessage({ type: '', text: '' });
        
        try {
            const res = await apiClient.delete(`/auth/profile/documents/${docId}`);
            setMessage({ type: 'success', text: res.data.message || 'Document deleted successfully!' });
            if (res.data.user) {
                if (typeof updateSession === 'function') {
                    updateSession(res.data.user);
                } else {
                    window.location.reload(); 
                }
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete document' });
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Document Center</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage your KYC documents and identity proofs.</p>
            </div>

            {message.text && (
                <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : ''}>
                    {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                    <AlertDescription className="ml-2">{message.text}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {docsConfig.map(doc => (
                    <Card key={doc.id} className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131313]">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-medium flex items-center justify-between text-zinc-900 dark:text-zinc-100">
                                {doc.title}
                                {doc.currentUrl ? (
                                    <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                                ) : (
                                    <FileText className="h-5 w-5 text-zinc-300 dark:text-zinc-600" />
                                )}
                            </CardTitle>
                            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                                {doc.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {doc.currentUrl ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-[#1A1A1A] border border-zinc-200 dark:border-zinc-800 rounded-md">
                                        <FileText className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate flex-1">
                                            {doc.id.toUpperCase()} Document
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="flex-1 text-xs h-8 dark:text-zinc-100 dark:border-zinc-700 dark:bg-[#131313] dark:hover:bg-[#1A1A1A]"
                                            onClick={() => window.open(doc.currentUrl, '_blank')}
                                        >
                                            <Eye className="w-3 h-3 mr-2" /> View
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="text-xs h-8 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 dark:border-zinc-700 dark:bg-[#131313]"
                                            onClick={() => handleDelete(doc.id)}
                                            disabled={loading === doc.id}
                                        >
                                            {loading === doc.id ? '...' : <Trash2 className="w-3 h-3" />}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-50 dark:bg-[#1A1A1A] text-center space-y-3">
                                    <UploadCloud className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
                                    <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Not Uploaded</div>
                                    <input 
                                        type="file" 
                                        id={`upload-${doc.id}`}
                                        className="hidden" 
                                        accept="image/jpeg,image/png,application/pdf"
                                        onChange={(e) => handleUpload(e, doc.id, doc.fieldName)}
                                        disabled={loading === doc.id}
                                    />
                                    <Button 
                                        size="sm" 
                                        className="text-xs h-8 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white"
                                        onClick={() => document.getElementById(`upload-${doc.id}`).click()}
                                        disabled={loading === doc.id}
                                    >
                                        {loading === doc.id ? 'Uploading...' : 'Upload File'}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Documents;
