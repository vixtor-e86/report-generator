'use client';

const Icons = {
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
};

export default function EditTemplateModal({ chapter, isOpen, onClose, onSave }) {
  if (!isOpen || !chapter) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          zIndex: 1000,
          maxWidth: '700px',
          width: 'calc(100% - 32px)',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            borderBottom: '1px solid #e5e7eb'
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>
              Edit Chapter {chapter.chapter}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
              {chapter.title}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.color = '#111827';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <Icons.X />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {/* Chapter Title */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              Chapter Title
            </label>
            <input
              type="text"
              defaultValue={chapter.title}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Sections */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
              Sections
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {chapter.sections.map((section, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#9ca3af',
                    minWidth: '32px'
                  }}>
                    {chapter.chapter}.{idx + 1}
                  </span>
                  <input
                    type="text"
                    defaultValue={section}
                    placeholder="Section title"
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  {chapter.sections.length > 1 && (
                    <button
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        background: 'white',
                        color: '#9ca3af',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        fontSize: '18px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fef2f2';
                        e.currentTarget.style.color = '#dc2626';
                        e.currentTarget.style.borderColor = '#fecaca';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.color = '#9ca3af';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}
                    >
                      −
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              style={{
                marginTop: '12px',
                padding: '10px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: 'white',
                color: '#3b82f6',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#eff6ff';
                e.currentTarget.style.borderColor = '#93c5fd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              + Add Section
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            background: '#f9fafb',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              background: 'white',
              color: '#111827',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave();
              onClose();
            }}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '8px',
              background: '#111827',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1f2937';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#111827';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}
