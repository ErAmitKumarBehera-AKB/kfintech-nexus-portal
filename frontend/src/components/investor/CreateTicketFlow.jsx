import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UploadCloud, CheckCircle2, AlertCircle, Send, FileText,
    Clock, ChevronLeft, Check, ArrowRight, X, Info
} from 'lucide-react';
import { SERVICE_TYPE_LIST, getServiceType } from '../../config/serviceTypes';

// Animation Variants
const stepVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
    exit:    { opacity: 0, x: -40, transition: { duration: 0.2, ease: 'easeIn' } }
};
const backVariants = {
    initial: { opacity: 0, x: -40 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
    exit:    { opacity: 0, x: 40, transition: { duration: 0.2, ease: 'easeIn' } }
};

// Step Indicator
const STEPS = [
    { num: 1, label: 'Select Service' },
    { num: 2, label: 'Fill Details'   },
    { num: 3, label: 'Review & Submit'}
];

const StepIndicator = ({ current }) => (
    <div className="flex items-center justify-center mb-10 relative">
        {/* Background connector line */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-64 h-0.5 bg-kfintech-border" />
        {/* Animated filled connector */}
        <motion.div
            className="absolute top-5 left-1/2 -translate-x-1/2 h-0.5 bg-kfintech-accent origin-left"
            style={{ width: '16rem' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: (current - 1) / 2 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
        />

        <div className="flex items-start justify-between w-64 relative z-10">
            {STEPS.map(step => {
                const done    = current > step.num;
                const active  = current === step.num;
                return (
                    <div key={step.num} className="flex flex-col items-center gap-2">
                        <motion.div
                            layout
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 transition-colors ${
                                done   ? 'bg-kfintech-accent border-kfintech-accent text-white shadow-[0_0_14px_rgba(16,185,129,0.5)]'
                                       : active ? 'bg-kfintech-primary/15 border-kfintech-primary text-kfintech-primary shadow-[0_0_14px_rgba(59,130,246,0.35)]'
                                               : 'bg-kfintech-bg border-kfintech-border text-gray-600'
                            }`}
                        >
                            {done ? <Check className="w-5 h-5" /> : step.num}
                        </motion.div>
                        <span className={`text-xs font-bold text-center leading-tight ${active || done ? 'text-white' : 'text-gray-600'}`}>
                            {step.label}
                        </span>
                    </div>
                );
            })}
        </div>
    </div>
);

// Service Selection
const ServiceCard = ({ config, isSelected, onClick }) => {
    const Icon = config.icon;
    const hasRequiredDocs = config.requiredDocuments.length > 0;

    return (
        <motion.button
            type="button"
            id={`service-card-${config.key.toLowerCase()}`}
            onClick={() => onClick(config.key)}
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            className={`relative text-left w-full p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col gap-4 ${
                isSelected
                    ? `${config.colorClasses.card} ${config.colorClasses.activeBorder} shadow-xl`
                    : 'border-kfintech-border bg-kfintech-card/40 hover:bg-kfintech-card/70 hover:border-kfintech-border hover:shadow-lg'
            }`}
        >
            {/* Selected checkmark */}
            <AnimatePresence>
                {isSelected && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute top-3 right-3 w-6 h-6 bg-kfintech-accent rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                    >
                        <Check className="w-3.5 h-3.5 text-white" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Icon */}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-colors ${
                isSelected
                    ? `${config.colorClasses.card} ${config.colorClasses.activeBorder}`
                    : 'bg-kfintech-bg border-kfintech-border'
            }`}>
                <Icon className={`w-5 h-5 ${isSelected ? config.colorClasses.icon : 'text-gray-500'}`} />
            </div>

            {/* Label + Description */}
            <div>
                <h3 className={`font-extrabold text-sm mb-1 transition-colors ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                    {config.label}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">{config.description}</p>
            </div>

            {/* SLA */}
            <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                <span className="text-xs text-gray-500">
                    SLA: <span className={`font-bold ${isSelected ? config.colorClasses.icon : 'text-gray-400'}`}>
                        {config.expectedSLA}
                    </span>
                </span>
            </div>

            {/* Required Documents */}
            {hasRequiredDocs ? (
                <div>
                    <p className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest mb-2">
                        Required Documents
                    </p>
                    <div className="space-y-1.5">
                        {config.requiredDocuments.map(doc => (
                            <div key={doc} className="flex items-start gap-2">
                                <FileText className="w-3 h-3 text-gray-600 shrink-0 mt-0.5" />
                                <span className="text-xs text-gray-500 leading-snug">{doc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gray-600" />
                    <span className="text-xs text-gray-500">No documents required</span>
                </div>
            )}
        </motion.button>
    );
};

// Service Information
const inputClass = "w-full bg-kfintech-bg border border-kfintech-border rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:ring-2 focus:ring-kfintech-primary/50 focus:border-kfintech-primary outline-none transition-all shadow-inner text-sm";

const MetadataField = ({ field, value, onChange }) => {
    if (field.type === 'select') {
        return (
            <select name={field.name} value={value || ''} onChange={onChange}
                required={field.required} className={`${inputClass} cursor-pointer`}>
                <option value="" disabled>Select {field.label}</option>
                {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        );
    }
    return (
        <input type={field.type || 'text'} name={field.name} value={value || ''}
            onChange={onChange} placeholder={field.placeholder}
            required={field.required} className={inputClass} />
    );
};

// Request Review
const ReviewRow = ({ label, value }) => (
    value ? (
        <div className="flex justify-between items-start py-3 border-b border-kfintech-border/40 last:border-0 gap-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest shrink-0">{label}</span>
            <span className="text-sm text-white font-medium text-right">{value}</span>
        </div>
    ) : null
);

// Create Ticket Flow
const CreateTicketFlow = () => {
    const [step, setStep] = useState(1);
    const [goingBack, setGoingBack] = useState(false);

    const [selectedType, setSelectedType] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        investorName: 'Amit',
        accountNumber: '9876543210'
    });
    const [serviceMetadata, setServiceMetadata] = useState({});
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fileInputRef = useRef(null);
    const formRef = useRef(null);

    // Demo Document Initialization
    useEffect(() => {
        fetch('/demo_statement.png')
            .then(res => res.blob())
            .then(blob => setFile(new File([blob], 'demo_statement.png', { type: 'image/png' })))
            .catch(() => {});
    }, []);

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

    // Form Validation
    const handleGoToReview = (e) => {
        e.preventDefault();
        goTo(3);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setStatus({ type: '', message: '' });

        try {
            const serviceConfig = getServiceType(selectedType);

            // Complaint Summary Generation
            const complaintText = selectedType === 'COMPLAINT'
                ? `[COMPLAINT] ${formData.title} - ${formData.description}`
                : `[${selectedType}] ${serviceConfig.label} request. ${formData.description || formData.title}`.trim();

            // Request Payload Construction
            const payload = new FormData();
            payload.append('title', formData.title);
            payload.append('description', formData.description || complaintText);
            payload.append('complaintText', complaintText); // keeping for backward compatibility in backend if any
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
                message: `${serviceConfig.label} request submitted successfully. Your ticket has been queued for L1 Maker review and AI triage.`
            });
            setSelectedType(null);
            setFormData({ title: '', description: '', investorName: 'Amit', accountNumber: '9876543210' });
            setServiceMetadata({});
            setFile(null);
            setGoingBack(true);
            setStep(1);

        } catch (error) {
            setStatus({
                type: 'error',
                message: error.response?.data?.message || 'Failed to submit request. Please ensure the backend is active.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentConfig = selectedType ? getServiceType(selectedType) : null;
    const variants = goingBack ? backVariants : stepVariants;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-6 md:p-8 max-w-5xl mx-auto"
        >
            {/* Header */}
            <header className="text-center mb-8">
                <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">Investor Service Portal</h1>
                <p className="text-gray-400 mt-2 text-base font-medium">Submit service requests securely — powered by AI triage.</p>
            </header>

            {/* Step Indicator */}
            <StepIndicator current={step} />

            {/* Status Banner (shown after submit attempt) */}
            <AnimatePresence>
                {status.message && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
                            status.type === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                                : 'bg-red-500/10 border-red-500/40 text-red-400'
                        }`}
                    >
                        {status.type === 'success'
                            ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                            : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                        <div>
                            <p className="font-extrabold text-xs uppercase tracking-widest text-white mb-0.5">
                                {status.type === 'success' ? 'Request Submitted' : 'Submission Error'}
                            </p>
                            <p className="text-sm font-medium">{status.message}</p>
                        </div>
                        <button onClick={() => setStatus({ type: '', message: '' })}
                            className="ml-auto text-gray-500 hover:text-white transition-colors shrink-0">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence mode="wait" custom={goingBack}>

                {/* ── STEP 1: Service Type Selection ── */}
                {step === 1 && (
                    <motion.div key="step1" variants={variants}
                        initial="initial" animate="animate" exit="exit">

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                            {SERVICE_TYPE_LIST.map(config => (
                                <ServiceCard
                                    key={config.key}
                                    config={config}
                                    isSelected={selectedType === config.key}
                                    onClick={handleSelectType}
                                />
                            ))}
                        </div>

                        {/* Continue CTA */}
                        <div className="flex justify-end">
                            <motion.button
                                id="step1-continue-btn"
                                type="button"
                                onClick={handleContinueToForm}
                                disabled={!selectedType}
                                whileHover={selectedType ? { scale: 1.02 } : {}}
                                whileTap={selectedType ? { scale: 0.98 } : {}}
                                className={`flex items-center gap-2 px-8 py-4 rounded-xl font-extrabold text-sm uppercase tracking-widest transition-all ${
                                    selectedType
                                        ? 'bg-kfintech-primary text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]'
                                        : 'bg-kfintech-card border border-kfintech-border text-gray-600 cursor-not-allowed'
                                }`}
                            >
                                {selectedType ? (
                                    <>Continue to Form <ArrowRight className="w-4 h-4" /></>
                                ) : (
                                    'Select a Service Type Above'
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* ── STEP 2: Service-Specific Form ── */}
                {step === 2 && currentConfig && (
                    <motion.div key="step2" variants={variants}
                        initial="initial" animate="animate" exit="exit">

                        {/* Selected service header */}
                        <div className={`flex items-center gap-4 p-5 rounded-2xl border-2 mb-6 ${currentConfig.colorClasses.card} ${currentConfig.colorClasses.activeBorder}`}>
                            {React.createElement(currentConfig.icon, { className: `w-6 h-6 ${currentConfig.colorClasses.icon}` })}
                            <div>
                                <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Selected Service</p>
                                <p className="text-white font-extrabold text-lg">{currentConfig.label}</p>
                            </div>
                            <div className="ml-auto flex items-center gap-2 text-xs text-gray-500 font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                {currentConfig.expectedSLA}
                            </div>
                            <button type="button" onClick={() => goTo(1)}
                                className="text-gray-500 hover:text-white transition-colors" title="Change service type">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Form — onSubmit goes to review (native validation fires) */}
                        <form ref={formRef} id="service-form" onSubmit={handleGoToReview}
                            className="glass-panel rounded-2xl border border-kfintech-border p-8 space-y-7">

                            {/* Investor Identity */}
                            <div>
                                <h3 className="text-xs font-extrabold text-kfintech-primary uppercase tracking-widest mb-4">
                                    Investor Identity
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Investor Name</label>
                                        <select name="investorName" value={formData.investorName}
                                            onChange={handleChange}
                                            className={`${inputClass} cursor-pointer`}>
                                            <option value="Amit">Amit (Perfect OCR Match)</option>
                                            <option value="John Doe">John Doe (Failure Test)</option>
                                            <option value="Jane Smith">Jane Smith (Failure Test)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Account Number</label>
                                        <select name="accountNumber" value={formData.accountNumber}
                                            onChange={handleChange}
                                            className={`${inputClass} cursor-pointer`}>
                                            <option value="9876543210">9876543210 (Perfect OCR Match)</option>
                                            <option value="1111111111">1111111111 (Failure Test)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Request Title */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">
                                    Request Title <span className="text-red-400">*</span>
                                </label>
                                <input type="text" name="title" required value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Brief one-line summary of your request"
                                    className={inputClass} />
                            </div>

                            {/* Dynamic Type-Specific Fields */}
                            {currentConfig.requiredFields.length > 0 && (
                                <div>
                                    <h3 className={`text-xs font-extrabold uppercase tracking-widest mb-4 ${currentConfig.colorClasses.icon}`}>
                                        {currentConfig.label} — Request Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {currentConfig.requiredFields.map(field => (
                                            <div key={field.name}>
                                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">
                                                    {field.label}
                                                    {field.required && <span className="text-red-400 ml-1">*</span>}
                                                </label>
                                                <MetadataField
                                                    field={field}
                                                    value={serviceMetadata[field.name] || ''}
                                                    onChange={handleMetadataChange}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">
                                    {selectedType === 'COMPLAINT' ? 'Detailed Description' : 'Additional Notes'}
                                    {selectedType === 'COMPLAINT' && <span className="text-red-400 ml-1">*</span>}
                                </label>
                                <textarea name="description" rows={4}
                                    required={selectedType === 'COMPLAINT'}
                                    value={formData.description} onChange={handleChange}
                                    placeholder={
                                        selectedType === 'COMPLAINT'
                                            ? 'Describe your issue in detail. Our AI engine will analyze sentiment and auto-prioritize...'
                                            : 'Any additional context for the processing team (optional).'
                                    }
                                    className={`${inputClass} resize-none leading-relaxed`} />
                            </div>

                            {/* Document Upload */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">
                                    Supporting Document
                                    <span className={`ml-2 text-[10px] px-2 py-0.5 rounded border font-black ${
                                        currentConfig.requiredDocuments.length > 0
                                            ? 'text-red-400 bg-red-500/10 border-red-500/30'
                                            : 'text-gray-600 bg-kfintech-bg border-kfintech-border'
                                    }`}>
                                        {currentConfig.requiredDocuments.length > 0 ? 'REQUIRED' : 'OPTIONAL'}
                                    </span>
                                </label>

                                {/* Required document hints */}
                                {currentConfig.requiredDocuments.length > 0 && (
                                    <div className="mb-3 flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                                        <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                        <div className="space-y-0.5">
                                            {currentConfig.requiredDocuments.map(doc => (
                                                <p key={doc} className="text-xs text-amber-400/80 font-medium">{doc}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <motion.div
                                    whileHover={{ scale: 1.005 }}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]); e.dataTransfer.clearData(); }}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-kfintech-border rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-kfintech-bg/50 hover:bg-kfintech-bg hover:border-kfintech-primary/40 transition-all group"
                                >
                                    <input type="file" className="hidden" ref={fileInputRef}
                                        accept="image/jpeg,image/png,application/pdf"
                                        required={currentConfig.requiredDocuments.length > 0 && !file}
                                        onChange={e => setFile(e.target.files[0])} />

                                    {file ? (
                                        <div className="text-center">
                                            <FileText className="w-10 h-10 text-kfintech-accent mx-auto mb-3 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                            <p className="text-kfintech-accent font-extrabold">{file.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">Ready for OCR processing</p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <UploadCloud className="w-10 h-10 text-gray-600 mx-auto mb-3 group-hover:text-kfintech-primary transition-colors" />
                                            <p className="text-gray-300 font-bold">Click to upload or drag and drop</p>
                                            <p className="text-xs text-gray-500 mt-1">JPEG, PNG, PDF — up to 5 MB</p>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        </form>

                        {/* Navigation */}
                        <div className="flex justify-between mt-6">
                            <motion.button type="button" onClick={() => goTo(1)}
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-kfintech-card border border-kfintech-border text-gray-300 hover:text-white hover:border-kfintech-border font-bold text-sm uppercase tracking-wider transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" /> Back
                            </motion.button>

                            <motion.button
                                id="step2-review-btn"
                                type="submit" form="service-form"
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-kfintech-primary text-white font-extrabold text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.35)] hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all"
                            >
                                Review Request <ArrowRight className="w-4 h-4" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* ── STEP 3: Review & Submit ── */}
                {step === 3 && currentConfig && (
                    <motion.div key="step3" variants={variants}
                        initial="initial" animate="animate" exit="exit">

                        <div className="glass-panel rounded-2xl border border-kfintech-border overflow-hidden">

                            {/* Review Header — compact service type banner */}
                            <div className={`flex items-center gap-4 px-8 py-5 border-b border-kfintech-border/50 ${currentConfig.colorClasses.card}`}>
                                {React.createElement(currentConfig.icon, {
                                    className: `w-7 h-7 ${currentConfig.colorClasses.icon} drop-shadow-[0_0_8px_currentColor]`
                                })}
                                <div>
                                    <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Service Request Review</p>
                                    <p className="text-white font-extrabold text-xl tracking-tight">{currentConfig.label}</p>
                                </div>
                                <div className="ml-auto flex flex-col items-end gap-1">
                                    <span className={`text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-lg border ${currentConfig.colorClasses.badge}`}>
                                        {currentConfig.key}
                                    </span>
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {currentConfig.expectedSLA}
                                    </span>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                {/* Investor Details */}
                                <div>
                                    <h4 className="text-xs font-extrabold text-kfintech-primary uppercase tracking-widest mb-3">
                                        Investor Details
                                    </h4>
                                    <div className="bg-kfintech-bg/60 rounded-xl border border-kfintech-border/60 px-5 divide-y divide-kfintech-border/30">
                                        <ReviewRow label="Investor Name"  value={formData.investorName} />
                                        <ReviewRow label="Account Number" value={formData.accountNumber} />
                                        <ReviewRow label="Request Title"  value={formData.title} />
                                    </div>
                                </div>

                                {/* Service-Specific Fields */}
                                {currentConfig.requiredFields.length > 0 && Object.keys(serviceMetadata).length > 0 && (
                                    <div>
                                        <h4 className={`text-xs font-extrabold uppercase tracking-widest mb-3 ${currentConfig.colorClasses.icon}`}>
                                            {currentConfig.label} — Request Details
                                        </h4>
                                        <div className="bg-kfintech-bg/60 rounded-xl border border-kfintech-border/60 px-5 divide-y divide-kfintech-border/30">
                                            {currentConfig.requiredFields.map(field => (
                                                <ReviewRow
                                                    key={field.name}
                                                    label={field.label}
                                                    value={serviceMetadata[field.name]}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                {formData.description && (
                                    <div>
                                        <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-2">
                                            {selectedType === 'COMPLAINT' ? 'Complaint Description' : 'Additional Notes'}
                                        </h4>
                                        <p className="text-gray-300 text-sm bg-kfintech-bg/60 p-4 rounded-xl border border-kfintech-border/60 leading-relaxed italic">
                                            "{formData.description}"
                                        </p>
                                    </div>
                                )}

                                {/* Attached Document */}
                                <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                                    file
                                        ? 'bg-emerald-500/5 border-emerald-500/30'
                                        : 'bg-kfintech-bg/40 border-kfintech-border/40'
                                }`}>
                                    {file
                                        ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                        : <AlertCircle className="w-5 h-5 text-gray-600 shrink-0" />
                                    }
                                    <div>
                                        <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">
                                            {currentConfig.requiredDocuments.length > 0 ? 'Required Document' : 'Supporting Document'}
                                        </p>
                                        <p className={`text-sm font-medium ${file ? 'text-emerald-400' : 'text-gray-600'}`}>
                                            {file ? file.name : 'No document attached'}
                                        </p>
                                    </div>
                                    {file && (
                                        <span className="ml-auto text-xs text-gray-500 font-medium">
                                            Will be processed by OCR engine
                                        </span>
                                    )}
                                </div>


                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex justify-between mt-6">
                            <motion.button type="button" onClick={() => goTo(2)}
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-kfintech-card border border-kfintech-border text-gray-300 hover:text-white font-bold text-sm uppercase tracking-wider transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" /> Edit Details
                            </motion.button>

                            <motion.button
                                id="step3-submit-btn"
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                                whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                                className={`flex items-center gap-2 px-10 py-3.5 rounded-xl font-extrabold text-sm uppercase tracking-widest transition-all ${
                                    isSubmitting
                                        ? 'bg-kfintech-border text-gray-500 cursor-wait'
                                        : 'bg-kfintech-primary text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:bg-blue-500 hover:shadow-[0_0_35px_rgba(59,130,246,0.7)]'
                                }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>Submit Request <Send className="w-4 h-4" /></>
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </motion.div>
    );
};

export default CreateTicketFlow;
