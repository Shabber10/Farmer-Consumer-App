import math


def haversine_meters(lat1, lon1, lat2, lon2):
    """Return great-circle distance in meters between two WGS84 coordinates."""
    if None in (lat1, lon1, lat2, lon2):
        return None
    r = 6371000.0
    phi1, phi2 = math.radians(float(lat1)), math.radians(float(lat2))
    dphi = math.radians(float(lat2) - float(lat1))
    dlambda = math.radians(float(lon2) - float(lon1))
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    return 2.0 * r * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))


def latlng_to_hex(lat, lng, hex_size_m=1000.0):
    """Map WGS84 (lat, lng) to pointy-top axial hex coordinates (q, r)."""
    lat_f, lng_f = float(lat), float(lng)
    # Local equirectangular projection in meters
    x = lng_f * 111320.0 * math.cos(math.radians(lat_f))
    y = lat_f * 110540.0
    q = (math.sqrt(3.0) / 3.0 * x - 1.0 / 3.0 * y) / hex_size_m
    r = (2.0 / 3.0 * y) / hex_size_m
    return _axial_round(q, r)


def _axial_round(q, r):
    s = -q - r
    rq, rr, rs = round(q), round(r), round(s)
    q_diff, r_diff, s_diff = abs(rq - q), abs(rr - r), abs(rs - s)
    if q_diff > r_diff and q_diff > s_diff:
        rq = -rr - rs
    elif r_diff > s_diff:
        rr = -rq - rs
    return int(rq), int(rr)


def hex_ring_distance(lat1, lng1, lat2, lng2, hex_size_m=1000.0):
    """Return axial hex ring distance between two coordinates."""
    if None in (lat1, lng1, lat2, lng2):
        return 0
    q1, r1 = latlng_to_hex(lat1, lng1, hex_size_m)
    q2, r2 = latlng_to_hex(lat2, lng2, hex_size_m)
    dq, dr = q1 - q2, r1 - r2
    return int((abs(dq) + abs(dq + dr) + abs(dr)) / 2)


def is_visible_in_expanding_hex_ring(farmer_lat, farmer_lng, buyer_lat, buyer_lng, dispatch_started_at, max_km=20.0, now=None):
    """
    Rapido-style expanding hex-ring geo-dispatch:
    - 0-10 mins: Ring <= 1 (nearest hexes)
    - Every +10 mins: expands +1 hex ring up to max_km
    """
    if None in (farmer_lat, farmer_lng, buyer_lat, buyer_lng):
        return True
    dist_m = haversine_meters(farmer_lat, farmer_lng, buyer_lat, buyer_lng)
    if dist_m is not None and dist_m > float(max_km or 20.0) * 1000.0:
        return False
    if not dispatch_started_at:
        return True
    from datetime import datetime
    curr = now or datetime.utcnow()
    elapsed_mins = max(0.0, (curr - dispatch_started_at).total_seconds() / 60.0)
    allowed_ring = 1 + int(elapsed_mins // 10.0)
    ring = hex_ring_distance(farmer_lat, farmer_lng, buyer_lat, buyer_lng, hex_size_m=1000.0)
    return ring <= allowed_ring
