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
