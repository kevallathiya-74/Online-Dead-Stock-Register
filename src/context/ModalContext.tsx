import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  // Asset modals
  isAddAssetModalOpen: boolean;
  isTransferAssetModalOpen: boolean;
  isBulkImportModalOpen: boolean;
  isLabelsModalOpen: boolean;
  
  // Modal actions
  openAddAssetModal: () => void;
  closeAddAssetModal: () => void;
  openTransferAssetModal: () => void;
  closeTransferAssetModal: () => void;
  openBulkImportModal: () => void;
  closeBulkImportModal: () => void;
  openLabelsModal: () => void;
  closeLabelsModal: () => void;
  
  // Selected asset for operations
  selectedAsset: any;
  setSelectedAsset: (asset: any) => void;
  
  // Global modal trigger for navigation
  triggerModalFromNavigation: (modalType: string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [isTransferAssetModalOpen, setIsTransferAssetModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [isLabelsModalOpen, setIsLabelsModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  const openAddAssetModal = () => setIsAddAssetModalOpen(true);
  const closeAddAssetModal = () => setIsAddAssetModalOpen(false);
  
  const openTransferAssetModal = () => setIsTransferAssetModalOpen(true);
  const closeTransferAssetModal = () => setIsTransferAssetModalOpen(false);
  
  const openBulkImportModal = () => setIsBulkImportModalOpen(true);
  const closeBulkImportModal = () => setIsBulkImportModalOpen(false);
  
  const openLabelsModal = () => setIsLabelsModalOpen(true);
  const closeLabelsModal = () => setIsLabelsModalOpen(false);

  const triggerModalFromNavigation = (modalType: string) => {
    switch (modalType) {
      case 'add-asset':
        openAddAssetModal();
        break;
      case 'transfers':
        openTransferAssetModal();
        break;
      case 'bulk-import':
        openBulkImportModal();
        break;
      case 'labels':
        openLabelsModal();
        break;
      default:
        console.warn(`Unknown modal type: ${modalType}`);
    }
  };

  const value: ModalContextType = {
    isAddAssetModalOpen,
    isTransferAssetModalOpen,
    isBulkImportModalOpen,
    isLabelsModalOpen,
    openAddAssetModal,
    closeAddAssetModal,
    openTransferAssetModal,
    closeTransferAssetModal,
    openBulkImportModal,
    closeBulkImportModal,
    openLabelsModal,
    closeLabelsModal,
    selectedAsset,
    setSelectedAsset,
    triggerModalFromNavigation,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};