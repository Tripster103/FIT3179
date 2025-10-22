
import json
import math
import os
from typing import List, Tuple, Dict
import numpy as np

def to_rad(d): return d * math.pi / 180.0
def to_deg(r): return r * 180.0 / math.pi

def ll_to_vec(lon: float, lat: float):
    lon_r, lat_r = to_rad(lon), to_rad(lat)
    x = math.cos(lat_r) * math.cos(lon_r)
    y = math.cos(lat_r) * math.sin(lon_r)
    z = math.sin(lat_r)
    return np.array([x, y, z], dtype=float)

def vec_to_ll(v):
    v = v / np.linalg.norm(v)
    lon = math.atan2(v[1], v[0])
    lat = math.asin(v[2])
    return to_deg(lon), to_deg(lat)

def slerp(a, b, t):
    a = a/np.linalg.norm(a); b = b/np.linalg.norm(b)
    dot = float(np.clip(np.dot(a,b), -1.0, 1.0))
    omega = math.acos(dot)
    if omega < 1e-12:
        return a.copy()
    so = math.sin(omega)
    return (math.sin((1-t)*omega)/so)*a + (math.sin(t*omega)/so)*b

def spherical_quadratic_bezier(a_vec, c_vec, b_vec, t):
    p0 = slerp(a_vec, c_vec, t)
    p1 = slerp(c_vec, b_vec, t)
    p  = slerp(p0, p1, t)
    return p/np.linalg.norm(p)

def curved_arc_points(lon1, lat1, lon2, lat2, height=0.15, direction=1, n=24):
    def lon_norm(lon):
        while lon > 180: lon -= 360
        while lon < -180: lon += 360
        return lon
    
    lon1_norm = lon_norm(lon1)
    lon2_norm = lon_norm(lon2)
    
    # Detect trans-Pacific crossing in BOTH directions
    # Map boundary at ±180° in Pacific, so paths must go WEST (through Africa)
    # Australia (lon ~133°) ↔ Americas (lon ~-95°)
    is_aus_to_usa = (lon1_norm > 100 and lon2_norm < -20)  # Australia → USA
    is_usa_to_aus = (lon1_norm < -20 and lon2_norm > 100)  # USA → Australia
    is_pacific_crossing = is_aus_to_usa or is_usa_to_aus
    
    if is_pacific_crossing:
        # For Pacific crossings, create a waypoint to force westward path through Africa/Europe
        # Waypoint at Europe/Africa (lon 10°, lat = midpoint between origin and dest)
        waypoint_lon = 10.0
        waypoint_lat = (lat1 + lat2) / 2.0
        
        a = ll_to_vec(lon1_norm, lat1)
        w = ll_to_vec(waypoint_lon, waypoint_lat)
        b = ll_to_vec(lon2_norm, lat2)
        
        # Use waypoint as control point for Bezier
        mid1 = slerp(a, w, 0.5)
        mid2 = slerp(w, b, 0.5)
        # Average the mids to create smooth transition through waypoint
        c = (mid1 + mid2) / 2.0
        c = c / np.linalg.norm(c)
        
        # Add curve bulge
        nrm = np.cross(a, b)
        if np.linalg.norm(nrm) < 1e-12:
            nrm = np.array([0,0,1.0])
        nrm = nrm/np.linalg.norm(nrm)
        c = (c + direction*height*0.5*nrm); c = c/np.linalg.norm(c)
    else:
        a = ll_to_vec(lon1_norm, lat1)
        b = ll_to_vec(lon2_norm, lat2)
        
        mid = slerp(a, b, 0.5)
        nrm = np.cross(a, b)
        if np.linalg.norm(nrm) < 1e-12:
            nrm = np.array([0,0,1.0])
        nrm = nrm/np.linalg.norm(nrm)
        c = (mid + direction*height*nrm); c = c/np.linalg.norm(c)
    
    pts = []
    prev_lon = lon1_norm
    
    for i in range(n+1):
        v = spherical_quadratic_bezier(a, c, b, i/n)
        lon, lat = vec_to_ll(v)
        
        # For Pacific crossings, handle longitude continuity based on direction
        if is_pacific_crossing:
            if is_aus_to_usa:
                # Australia → USA: westward (DECREASING longitude)
                # 133° → 100° → 50° → 0° → -50° → -95°
                if i > 0 and lon > prev_lon:
                    lon -= 360
            else:  # is_usa_to_aus
                # USA → Australia: also westward but INCREASING longitude
                # -95° → -50° → 0° → 50° → 100° → 133°
                if i > 0 and lon < prev_lon:
                    lon += 360
            
            # Also handle regular wrapping
            while lon > prev_lon + 180:
                lon -= 360
            while lon < prev_lon - 180:
                lon += 360
        else:
            # Normal continuity
            if i > 0:
                while lon > prev_lon + 180:
                    lon -= 360
                while lon < prev_lon - 180:
                    lon += 360
        
        prev_lon = lon
        pts.append((lon, lat))
    return pts

def topo_bbox(path):
    with open(path, "r", encoding="utf-8") as f:
        topo = json.load(f)
    if "bbox" in topo and len(topo["bbox"]) == 4:
        minx, miny, maxx, maxy = topo["bbox"]
        return float(minx), float(miny), float(maxx), float(maxy)
    transform = topo.get("transform")
    if not transform:
        return (-180.0, -90.0, 180.0, 90.0)
    scale = transform.get("scale", [1,1])
    translate = transform.get("translate", [0,0])
    sx, sy = scale; tx, ty = translate
    minx = 1e9; miny = 1e9; maxx = -1e9; maxy = -1e9
    for arc in topo.get("arcs", []):
        x = 0; y = 0
        for dx, dy in arc:
            x += dx; y += dy
            lon = x*sx + tx
            lat = y*sy + ty
            if lon < minx: minx = lon
            if lon > maxx: maxx = lon
            if lat < miny: miny = lat
            if lat > maxy: maxy = lat
    if minx > maxx or miny > maxy:
        return (-180.0, -90.0, 180.0, 90.0)
    return (float(minx), float(miny), float(maxx), float(maxy))

INSIDE, LEFT, RIGHT, BOTTOM, TOP = 0, 1, 2, 4, 8
def _code(x, y, xmin, ymin, xmax, ymax):
    code = INSIDE
    if x < xmin: code |= LEFT
    elif x > xmax: code |= RIGHT
    if y < ymin: code |= BOTTOM
    elif y > ymax: code |= TOP
    return code

def clip_segment(p0, p1, bbox):
    x0, y0 = p0; x1, y1 = p1
    xmin, ymin, xmax, ymax = bbox
    c0 = _code(x0,y0,xmin,ymin,xmax,ymax)
    c1 = _code(x1,y1,xmin,ymin,xmax,ymax)
    while True:
        if not (c0 | c1):
            return [(x0,y0), (x1,y1)]
        if c0 & c1:
            return []
        co = c0 or c1
        if co & TOP:
            x = x0 + (x1 - x0) * (ymax - y0) / (y1 - y0); y = ymax
        elif co & BOTTOM:
            x = x0 + (x1 - x0) * (ymin - y0) / (y1 - y0); y = ymin
        elif co & RIGHT:
            y = y0 + (y1 - y0) * (xmax - x0) / (x1 - x0); x = xmax
        else:
            y = y0 + (y1 - y0) * (xmin - x0) / (x1 - x0); x = xmin
        if co == c0:
            x0, y0 = x, y; c0 = _code(x0,y0,xmin,ymin,xmax,ymax)
        else:
            x1, y1 = x, y; c1 = _code(x1,y1,xmin,ymin,xmax,ymax)

def split_and_clip_polyline(points, bbox):
    if len(points) < 2: return []
    out = []; current = []
    for i in range(len(points)-1):
        a = points[i]; b = points[i+1]
        clipped = clip_segment(a, b, bbox)
        if not clipped:
            if current:
                out.append(current); current = []
            continue
        a2, b2 = clipped
        if not current:
            current = [a2, b2]
        else:
            if current[-1] != a2:
                current.append(a2)
            current.append(b2)
        xmin,ymin,xmax,ymax = bbox
        outside_b = (b[0] < xmin or b[0] > xmax or b[1] < ymin or b[1] > ymax)
        if outside_b:
            out.append(current); current = []
    if current: out.append(current)
    return [seg for seg in out if len(seg) >= 2]

AUS_LON, AUS_LAT = 133.7751, -25.2744

def assign_curve_params(flows):
    params = {}
    aus_vec = ll_to_vec(AUS_LON, AUS_LAT)
    dists = []
    for f in flows:
        dest = ll_to_vec(f['dest_lon'], f['dest_lat'])
        d = math.acos(float(np.clip(np.dot(aus_vec/np.linalg.norm(aus_vec),
                                           dest/np.linalg.norm(dest)), -1.0, 1.0)))
        dists.append(d)
    maxd = max(dists) if dists else 1.0
    if maxd == 0:
        maxd = 1.0
    for i, d in enumerate(dists):
        h = 0.1 + 0.2 * math.sqrt(d/maxd)
        params[i] = {'height': min(h, 0.32), 'direction': (1 if i%2==0 else -1)}
    return params

def add_curves_to_flows_with_clipping(flow_data, bbox, n_points=24):
    curve_params = assign_curve_params(flow_data)
    features = []
    for idx, f in enumerate(flow_data):
        p = curve_params[idx]
        pts = curved_arc_points(f['origin_lon'], f['origin_lat'],
                                f['dest_lon'], f['dest_lat'],
                                height=p['height'], direction=p['direction'], n=n_points)
        
        # DON'T unwrap - keep the continuous coordinates from curve generation
        # The curve function already handles longitude continuity correctly
        pts_float = [(float(x), float(y)) for x,y in pts]

        inside = split_and_clip_polyline(pts_float, bbox)
        for seg in inside:
            for i in range(len(seg)-1):
                features.append({
                    'country': f.get('country'),
                    'year': f.get('year'),
                    'value': f.get('value'),
                    'origin_lon': seg[i][0],
                    'origin_lat': seg[i][1],
                    'dest_lon': seg[i+1][0],
                    'dest_lat': seg[i+1][1],
                    'segment': i,
                    'total_segments': len(seg)-1
                })
    return features

def main():
    topo_path = 'js/ne_110m_admin_0_countries.topojson'
    flow_exports = 'data/NEW_flow_lines_exports.json'
    flow_imports = 'data/NEW_flow_lines_imports.json'
    if not os.path.exists(topo_path):
        print('Missing TopoJSON:', topo_path); return
    if not os.path.exists(flow_exports) or not os.path.exists(flow_imports):
        print('Missing flow JSONs.'); return
    bbox = topo_bbox(topo_path)
    print('Original map bbox:', bbox)
    
    # Extend bbox to handle westward Pacific crossings
    # Westward from Australia (133°) through antipode (84°) to USA requires going below 0°
    # Allow longitudes from -180 (or lower) to positive range
    extended_bbox = (-360.0, bbox[1], 270.0, bbox[3])
    print('Extended bbox for flows:', extended_bbox)
    
    with open(flow_exports, 'r', encoding='utf-8') as f: exports = json.load(f)
    with open(flow_imports, 'r', encoding='utf-8') as f: imports = json.load(f)
    curved_exports = add_curves_to_flows_with_clipping(exports, extended_bbox, n_points=24)
    curved_imports = add_curves_to_flows_with_clipping(imports, extended_bbox, n_points=24)
    with open(flow_exports, 'w', encoding='utf-8') as f: json.dump(curved_exports, f, indent=2)
    with open(flow_imports, 'w', encoding='utf-8') as f: json.dump(curved_imports, f, indent=2)
    print('Wrote:', flow_exports, 'and', flow_imports)

if __name__ == '__main__':
    main()
