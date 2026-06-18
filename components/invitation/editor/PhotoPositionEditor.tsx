import React, { useRef, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';

export const PhotoPositionEditor: React.FC<{
    src: string;
    config: { scale: number; x: number; y: number };
    onChange: (c: { scale: number; x: number; y: number }) => void;
    onRemove?: () => void;
}> = ({ src, config, onChange, onRemove }) => {
    const isDragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const configRef = useRef(config);
    configRef.current = config;
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useEffect(() => {
        const move = (cx: number, cy: number) => {
            if (!isDragging.current) return;
            const dx = cx - lastPos.current.x;
            const dy = cy - lastPos.current.y;
            lastPos.current = { x: cx, y: cy };
            const c = configRef.current;
            onChangeRef.current({
                ...c,
                x: Math.max(0, Math.min(100, c.x - dx * 0.5)),
                y: Math.max(0, Math.min(100, c.y - dy * 0.5)),
            });
        };
        const onMM = (e: MouseEvent) => move(e.clientX, e.clientY);
        const onTM = (e: TouchEvent) => { if (isDragging.current) e.preventDefault(); move(e.touches[0].clientX, e.touches[0].clientY); };
        const onEnd = () => { isDragging.current = false; };
        window.addEventListener('mousemove', onMM);
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchmove', onTM, { passive: false });
        window.addEventListener('touchend', onEnd);
        return () => {
            window.removeEventListener('mousemove', onMM);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchmove', onTM);
            window.removeEventListener('touchend', onEnd);
        };
    }, []);

    return (
        <div className="space-y-2">
            <div
                className="relative w-full h-36 rounded-lg overflow-hidden border-2 border-rose-200 cursor-grab active:cursor-grabbing select-none group"
                onMouseDown={e => { isDragging.current = true; lastPos.current = { x: e.clientX, y: e.clientY }; e.preventDefault(); }}
                onTouchStart={e => { isDragging.current = true; lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
            >
                <img
                    src={src} alt="Vị trí ảnh"
                    className="w-full h-full object-cover pointer-events-none"
                    style={{ objectPosition: `${config.x}% ${config.y}%`, transform: config.scale !== 1 ? `scale(${config.scale})` : undefined, transformOrigin: `${config.x}% ${config.y}%` }}
                    draggable={false}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-8 border-2 border-white/50 rounded-full" />
                    <div className="absolute w-px h-full bg-white/20" />
                    <div className="absolute w-full h-px bg-white/20" />
                </div>
                {onRemove && (
                    <button onClick={e => { e.stopPropagation(); onRemove(); }}
                        className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                    ><X size={12} /></button>
                )}
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">🔍</span>
                <input type="range" min="1" max="2" step="0.05" value={config.scale}
                    onChange={e => onChange({ ...config, scale: parseFloat(e.target.value) })}
                    className="flex-1 h-1 accent-rose-500 cursor-pointer"
                />
                <span className="text-[10px] text-gray-500 font-mono w-8 text-right">{Math.round(config.scale * 100)}%</span>
            </div>
            {(config.x !== 50 || config.y !== 50 || config.scale !== 1) && (
                <button onClick={() => onChange({ scale: 1, x: 50, y: 50 })}
                    className="text-[11px] text-gray-400 hover:text-rose-500 flex items-center gap-1"
                ><RefreshCw size={10} /> Reset vị trí</button>
            )}
        </div>
    );
};
