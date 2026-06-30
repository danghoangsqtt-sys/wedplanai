import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../../../store/useStore';
import { InvitationData, SectionId } from '../../../types';
import { useEditorHistory } from '../../../hooks/useEditorHistory';
import InvitationPreview from '../InvitationPreview';
import EditorTopBar from './EditorTopBar';
import EditorLeftSidebar from './EditorLeftSidebar';
import EditorContextPanel from './EditorContextPanel';
import TemplateGalleryModal from '../TemplateGalleryModal';

const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Cinzel:wght@400;600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,600;1,400&family=Noto+Serif:ital,wght@0,400;0,600;0,700;1,400&family=Spectral:ital,wght@0,400;0,600;1,400&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=Be+Vietnam+Pro:wght@400;500;600&family=DM+Sans:wght@400;500;600&family=Fahkwang:wght@400;500;600&family=Nunito:wght@400;500;600&family=Quicksand:wght@400;500;600&family=Josefin+Sans:wght@400;500;600&family=Mulish:wght@400;500;600&display=swap';

const InvitationEditorPage: React.FC = () => {
    const { invitation, updateInvitation, addNotification } = useStore();
    const { data, push, undo, redo, canUndo, canRedo, reset } = useEditorHistory(invitation);

    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | false>(false);
    const [showTemplateGallery, setShowTemplateGallery] = useState(false);

    // Sync store → history only when invitation changes from an EXTERNAL source
    // (e.g., cloud load). We track what the editor last wrote so we don't clear
    // undo history on our own debounced saves coming back through the store.
    const prevInvRef = useRef(invitation);
    const editorLastWriteRef = useRef<InvitationData | null>(null);
    useEffect(() => {
        if (invitation !== prevInvRef.current) {
            // Only reset if this change did NOT originate from the editor itself
            if (invitation !== editorLastWriteRef.current) {
                reset(invitation);
            }
            prevInvRef.current = invitation;
        }
    }, [invitation, reset]);

    // Load Google Fonts
    useEffect(() => {
        if (!document.querySelector(`link[href*="fonts.googleapis.com"][data-editor]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = GOOGLE_FONTS_URL;
            link.dataset.editor = 'true';
            document.head.appendChild(link);
        }
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const el = e.target as HTMLElement;
            if (el.isContentEditable || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return;
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
            if (e.key === 'Escape') setSelectedSection(null);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [undo, redo]);

    // Debounce store sync — flush on unmount so pending changes aren't lost.
    // Track the last value written so the external-change detector above can
    // distinguish editor writes from true external cloud loads.
    const syncTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestData = useRef(data);
    latestData.current = data;
    useEffect(() => {
        if (syncTimeout.current) clearTimeout(syncTimeout.current);
        syncTimeout.current = setTimeout(() => {
            editorLastWriteRef.current = latestData.current;
            updateInvitation(latestData.current);
        }, 500);
        return () => { if (syncTimeout.current) clearTimeout(syncTimeout.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);
    useEffect(() => {
        return () => { updateInvitation(latestData.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = useCallback((patch: Partial<InvitationData>) => {
        push(draft => { Object.assign(draft, patch); });
    }, [push]);

    const handleSectionClick = useCallback((id: string) => {
        setSelectedSection(prev => prev === id ? null : id);
    }, []);

    const handleFieldEdit = useCallback((field: string, value: string) => {
        push(draft => {
            const keys = field.replace(/\[(\d+)\]/g, '.$1').split('.');
            let curr: any = draft;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!curr[keys[i]]) curr[keys[i]] = isNaN(Number(keys[i+1])) ? {} : [];
                curr = curr[keys[i]];
            }
            curr[keys[keys.length - 1]] = value;
        });
    }, [push]);

    const handleSave = () => {
        updateInvitation(data);
        addNotification('SUCCESS', 'Đã lưu thiết kế thiệp thành công');
    };

    const handleBack = () => {
        updateInvitation(data);
        window.dispatchEvent(new CustomEvent('invitation-editor-back'));
    };

    const handleReset = () => {
        if (confirm('Đặt lại toàn bộ thiệp về mặc định?')) {
            reset(invitation);
        }
    };

    const editorConfig = previewMode ? undefined : {
        selectedSection: selectedSection ?? undefined,
        onSectionClick: handleSectionClick,
        onFieldEdit: handleFieldEdit,
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-gray-100">
            <EditorTopBar
                data={data}
                canUndo={canUndo}
                canRedo={canRedo}
                previewMode={previewMode}
                selectedSection={selectedSection}
                onUndo={undo}
                onRedo={redo}
                onSetPreview={setPreviewMode}
                onSave={handleSave}
                onBack={handleBack}
                onReset={handleReset}
                onShowTemplates={() => setShowTemplateGallery(true)}
                onChange={handleChange}
            />

            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* Left Sidebar: section reorder, visibility, style picker */}
                <EditorLeftSidebar
                    data={data}
                    selectedSection={selectedSection}
                    onSectionClick={handleSectionClick}
                    onChange={handleChange}
                />

                {/* Canvas area */}
                <div
                    className="flex-1 overflow-y-auto overflow-x-hidden"
                    onClick={() => setSelectedSection(null)}
                >
                    <div
                        className={`mx-auto transition-all duration-300 ${
                            previewMode === 'mobile'
                                ? 'max-w-[375px] my-6 rounded-3xl shadow-2xl ring-8 ring-gray-800 overflow-hidden'
                                : 'w-full max-w-[1024px] min-h-full bg-white shadow-xl'
                        }`}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Mobile notch */}
                        {previewMode === 'mobile' && (
                            <div className="bg-gray-800 h-6 flex justify-center">
                                <div className="w-24 h-4 mt-1 bg-gray-900 rounded-b-xl" />
                            </div>
                        )}
                        <InvitationPreview
                            data={data}
                            editorConfig={editorConfig}
                        />
                    </div>

                    {/* Bottom hint */}
                    {!previewMode && !selectedSection && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800/90 text-white text-xs px-4 py-2 rounded-full shadow-lg backdrop-blur-sm pointer-events-none z-50">
                            Click vào bất kỳ phần nào của thiệp để chỉnh sửa — click vào chữ để sửa trực tiếp
                        </div>
                    )}
                </div>

                {/* Right Context Panel: section-specific flyout (slides in on section select) */}
                <EditorContextPanel
                    selectedSection={selectedSection}
                    data={data}
                    onClose={() => setSelectedSection(null)}
                    onChange={handleChange}
                />

            </div>

            <TemplateGalleryModal
                isOpen={showTemplateGallery}
                onClose={() => setShowTemplateGallery(false)}
                currentTemplateId={data.templateId || 'traditional'}
                onSelectTemplate={(id) => handleChange({ templateId: id })}
                currentData={data}
            />
        </div>
    );
};

export default InvitationEditorPage;
