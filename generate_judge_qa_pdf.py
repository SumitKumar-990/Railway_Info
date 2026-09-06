import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "RailVue AI — SIH Hackathon Judge Q&A Defense Guide")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)
        
        # Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 35, page_text)
        self.drawString(54, 35, "RAILVUE AI (SIH 2026) — EVALUATION & JURY DEFENSE HANDBOOK")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)
        self.restoreState()

def build_pdf(filename="RailVue_AI_Hackathon_Judge_QA_Guide.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=58,
        bottomMargin=55
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    c_primary = colors.HexColor("#0F172A")    # Slate 900
    c_brand = colors.HexColor("#1E40AF")      # Blue 800
    c_accent = colors.HexColor("#0369A1")     # Sky 700
    c_hint_bg = colors.HexColor("#F8FAFC")    # Slate 50
    c_hint_border = colors.HexColor("#93C5FD")# Blue 300
    c_text = colors.HexColor("#334155")       # Slate 700
    c_q_text = colors.HexColor("#0F172A")     # Slate 900
    c_badge_bg = colors.HexColor("#DBEAFE")   # Blue 100

    # Typography
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=c_primary,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=c_brand,
        spaceAfter=10
    )

    intro_box_style = ParagraphStyle(
        'IntroBox',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#1E293B")
    )

    cat_header_style = ParagraphStyle(
        'CatHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.white
    )

    cat_badge_style = ParagraphStyle(
        'CatBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1E3A8A"),
        alignment=2
    )

    q_title_style = ParagraphStyle(
        'QuestionText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13.5,
        textColor=c_q_text,
        spaceBefore=4,
        spaceAfter=3,
        keepWithNext=True
    )

    hint_text_style = ParagraphStyle(
        'HintText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1E293B")
    )

    story = []

    # Title & Subtitle
    story.append(Paragraph("RailVue AI — Hackathon Judge Q&A Guide", title_style))
    story.append(Paragraph("Smart India Hackathon (SIH 2026) | Complete Viva & Technical Defense Handbook", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_brand, spaceBefore=0, spaceAfter=8))

    # Executive Overview Box
    overview_text = (
        "<b>Executive Summary & Strategy for Jury Q&A:</b><br/>"
        "During a 5–10 minute hackathon evaluation, judges test beyond surface-level UI demos to probe "
        "data integrity, feature grounding, failure resiliency, and mathematical choices. This defense guide covers "
        "<b>24 targeted, realistic questions</b> across 9 core architectural pillars. Each entry includes the exact "
        "question a panelist will ask and a clear, evidence-backed answer hint citing real system benchmarks "
        "(e.g., MAE 7.31 min vs 66 min baseline, Open-Meteo caching, dead-reckoning fallback, and time-based cross-validation)."
    )
    overview_table = Table([[Paragraph(overview_text, intro_box_style)]], colWidths=[504])
    overview_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#EFF6FF")),
        ('BORDER', (0, 0), (-1, -1), 1, colors.HexColor("#BFDBFE")),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]))
    story.append(overview_table)
    story.append(Spacer(1, 10))

    # Categories Data
    categories = [
        {
            "num": "1",
            "title": "Weather Data Usage",
            "count": "3 Questions",
            "questions": [
                (
                    "Q1. Why did you choose Open-Meteo over other weather APIs like OpenWeatherMap or WeatherAPI, and how are these features injected into your model?",
                    "Highlight that Open-Meteo is open-access with no restrictive rate-limit API keys, offers historical ERA5 reanalysis and high-resolution forecasts, and station coordinates (from <code>stations.json</code>) map directly to fetch rainfall (mm), temperature (°C), humidity, and wind speed."
                ),
                (
                    "Q2. What happens in production if the Open-Meteo API experiences downtime or network latency?",
                    "Mention your graceful degradation strategy: station-wise weather is cached with TTL, and if the API drops, the pipeline automatically falls back to historical seasonal averages (climatological norms) without crashing or blocking the sub-15ms ETA inference loop."
                ),
                (
                    "Q3. Did weather features show a strong statistical correlation with delays, or did they only act as marginal noise?",
                    "Be honest that weather has a weak linear correlation on normal sunny days, but serves as a critical non-linear trigger for systemic delays during extreme monsoon downpours and winter fog (low temperatures combined with high humidity in Dec–Feb)."
                )
            ]
        },
        {
            "num": "2",
            "title": "Congestion Score Proxy",
            "count": "2 Questions",
            "questions": [
                (
                    "Q1. Since Indian Railways doesn't publicly expose real-time track circuit or signaling block occupancy, how exactly is your congestion score derived?",
                    "Explain the exact formula from <code>prepare_datasets.py</code>: <i>congestion_score = (delayed_trains / total_trains) × average_delay_magnitude</i>, computed per route segment (<code>station_curr_station_next</code>), hour of day, and day of week."
                ),
                (
                    "Q2. What are the limitations of using this historical proxy, and how heavily does the model weigh it compared to physical features?",
                    "Acknowledge that it is a trailing statistical proxy rather than live physical block occupancy. Consequently, physical distance remaining and scheduled travel time carry the primary structural weight, while the congestion score provides localized penalties at bottleneck junctions like CNB, PRYJ, and DDU."
                )
            ]
        },
        {
            "num": "3",
            "title": "System Architecture & API Resiliency",
            "count": "3 Questions",
            "questions": [
                (
                    "Q1. Walk us through the end-to-end data flow from the passenger search in React to the FastAPI prediction response.",
                    "Explain that the React/TypeScript frontend queries <code>/api/trains/{id}/live</code>; FastAPI matches the active track segment and remaining distance, loads the serialized bundle (<code>eta_production_bundle.pkl</code>) in memory for sub-15ms inference, and returns updated ETAs with confidence scores."
                ),
                (
                    "Q2. How does your architecture decouple live train tracking from the heavy ML prediction pipeline to handle high concurrency?",
                    "Clarify that live telemetry updates run asynchronously via a background polling/ticker service into an in-memory/cache store, while ML predictions are purely stateless read queries that evaluate pre-computed feature vectors without blocking external API calls."
                ),
                (
                    "Q3. What happens if the external RailRadar/NTES API fails or rate-limits—and how did you resolve earlier mock-fallback issues?",
                    "Explain that earlier unhandled API errors caused inconsistent mock fallbacks; you resolved this by implementing an explicit Dead-Reckoning engine (advancing train position based on sectional speed and elapsed timetable schedule), health status badges, and an active fallback cache."
                )
            ]
        },
        {
            "num": "4",
            "title": "ML Architecture & Model Choice",
            "count": "3 Questions",
            "questions": [
                (
                    "Q1. Why did a basic Linear Regression model outperform or match advanced gradient-boosted trees like XGBoost and Random Forest on this dataset?",
                    "Explain that total remaining travel time has an overwhelmingly linear physical foundation (<i>time ≈ distance / speed + delay</i>); because <code>scheduled_remaining_time</code> and <code>distance_remaining</code> are strong linear anchors, standard Linear Regression achieves high precision (MAE ~7.31 min) without overfitting."
                ),
                (
                    "Q2. What did your Stacking Regressor and hyperparameter tuning reveal about XGBoost’s actual contribution?",
                    "Point out that in the Ridge meta-learner stacking setup, the coefficient assigned to Linear Regression was ~1.0 while XGBoost was near zero for gross trip time, proving that XGBoost's true value lies in the isolated <i>delay-deviation task</i> (Δy = actual - scheduled) rather than raw journey duration."
                ),
                (
                    "Q3. Why did you avoid complex deep learning architectures like LSTMs or Transformers, and how do you justify the interpretability tradeoff?",
                    "Emphasize tabular data efficiency, sub-millisecond CPU inference, and operational auditability: railway section controllers require transparent feature weights and SHAP explanations rather than an unexplainable black box when making train routing decisions."
                )
            ]
        },
        {
            "num": "5",
            "title": "Feature Engineering & Data Integrity",
            "count": "3 Questions",
            "questions": [
                (
                    "Q1. What features were engineered versus raw telemetry, and how did you prevent time-based data leakage during training?",
                    "Raw features were station IDs, timestamps, and current delay; engineered features included route segments, historical station/route delay means, and congestion scores. Leakage was strictly prevented by computing all historical aggregations only on training folds and using chronological <code>TimeSeriesSplit</code>."
                ),
                (
                    "Q2. How did you encode high-cardinality categorical features like station codes and train numbers?",
                    "State that you used <code>OrdinalEncoder</code> mapping with explicit unknown-category handling and fallback to global segment averages, avoiding sparse matrix blowup from One-Hot Encoding across hundreds of railway stations."
                ),
                (
                    "Q3. How does your preprocessing handle missing or corrupted sensor values in transit?",
                    "Mention that numeric telemetry fields use median imputation calculated strictly from training distributions, categorical fields use mode imputation, and missing delay numbers default to the scheduled timetable offset."
                )
            ]
        },
        {
            "num": "6",
            "title": "Accuracy, Metrics & Benchmarks",
            "count": "3 Questions",
            "questions": [
                (
                    "Q1. Can you give us the exact performance numbers of your model versus a naive schedule baseline?",
                    "Cite your concrete benchmark results: the naive schedule baseline produced an MAE of ~66 minutes (or ~18–26 mins on zero-deviation), whereas the trained regression model cut MAE down to <b>~7.31 minutes</b> (RMSE ~9.22 mins), delivering a >42% error reduction."
                ),
                (
                    "Q2. Your model reports an R² of ~0.998. Isn't that suspiciously high or deceptive for railway delays?",
                    "Acknowledge this upfront: gross remaining travel time spans hundreds of minutes, which mathematically inflates R²; that is why you also built and evaluated the isolated <b>Delay-Only Task</b> (Δy), where the model achieved an honest R² ≈ 0.50 solely on unpredictable delay fluctuations."
                ),
                (
                    "Q3. How does the model perform across different journey lengths, particularly on long-distance trips versus short arrivals?",
                    "Reference your distance-bucket MAE breakdown: short trips (<200 km) have the lowest absolute error (~3–4 mins), while long-distance hauls (>600 km) accumulate variance (~10–12 mins) due to downstream congestion compounding."
                )
            ]
        },
        {
            "num": "7",
            "title": "Novelty & Real-World Viability",
            "count": "2 Questions",
            "questions": [
                (
                    "Q1. How is RailVue AI superior to the existing NTES or IRCTC live running status that passengers already use?",
                    "NTES relies on static, retrospective timetable offsets (<i>current delay + schedule</i>) that assume a train will maintain its current delay forever; RailVue AI dynamically anticipates future track congestion, section bottlenecks, and weather friction ahead of the train."
                ),
                (
                    "Q2. What is the practical roadmap to deploy this prototype at Indian Railways production scale?",
                    "Explain that the system can sit on top of the existing CRIS FOIS/COA (Control Office Application) and RTIS (locomotive GPS) data feeds via Kafka message streams, running containerized FastAPI worker pods behind a Redis caching layer for millions of passenger hits."
                )
            ]
        },
        {
            "num": "8",
            "title": "Failure Modes & Edge Cases",
            "count": "3 Questions",
            "questions": [
                (
                    "Q1. What is your 'cold-start' strategy for a newly introduced train or an unfamiliar route with zero historical data?",
                    "The pipeline defaults to the physical kinematic baseline (<i>distance / speed + current delay</i>) combined with broad zonal averages (e.g., Northern Railway historical averages) until dedicated trip history is accumulated."
                ),
                (
                    "Q2. How does the model react to extreme unforeseen disruptions like track maintenance, derailments, or sudden protests?",
                    "Clarify that standard regression models cannot foresee unannounced physical track closures; to handle this, the system incorporates the <b>Delay-Risk Classifier</b> and anomaly detection thresholds to flag abnormal station dwell times and trigger manual controller overrides."
                ),
                (
                    "Q3. How do you monitor for model drift across changing seasons (e.g., monsoon to winter fog)?",
                    "Propose a weekly automated retraining cron job comparing rolling 7-day MAE against the baseline, triggering retrains with updated seasonal weather and congestion weights when performance degrades past an operational threshold."
                )
            ]
        },
        {
            "num": "9",
            "title": "Team & Project Execution",
            "count": "2 Questions",
            "questions": [
                (
                    "Q1. What was the single most difficult technical bug your team had to debug during this hackathon build?",
                    "Discuss solving the subtle data leakage where future journey delays were accidentally leaking into station historical aggregations, which initially produced unrealistically perfect metrics until strict <code>GroupShuffleSplit</code> and chronological splits were enforced."
                ),
                (
                    "Q2. If your team had another two weeks to work on RailVue AI, what feature would you prioritize next?",
                    "Mention integrating real-time loco-pilot telemetry from RTIS via direct WebSocket streams and building automated rake-turnaround prediction for incoming trains at terminus platforms."
                )
            ]
        }
    ]

    for cat in categories:
        # Category Header Bar Table
        cat_header_html = f"<b>CATEGORY {cat['num']}: {cat['title'].upper()}</b>"
        cat_badge_html = f"<b>{cat['count']}</b>"
        header_table = Table(
            [[Paragraph(cat_header_html, cat_header_style), Paragraph(cat_badge_html, cat_badge_style)]],
            colWidths=[404, 100]
        )
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), c_brand),
            ('BACKGROUND', (1, 0), (1, 0), c_badge_bg),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('BOX', (0, 0), (-1, -1), 1, c_brand),
        ]))

        story.append(header_table)
        story.append(Spacer(1, 4))

        for q_text, hint_text in cat['questions']:
            q_flowable = []
            q_flowable.append(Paragraph(f"• {q_text}", q_title_style))
            
            hint_box_content = f"<b>Strong Defense Strategy & Answer:</b><br/>{hint_text}"
            hint_table = Table([[Paragraph(hint_box_content, hint_text_style)]], colWidths=[504])
            hint_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), c_hint_bg),
                ('BORDER', (0, 0), (-1, -1), 0.5, c_hint_border),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ]))
            
            q_flowable.append(hint_table)
            q_flowable.append(Spacer(1, 5))
            story.append(KeepTogether(q_flowable))

        story.append(Spacer(1, 6))

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {filename}")

if __name__ == '__main__':
    build_pdf()
