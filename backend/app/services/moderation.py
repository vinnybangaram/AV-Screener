import re

class ModerationService:
    """
    Service for sanitizing user content and detecting spam/abuse.
    """
    
    BANNED_WORDS = {'scam', 'shilling', 'abuse', 'cheat', 'fraud'} 
    LINK_PATTERN = re.compile(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+')

    def is_spam(self, text: str) -> bool:
        # Check for banned words
        words = set(text.lower().split())
        if words.intersection(self.BANNED_WORDS):
            return True
        
        # Check for excessive links
        links = self.LINK_PATTERN.findall(text)
        if len(links) > 1:
            return True
            
        return False

    def sanitize(self, text: str) -> str:
        # Basic HTML strip
        clean = re.sub(r'<[^>]*>', '', text)
        return clean.strip()

moderation = ModerationService()
