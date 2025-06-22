import React from 'react';
import Icons from './Icons';

const SaveButton = ({ hasModifications, onSaveClick }) => {
  if (!hasModifications) return null;

  return (
    <button className="save-btn" onClick={onSaveClick}>
      {Icons.save} Save Changes
    </button>
  );
};

export default SaveButton; 