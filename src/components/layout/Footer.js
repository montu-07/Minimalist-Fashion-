import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';
import BrandLogo from 'components/BrandLogo';

function Footer() {
  return (
    <Box component="footer" sx={{ mt: 'auto', bgcolor: 'common.black', color: 'common.white' }}>
      {/* Animated water divider using Three.js (R3F + drei) */}
      <Box sx={{ position: 'relative', width: '100%', height: 160, overflow: 'hidden', bgcolor: 'background.default' }}>
        {(() => {
          const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (reduce) {
            return (
              <Box component="svg" viewBox="0 0 1440 100" preserveAspectRatio="none" sx={{ position: 'absolute', inset: 0 }}>
                <path d="M0,50 C240,70 480,70 720,50 C960,30 1200,30 1440,50 L1440,100 L0,100 Z" fill="#0A0A0A" />
              </Box>
            );
          }

          function WaterSurface() {
            // Create a procedural DuDv-like texture (centered noise)
            const dudv = React.useMemo(() => {
              const size = 256;
              const data = new Uint8Array(size * size * 3);
              for (let i = 0; i < size * size; i++) {
                // Centered noise around 128 with slight variation
                const n1 = 128 + Math.floor((Math.random() - 0.5) * 64); // R
                const n2 = 128 + Math.floor((Math.random() - 0.5) * 64); // G
                const n3 = 255; // B max to keep brightness
                data[i * 3] = n1;
                data[i * 3 + 1] = n2;
                data[i * 3 + 2] = n3;
              }
              const tex = new THREE.DataTexture(data, size, size, THREE.RGBFormat);
              tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
              tex.repeat.set(4, 4);
              tex.needsUpdate = true;
              return tex;
            }, []);

            useFrame((_, delta) => {
              dudv.offset.x += delta * 0.05;
              dudv.offset.y += delta * 0.025;
            });
            return (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[120, 120, 1, 1]} />
                <MeshReflectorMaterial
                  color="#0A0A0A"
                  blur={[300, 60]}
                  mixBlur={0.6}
                  mixStrength={3}
                  resolution={256}
                  mirror={0.45}
                  roughness={0.6}
                  metalness={0.1}
                  depthScale={1.2}
                  minDepthThreshold={0.2}
                  maxDepthThreshold={1.5}
                  distortionMap={dudv}
                />
              </mesh>
            );
          }

          return (
            <Canvas dpr={[1, 2]} camera={{ position: [0, 8, 14], fov: 35 }} style={{ position: 'absolute', inset: 0 }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[4, 10, 2]} intensity={0.5} />
              <Environment preset="city" background={false} />
              <group position={[0, -3, 0]}>
                <WaterSurface />
              </group>
            </Canvas>
          );
        })()}
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <BrandLogo size={24} withWordmark />
        </Box>
        {/* Newsletter */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Subscribe to our emails</Typography>
          <Typography variant="body2" sx={{ color: 'grey.400', mb: 2 }}>Join our email list for exclusive offers and the latest news.</Typography>
          <Grid container spacing={1} justifyContent="center">
            <Grid item xs={12} sm={6} md={5}>
              <TextField fullWidth size="small" placeholder="Email" variant="outlined" sx={{ bgcolor: 'common.white', borderRadius: 1 }} />
            </Grid>
            <Grid item xs={12} sm={3} md={2}>
              <Button fullWidth variant="contained" color="primary">Sign up</Button>
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Quick links</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link component={RouterLink} to="/profile" color="inherit" underline="hover">Track Your Order</Link>
              <Link component={RouterLink} to="/contact" color="inherit" underline="hover">Contact us</Link>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Policies</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link component={RouterLink} to="/policies/privacy" color="inherit" underline="hover">Privacy Policy</Link>
              <Link component={RouterLink} to="/policies/exchange" color="inherit" underline="hover">Exchange Policy</Link>
              <Link component={RouterLink} to="/policies/shipping" color="inherit" underline="hover">Shipping Policy</Link>
              <Link component={RouterLink} to="/policies/terms" color="inherit" underline="hover">Terms of Service</Link>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>About</Typography>
            <Typography variant="body2" sx={{ color: 'grey.400' }}>
              E-Shop is your destination for trend-forward essentials. Crafted with passion for great shopping experiences.
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ borderTop: '1px solid', borderColor: 'grey.800', mt: 4, pt: 2, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'grey.500' }}>© {new Date().getFullYear()} E-Shop. All rights reserved.</Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default Footer;
