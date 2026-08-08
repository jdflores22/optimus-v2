import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DashboardCustomizeOutlinedIcon from '@mui/icons-material/DashboardCustomizeOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import ViewCompactOutlinedIcon from '@mui/icons-material/ViewCompactOutlined';
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import type { DocumentTemplateDto } from '../../../shared/types';
import { API_BASE_URL } from '../../../shared/types';
import {
  DOCUMENT_BLOCK_GROUPS,
  parseDocumentLayout,
  placeholdersForType,
  serializeDocumentLayout,
} from './documentTemplateBlocks';
import '../../../lib/document-template-builder.js';
import './document-template-builder.css';

type Props = {
  template: DocumentTemplateDto;
  onToast?: (message: string, severity: 'success' | 'error') => void;
};

type MobilePanel = 'canvas' | 'elements' | 'properties' | 'settings';

function panelVisibility(isMobile: boolean, active: MobilePanel, panel: MobilePanel) {
  if (!isMobile) return undefined;
  return active === panel ? undefined : 'none';
}

export function DocumentTemplateBuilder({ template, onToast }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('canvas');
  const token = useSelector((state: RootState) => state.auth.accessToken);

  const layout = useMemo(
    () =>
      parseDocumentLayout(
        template.layoutJson,
        template.documentType,
        template.paperSize,
        template.orientation,
      ),
    [template.id, template.layoutJson, template.documentType, template.paperSize, template.orientation],
  );

  const layoutJson = useMemo(() => serializeDocumentLayout(layout), [layout]);
  const placeholders = useMemo(() => placeholdersForType(template.documentType), [template.documentType]);

  const apiBase = API_BASE_URL.replace(/\/$/, '');
  const saveUrl = `${apiBase}/api/document-templates/${template.id}/layout`;
  const uploadUrl = `${apiBase}/api/document-templates/${template.id}/upload-image`;
  const previewUrl = `${apiBase}/api/document-templates/${template.id}/preview-html`;

  const canvasMaxWidth = layout.canvas.orientation === 'landscape' ? 1123 : 794;
  const elementCount = layout.elements.length;

  useEffect(() => {
    window.dtToast = (message, type) => {
      onToast?.(message, type === 'success' ? 'success' : 'error');
    };
    return () => {
      delete window.dtToast;
    };
  }, [onToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.initDocumentTemplateBuilder?.();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [template.id, layoutJson, token]);

  const elementsColumn = (
    <>
      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: { xs: 1.5, sm: 2 } }}>
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          Add Elements
        </Typography>
        <Box className="dt-palette-scroll" sx={{ maxHeight: { xs: 'none', lg: '70vh' }, overflowY: { lg: 'auto' } }}>
          {Object.entries(DOCUMENT_BLOCK_GROUPS).map(([groupName, blocks]) => (
            <Box key={groupName} mb={2}>
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                display="block"
                sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1 }}
              >
                {groupName}
              </Typography>
              <Box className="dt-palette-grid">
                {Object.entries(blocks).map(([blockType, block]) => (
                  <button key={blockType} type="button" className="block-palette-btn" data-block-type={blockType}>
                    {block.name}
                  </button>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle2" fontWeight={700}>
            On This Template
          </Typography>
          <span id="dt-used-elements-count" className="badge badge-ghost badge-xs">
            {elementCount}
          </span>
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          Tap an item to select it on the canvas.
        </Typography>
        <div id="dt-used-elements-list" />
        <p
          id="dt-used-elements-empty"
          className={`text-sm text-base-content/50 text-center py-4${elementCount > 0 ? ' hidden' : ''}`}
        >
          No elements on the canvas yet
        </p>
      </Paper>
    </>
  );

  const canvasColumn = (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} gap={1}>
        <Typography variant="subtitle2" fontWeight={700}>
          Canvas
        </Typography>
        <Typography id="dt-element-count" variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
          {elementCount} elements
        </Typography>
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        mb={2}
        sx={{ display: { xs: 'none', sm: 'block' } }}
      >
        Drag elements to position them. Use <strong>Field Label</strong> and <strong>Field Value</strong> as separate
        blocks for precise alignment.
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={1.5} sx={{ display: { xs: 'block', sm: 'none' } }}>
        Pinch or swipe sideways to pan the canvas. Tap an element to edit in Properties.
      </Typography>
      <Box
        className="dt-canvas-scroll"
        sx={{
          bgcolor: 'grey.200',
          borderRadius: 2,
          p: { xs: 1, sm: 3 },
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div
          id="dt-canvas"
          className="bg-white shadow-xl mx-auto relative dt-canvas-page"
          style={{
            width: isMobile ? canvasMaxWidth : '100%',
            minWidth: isMobile ? canvasMaxWidth : undefined,
            maxWidth: canvasMaxWidth,
            aspectRatio: `${layout.canvas.width} / ${layout.canvas.height}`,
            border: '2px solid #1e3a5f',
            background: '#fff',
            margin: '0 auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          <div
            id="dt-canvas-inner"
            className="relative w-full h-full"
            style={{ position: 'relative', width: '100%', height: '100%' }}
          >
            <div
              id="dt-paper-guides"
              className="absolute inset-0"
              style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }}
              aria-hidden="true"
            >
              <div id="dt-margin-zone-top" className="dt-margin-zone" />
              <div id="dt-margin-zone-right" className="dt-margin-zone" />
              <div id="dt-margin-zone-bottom" className="dt-margin-zone" />
              <div id="dt-margin-zone-left" className="dt-margin-zone" />
              <div id="dt-margin-frame" />
              <div id="dt-paper-label" className="dt-paper-label" />
            </div>
            <div
              id="dt-elements-list"
              className="absolute inset-0"
              style={{ position: 'absolute', inset: 0, zIndex: 10 }}
            />
            <div id="dt-canvas-guides" className="dt-canvas-guides" aria-hidden="true">
              <div id="dt-guide-v-center" />
              <div id="dt-guide-h-center" />
              <div id="dt-guide-center-dot" />
            </div>
            <div
              id="dt-canvas-empty"
              className={`absolute inset-0 flex flex-col items-center justify-center text-base-content/40 pointer-events-none${elementCount > 0 ? ' hidden' : ''}`}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                display: elementCount > 0 ? 'none' : 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(0,0,0,0.35)',
                pointerEvents: 'none',
              }}
            >
              <Typography variant="body2" mt={1} px={2} textAlign="center">
                Add elements from the palette to design your document
              </Typography>
            </div>
          </div>
        </div>
      </Box>
    </Paper>
  );

  const propertiesColumn = (
    <>
      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: { xs: 1.5, sm: 2 } }}>
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          Properties
        </Typography>
        <div id="dt-properties-panel">
          <Typography variant="body2" color="text.secondary">
            Select an element on the canvas to edit its properties
          </Typography>
        </div>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: { xs: 1.5, sm: 2 } }}>
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          Dynamic Fields
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          Tap to copy placeholder key
        </Typography>
        <Box sx={{ maxHeight: { xs: 'none', lg: 220 }, overflowY: { lg: 'auto' } }}>
          {Object.entries(placeholders).map(([groupName, fields]) => (
            <Box key={groupName} mb={1.5}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.5}>
                {groupName}
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {Object.entries(fields).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className="placeholder-chip"
                    data-placeholder={key}
                    title={label}
                  >
                    {key}
                  </button>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>
    </>
  );

  const settingsColumn = (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
        Canvas Settings
      </Typography>
      <Box display="flex" flexDirection="column" gap={1.5}>
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={1}>
          <label className="form-control">
            <span className="label-text text-xs">Paper size</span>
            <select id="dt-paper-size" className="select select-sm" defaultValue={template.paperSize}>
              <option value="A4">A4</option>
              <option value="letter">Letter (US)</option>
              <option value="legal">Legal (US)</option>
            </select>
          </label>
          <label className="form-control">
            <span className="label-text text-xs">Orientation</span>
            <select id="dt-orientation" className="select select-sm" defaultValue={template.orientation}>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </label>
        </Box>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase' }}>
          Page margins (px)
        </Typography>
        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
          {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
            <label key={side} className="form-control">
              <span className="label-text text-xs" style={{ textTransform: 'capitalize' }}>
                {side}
              </span>
              <input
                type="number"
                id={`dt-margin-${side}`}
                className="input input-sm"
                defaultValue={String((layout.canvas.margin as Record<string, number>)?.[side] ?? 48)}
                min={0}
                max={200}
              />
            </label>
          ))}
        </Box>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" id="dt-show-margin-guides" className="checkbox checkbox-xs" defaultChecked />
          <span className="text-xs">Show margin guides</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" id="dt-show-border" className="checkbox checkbox-xs" defaultChecked />
          <span className="text-xs">Show page border</span>
        </label>
        <label className="form-control">
          <span className="label-text text-xs">Border color</span>
          <input
            type="color"
            id="dt-border-color"
            defaultValue="#1e3a5f"
            className="input input-sm"
            style={{ height: 32 }}
          />
        </label>
      </Box>
    </Paper>
  );

  return (
    <Box
      id="doc-template-builder"
      className={isMobile ? 'dt-builder-mobile' : undefined}
      data-template-id={template.id}
      data-save-url={saveUrl}
      data-upload-url={uploadUrl}
      data-preview-url={previewUrl}
      data-layout={layoutJson}
      data-paper-size={template.paperSize}
      data-orientation={template.orientation}
      data-auth-token={token ?? ''}
      sx={{ width: '100%' }}
    >
      <div id="dtToastContainer" aria-live="polite" />

      {isMobile && (
        <Paper variant="outlined" sx={{ mb: 1.5, borderRadius: 2, overflow: 'hidden' }}>
          <Tabs
            value={mobilePanel}
            onChange={(_, value: MobilePanel) => setMobilePanel(value)}
            variant="fullWidth"
            sx={{
              minHeight: 44,
              '& .MuiTab-root': { minHeight: 44, py: 0.75, fontSize: '0.72rem', minWidth: 0, px: 0.5 },
            }}
          >
            <Tab icon={<ViewCompactOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="top" label="Canvas" value="canvas" />
            <Tab icon={<WidgetsOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="top" label="Add" value="elements" />
            <Tab icon={<TuneOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="top" label="Props" value="properties" />
            <Tab icon={<DashboardCustomizeOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="top" label="Settings" value="settings" />
          </Tabs>
        </Paper>
      )}

      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        <Grid item xs={12} xl={2} sx={{ display: panelVisibility(isMobile, mobilePanel, 'elements') }}>
          {elementsColumn}
        </Grid>

        <Grid item xs={12} xl={6} sx={{ display: panelVisibility(isMobile, mobilePanel, 'canvas') }}>
          {canvasColumn}
        </Grid>

        <Grid item xs={12} xl={4}>
          <Box sx={{ display: panelVisibility(isMobile, mobilePanel, 'properties') }}>{propertiesColumn}</Box>
          <Box sx={{ display: panelVisibility(isMobile, mobilePanel, 'settings'), mt: { xs: 0, lg: 0 } }}>
            {settingsColumn}
          </Box>
        </Grid>
      </Grid>

      <button type="button" id="dt-save-btn" style={{ display: 'none' }} aria-hidden="true" />
      <span id="dt-save-spinner" className="hidden" aria-hidden="true" />
      <button type="button" id="dt-preview-btn" style={{ display: 'none' }} aria-hidden="true" />
    </Box>
  );
}

export function triggerDocumentTemplateSave(onDone?: () => void) {
  window.documentTemplateBuilderSave?.();
  onDone?.();
}

export function triggerDocumentTemplatePreview() {
  window.documentTemplateBuilderPreview?.();
}
