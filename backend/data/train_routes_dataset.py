from typing import Dict, List, Any, Optional

"""
RailVue AI - Dataset-Driven Ordered Train Routes Master Catalog
Stores deterministic ordered routes for all supported dataset trains.
Every station has a strict sequence number (1..N), station code, station name, distance from source (km), and scheduled timetable arrival/departure times.
"""

TRAIN_ROUTES_CATALOG: Dict[str, Dict[str, Any]] = {
    "12301": {
        "train_number": "12301",
        "train_name": "Howrah Rajdhani Express",
        "train_type": "Rajdhani Express",
        "zone": "ER",
        "source": "Howrah Junction",
        "source_code": "HWH",
        "destination": "New Delhi",
        "destination_code": "NDLS",
        "route_id": "route_12301",
        "total_distance_km": 1447.0,
        "route": [
            {"sequence": 1, "station_code": "HWH", "station_name": "Howrah Junction", "distance_from_source": 0.0, "scheduled_arrival": "16:50", "scheduled_departure": "16:50"},
            {"sequence": 2, "station_code": "DHN", "station_name": "Dhanbad Junction", "distance_from_source": 259.0, "scheduled_arrival": "19:55", "scheduled_departure": "20:00"},
            {"sequence": 3, "station_code": "GAYA", "station_name": "Gaya Junction", "distance_from_source": 458.0, "scheduled_arrival": "22:19", "scheduled_departure": "22:22"},
            {"sequence": 4, "station_code": "DDU", "station_name": "Pt DD Upadhyaya Junction", "distance_from_source": 660.0, "scheduled_arrival": "00:45", "scheduled_departure": "00:55"},
            {"sequence": 5, "station_code": "PRYJ", "station_name": "Prayagraj Junction", "distance_from_source": 812.0, "scheduled_arrival": "02:33", "scheduled_departure": "02:35"},
            {"sequence": 6, "station_code": "CNB", "station_name": "Kanpur Central", "distance_from_source": 1007.0, "scheduled_arrival": "04:50", "scheduled_departure": "04:55"},
            {"sequence": 7, "station_code": "NDLS", "station_name": "New Delhi", "distance_from_source": 1447.0, "scheduled_arrival": "10:05", "scheduled_departure": "10:05"}
        ]
    },
    "12302": {
        "train_number": "12302",
        "train_name": "Howrah Rajdhani Express",
        "train_type": "Rajdhani Express",
        "zone": "ER",
        "source": "New Delhi",
        "source_code": "NDLS",
        "destination": "Howrah Junction",
        "destination_code": "HWH",
        "route_id": "route_12302",
        "total_distance_km": 1447.0,
        "route": [
            {"sequence": 1, "station_code": "NDLS", "station_name": "New Delhi", "distance_from_source": 0.0, "scheduled_arrival": "16:55", "scheduled_departure": "16:55"},
            {"sequence": 2, "station_code": "CNB", "station_name": "Kanpur Central", "distance_from_source": 440.0, "scheduled_arrival": "21:30", "scheduled_departure": "21:35"},
            {"sequence": 3, "station_code": "PRYJ", "station_name": "Prayagraj Junction", "distance_from_source": 635.0, "scheduled_arrival": "23:40", "scheduled_departure": "23:42"},
            {"sequence": 4, "station_code": "DDU", "station_name": "Pt DD Upadhyaya Junction", "distance_from_source": 788.0, "scheduled_arrival": "02:15", "scheduled_departure": "02:25"},
            {"sequence": 5, "station_code": "GAYA", "station_name": "Gaya Junction", "distance_from_source": 994.0, "scheduled_arrival": "05:35", "scheduled_departure": "05:38"},
            {"sequence": 6, "station_code": "DHN", "station_name": "Dhanbad Junction", "distance_from_source": 1195.0, "scheduled_arrival": "08:40", "scheduled_departure": "08:45"},
            {"sequence": 7, "station_code": "HWH", "station_name": "Howrah Junction", "distance_from_source": 1447.0, "scheduled_arrival": "12:15", "scheduled_departure": "12:15"}
        ]
    },
    "12951": {
        "train_number": "12951",
        "train_name": "Mumbai Rajdhani Express",
        "train_type": "Rajdhani Express",
        "zone": "WR",
        "source": "Mumbai Central",
        "source_code": "MMCT",
        "destination": "New Delhi",
        "destination_code": "NDLS",
        "route_id": "route_12951",
        "total_distance_km": 1386.0,
        "route": [
            {"sequence": 1, "station_code": "MMCT", "station_name": "Mumbai Central", "distance_from_source": 0.0, "scheduled_arrival": "17:00", "scheduled_departure": "17:00"},
            {"sequence": 2, "station_code": "ST", "station_name": "Surat", "distance_from_source": 263.0, "scheduled_arrival": "19:43", "scheduled_departure": "19:48"},
            {"sequence": 3, "station_code": "BRC", "station_name": "Vadodara Junction", "distance_from_source": 393.0, "scheduled_arrival": "21:16", "scheduled_departure": "21:26"},
            {"sequence": 4, "station_code": "KOTA", "station_name": "Kota Junction", "distance_from_source": 910.0, "scheduled_arrival": "03:15", "scheduled_departure": "03:25"},
            {"sequence": 5, "station_code": "NDLS", "station_name": "New Delhi", "distance_from_source": 1386.0, "scheduled_arrival": "08:32", "scheduled_departure": "08:32"}
        ]
    },
    "12002": {
        "train_number": "12002",
        "train_name": "Bhopal Shatabdi Express",
        "train_type": "Shatabdi Express",
        "zone": "NCR",
        "source": "New Delhi",
        "source_code": "NDLS",
        "destination": "Rani Kamlapati",
        "destination_code": "RKMP",
        "route_id": "route_12002",
        "total_distance_km": 706.0,
        "route": [
            {"sequence": 1, "station_code": "NDLS", "station_name": "New Delhi", "distance_from_source": 0.0, "scheduled_arrival": "06:00", "scheduled_departure": "06:00"},
            {"sequence": 2, "station_code": "AGC", "station_name": "Agra Cantt", "distance_from_source": 195.0, "scheduled_arrival": "07:50", "scheduled_departure": "07:55"},
            {"sequence": 3, "station_code": "GWL", "station_name": "Gwalior Junction", "distance_from_source": 313.0, "scheduled_arrival": "09:23", "scheduled_departure": "09:28"},
            {"sequence": 4, "station_code": "RKMP", "station_name": "Rani Kamlapati", "distance_from_source": 706.0, "scheduled_arrival": "14:40", "scheduled_departure": "14:40"}
        ]
    },
    "12309": {
        "train_number": "12309",
        "train_name": "Patna Tejas Rajdhani Express",
        "train_type": "Rajdhani Express",
        "zone": "ECR",
        "source": "Rajendra Nagar",
        "source_code": "RJPB",
        "destination": "New Delhi",
        "destination_code": "NDLS",
        "route_id": "route_12309",
        "total_distance_km": 1002.0,
        "route": [
            {"sequence": 1, "station_code": "RJPB", "station_name": "Rajendra Nagar", "distance_from_source": 0.0, "scheduled_arrival": "19:10", "scheduled_departure": "19:10"},
            {"sequence": 2, "station_code": "DDU", "station_name": "Pt DD Upadhyaya Junction", "distance_from_source": 211.0, "scheduled_arrival": "22:12", "scheduled_departure": "22:22"},
            {"sequence": 3, "station_code": "MZP", "station_name": "Mirzapur", "distance_from_source": 274.0, "scheduled_arrival": "23:55", "scheduled_departure": "23:57"},
            {"sequence": 4, "station_code": "PRYJ", "station_name": "Prayagraj Junction", "distance_from_source": 363.0, "scheduled_arrival": "00:45", "scheduled_departure": "00:47"},
            {"sequence": 5, "station_code": "CNB", "station_name": "Kanpur Central", "distance_from_source": 558.0, "scheduled_arrival": "03:10", "scheduled_departure": "03:15"},
            {"sequence": 6, "station_code": "NDLS", "station_name": "New Delhi", "distance_from_source": 1002.0, "scheduled_arrival": "07:40", "scheduled_departure": "07:40"}
        ]
    },
    "22436": {
        "train_number": "22436",
        "train_name": "Vande Bharat Express",
        "train_type": "Vande Bharat",
        "zone": "NR",
        "source": "New Delhi",
        "source_code": "NDLS",
        "destination": "Varanasi Junction",
        "destination_code": "BSB",
        "route_id": "route_22436",
        "total_distance_km": 759.0,
        "route": [
            {"sequence": 1, "station_code": "NDLS", "station_name": "New Delhi", "distance_from_source": 0.0, "scheduled_arrival": "06:00", "scheduled_departure": "06:00"},
            {"sequence": 2, "station_code": "CNB", "station_name": "Kanpur Central", "distance_from_source": 440.0, "scheduled_arrival": "10:08", "scheduled_departure": "10:10"},
            {"sequence": 3, "station_code": "PRYJ", "station_name": "Prayagraj Junction", "distance_from_source": 635.0, "scheduled_arrival": "12:12", "scheduled_departure": "12:14"},
            {"sequence": 4, "station_code": "BSB", "station_name": "Varanasi Junction", "distance_from_source": 759.0, "scheduled_arrival": "14:00", "scheduled_departure": "14:00"}
        ]
    },
    "12259": {
        "train_number": "12259",
        "train_name": "Sealdah Duronto Express",
        "train_type": "Duronto Express",
        "zone": "ER",
        "source": "Bikaner Junction",
        "source_code": "BKN",
        "destination": "Sealdah",
        "destination_code": "SDAH",
        "route_id": "route_12259",
        "total_distance_km": 1918.0,
        "route": [
            {"sequence": 1, "station_code": "BKN", "station_name": "Bikaner Junction", "distance_from_source": 0.0, "scheduled_arrival": "12:15", "scheduled_departure": "12:15"},
            {"sequence": 2, "station_code": "NDLS", "station_name": "New Delhi", "distance_from_source": 448.0, "scheduled_arrival": "19:40", "scheduled_departure": "20:00"},
            {"sequence": 3, "station_code": "DHN", "station_name": "Dhanbad Junction", "distance_from_source": 1690.0, "scheduled_arrival": "09:10", "scheduled_departure": "09:15"},
            {"sequence": 4, "station_code": "ASN", "station_name": "Asansol Junction", "distance_from_source": 1748.0, "scheduled_arrival": "10:15", "scheduled_departure": "10:20"},
            {"sequence": 5, "station_code": "SDAH", "station_name": "Sealdah", "distance_from_source": 1918.0, "scheduled_arrival": "12:45", "scheduled_departure": "12:45"}
        ]
    },
    "12624": {
        "train_number": "12624",
        "train_name": "Chennai Mail",
        "train_type": "Superfast Express",
        "zone": "SR",
        "source": "Trivandrum Central",
        "source_code": "TVC",
        "destination": "Chennai Central",
        "destination_code": "MAS",
        "route_id": "route_12624",
        "total_distance_km": 918.0,
        "route": [
            {"sequence": 1, "station_code": "TVC", "station_name": "Trivandrum Central", "distance_from_source": 0.0, "scheduled_arrival": "15:00", "scheduled_departure": "15:00"},
            {"sequence": 2, "station_code": "ERODE", "station_name": "Erode Junction", "distance_from_source": 520.0, "scheduled_arrival": "23:45", "scheduled_departure": "23:50"},
            {"sequence": 3, "station_code": "SALEM", "station_name": "Salem Junction", "distance_from_source": 580.0, "scheduled_arrival": "00:47", "scheduled_departure": "00:50"},
            {"sequence": 4, "station_code": "MAS", "station_name": "Chennai Central", "distance_from_source": 918.0, "scheduled_arrival": "07:40", "scheduled_departure": "07:40"}
        ]
    },
    "12555": {
        "train_number": "12555",
        "train_name": "Gorakhdham Express",
        "train_type": "Superfast Express",
        "zone": "NER",
        "source": "Gorakhpur JN",
        "source_code": "GKP",
        "destination": "Hisar",
        "destination_code": "HSR",
        "route_id": "route_12555",
        "total_distance_km": 744.0,
        "route": [
            {"sequence": 1, "station_code": "GKP", "station_name": "Gorakhpur JN", "distance_from_source": 0.0, "scheduled_arrival": "16:35", "scheduled_departure": "16:35"},
            {"sequence": 2, "station_code": "LKO", "station_name": "Lucknow NR", "distance_from_source": 270.0, "scheduled_arrival": "21:30", "scheduled_departure": "21:40"},
            {"sequence": 3, "station_code": "CNB", "station_name": "Kanpur Central", "distance_from_source": 342.0, "scheduled_arrival": "23:18", "scheduled_departure": "23:23"},
            {"sequence": 4, "station_code": "NDLS", "station_name": "New Delhi", "distance_from_source": 782.0, "scheduled_arrival": "05:15", "scheduled_departure": "05:30"},
            {"sequence": 5, "station_code": "HSR", "station_name": "Hisar", "distance_from_source": 948.0, "scheduled_arrival": "10:00", "scheduled_departure": "10:00"}
        ]
    },
    "12230": {
        "train_number": "12230",
        "train_name": "Lucknow Mail",
        "train_type": "Superfast Express",
        "zone": "NR",
        "source": "Lucknow NR",
        "source_code": "LKO",
        "destination": "New Delhi",
        "destination_code": "NDLS",
        "route_id": "route_12230",
        "total_distance_km": 493.0,
        "route": [
            {"sequence": 1, "station_code": "LKO", "station_name": "Lucknow NR", "distance_from_source": 0.0, "scheduled_arrival": "22:00", "scheduled_departure": "22:00"},
            {"sequence": 2, "station_code": "BE", "station_name": "Bareilly Junction", "distance_from_source": 235.0, "scheduled_arrival": "01:38", "scheduled_departure": "01:40"},
            {"sequence": 3, "station_code": "MB", "station_name": "Moradabad Junction", "distance_from_source": 325.0, "scheduled_arrival": "03:17", "scheduled_departure": "03:25"},
            {"sequence": 4, "station_code": "GZB", "station_name": "Ghaziabad Junction", "distance_from_source": 466.0, "scheduled_arrival": "06:15", "scheduled_departure": "06:17"},
            {"sequence": 5, "station_code": "NDLS", "station_name": "New Delhi", "distance_from_source": 493.0, "scheduled_arrival": "06:55", "scheduled_departure": "06:55"}
        ]
    },
    "12839": {
        "train_number": "12839",
        "train_name": "Howrah Mail",
        "train_type": "Superfast Express",
        "zone": "SER",
        "source": "Howrah Junction",
        "source_code": "HWH",
        "destination": "Chennai Central",
        "destination_code": "MAS",
        "route_id": "route_12839",
        "total_distance_km": 1660.0,
        "route": [
            {"sequence": 1, "station_code": "HWH", "station_name": "Howrah Junction", "distance_from_source": 0.0, "scheduled_arrival": "23:55", "scheduled_departure": "23:55"},
            {"sequence": 2, "station_code": "KGP", "station_name": "Kharagpur Junction", "distance_from_source": 116.0, "scheduled_arrival": "01:40", "scheduled_departure": "01:45"},
            {"sequence": 3, "station_code": "BHC", "station_name": "Bhadrak", "distance_from_source": 294.0, "scheduled_arrival": "04:15", "scheduled_departure": "04:17"},
            {"sequence": 4, "station_code": "MAS", "station_name": "Chennai Central", "distance_from_source": 1660.0, "scheduled_arrival": "03:45", "scheduled_departure": "03:45"}
        ]
    },
    "12345": {
        "train_number": "12345",
        "train_name": "Prayagraj Express",
        "train_type": "Superfast Express",
        "zone": "NCR",
        "source": "New Delhi",
        "source_code": "NDLS",
        "destination": "Prayagraj Junction",
        "destination_code": "PRYJ",
        "route_id": "route_12345",
        "total_distance_km": 635.0,
        "route": [
            {"sequence": 1, "station_code": "NDLS", "station_name": "New Delhi", "distance_from_source": 0.0, "scheduled_arrival": "22:10", "scheduled_departure": "22:10"},
            {"sequence": 2, "station_code": "CNB", "station_name": "Kanpur Central", "distance_from_source": 440.0, "scheduled_arrival": "04:30", "scheduled_departure": "04:35"},
            {"sequence": 3, "station_code": "PRYJ", "station_name": "Prayagraj Junction", "distance_from_source": 635.0, "scheduled_arrival": "07:00", "scheduled_departure": "07:00"}
        ]
    },
    "12401": {
        "train_number": "12401",
        "train_name": "Magadh Express",
        "train_type": "Superfast Express",
        "zone": "ECR",
        "source": "New Delhi",
        "source_code": "NDLS",
        "destination": "Islampur",
        "destination_code": "IPR",
        "route_id": "route_12401",
        "total_distance_km": 1065.0,
        "route": [
            {"sequence": 1, "station_code": "NDLS", "station_name": "New Delhi", "distance_from_source": 0.0, "scheduled_arrival": "21:05", "scheduled_departure": "21:05"},
            {"sequence": 2, "station_code": "CNB", "station_name": "Kanpur Central", "distance_from_source": 440.0, "scheduled_arrival": "03:15", "scheduled_departure": "03:20"},
            {"sequence": 3, "station_code": "PRYJ", "station_name": "Prayagraj Junction", "distance_from_source": 635.0, "scheduled_arrival": "05:40", "scheduled_departure": "05:45"},
            {"sequence": 4, "station_code": "BXR", "station_name": "Buxar Junction", "distance_from_source": 868.0, "scheduled_arrival": "09:30", "scheduled_departure": "09:32"},
            {"sequence": 5, "station_code": "IPR", "station_name": "Islampur", "distance_from_source": 1065.0, "scheduled_arrival": "13:30", "scheduled_departure": "13:30"}
        ]
    }
}

def search_trains_dataset(query: str) -> List[Dict[str, Any]]:
    """
    Searches the dataset by:
    - Train Number
    - Train Name
    - Source Station (Name or Code)
    - Destination Station (Name or Code)
    """
    if not query:
        return [get_train_summary(t) for t in TRAIN_ROUTES_CATALOG.values()]

    q = query.strip().lower()
    results = []
    for train in TRAIN_ROUTES_CATALOG.values():
        num_match = q in train["train_number"].lower()
        name_match = q in train["train_name"].lower()
        src_match = q in train["source"].lower() or q in train["source_code"].lower()
        dst_match = q in train["destination"].lower() or q in train["destination_code"].lower()

        if num_match or name_match or src_match or dst_match:
            results.append(get_train_summary(train))

    return results

def get_train_summary(train: Dict[str, Any]) -> Dict[str, Any]:
    """Returns compact summary dict for search results."""
    return {
        "train_number": train["train_number"],
        "train_name": train["train_name"],
        "train_type": train["train_type"],
        "zone": train["zone"],
        "source": train["source"],
        "source_code": train["source_code"],
        "destination": train["destination"],
        "destination_code": train["destination_code"],
        "total_distance_km": train["total_distance_km"],
        "route_length_stations": len(train["route"])
    }

def get_train_route_by_number(train_number: str) -> Optional[Dict[str, Any]]:
    """Returns complete route record for train number or None."""
    return TRAIN_ROUTES_CATALOG.get(str(train_number).strip())
