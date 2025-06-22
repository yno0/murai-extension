import React from 'react';
import Icons from './Icons';

const WhitelistSection = ({
  whitelistTerms,
  whitelistWebsites,
  newTerm,
  newWebsite,
  editingTerm,
  editingWebsite,
  onNewTermChange,
  onNewWebsiteChange,
  onAddTerm,
  onAddWebsite,
  onRemoveTerm,
  onRemoveWebsite,
  onStartEditTerm,
  onStartEditWebsite,
  onSaveEditTerm,
  onSaveEditWebsite,
  onCancelEdit
}) => {
  return (
    <div className="whitelist-section">
      <p className="section-title">{Icons.lock} Whitelist Management</p>
      
      {/* Terms Whitelist */}
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ fontSize: '12px', marginBottom: '8px', color: '#555', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {Icons.terms} Terms
        </h4>
        <div className="whitelist-input-group">
          <input
            type="text"
            className="whitelist-input"
            placeholder="Enter term to whitelist"
            value={newTerm}
            onChange={(e) => onNewTermChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onAddTerm()}
          />
          <button className="add-btn" onClick={onAddTerm}>
            {Icons.add} Add
          </button>
        </div>
        {whitelistTerms.map((term, index) => (
          <div key={index} className="whitelist-item">
            {editingTerm && editingTerm.index === index ? (
              <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                <input
                  type="text"
                  className="whitelist-input"
                  value={editingTerm.value}
                  onChange={(e) => onStartEditTerm({ ...editingTerm, value: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && onSaveEditTerm()}
                />
                <button className="edit-btn" onClick={onSaveEditTerm}>{Icons.save}</button>
                <button className="remove-btn" onClick={onCancelEdit}>{Icons.cancel}</button>
              </div>
            ) : (
              <>
                <span className="whitelist-item-text">{term}</span>
                <div className="whitelist-item-actions">
                  <button className="edit-btn" onClick={() => onStartEditTerm({ index, value: term })}>{Icons.edit}</button>
                  <button className="remove-btn" onClick={() => onRemoveTerm(index)}>{Icons.remove}</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Websites Whitelist */}
      <div>
        <h4 style={{ fontSize: '12px', marginBottom: '8px', color: '#555', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {Icons.website} Websites
        </h4>
        <div className="whitelist-input-group">
          <input
            type="text"
            className="whitelist-input"
            placeholder="Enter website URL"
            value={newWebsite}
            onChange={(e) => onNewWebsiteChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onAddWebsite()}
          />
          <button className="add-btn" onClick={onAddWebsite}>
            {Icons.add} Add
          </button>
        </div>
        {whitelistWebsites.map((website, index) => (
          <div key={index} className="whitelist-item">
            {editingWebsite && editingWebsite.index === index ? (
              <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                <input
                  type="text"
                  className="whitelist-input"
                  value={editingWebsite.value}
                  onChange={(e) => onStartEditWebsite({ ...editingWebsite, value: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && onSaveEditWebsite()}
                />
                <button className="edit-btn" onClick={onSaveEditWebsite}>{Icons.save}</button>
                <button className="remove-btn" onClick={onCancelEdit}>{Icons.cancel}</button>
              </div>
            ) : (
              <>
                <span className="whitelist-item-text">{website}</span>
                <div className="whitelist-item-actions">
                  <button className="edit-btn" onClick={() => onStartEditWebsite({ index, value: website })}>{Icons.edit}</button>
                  <button className="remove-btn" onClick={() => onRemoveWebsite(index)}>{Icons.remove}</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WhitelistSection; 