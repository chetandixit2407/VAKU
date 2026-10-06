import React from 'react';
import type { Candidate, UserRole } from '../types/index.ts';
import { SecureDocumentViewerModal } from './SecureDocumentViewerModal.tsx';

interface ResumeDocumentModalProps {
  candidate: Candidate;
  currentRole: UserRole;
  onClose: () => void;
}

export const ResumeDocumentModal: React.FC<ResumeDocumentModalProps> = ({
  candidate,
  currentRole,
  onClose,
}) => {
  return (
    <SecureDocumentViewerModal
      candidate={candidate}
      currentRole={currentRole}
      documentType="RESUME"
      onClose={onClose}
    />
  );
};

