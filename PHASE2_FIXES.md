# Phase 2 Fixes: Timeline Shift & Color Coding

**Date**: October 16, 2025  
**Status**: Fixed

---

## 🐛 Issue 1: Timeline Shifts When Clicking Event

### **Problem:**
When clicking an event marker, all markers shifted dramatically to the right. The arrow stayed where the event used to be, but the event moved.

### **Root Cause:**
Pre-load logic was using `markerValue` (fractional, e.g., -4.41) instead of `pointB_reference_markerValue` (integer, e.g., -4). This caused:
1. Fractional target markers (e.g., -4.41 - 50 = -54.41)
2. `Math.floor()` and `Math.ceil()` creating incorrect ranges
3. Adding wrong markers triggered re-render with position shifts

### **Fix:**
```javascript
// Before (WRONG - uses fractional arrow value)
const targetMinMarker = markerValue - markersToPreload;
const targetMaxMarker = markerValue + markersToPreload;

// After (CORRECT - uses integer reference)
const referenceForPreload = isFirstActivation || isOutsideMargin 
  ? Math.round(markerValue)
  : pointB_reference_markerValue;

const targetMinMarker = Math.floor(referenceForPreload - markersToPreload);
const targetMaxMarker = Math.ceil(referenceForPreload + markersToPreload);
```

### **Result:**
✅ Timeline stays put when clicking events  
✅ Arrow appears at clicked position  
✅ No dramatic shifts  

---

## 🎨 Issue 2: Color Code Point B Reference Marker

### **Requirement:**
Highlight the Point B reference marker (integer coordinate) in light red/orange, similar to how Point A (marker 0) is highlighted in light blue.

### **Implementation:**

#### **TimeMarkers.js:**
```javascript
// Check if this is the Point B reference marker
const isPointBReference = pointB_active && value === pointB_reference_markerValue;

// Marker line color
backgroundColor: isPointBReference 
  ? theme.palette.mode === 'dark' ? '#ff6b6b' : '#ff8787'  // Light red/orange
  : isDestination 
    ? theme.palette.text.secondary 
    : undefined

// Marker label color
color: isPointBReference
  ? theme.palette.mode === 'dark' ? '#ff6b6b' : '#ff8787'  // Light red/orange
  : value === 0 
    ? theme.palette.primary.main  // Point A (blue)
    : theme.palette.text.secondary
```

### **Color Scheme:**
- **Point A (marker 0)**: Light blue (primary color)
- **Point B reference**: Light red/orange (#ff6b6b dark, #ff8787 light)
- **Special markers** (12AM, Sunday, January): Taller line, background badge
- **Regular markers**: Default text color

### **Result:**
✅ Point B reference marker clearly visible in light red/orange  
✅ Distinguishable from Point A (blue)  
✅ Updates when reference changes  

---

## 📊 Visual Hierarchy

```
Timeline Markers:
├─ Point A (marker 0)
│  ├─ Color: Light blue (primary)
│  ├─ Always at current time
│  └─ Updates every minute
│
├─ Point B Reference (integer coordinate)
│  ├─ Color: Light red/orange
│  ├─ Shows calculation anchor
│  └─ Only visible when Point B active
│
├─ Special Markers (12AM, Sunday, January)
│  ├─ Taller line (25px vs 15px)
│  ├─ Thicker line (3px vs 2px)
│  └─ Background badge
│
└─ Regular Markers
   ├─ Default text color
   ├─ Standard height (15px)
   └─ Hover animation
```

---

## 🔧 Props Added

### **TimeMarkers Component:**
```javascript
<TimeMarkers
  // ... existing props
  pointB_active={pointB_active}
  pointB_reference_markerValue={pointB_reference_markerValue}
  onMarkerClick={(markerValue, timestamp, viewMode) => {
    activatePointB(markerValue, timestamp, viewMode, null, false);
  }}
/>
```

---

## ✅ Testing Checklist

- [x] Click event marker → Timeline stays put
- [x] Arrow appears at clicked event
- [x] Point B reference marker highlighted in red/orange
- [x] Point A marker still blue at position 0
- [x] Click nearby event → No shift
- [x] Click far event → Smooth recalculation
- [x] Press 'B' key → Resets Point B, colors update

---

## 🎯 Expected Behavior

### **Before Fix:**
```
Click purple event at -4.41
→ Pre-load calculates: [-54.41 to 45.59]
→ Creates fractional markers
→ Timeline shifts dramatically ❌
→ Arrow stays at old position ❌
```

### **After Fix:**
```
Click purple event at -4.41
→ Reference snaps to: -4
→ Pre-load calculates: [-54 to 46]
→ Creates integer markers only
→ Timeline stays put ✅
→ Arrow at exact click position ✅
→ Marker -4 highlighted in red/orange ✅
```

---

## 📝 Console Logs

```
[Point B] Activating at marker: -4.41 timestamp: ... viewMode: week
[Point B] Reference updated to integer: -4 margin: 20
[Point B] Pre-loading 100 markers for smooth scrolling
[Point B] Point B activated at clicked position (timeline stays put)
```

---

**Status**: ✅ **FIXED** - Timeline no longer shifts, Point B reference clearly visible!
