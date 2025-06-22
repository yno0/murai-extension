import React from 'react';

const ConfirmationModal = ({ showModal, onConfirm, onCancel }) => {
  if (!showModal) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Save Changes</div>
        <div className="modal-message">
          Are you sure you want to save your changes? This will update your MURAi extension settings.
        </div>
        <div className="modal-buttons">
          <button className="modal-btn confirm" onClick={onConfirm}>
            Save
          </button>
          <button className="modal-btn cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal; 