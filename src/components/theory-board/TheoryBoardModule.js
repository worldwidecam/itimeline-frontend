import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../../utils/api';
import {
  Alert,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import EditNoteIcon from '@mui/icons-material/EditNote';
import PushPinIcon from '@mui/icons-material/PushPin';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const CELL_WIDTH = 220;
const CELL_HEIGHT = 150;

const pinPalette = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

const pinColorFromValue = (value) => {
  const normalized = String(value || '').toLowerCase();
  if (pinPalette.includes(normalized)) return normalized;
  return pinPalette[0];
};

const TheoryBoardModule = ({ profileUserId, isOwner, onOpenEventReference }) => {
  const theme = useTheme();
  const boardRef = useRef(null);
  const dragRef = useRef({ active: false, nodeId: null, startX: 0, startY: 0, baseOffsetX: 0, baseOffsetY: 0 });
  const panDragRef = useRef({ active: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });
  const [board, setBoard] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [eventIdDraft, setEventIdDraft] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pinMenuAnchor, setPinMenuAnchor] = useState(null);
  const [pinMenuNodeId, setPinMenuNodeId] = useState(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const fetchBoard = useCallback(async () => {
    if (!profileUserId) return;
    try {
      setLoading(true);
      setErrorMessage('');
      const response = await api.get(`/api/v1/users/${profileUserId}/theory-board`);
      const nextBoard = response?.data?.board || null;
      setBoard(nextBoard);
      setPan({
        x: Number(nextBoard?.viewport?.x || 0),
        y: Number(nextBoard?.viewport?.y || 0),
      });
      setZoom(Math.max(0.25, Math.min(3, Number(nextBoard?.viewport?.zoom || 100) / 100)));
    } catch (error) {
      setErrorMessage(error?.response?.data?.error || error?.message || 'Failed to load Theory Board');
    } finally {
      setLoading(false);
    }
  }, [profileUserId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const boundary = useMemo(() => {
    const source = board?.boundary || { min_col: -1, min_row: -1, max_col: 1, max_row: 1 };
    return {
      minCol: Number(source.min_col ?? -1),
      minRow: Number(source.min_row ?? -1),
      maxCol: Number(source.max_col ?? 1),
      maxRow: Number(source.max_row ?? 1),
    };
  }, [board?.boundary]);

  const boardSize = useMemo(() => {
    const cols = Math.max(3, boundary.maxCol - boundary.minCol + 1);
    const rows = Math.max(3, boundary.maxRow - boundary.minRow + 1);
    return {
      width: cols * CELL_WIDTH,
      height: rows * CELL_HEIGHT,
    };
  }, [boundary]);

  const nodePixelPosition = useCallback((node) => {
    const col = Number(node?.grid_col || 0) - boundary.minCol;
    const row = Number(node?.grid_row || 0) - boundary.minRow;
    return {
      x: col * CELL_WIDTH + Number(node?.offset_x || 0),
      y: row * CELL_HEIGHT + Number(node?.offset_y || 0),
    };
  }, [boundary.minCol, boundary.minRow]);

  const nodeMap = useMemo(() => {
    const map = new Map();
    (board?.nodes || []).forEach((node) => {
      map.set(Number(node.id), node);
    });
    return map;
  }, [board?.nodes]);

  const edgePaths = useMemo(() => {
    return (board?.edges || []).map((edge) => {
      const fromNode = nodeMap.get(Number(edge.from_node_id));
      const toNode = nodeMap.get(Number(edge.to_node_id));
      if (!fromNode || !toNode) return null;

      const fromPos = nodePixelPosition(fromNode);
      const toPos = nodePixelPosition(toNode);
      const x1 = fromPos.x + 120;
      const y1 = fromPos.y + 20;
      const x2 = toPos.x + 120;
      const y2 = toPos.y + 20;
      const midX = (x1 + x2) / 2;
      const droop = Number(edge?.droop_strength || 18);
      const distance = Math.abs(x1 - x2) + Math.abs(y1 - y2);
      const controlY = Math.max(y1, y2) + droop + Math.round(distance * 0.06);

      return {
        id: edge.id,
        path: `M ${x1} ${y1} Q ${midX} ${controlY} ${x2} ${y2}`,
      };
    }).filter(Boolean);
  }, [board?.edges, nodeMap, nodePixelPosition]);

  const updateBoardFromResponse = (response) => {
    const nextBoard = response?.data?.board || null;
    setBoard(nextBoard);
  };

  const handleAddEventNode = async () => {
    const parsed = Number(eventIdDraft);
    if (!Number.isInteger(parsed) || parsed <= 0) return;

    try {
      const response = await api.post(`/api/v1/users/${profileUserId}/theory-board/nodes/event`, {
        event_id: parsed,
      });
      updateBoardFromResponse(response);
      setEventIdDraft('');
    } catch (error) {
      setErrorMessage(error?.response?.data?.error || error?.message || 'Failed to add event node');
    }
  };

  const handleDeleteNode = async (nodeId) => {
    try {
      const response = await api.delete(`/api/v1/users/${profileUserId}/theory-board/nodes/${nodeId}`);
      updateBoardFromResponse(response);
    } catch (error) {
      setErrorMessage(error?.response?.data?.error || error?.message || 'Failed to delete node');
    }
  };

  const handleOpenPinMenu = (event, nodeId) => {
    setPinMenuAnchor(event.currentTarget);
    setPinMenuNodeId(Number(nodeId));
  };

  const handleClosePinMenu = () => {
    setPinMenuAnchor(null);
    setPinMenuNodeId(null);
  };

  const handleNodeClick = async (node) => {
    if (typeof onOpenEventReference !== 'function') return;
    onOpenEventReference({
      eventId: Number(node?.event_id),
      resolvedEvent: node?.event,
    });
  };

  const handlePinMouseDown = (event, node) => {
    if (!isOwner) return;
    event.preventDefault();
    event.stopPropagation();

    dragRef.current = {
      active: true,
      nodeId: Number(node.id),
      startX: event.clientX,
      startY: event.clientY,
      baseOffsetX: Number(node.offset_x || 0),
      baseOffsetY: Number(node.offset_y || 0),
    };
  };

  const handleBoardMouseMove = async (event) => {
    const drag = dragRef.current;
    if (drag.active && isOwner) {
      setBoard((prev) => {
        if (!prev) return prev;
        const nextNodes = (prev.nodes || []).map((node) => {
          if (Number(node.id) !== drag.nodeId) return node;
          return {
            ...node,
            offset_x: drag.baseOffsetX + (event.clientX - drag.startX),
            offset_y: drag.baseOffsetY + (event.clientY - drag.startY),
          };
        });
        return { ...prev, nodes: nextNodes };
      });
      return;
    }

    const panDrag = panDragRef.current;
    if (!panDrag.active) return;
    setPan({
      x: panDrag.baseX + (event.clientX - panDrag.startX),
      y: panDrag.baseY + (event.clientY - panDrag.startY),
    });
  };

  const handleBoardMouseUp = async () => {
    const drag = dragRef.current;
    if (!drag.active || !isOwner || !board) return;

    const node = (board.nodes || []).find((item) => Number(item.id) === drag.nodeId);
    dragRef.current = { active: false, nodeId: null, startX: 0, startY: 0, baseOffsetX: 0, baseOffsetY: 0 };
    if (!node) return;

    const offsetX = Number(node.offset_x || 0);
    const offsetY = Number(node.offset_y || 0);
    const deltaCols = Math.round(offsetX / CELL_WIDTH);
    const deltaRows = Math.round(offsetY / CELL_HEIGHT);
    const nextCol = Number(node.grid_col) + deltaCols;
    const nextRow = Number(node.grid_row) + deltaRows;
    const normalizedOffsetX = offsetX - (deltaCols * CELL_WIDTH);
    const normalizedOffsetY = offsetY - (deltaRows * CELL_HEIGHT);

    try {
      const response = await api.patch(`/api/v1/users/${profileUserId}/theory-board/nodes/${node.id}/position`, {
        grid_col: nextCol,
        grid_row: nextRow,
        offset_x: normalizedOffsetX,
        offset_y: normalizedOffsetY,
      });
      updateBoardFromResponse(response);
    } catch (error) {
      setErrorMessage(error?.response?.data?.error || error?.message || 'Failed to move node');
      fetchBoard();
    }

    return;
  };

  const handleBoardMouseDown = (event) => {
    if (event.target.closest('[data-theory-node="true"]')) {
      return;
    }
    panDragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      baseX: Number(pan.x || 0),
      baseY: Number(pan.y || 0),
    };
  };

  const handleBoardPointerEnd = async () => {
    await handleBoardMouseUp();

    if (!panDragRef.current.active) return;
    panDragRef.current = { active: false, startX: 0, startY: 0, baseX: 0, baseY: 0 };

    if (!isOwner) return;
    try {
      const response = await api.patch(`/api/v1/users/${profileUserId}/theory-board/viewport`, {
        x: Math.round(pan.x),
        y: Math.round(pan.y),
        zoom: Math.round(zoom * 100),
      });
      updateBoardFromResponse(response);
    } catch (_error) {
      // Ignore viewport sync errors to keep interactions smooth.
    }
  };

  const handleCanvasClick = () => {
    setZoom((prev) => Math.min(3, prev + 0.12));
  };

  const handleCanvasDoubleClick = (event) => {
    event.preventDefault();
    setZoom((prev) => Math.max(0.25, prev - 0.16));
  };

  const handleToggleFullscreen = async () => {
    if (!boardRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await boardRef.current.requestFullscreen();
  };

  return (
    <Paper sx={{ p: 1.5, borderRadius: 2.5, position: 'relative', overflow: 'hidden' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Theory Board</Typography>
        <Stack direction="row" spacing={1}>
          {isOwner && (
            <Tooltip title="Theory Board tools">
              <IconButton onClick={() => setDrawerOpen((prev) => !prev)}>
                <EditNoteIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Fullscreen">
            <IconButton onClick={handleToggleFullscreen}>
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {errorMessage ? <Alert severity="warning" sx={{ mb: 1.2 }}>{errorMessage}</Alert> : null}

      {drawerOpen && isOwner ? (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1.2 }}>
          <TextField
            label="Event ID"
            value={eventIdDraft}
            size="small"
            onChange={(event) => setEventIdDraft(event.target.value)}
            placeholder="123"
            sx={{ minWidth: 140 }}
          />
          <Button variant="contained" onClick={handleAddEventNode}>Pin Event</Button>
        </Stack>
      ) : null}

      <Box
        ref={boardRef}
        onMouseDown={handleBoardMouseDown}
        onMouseMove={handleBoardMouseMove}
        onMouseUp={handleBoardPointerEnd}
        onMouseLeave={handleBoardPointerEnd}
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
        sx={{
          position: 'relative',
          minHeight: 360,
          borderRadius: 2,
          border: '8px solid #7f4f24',
          background: 'linear-gradient(145deg, #b9895a 0%, #a67144 100%)',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.22), inset 0 0 36px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          cursor: dragRef.current.active ? 'grabbing' : 'grab',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: pan.x,
            top: pan.y,
            transform: `scale(${zoom})`,
            transformOrigin: '0 0',
            width: boardSize.width,
            height: boardSize.height,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              border: '2px dashed rgba(252, 252, 252, 0.65)',
              borderRadius: 1,
              pointerEvents: 'none',
            }}
          />

          <svg
            width={boardSize.width}
            height={boardSize.height}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            {edgePaths.map((edge) => (
              <path
                key={edge.id}
                d={edge.path}
                stroke="rgba(139,69,19,0.88)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            ))}
          </svg>

          {(board?.nodes || []).map((node) => {
            const pos = nodePixelPosition(node);
            const pinColor = pinColorFromValue(node.pin_color);
            return (
              <Paper
                key={node.id}
                data-theory-node="true"
                onClick={(event) => {
                  event.stopPropagation();
                  handleNodeClick(node);
                }}
                sx={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  width: 240,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(130,177,255,0.4)' : 'rgba(25,118,210,0.25)',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
                  p: 1,
                  cursor: 'pointer',
                  userSelect: 'none',
                  zIndex: Number(node.z_index || 0) + 10,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Box
                    onMouseDown={(event) => handlePinMouseDown(event, node)}
                    onClick={(event) => event.stopPropagation()}
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      bgcolor: pinColor,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 0 2px rgba(255,255,255,0.8), 0 4px 8px rgba(0,0,0,0.45)',
                      cursor: isOwner ? 'grab' : 'default',
                    }}
                  >
                    <PushPinIcon sx={{ fontSize: 15, color: '#fff' }} />
                  </Box>

                  {isOwner ? (
                    <IconButton
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenPinMenu(event, node.id);
                      }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  ) : null}
                </Box>

                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {node?.event?.title || `Event #${node.event_id}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {node?.event?.type || 'event'} • #{node.event_id}
                </Typography>
              </Paper>
            );
          })}
        </Box>

        {loading ? (
          <Box sx={{ position: 'absolute', right: 10, bottom: 10, px: 1, py: 0.35, borderRadius: 1, bgcolor: 'rgba(0,0,0,0.42)' }}>
            <Typography variant="caption" sx={{ color: '#fff' }}>Loading...</Typography>
          </Box>
        ) : null}
      </Box>

      <Menu
        anchorEl={pinMenuAnchor}
        open={Boolean(pinMenuAnchor)}
        onClose={handleClosePinMenu}
      >
        <MenuItem
          onClick={async () => {
            if (pinMenuNodeId) {
              await handleDeleteNode(pinMenuNodeId);
            }
            handleClosePinMenu();
          }}
        >
          Delete pin
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default TheoryBoardModule;
