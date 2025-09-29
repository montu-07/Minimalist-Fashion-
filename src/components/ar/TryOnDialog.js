import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Slider,
  Stack,
  Typography,
  Alert,
} from '@mui/material';

// Simple AR-like try-on experience using camera feed and a draggable/scalable/rotatable overlay image.
// This is a web-based approximation; for production-grade AR consider WebXR or native SDKs.

export default function TryOnDialog({ open, onClose, imageSrc, title = 'Try in AR' }) {
  const videoRef = React.useRef(null);
  const [error, setError] = React.useState('');
  const [stream, setStream] = React.useState(null);

  // Transform state
  const [scale, setScale] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const [drag, setDrag] = React.useState({ active: false, startX: 0, startY: 0, origX: 0, origY: 0 });

  const resetTransforms = () => {
    setScale(1);
    setRotation(0);
    setPos({ x: 0, y: 0 });
  };

  React.useEffect(() => {
    let isMounted = true;
    async function init() {
      setError('');
      try {
        if (!open) return;
        // Request user media
        const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        if (!isMounted) { st.getTracks().forEach(t => t.stop()); return; }
        setStream(st);
        if (videoRef.current) {
          videoRef.current.srcObject = st;
          await videoRef.current.play().catch(() => {});
        }
      } catch (e) {
        console.error(e);
        setError('Unable to access camera. Please allow camera permission or try another device.');
      }
    }
    init();
    return () => {
      isMounted = false;
      try { if (stream) stream.getTracks().forEach(t => t.stop()); } catch {}
      setStream(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Pointer interactions for dragging the overlay
  const onPointerDown = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = e.clientX; const startY = e.clientY;
    setDrag({ active: true, startX, startY, origX: pos.x, origY: pos.y });
  };
  const onPointerMove = (e) => {
    if (!drag.active) return;
    const dx = e.clientX - drag.startX; const dy = e.clientY - drag.startY;
    setPos({ x: drag.origX + dx, y: drag.origY + dy });
  };
  const onPointerUp = () => setDrag((d) => ({ ...d, active: false }));

  // Wheel to scale
  const onWheel = (e) => {
    e.preventDefault();
    const delta = -e.deltaY;
    setScale((s) => Math.min(3, Math.max(0.25, s + delta * 0.0015)));
  };

  // Simple pinch handling
  const pinch = React.useRef({ active: false, dist: 0, startScale: 1 });
  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      const d = distance(e.touches[0], e.touches[1]);
      pinch.current = { active: true, dist: d, startScale: scale };
    }
  };
  const onTouchMove = (e) => {
    if (pinch.current.active && e.touches.length === 2) {
      const d = distance(e.touches[0], e.touches[1]);
      const factor = d / (pinch.current.dist || 1);
      setScale(() => Math.min(3, Math.max(0.25, pinch.current.startScale * factor)));
    }
  };
  const onTouchEnd = (e) => { if (e.touches.length < 2) pinch.current.active = false; };

  function distance(a, b) { const dx = a.clientX - b.clientX; const dy = a.clientY - b.clientY; return Math.hypot(dx, dy); }

  const overlayStyle = {
    position: 'absolute', left: '50%', top: '50%', transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) rotate(${rotation}deg) scale(${scale})`,
    transformOrigin: 'center center', touchAction: 'none', cursor: drag.active ? 'grabbing' : 'grab',
  };

  const handleClose = () => {
    try { if (stream) stream.getTracks().forEach(t => t.stop()); } catch {}
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
        <Box sx={{ position: 'relative', width: '100%', bgcolor: 'black' }} onWheel={onWheel}>
          <Box sx={{ position: 'relative', width: '100%', paddingTop: '133%' /* 3:4 aspect for front camera */ }}>
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
            />
            {imageSrc && (
              <img
                src={imageSrc}
                alt="overlay"
                style={overlayStyle}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                draggable={false}
              />
            )}
          </Box>
        </Box>
        <Box sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <Typography sx={{ minWidth: 96 }} variant="body2">Scale</Typography>
              <Slider min={0.25} max={3} step={0.01} value={scale} onChange={(_, v) => setScale(v)} />
              <Button onClick={resetTransforms} size="small">Reset</Button>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <Typography sx={{ minWidth: 96 }} variant="body2">Rotation</Typography>
              <Slider min={-180} max={180} step={1} value={rotation} onChange={(_, v) => setRotation(v)} />
            </Stack>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
