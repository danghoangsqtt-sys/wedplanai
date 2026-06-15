import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../../../store/useStore';
import { InvitationData, SectionId } from '../../../types';
import { useEditorHistory } from '../../../hooks/useEditorHistory';
import InvitationPreview from '../InvitationPreview';
import EditorTopBar from './EditorTopBar';
import EditorLeftSidebar from './EditorLeftSidebar';
import EditorContextPanel from './EditorContextPanel';

const InvitationEditorPage: React.FC = () => {
    const { invitation, updateInvitation } = useStore();

    // Editor history (undo/redo via immer)
    const { data, push, undo, redo, canUndo, canRedo, reset } = useEditorHistory(invitation);

    // UI state
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState(false);

    // Sync store → history when cloud data loads externally
    const prevInvRef = useRef(invitation);
    useEffect(() => {
        if (invitation !== prevInvRef.current) {
            reset(invitation);
            prevInvRef.current = invitation;
        }
    }, [invitation, reset]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
            if (e.key === 'Escape') setSelectedSection(null);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [undo, redo]);

    // Debounce store sync: push to store + cloud after 500ms of inactivity
    const syncTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (syncTimeout.current) clearTimeout(syncTimeout.current);
        syncTimeout.current = setTimeout(() => {
            updateInvitation(data);
        }, 500);
        return () => { if (syncTimeout.current) clearTimeout(syncTimeout.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    const handleChange = useCallback((patch: Partial<InvitationData>) => {
        push(draft => { Object.assign(draft, patch); });
    }, [push]);

    const handleSectionClick = useCallback((id: SectionId) => {
        setSelectedSection(prev => prev === id ? null : id);
        setPreviewMode(false);
    }, []);

    const handleSave = () => {
        updateInvitation(data);
    };

    const handleBack = () => {
        updateInvitation(data);
        // Dispatch a custom event that App.tsx can listen for, or just rely on the user clicking the nav
        window.dispatchEvent(new CustomEvent('invitation-editor-back'));
    };

    // Build editorConfig for InvitationPreview
    const editorConfig = previewMode ? undefined : {
        selectedSection: selectedSection ?? undefined,
        onSectionClick: handleSectionClick,
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-gray-50">
            {/* Top bar */}
            <EditorTopBar
                data={data}
                canUndo={canUndo}
                canRedo={canRedo}
                previewMode={previewMode}
                onUndo={undo}
                onRedo={redo}
                onTogglePreview={() => setPreviewMode(v => !v)}
                onSave={handleSave}
                onBack={handleBack}
                onChange={handleChange}
            />

            {/* Editor body */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* Left sidebar (hidden in preview mode) */}
                {!previewMode && (
                    <EditorLeftSidebar
                        data={data}
                        selectedSection={selectedSection}
                        onSectionClick={handleSectionClick}
                        onChange={handleChange}
                    />
                )}

                {/* Canvas area */}
                <div
                    className="flex-1 overflow-y-auto overflow-x-hidden flex items-start justify-center py-6 px-4"
                    onClick={() => setSelectedSection(null)}
                >
                    {/* Phone frame */}
                    <div
                        className={`relative mx-auto bg-white overflow-hidden transition-all duration-300 ${
                            previewMode
                                ? 'w-full max-w-sm rounded-2xl shadow-2xl ring-4 ring-black/5'
                                : 'w-[375px] rounded-[2.5rem] shadow-2xl ring-[10px] ring-gray-800'
                        }`}
                        style={{ minHeight: previewMode ? '100vh' : '780px' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Phone notch (editor mode only) */}
                        {!previewMode && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5 bg-gray-800 rounded-b-2xl z-10" />
                        )}

                        {/* The invitation */}
                        <div className={previewMode ? '' : 'mt-5 overflow-hidden'} style={{ maxHeight: previewMode ? 'none' : 'calc(780px - 20px)', overflow: previewMode ? 'visible' : 'hidden auto' }}>
                            <InvitationPreview
                                data={data}
                                editorConfig={editorConfig}
                            />
                        </div>
                    </div>

                    {/* Canvas click hint */}
                    {!previewMode && !selectedSection && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800/90 text-white text-xs px-4 py-2 rounded-full shadow-lg backdrop-blur-sm pointer-events-none">
                            Click vào bất kỳ phần nào của thiệp để chỉnh sửa
                        </div>
                    )}
                </div>

                {/* Right context panel */}
                <EditorContextPanel
                    selectedSection={selectedSection}
                    data={data}
                    onClose={() => setSelectedSection(null)}
                    onChange={handleChange}
                />
            </div>
        </div>
    );
};

export default InvitationEditorPage;
