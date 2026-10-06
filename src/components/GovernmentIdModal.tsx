import React from 'react';
import type { Candidate, UserRole } from '../types/index.ts';
import { SecureDocumentViewerModal } from './SecureDocumentViewerModal.tsx';

interface GovernmentIdModalProps {
  candidate: Candidate;
  currentRole: UserRole;
  onClose: () => void;
}

export const GovernmentIdModal: React.FC<GovernmentIdModalProps> = ({
  candidate,
  currentRole,
  onClose,
}) => {
  return (
    <SecureDocumentViewerModal
      candidate={candidate}
      currentRole={currentRole}
      documentType="GOVERNMENT_ID"
      onClose={onClose}
    />
  );
};

