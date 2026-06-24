import {
    MessageSquare,
    Landmark,
    Users,
    MapPin,
    Mail,
    Phone,
    CreditCard
} from 'lucide-react';

export const SERVICE_TYPES = {
    COMPLAINT: {
        key: 'COMPLAINT',
        label: 'Complaint',
        description: 'Lodge a formal complaint about your mutual fund or service experience.',
        icon: MessageSquare,
        colorClasses: {
            badge: 'bg-red-500/15 text-red-400 border-red-500/30',
            card: 'border-red-500/40 bg-red-500/5',
            icon: 'text-red-400',
            activeBorder: 'border-red-400'
        },
        requiredFields: [],
        requiredDocuments: [],      
        expectedSLA: '7 Business Days',
        defaultPriority: 'NORMAL'
    },

    BANK_UPDATE: {
        key: 'BANK_UPDATE',
        label: 'Bank Account Update',
        description: 'Update your registered bank account number, IFSC code, or account type.',
        icon: Landmark,
        colorClasses: {
            badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
            card: 'border-blue-500/40 bg-blue-500/5',
            icon: 'text-blue-400',
            activeBorder: 'border-blue-400'
        },
        requiredFields: [
            { name: 'newBankName',      label: 'New Bank Name',      type: 'text',   placeholder: 'e.g. HDFC Bank',       required: true  },
            { name: 'newAccountNumber', label: 'New Account Number', type: 'text',   placeholder: 'Enter account number', required: true  },
            { name: 'ifscCode',         label: 'IFSC Code',          type: 'text',   placeholder: 'e.g. HDFC0001234',     required: true  },
            { name: 'accountType',      label: 'Account Type',       type: 'select', required: true,
              options: ['Savings', 'Current', 'NRE', 'NRO'] }
        ],
        requiredDocuments: [
            'Cancelled Cheque (clear bank name & account number)',
            'Bank Passbook — First Page'
        ],
        expectedSLA: '10 Business Days',
        defaultPriority: 'NORMAL'
    },

    NOMINEE_UPDATE: {
        key: 'NOMINEE_UPDATE',
        label: 'Nominee Update',
        description: 'Add or change the nominee registered against your mutual fund folio.',
        icon: Users,
        colorClasses: {
            badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
            card: 'border-purple-500/40 bg-purple-500/5',
            icon: 'text-purple-400',
            activeBorder: 'border-purple-400'
        },
        requiredFields: [
            { name: 'nomineeName',         label: 'Nominee Full Name',     type: 'text',   placeholder: 'As per government ID', required: true  },
            { name: 'nomineeRelationship', label: 'Relationship',          type: 'select', required: true,
              options: ['Spouse', 'Child', 'Parent', 'Sibling', 'Other'] },
            { name: 'nomineeDob',          label: 'Nominee Date of Birth', type: 'text',   placeholder: 'DD/MM/YYYY',           required: true  },
            { name: 'nomineePan',          label: 'Nominee PAN Number',    type: 'text',   placeholder: 'ABCDE1234F',           required: false }
        ],
        requiredDocuments: [
            'Nominee ID Proof (Aadhaar / PAN Card)',
            'Passport-size Photograph of Nominee'
        ],
        expectedSLA: '7 Business Days',
        defaultPriority: 'NORMAL'
    },

    ADDRESS_UPDATE: {
        key: 'ADDRESS_UPDATE',
        label: 'Address Update',
        description: 'Request a change to your registered correspondence or permanent address.',
        icon: MapPin,
        colorClasses: {
            badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
            card: 'border-amber-500/40 bg-amber-500/5',
            icon: 'text-amber-400',
            activeBorder: 'border-amber-400'
        },
        requiredFields: [
            { name: 'addressLine1', label: 'Address Line 1', type: 'text', placeholder: 'House / Flat / Block No.',  required: true  },
            { name: 'addressLine2', label: 'Address Line 2', type: 'text', placeholder: 'Street / Area / Locality', required: false },
            { name: 'city',         label: 'City',           type: 'text', placeholder: 'e.g. Mumbai',              required: true  },
            { name: 'state',        label: 'State',          type: 'text', placeholder: 'e.g. Maharashtra',         required: true  },
            { name: 'pinCode',      label: 'PIN Code',       type: 'text', placeholder: '6-digit PIN code',         required: true  }
        ],
        requiredDocuments: [
            'Address Proof (Aadhaar / Utility Bill / Rental Agreement)',
            'Self-declaration Letter (if Aadhaar address differs)'
        ],
        expectedSLA: '7 Business Days',
        defaultPriority: 'NORMAL'
    },

    EMAIL_UPDATE: {
        key: 'EMAIL_UPDATE',
        label: 'Email ID Update',
        description: 'Update the primary email address linked to your investor account.',
        icon: Mail,
        colorClasses: {
            badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
            card: 'border-cyan-500/40 bg-cyan-500/5',
            icon: 'text-cyan-400',
            activeBorder: 'border-cyan-400'
        },
        requiredFields: [
            { name: 'newEmail',     label: 'New Email Address',     type: 'text', placeholder: 'new@email.com',    required: true },
            { name: 'confirmEmail', label: 'Confirm Email Address', type: 'text', placeholder: 'Retype new email', required: true }
        ],
        requiredDocuments: [],       
        expectedSLA: '2 Business Days',
        defaultPriority: 'NORMAL'
    },

    MOBILE_UPDATE: {
        key: 'MOBILE_UPDATE',
        label: 'Mobile Number Update',
        description: 'Change the mobile number used for OTP authentication and alerts.',
        icon: Phone,
        colorClasses: {
            badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
            card: 'border-emerald-500/40 bg-emerald-500/5',
            icon: 'text-emerald-400',
            activeBorder: 'border-emerald-400'
        },
        requiredFields: [
            { name: 'countryCode',    label: 'Country Code',     type: 'select', required: true,
              options: ['+91 (India)', '+1 (USA)', '+44 (UK)', '+971 (UAE)', '+65 (Singapore)'] },
            { name: 'newMobileNumber', label: 'New Mobile Number', type: 'tel', placeholder: '10-digit number', required: true }
        ],
        requiredDocuments: [],
        expectedSLA: '2 Business Days',
        defaultPriority: 'NORMAL'
    },

    KYC_UPDATE: {
        key: 'KYC_UPDATE',
        label: 'KYC Update',
        description: 'Submit updated Know Your Customer documents for compliance verification.',
        icon: CreditCard,
        colorClasses: {
            badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
            card: 'border-orange-500/40 bg-orange-500/5',
            icon: 'text-orange-400',
            activeBorder: 'border-orange-400'
        },
        requiredFields: [
            { name: 'kycDocumentType', label: 'KYC Document Type', type: 'select', required: true,
              options: ['PAN Card', 'Aadhaar Card', 'Passport', 'Voter ID', 'Driving Licence'] },
            { name: 'documentNumber',  label: 'Document Number',   type: 'text',   placeholder: 'Enter document number', required: true }
        ],
        requiredDocuments: [
            'KYC Document — Clear Front & Back Scan',
            'Passport-size Photograph (white background)'
        ],
        expectedSLA: '15 Business Days',
        defaultPriority: 'NORMAL'
    }
};

export const SERVICE_TYPE_LIST = Object.values(SERVICE_TYPES);
export const getServiceType = (key) => SERVICE_TYPES[key] || SERVICE_TYPES.COMPLAINT;
