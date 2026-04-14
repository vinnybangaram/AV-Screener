from PIL import Image, ImageDraw, ImageFont
import io
import os
from app.services.stock_analysis_service import get_full_analysis
from app.services.confluence_engine import engine as confluence_engine

class ShareCardService:
    def generate_stock_card(self, symbol: str) -> bytes:
        # 1. Fetch live data
        try:
            analysis = get_full_analysis(symbol)
            conf = confluence_engine.generate_score(symbol)
            price = analysis['price']
            score = conf['score']
        except:
            price = 0
            score = 0

        # 2. Create Canvas (OG standard: 1200x630)
        width, height = 1200, 630
        img = Image.new('RGB', (width, height), color=(15, 23, 42)) # Deep Slate
        draw = ImageDraw.Draw(img)

        # 3. Add Gradient Effect (Simulated)
        for i in range(height):
            color = (15 + (i // 20), 23 + (i // 30), 42 + (i // 15))
            draw.line([(0, i), (width, i)], fill=color)

        # 4. Load Fonts (Fallback to default if not found)
        try:
            # Try some common windows fonts
            font_path = "C:/Windows/Fonts/SegoeUIB.ttf" # Bold
            if not os.path.exists(font_path): font_path = "arial.ttf"
            
            title_font = ImageFont.truetype(font_path, 120)
            price_font = ImageFont.truetype(font_path, 80)
            label_font = ImageFont.truetype(font_path, 40)
            score_font = ImageFont.truetype(font_path, 160)
        except:
            title_font = ImageFont.load_default()
            price_font = ImageFont.load_default()
            label_font = ImageFont.load_default()
            score_font = ImageFont.load_default()

        # 5. Draw Content
        # Symbol
        draw.text((80, 80), symbol.upper(), font=title_font, fill=(255, 255, 255))
        draw.text((80, 220), "Institutional Terminal Analysis", font=label_font, fill=(99, 102, 241)) # Accent color

        # Price
        draw.text((80, 320), f"Price: ₹{price:,.2f}", font=price_font, fill=(248, 250, 252))

        # Confluence Score Circle (Simplified)
        circle_center = (950, 315)
        radius = 180
        # Draw background ring
        draw.ellipse([circle_center[0]-radius, circle_center[1]-radius, circle_center[0]+radius, circle_center[1]+radius], 
                     outline=(30, 41, 59), width=20)
        
        # Color based on score
        score_color = (16, 185, 129) if score > 70 else (245, 158, 11) if score > 40 else (239, 68, 68)
        
        # Draw arc for score
        draw.arc([circle_center[0]-radius, circle_center[1]-radius, circle_center[0]+radius, circle_center[1]+radius], 
                 start=-90, end=(-90 + (score * 3.6)), fill=score_color, width=20)
        
        # Draw score text
        score_txt = str(int(score))
        tw, th = draw.textbbox((0, 0), score_txt, font=score_font)[2:]
        draw.text((circle_center[0] - tw/2, circle_center[1] - th/2 - 20), score_txt, font=score_font, fill=score_color)
        draw.text((circle_center[0] - 80, circle_center[1] + 80), "CONFLUENCE", font=label_font, fill=(148, 163, 184))

        # Footer Branding
        draw.rectangle([0, 550, 1200, 630], fill=(2, 6, 23))
        draw.text((450, 565), "AV SCREENER", font=label_font, fill=(255, 255, 255))
        draw.text((800, 565), "PROBABILISTIC QUANT SUITE", font=label_font, fill=(71, 85, 105))

        # 6. Save to stream
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        return buf.getvalue()

share_card_service = ShareCardService()
