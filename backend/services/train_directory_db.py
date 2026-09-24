import os
import sys
import sqlite3
import csv
import re
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("TrainDirectoryDB")
logging.basicConfig(level=logging.INFO)

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
DB_PATH = os.path.join(DATA_DIR, "train_directory.db")
CSV_PATH = os.path.join(DATA_DIR, "Train_details_22122017.csv")

def normalize_text(text: Optional[str]) -> str:
    if not text:
        return ""
    return text.strip().strip("'\"").strip()

def infer_train_type(name: str) -> str:
    name_upper = name.upper()
    if "RAJ" in name_upper or "RAJDHANI" in name_upper:
        return "Rajdhani Express"
    if "SHATABDI" in name_upper:
        return "Shatabdi Express"
    if "VANDE" in name_upper:
        return "Vande Bharat"
    if "DURONTO" in name_upper:
        return "Duronto Express"
    if "GARIB" in name_upper:
        return "Garib Rath"
    if "JAN SHATABDI" in name_upper or "JANSHATABDI" in name_upper:
        return "Jan Shatabdi"
    if "SF" in name_upper or "SUPERFAST" in name_upper:
        return "Superfast Express"
    if "MAIL" in name_upper:
        return "Mail"
    if "PASS" in name_upper or "PASSENGER" in name_upper:
        return "Passenger"
    if "EXP" in name_upper or "EXPRESS" in name_upper:
        return "Express"
    return "Express"

class TrainDirectoryDB:
    def __init__(self, db_path: str = DB_PATH, csv_path: str = CSV_PATH):
        self.db_path = db_path
        self.csv_path = csv_path
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        conn = self._get_connection()
        cursor = conn.cursor()

        # Create trains table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS trains (
                train_number TEXT PRIMARY KEY,
                train_name TEXT,
                train_type TEXT,
                source_code TEXT,
                source_name TEXT,
                destination_code TEXT,
                destination_name TEXT,
                departure_time TEXT,
                arrival_time TEXT,
                total_distance_km REAL,
                total_stops INTEGER
            )
        """)

        # Create train_stations table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS train_stations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                train_number TEXT,
                station_seq INTEGER,
                station_code TEXT,
                station_name TEXT,
                arrival_time TEXT,
                departure_time TEXT,
                distance_km REAL,
                FOREIGN KEY (train_number) REFERENCES trains(train_number)
            )
        """)

        # Create Indexes for lightning-fast lookups
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_trains_number ON trains(train_number)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_trains_name ON trains(train_name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_trains_src ON trains(source_code)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_trains_dst ON trains(destination_code)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_ts_train_seq ON train_stations(train_number, station_seq)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_ts_station ON train_stations(station_code)")

        conn.commit()

        # Check if database has trains
        cursor.execute("SELECT COUNT(*) FROM trains")
        count = cursor.fetchone()[0]
        conn.close()

        if count == 0:
            if os.path.exists(self.csv_path):
                logger.info("[DB] Train directory is empty. Ingesting Train_details_22122017.csv...")
                self.import_csv()
            else:
                logger.info("[DB] Ingesting from curated_trains.json and train routes catalog...")
                self.import_catalog_and_curated()
        else:
            logger.info(f"[DB] Train directory ready with {count} indexed trains.")

    def import_catalog_and_curated(self):
        """Imports from curated_trains.json, train_catalog.csv, and train_routes_dataset."""
        conn = self._get_connection()
        cursor = conn.cursor()

        # 1. Ingest routes from train_routes_dataset
        try:
            from data.train_routes_dataset import TRAIN_ROUTES_CATALOG
            for t_no, t_data in TRAIN_ROUTES_CATALOG.items():
                routes = t_data.get("route", [])
                cursor.execute("""
                    INSERT OR REPLACE INTO trains (
                        train_number, train_name, train_type, source_code, source_name,
                        destination_code, destination_name, departure_time, arrival_time,
                        total_distance_km, total_stops
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    t_no,
                    t_data.get("train_name", f"Train {t_no}"),
                    t_data.get("train_type", "Express"),
                    t_data.get("source_code", "ORG"),
                    t_data.get("source", "Origin"),
                    t_data.get("destination_code", "DEST"),
                    t_data.get("destination", "Destination"),
                    routes[0].get("scheduled_departure", "00:00") if routes else "00:00",
                    routes[-1].get("scheduled_arrival", "00:00") if routes else "00:00",
                    float(t_data.get("total_distance_km", 500.0)),
                    len(routes)
                ))
                for st in routes:
                    cursor.execute("""
                        INSERT INTO train_stations (
                            train_number, station_seq, station_code, station_name,
                            arrival_time, departure_time, distance_km
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        t_no,
                        st.get("sequence", 1),
                        st.get("station_code", "STN"),
                        st.get("station_name", "Station"),
                        st.get("scheduled_arrival", "00:00"),
                        st.get("scheduled_departure", "00:00"),
                        float(st.get("distance_from_source", 0.0))
                    ))
        except Exception as e:
            logger.warning(f"[DB] Error loading routes catalog: {e}")

        # 2. Ingest from curated_trains.json
        curated_json_path = os.path.join(DATA_DIR, "curated_train_directory", "curated_trains.json")
        if os.path.exists(curated_json_path):
            try:
                import json
                with open(curated_json_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    trains = data.get("trains", [])
                    train_rows = [
                        (
                            t.get("train_number"),
                            t.get("train_name"),
                            t.get("train_type", "Express"),
                            t.get("source_code", "ORG"),
                            t.get("source_name", "Origin"),
                            t.get("destination_code", "DEST"),
                            t.get("destination_name", "Destination"),
                            t.get("departure_time", "00:00"),
                            t.get("arrival_time", "00:00"),
                            float(t.get("total_distance_km", 0.0) or 0.0),
                            int(t.get("total_stops", 2) or 2)
                        )
                        for t in trains if t.get("train_number")
                    ]
                    cursor.executemany("""
                        INSERT OR IGNORE INTO trains (
                            train_number, train_name, train_type, source_code, source_name,
                            destination_code, destination_name, departure_time, arrival_time,
                            total_distance_km, total_stops
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, train_rows)
            except Exception as e:
                logger.warning(f"[DB] Error loading curated_trains.json: {e}")

        # 3. Ingest from train_catalog.csv
        catalog_csv_path = os.path.join(DATA_DIR, "train_catalog.csv")
        if os.path.exists(catalog_csv_path):
            try:
                with open(catalog_csv_path, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        t_no = normalize_text(row.get("train_number", ""))
                        if not t_no:
                            continue
                        cursor.execute("""
                            INSERT OR IGNORE INTO trains (
                                train_number, train_name, train_type, source_code, source_name,
                                destination_code, destination_name, departure_time, arrival_time,
                                total_distance_km, total_stops
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            t_no,
                            normalize_text(row.get("train_name", "")),
                            normalize_text(row.get("train_type", "Express")),
                            normalize_text(row.get("source_code", "")),
                            normalize_text(row.get("source_name", "")),
                            normalize_text(row.get("destination_code", "")),
                            normalize_text(row.get("destination_name", "")),
                            "06:00",
                            "20:00",
                            float(row.get("total_distance_km", 500.0) or 500.0),
                            10
                        ))
            except Exception as e:
                logger.warning(f"[DB] Error loading train_catalog.csv: {e}")

        conn.commit()
        cursor.execute("SELECT COUNT(*) FROM trains")
        cnt = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM train_stations")
        st_cnt = cursor.fetchone()[0]
        conn.close()
        logger.info(f"[DB] Ingested fallback data: {cnt} trains, {st_cnt} station stops.")

    def import_csv(self):
        if not os.path.exists(self.csv_path):
            logger.error(f"[DB] CSV file not found at {self.csv_path}")
            return

        logger.info(f"[DB] Ingesting CSV from {self.csv_path}...")
        conn = self._get_connection()
        cursor = conn.cursor()

        trains_map = {}
        stations_list = []

        with open(self.csv_path, mode="r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            for row in reader:
                raw_t_no = normalize_text(row.get("Train No", ""))
                if not raw_t_no:
                    continue

                # Strip non-digits or leading single quotes
                t_no = raw_t_no.lstrip("'").strip()
                t_name = normalize_text(row.get("Train Name", ""))
                seq_str = normalize_text(row.get("SEQ", "1"))
                try:
                    seq = int(seq_str)
                except ValueError:
                    seq = 1

                st_code = normalize_text(row.get("Station Code", "")).upper()
                st_name = normalize_text(row.get("Station Name", "")).title()
                arr_time = normalize_text(row.get("Arrival time", "00:00:00"))[:5]
                dep_time = normalize_text(row.get("Departure Time", "00:00:00"))[:5]
                
                dist_str = normalize_text(row.get("Distance", "0"))
                try:
                    dist = float(dist_str)
                except ValueError:
                    dist = 0.0

                src_code = normalize_text(row.get("Source Station", "")).upper()
                src_name = normalize_text(row.get("Source Station Name", "")).title()
                dst_code = normalize_text(row.get("Destination Station", "")).upper()
                dst_name = normalize_text(row.get("Destination Station Name", "")).title()

                if t_no not in trains_map:
                    trains_map[t_no] = {
                        "train_number": t_no,
                        "train_name": t_name,
                        "train_type": infer_train_type(t_name),
                        "source_code": src_code or st_code,
                        "source_name": src_name or st_name,
                        "destination_code": dst_code or st_code,
                        "destination_name": dst_name or st_name,
                        "departure_time": dep_time if seq == 1 else "00:00",
                        "arrival_time": arr_time,
                        "total_distance_km": dist,
                        "total_stops": 1,
                        "max_seq": seq
                    }
                else:
                    t_entry = trains_map[t_no]
                    t_entry["total_stops"] += 1
                    if dist > t_entry["total_distance_km"]:
                        t_entry["total_distance_km"] = dist
                    if seq == 1:
                        t_entry["departure_time"] = dep_time
                    if seq >= t_entry["max_seq"]:
                        t_entry["max_seq"] = seq
                        t_entry["arrival_time"] = arr_time
                        if not t_entry["destination_code"]:
                            t_entry["destination_code"] = dst_code or st_code
                            t_entry["destination_name"] = dst_name or st_name

                stations_list.append((
                    t_no, seq, st_code, st_name, arr_time, dep_time, dist
                ))

        # Insert into trains table
        train_rows = [
            (
                t["train_number"],
                t["train_name"],
                t["train_type"],
                t["source_code"],
                t["source_name"],
                t["destination_code"],
                t["destination_name"],
                t["departure_time"],
                t["arrival_time"],
                t["total_distance_km"],
                t["total_stops"]
            )
            for t in trains_map.values()
        ]

        cursor.executemany("""
            INSERT OR REPLACE INTO trains (
                train_number, train_name, train_type, source_code, source_name,
                destination_code, destination_name, departure_time, arrival_time,
                total_distance_km, total_stops
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, train_rows)

        # Insert into train_stations table in chunks
        chunk_size = 5000
        for i in range(0, len(stations_list), chunk_size):
            chunk = stations_list[i:i + chunk_size]
            cursor.executemany("""
                INSERT INTO train_stations (
                    train_number, station_seq, station_code, station_name,
                    arrival_time, departure_time, distance_km
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, chunk)

        conn.commit()
        conn.close()
        logger.info(f"[DB] Ingestion completed! {len(train_rows)} unique trains and {len(stations_list)} station stops saved.")

    # =========================================================================
    # SEARCH API (Ranked search across full universe)
    # =========================================================================
    def search_trains(self, query: str, limit: int = 15) -> List[Dict[str, Any]]:
        """
        Ranked search:
        1. Exact train number
        2. Train number prefix
        3. Exact train name
        4. Train name prefix
        5. Partial train name
        """
        if not query or len(query.strip()) < 1:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM trains LIMIT ?", (limit,))
            rows = cursor.fetchall()
            conn.close()
            return [dict(r) for r in rows]

        q = query.strip()
        q_lower = q.lower()
        q_upper = q.upper()

        conn = self._get_connection()
        cursor = conn.cursor()

        # SQL with custom ordering priority
        query_sql = """
            SELECT *,
                CASE
                    WHEN train_number = ? THEN 1
                    WHEN train_number LIKE ? THEN 2
                    WHEN LOWER(train_name) = ? THEN 3
                    WHEN LOWER(train_name) LIKE ? THEN 4
                    WHEN LOWER(train_name) LIKE ? THEN 5
                    WHEN train_number LIKE ? THEN 6
                    ELSE 7
                END AS search_rank
            FROM trains
            WHERE
                train_number = ?
                OR train_number LIKE ?
                OR LOWER(train_name) LIKE ?
                OR source_code = ?
                OR destination_code = ?
                OR LOWER(source_name) LIKE ?
                OR LOWER(destination_name) LIKE ?
            ORDER BY search_rank ASC, total_stops DESC
            LIMIT ?
        """
        
        params = (
            q, f"{q}%", q_lower, f"{q_lower}%", f"%{q_lower}%", f"%{q}%",
            q, f"{q}%", f"%{q_lower}%", q_upper, q_upper, f"%{q_lower}%", f"%{q_lower}%",
            limit
        )

        cursor.execute(query_sql, params)
        rows = cursor.fetchall()
        conn.close()

        results = []
        for r in rows:
            d = dict(r)
            d.pop("search_rank", None)
            results.append(d)

        return results

    # =========================================================================
    # GET SINGLE TRAIN METADATA
    # =========================================================================
    def get_train(self, train_number: str) -> Optional[Dict[str, Any]]:
        t_no = train_number.strip().lstrip("'")
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM trains WHERE train_number = ? LIMIT 1", (t_no,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return None

    # =========================================================================
    # GET TRAIN SCHEDULE / TIMETABLE
    # =========================================================================
    def get_train_schedule(self, train_number: str) -> Dict[str, Any]:
        t_no = train_number.strip().lstrip("'")
        train_info = self.get_train(t_no)
        
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM train_stations 
            WHERE train_number = ? 
            ORDER BY station_seq ASC
        """, (t_no,))
        rows = cursor.fetchall()
        conn.close()

        stations = []
        for r in rows:
            stations.append({
                "sequence": r["station_seq"],
                "station_code": r["station_code"],
                "station_name": r["station_name"],
                "scheduled_arrival": r["arrival_time"] if r["arrival_time"] != "00:00" else "--",
                "scheduled_departure": r["departure_time"] if r["departure_time"] != "00:00" else "--",
                "distance_km": r["distance_km"]
            })

        if not train_info:
            try:
                from app.api.train_registry import train_registry
                reg = train_registry.get_train_by_id(t_no)
                if reg:
                    train_info = {
                        "train_number": reg["train_number"],
                        "train_name": reg["train_name"],
                        "train_type": reg.get("type", "Express"),
                        "source_code": reg.get("origin_code", "ORG"),
                        "source_name": reg.get("origin", "Origin"),
                        "destination_code": reg.get("destination_code", "DEST"),
                        "destination_name": reg.get("destination", "Destination"),
                        "total_distance_km": reg.get("total_distance_km", 600.0),
                        "departure_time": "06:00",
                        "arrival_time": "20:00"
                    }
            except Exception:
                pass

        if not stations and train_info:
            tot_dist = float(train_info.get("total_distance_km", 500.0) or 500.0)
            stations = [
                {
                    "sequence": 1,
                    "station_code": train_info.get("source_code", "ORG"),
                    "station_name": train_info.get("source_name", "Origin"),
                    "scheduled_arrival": train_info.get("departure_time", "06:00"),
                    "scheduled_departure": train_info.get("departure_time", "06:00"),
                    "distance_km": 0.0
                },
                {
                    "sequence": 2,
                    "station_code": train_info.get("destination_code", "DEST"),
                    "station_name": train_info.get("destination_name", "Destination"),
                    "scheduled_arrival": train_info.get("arrival_time", "20:00"),
                    "scheduled_departure": train_info.get("arrival_time", "20:00"),
                    "distance_km": tot_dist
                }
            ]

        if train_info:
            return {
                "train_number": train_info["train_number"],
                "train_name": train_info["train_name"],
                "train_type": train_info["train_type"],
                "source_station_code": train_info["source_code"],
                "source_station_name": train_info["source_name"],
                "destination_station_code": train_info["destination_code"],
                "destination_station_name": train_info["destination_name"],
                "total_distance_km": train_info["total_distance_km"],
                "stations": stations
            }

        return {
            "train_number": t_no,
            "train_name": f"Train {t_no}",
            "stations": stations
        }

    # =========================================================================
    # STATION RESOLUTION AND FIND TRAINS BETWEEN STATIONS
    # =========================================================================
    COMMON_STATION_ALIASES = {
        "MMCT": ["BCT", "MMCT"],
        "BCT": ["BCT", "MMCT"],
        "MUMBAI CENTRAL": ["BCT", "MMCT"],
        "MUMBAI": ["BCT", "CSMT", "LTT", "BDTS"],
        "CSMT": ["CSMT", "CSTM"],
        "CSTM": ["CSMT", "CSTM"],
        "PRYJ": ["PRYJ", "ALD"],
        "ALD": ["PRYJ", "ALD"],
        "ALLAHABAD": ["PRYJ", "ALD"],
        "DDU": ["DDU", "MGS"],
        "MGS": ["DDU", "MGS"],
        "MUGHALSARAI": ["DDU", "MGS"],
        "RKMP": ["RKMP", "HBJ"],
        "HBJ": ["RKMP", "HBJ"],
        "HABIBGANJ": ["RKMP", "HBJ"],
        "AY": ["AY", "AYC"],
        "AYC": ["AY", "AYC"],
        "AYODHYA": ["AY", "AYC"],
        "DELHI": ["NDLS", "DLI", "NZM", "ANVT"],
        "NEW DELHI": ["NDLS"],
        "HOWRAH": ["HWH"],
        "RANCHI": ["RNC"],
        "KANPUR": ["CNB"],
        "VARANASI": ["BSB"],
        "GOA": ["MAO"],
        "MADGAON": ["MAO"]
    }

    def resolve_station_codes(self, station_input: str) -> List[str]:
        if not station_input:
            return []
        s = station_input.strip()
        # 1. Extract code inside parentheses e.g. "Howrah Junction (HWH)" -> "HWH"
        m = re.search(r'\(([A-Za-z0-9]+)\)', s)
        if m:
            code = m.group(1).upper()
            return self.COMMON_STATION_ALIASES.get(code, [code])
        
        s_upper = s.upper()
        if s_upper in self.COMMON_STATION_ALIASES:
            return self.COMMON_STATION_ALIASES[s_upper]

        conn = self._get_connection()
        cursor = conn.cursor()

        # 2. If 2-5 alphanumeric, check if exact station_code
        if 2 <= len(s_upper) <= 5 and s_upper.isalnum():
            cursor.execute("SELECT station_code FROM train_stations WHERE station_code = ? LIMIT 1", (s_upper,))
            if cursor.fetchone():
                conn.close()
                return self.COMMON_STATION_ALIASES.get(s_upper, [s_upper])

        # 3. Clean keywords (junction, jn, central, cantt, etc.)
        cleaned = re.sub(r'(?i)\b(junction|jn\.?|central|centr\.?|cantt\.?|terminus|terminal|term\.?|city)\b', '', s).strip()
        c_upper = cleaned.upper()
        if c_upper in self.COMMON_STATION_ALIASES:
            conn.close()
            return self.COMMON_STATION_ALIASES[c_upper]

        cursor.execute("""
            SELECT DISTINCT station_code FROM train_stations 
            WHERE station_code LIKE ? OR UPPER(station_name) LIKE ? OR UPPER(station_name) LIKE ?
            ORDER BY CASE WHEN station_code = ? THEN 1 WHEN UPPER(station_name) LIKE ? THEN 2 ELSE 3 END
            LIMIT 5
        """, (f"{c_upper}%", f"{c_upper}%", f"%{c_upper}%", c_upper, f"{c_upper}%"))
        found = [r[0] for r in cursor.fetchall()]
        conn.close()
        return found or [s_upper]

    def _calc_duration(self, dep_str: str, arr_str: str) -> str:
        try:
            dep_parts = [int(p) for p in dep_str.split(":")[:2]]
            arr_parts = [int(p) for p in arr_str.split(":")[:2]]
            dep_min = dep_parts[0] * 60 + dep_parts[1]
            arr_min = arr_parts[0] * 60 + arr_parts[1]
            diff = arr_min - dep_min
            if diff <= 0:
                diff += 24 * 60
            hours = diff // 60
            mins = diff % 60
            return f"{hours}h {mins}m" if mins > 0 else f"{hours}h"
        except Exception:
            return "Calculated on schedule"

    def get_trains_between(self, from_station: str, to_station: str, limit: int = 30) -> List[Dict[str, Any]]:
        from_codes = self.resolve_station_codes(from_station)
        to_codes = self.resolve_station_codes(to_station)

        if not from_codes or not to_codes:
            return []

        conn = self._get_connection()
        cursor = conn.cursor()

        placeholders_from = ",".join(["?"] * len(from_codes))
        placeholders_to = ",".join(["?"] * len(to_codes))

        # Join train_stations twice to find trains that visit from_station then to_station
        sql = f"""
            SELECT 
                t.train_number,
                t.train_name,
                t.train_type,
                s1.station_code AS source_station_code,
                s1.station_name AS source_station_name,
                s2.station_code AS destination_station_code,
                s2.station_name AS destination_station_name,
                s1.departure_time AS departure_time,
                s2.arrival_time AS arrival_time,
                (s2.distance_km - s1.distance_km) AS segment_distance_km,
                t.total_distance_km
            FROM train_stations s1
            JOIN train_stations s2 ON s1.train_number = s2.train_number
            JOIN trains t ON t.train_number = s1.train_number
            WHERE s1.station_code IN ({placeholders_from})
              AND s2.station_code IN ({placeholders_to})
              AND s1.station_seq < s2.station_seq
            ORDER BY t.train_number ASC
            LIMIT ?
        """
        params = list(from_codes) + list(to_codes) + [limit]
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        conn.close()

        results = []
        for r in rows:
            dist = r["segment_distance_km"] if r["segment_distance_km"] > 0 else r["total_distance_km"]
            dep = r["departure_time"] or "08:00"
            arr = r["arrival_time"] or "16:00"
            results.append({
                "train_number": r["train_number"],
                "train_name": r["train_name"],
                "type": r["train_type"] or "Superfast Express",
                "zone": "IR",
                "source_station_code": r["source_station_code"],
                "source_station_name": r["source_station_name"],
                "destination_station_code": r["destination_station_code"],
                "destination_station_name": r["destination_station_name"],
                "departure_time": dep,
                "arrival_time": arr,
                "duration": self._calc_duration(dep, arr),
                "total_distance_km": dist,
                "runs_on": ["Daily"]
            })

        return results

    # =========================================================================
    # SEARCH STATIONS
    # =========================================================================
    def search_stations(self, query: str, limit: int = 15) -> List[Dict[str, str]]:
        if not query or len(query.strip()) < 1:
            return []

        q = query.strip()
        q_upper = q.upper()
        q_like = f"%{q.lower()}%"

        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT DISTINCT station_code, station_name
            FROM train_stations
            WHERE station_code LIKE ? OR LOWER(station_name) LIKE ?
            ORDER BY 
                CASE 
                    WHEN station_code = ? THEN 1
                    WHEN station_code LIKE ? THEN 2
                    WHEN LOWER(station_name) LIKE ? THEN 3
                    ELSE 4
                END
            LIMIT ?
        """, (f"{q_upper}%", q_like, q_upper, f"{q_upper}%", f"{q.lower()}%", limit))
        rows = cursor.fetchall()
        conn.close()

        return [{"code": r["station_code"], "name": r["station_name"], "city": r["station_name"]} for r in rows]

    # =========================================================================
    # GET STATS
    # =========================================================================
    def get_stats(self) -> Dict[str, Any]:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM trains")
        total_trains = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM train_stations")
        total_stops = cursor.fetchone()[0]

        cursor.execute("SELECT train_type, COUNT(*) as cnt FROM trains GROUP BY train_type")
        rows = cursor.fetchall()
        categories = {r["train_type"]: r["cnt"] for r in rows}
        conn.close()

        return {
            "total_trains": total_trains,
            "total_stops": total_stops,
            "categories": categories,
            "dataset": "Curated Indian Railways Directory (1,500 Trains)"
        }

train_directory_db = TrainDirectoryDB()

