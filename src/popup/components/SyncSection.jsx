import React from 'react';

const SyncSection = ({ 
  lastSyncTime, 
  isSyncing, 
  syncStatus, 
  onSyncClick,
  userEmail 
}) => {
  const formatSyncTime = (time) => {
    if (!time) return 'Never';
    const now = new Date();
    const diff = now - time;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'Synced': return '#29CC99';
      case 'Syncing...': return '#3b82f6';
      case 'Sync failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'Synced': return '✅';
      case 'Syncing...': return '🔄';
      case 'Sync failed': return '❌';
      default: return '⚪';
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf9 0%, #ecfdf5 100%)',
      border: '1px solid rgba(41, 204, 153, 0.2)',
      borderRadius: '12px',
      padding: '16px',
      margin: '16px 0'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: '600',
          color: '#064e3b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {getSyncIcon()} Mobile App Sync
        </h3>
        <button
          onClick={onSyncClick}
          disabled={isSyncing}
          style={{
            background: isSyncing ? '#9ca3af' : 'linear-gradient(135deg, #29CC99 0%, #10b981 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: isSyncing ? 'none' : '0 2px 8px rgba(41, 204, 153, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!isSyncing) {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(41, 204, 153, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSyncing) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 8px rgba(41, 204, 153, 0.3)';
            }
          }}
        >
          {isSyncing ? (
            <>
              <span style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                border: '2px solid #ffffff',
                borderRadius: '50%',
                borderTopColor: 'transparent',
                animation: 'spin 1s linear infinite'
              }}></span>
              Syncing...
            </>
          ) : (
            <>
              🔄 Sync Now
            </>
          )}
        </button>
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px'
      }}>
        <div>
          <div style={{ color: '#047857', marginBottom: '4px', fontWeight: '500' }}>
            Account: {userEmail || 'Not available'}
          </div>
          <div style={{ color: '#6b7280' }}>
            Last sync: {formatSyncTime(lastSyncTime)}
          </div>
        </div>
        <div style={{
          color: getSyncStatusColor(),
          fontWeight: '600',
          fontSize: '11px',
          padding: '4px 8px',
          background: `${getSyncStatusColor()}15`,
          borderRadius: '6px',
          border: `1px solid ${getSyncStatusColor()}30`
        }}>
          {syncStatus}
        </div>
      </div>

      {/* Add CSS animation for spinner */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default SyncSection;
