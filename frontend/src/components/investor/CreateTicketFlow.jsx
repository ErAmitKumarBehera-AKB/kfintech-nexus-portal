import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UploadCloud, CheckCircle2, AlertCircle, Send, FileText,
    Clock, ChevronLeft, Check, ArrowRight, X
} from 'lucide-react';
import { SERVICE_TYPE_LIST, getServiceType } from '../../config/serviceTypes';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

// Animation Variants
const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit:    { opacity: 0, x: -20, transition: { duration: 0.2 } }
};
const backVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit:    { opacity: 0, x: 20, transition: { duration: 0.2 } }
};

// Step Indicator
const STEPS = [
    { num: 1, label: 'Select Service' },
    { num: 2, label: 'Fill Details'   },
    { num: 3, label: 'Review & Submit'}
];

const StepIndicator = ({ current }) => {
    const progress = ((current - 1) / (STEPS.length - 1)) * 100;
    
    return (
        <div className="mb-10 max-w-xl mx-auto px-4">
            <div className="relative mb-6">
                <Progress value={progress} className="h-1 bg-zinc-100" />
            </div>
            <div className="flex justify-between relative -top-3">
                {STEPS.map(step => {
                    const done    = current > step.num;
                    const active  = current === step.num;
                    return (
                        <div key={step.num} className="flex flex-col items-center gap-2">
                            <motion.div
                                layout
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm border-2 bg-white transition-colors z-10 ${
                                    done   ? 'border-zinc-900 text-zinc-900 bg-zinc-900 text-white'
                                           : active ? 'border-zinc-900 text-zinc-900'
                                                   : 'border-zinc-200 text-zinc-400'
                                }`}
                            >
                                {done ? <Check className="w-4 h-4 text-white" /> : step.num}
                            </motion.div>
                            <span className={`text-xs font-medium text-center ${active || done ? 'text-zinc-900' : 'text-zinc-400'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Service Selection
const ServiceCard = ({ config, isSelected, onClick }) => {
    const Icon = config.icon;

    return (
        <motion.div
            onClick={() => onClick(config.key)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`relative text-left w-full rounded-xl border p-4 cursor-pointer transition-all duration-200 flex flex-col gap-3 ${
                isSelected
                    ? 'border-zinc-900 bg-zinc-50 shadow-sm ring-1 ring-zinc-900'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm'
            }`}
        >
            <AnimatePresence>
                {isSelected && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute top-3 right-3 w-5 h-5 bg-zinc-900 rounded-full flex items-center justify-center"
                    >
                        <Check className="w-3 h-3 text-white" />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                isSelected ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-100 text-zinc-500'
            }`}>
                <Icon className="w-5 h-5" />
            </div>

            <div>
                <h3 className={`font-semibold text-sm mb-0.5 transition-colors ${isSelected ? 'text-zinc-900' : 'text-zinc-700'}`}>
                    {config.label}
                </h3>
                <p className="text-xs text-zinc-500 line-clamp-2">{config.description}</p>
            </div>

            <div className="flex items-center gap-1.5 mt-auto pt-2">
                <Clock className="w-3 h-3 text-zinc-400" />
                <span className="text-[11px] font-medium text-zinc-500">
                    SLA: {config.expectedSLA}
                </span>
            </div>
        </motion.div>
    );
};

// Service Information
const MetadataField = ({ field, value, onChange }) => {
    if (field.type === 'select') {
        return (
            <Select value={value || ''} onValueChange={(val) => onChange({ target: { name: field.name, value: val } })}>
                <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder={`Select ${field.label}`} />
                </SelectTrigger>
                <SelectContent>
                    {field.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
            </Select>
        );
    }
    return (
        <Input 
            type={field.type || 'text'} 
            name={field.name} 
            value={value || ''}
            onChange={onChange} 
            placeholder={field.placeholder}
            required={field.required} 
            className="bg-white"
        />
    );
};

// Request Review
const ReviewRow = ({ label, value }) => (
    value ? (
        <div className="flex justify-between items-start py-3 border-b border-zinc-100 last:border-0 gap-4">
            <span className="text-xs font-medium text-zinc-500 shrink-0">{label}</span>
            <span className="text-sm text-zinc-900 font-medium text-right">{value}</span>
        </div>
    ) : null
);

const CreateTicketFlow = ({ onTabChange }) => {
    const [step, setStep] = useState(1);
    const [goingBack, setGoingBack] = useState(false);
    const [selectedType, setSelectedType] = useState(null);
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        investorName: user?.name || '',
        accountNumber: ''
    });
    const [serviceMetadata, setServiceMetadata] = useState({});
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fileInputRef = useRef(null);
    const formRef = useRef(null);



    const goTo = (nextStep) => {
        setGoingBack(nextStep < step);
        setStep(nextStep);
        setStatus({ type: '', message: '' });
    };

    const handleSelectType = (typeKey) => {
        setSelectedType(typeKey);
        setServiceMetadata({});
    };

    const handleContinueToForm = () => {
        if (selectedType) goTo(2);
    };
    
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleMetadataChange = (e) => setServiceMetadata(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleGoToReview = (e) => {
        e.preventDefault();
        goTo(3);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setStatus({ type: '', message: '' });

        try {
            const serviceConfig = getServiceType(selectedType);
            const complaintText = selectedType === 'COMPLAINT'
                ? `[COMPLAINT] ${formData.title} - ${formData.description}`
                : `[${selectedType}] ${serviceConfig.label} request. ${formData.description || formData.title}`.trim();

            const payload = new FormData();
            payload.append('title', formData.title);
            payload.append('description', formData.description || complaintText);
            payload.append('complaintText', complaintText);
            payload.append('investorName', formData.investorName);
            payload.append('accountNumber', formData.accountNumber);
            payload.append('serviceType', selectedType);
            payload.append('serviceMetadata', JSON.stringify(serviceMetadata));
            if (file) payload.append('documents', file);

            await apiClient.post('/tickets', payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setStatus({
                type: 'success',
                message: `${serviceConfig.label} request submitted successfully. Redirecting to your tickets...`
            });
            setSelectedType(null);
            setFormData({ title: '', description: '', investorName: user?.name || '', accountNumber: '' });
            setServiceMetadata({});
            setFile(null);
            
            // Route back to My Tickets
            setTimeout(() => {
                if (onTabChange) onTabChange('tickets');
            }, 2000);

        } catch (error) {
            setStatus({
                type: 'error',
                message: error.response?.data?.message || 'Failed to submit request.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentConfig = selectedType ? getServiceType(selectedType) : null;
    const variants = goingBack ? backVariants : stepVariants;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="text-center">
                <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Create Service Request</h1>
                <p className="text-zinc-500 mt-1 text-sm">Select a category and provide details for your request.</p>
            </header>

            <StepIndicator current={step} />

            <AnimatePresence>
                {status.message && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
                            status.type === 'success'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                        }`}
                    >
                        {status.type === 'success'
                            ? <CheckCircle2 className="w-5 h-5 shrink-0" />
                            : <AlertCircle className="w-5 h-5 shrink-0" />}
                        <div className="flex-1">
                            <p className="font-semibold text-sm">
                                {status.type === 'success' ? 'Success' : 'Error'}
                            </p>
                            <p className="text-sm mt-0.5">{status.message}</p>
                        </div>
                        <button onClick={() => setStatus({ type: '', message: '' })} className="shrink-0 opacity-70 hover:opacity-100">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait" custom={goingBack}>
                {step === 1 && (
                    <motion.div key="step1" variants={variants} initial="initial" animate="animate" exit="exit" className="space-y-8">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {SERVICE_TYPE_LIST.map(config => (
                                <ServiceCard
                                    key={config.key}
                                    config={config}
                                    isSelected={selectedType === config.key}
                                    onClick={handleSelectType}
                                />
                            ))}
                        </div>

                        <div className="flex justify-end">
                            <Button
                                onClick={handleContinueToForm}
                                disabled={!selectedType}
                                className="bg-zinc-900 text-white hover:bg-zinc-800"
                            >
                                Continue <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 2 && currentConfig && (
                    <motion.div key="step2" variants={variants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                        <Card className="border-zinc-200 shadow-sm bg-white">
                            <CardContent className="p-6 space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
                                    <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center">
                                        {React.createElement(currentConfig.icon, { className: "w-5 h-5" })}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-900">{currentConfig.label}</p>
                                        <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                                            <Clock className="w-3 h-3" /> SLA: {currentConfig.expectedSLA}
                                        </p>
                                    </div>
                                </div>

                                <form ref={formRef} id="service-form" onSubmit={handleGoToReview} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Investor Name</Label>
                                            <Input type="text" name="investorName" value={formData.investorName} readOnly className="bg-zinc-50 text-zinc-500 border-zinc-200" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Account Number <span className="text-red-500">*</span></Label>
                                            <Input type="text" name="accountNumber" required value={formData.accountNumber} onChange={handleChange} placeholder="Enter your account number" className="bg-white border-zinc-200" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Request Title <span className="text-red-500">*</span></Label>
                                        <Input type="text" name="title" required value={formData.title} onChange={handleChange} placeholder="Brief summary" className="bg-white border-zinc-200" />
                                    </div>

                                    {currentConfig.requiredFields.length > 0 && (
                                        <div className="space-y-4 pt-2">
                                            <h3 className="text-sm font-semibold text-zinc-900">{currentConfig.label} Details</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {currentConfig.requiredFields.map(field => (
                                                    <div key={field.name} className="space-y-2">
                                                        <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
                                                        <MetadataField field={field} value={serviceMetadata[field.name] || ''} onChange={handleMetadataChange} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label>
                                            {selectedType === 'COMPLAINT' ? 'Detailed Description' : 'Additional Notes'}
                                            {selectedType === 'COMPLAINT' && <span className="text-red-500 ml-1">*</span>}
                                        </Label>
                                        <Textarea 
                                            name="description" 
                                            rows={4}
                                            required={selectedType === 'COMPLAINT'}
                                            value={formData.description} 
                                            onChange={handleChange}
                                            placeholder="Provide any additional context..."
                                            className="resize-none bg-white border-zinc-200" 
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>
                                            Supporting Document
                                            {currentConfig.requiredDocuments.length > 0 ? (
                                                <span className="ml-2 text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded uppercase font-semibold tracking-wider">Required</span>
                                            ) : (
                                                <span className="ml-2 text-[10px] bg-zinc-50 text-zinc-400 px-2 py-0.5 rounded uppercase font-medium tracking-wider border border-zinc-100">Optional</span>
                                            )}
                                        </Label>
                                        
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-zinc-200 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-zinc-50 hover:bg-zinc-100 transition-colors"
                                        >
                                            <input type="file" className="hidden" ref={fileInputRef} accept="image/jpeg,image/png,application/pdf" required={currentConfig.requiredDocuments.length > 0 && !file} onChange={e => setFile(e.target.files[0])} />
                                            {file ? (
                                                <div className="text-center">
                                                    <FileText className="w-8 h-8 text-zinc-900 mx-auto mb-2" />
                                                    <p className="text-sm font-medium text-zinc-900">{file.name}</p>
                                                </div>
                                            ) : (
                                                <div className="text-center text-zinc-500">
                                                    <UploadCloud className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                                    <p className="text-xs opacity-70 mt-1">JPEG, PNG, PDF up to 5 MB</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => goTo(1)}>
                                <ChevronLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                            <Button type="submit" form="service-form" className="bg-zinc-900 text-white hover:bg-zinc-800">
                                Review Request <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 3 && currentConfig && (
                    <motion.div key="step3" variants={variants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                        <Card className="border-zinc-200 shadow-sm bg-white overflow-hidden">
                            <div className="bg-zinc-50 border-b border-zinc-100 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white border border-zinc-200 text-zinc-900 flex items-center justify-center">
                                        {React.createElement(currentConfig.icon, { className: "w-5 h-5" })}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-900">{currentConfig.label}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">Review your submission</p>
                                    </div>
                                </div>
                            </div>
                            
                            <CardContent className="p-6 space-y-6">
                                <div>
                                    <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-widest mb-3">Investor Details</h4>
                                    <div className="bg-white rounded-lg border border-zinc-100 px-4">
                                        <ReviewRow label="Name" value={formData.investorName} />
                                        <ReviewRow label="Account" value={formData.accountNumber} />
                                        <ReviewRow label="Title" value={formData.title} />
                                    </div>
                                </div>

                                {currentConfig.requiredFields.length > 0 && Object.keys(serviceMetadata).length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-widest mb-3">Service Details</h4>
                                        <div className="bg-white rounded-lg border border-zinc-100 px-4">
                                            {currentConfig.requiredFields.map(field => (
                                                <ReviewRow key={field.name} label={field.label} value={serviceMetadata[field.name]} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {formData.description && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-widest mb-3">Notes</h4>
                                        <p className="text-sm text-zinc-600 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
                                            "{formData.description}"
                                        </p>
                                    </div>
                                )}

                                <div className={`flex items-center gap-3 p-4 rounded-lg border ${file ? 'bg-zinc-50 border-zinc-200' : 'bg-white border-dashed border-zinc-200'}`}>
                                    {file ? <CheckCircle2 className="w-5 h-5 text-zinc-900 shrink-0" /> : <AlertCircle className="w-5 h-5 text-zinc-400 shrink-0" />}
                                    <div>
                                        <p className="text-sm font-medium text-zinc-900">{file ? file.name : 'No document attached'}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">Document upload status</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => goTo(2)}>
                                <ChevronLeft className="w-4 h-4 mr-1" /> Edit
                            </Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-zinc-900 text-white hover:bg-zinc-800">
                                {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                                {!isSubmitting && <Send className="w-4 h-4 ml-2" />}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CreateTicketFlow;
