from transformers import AutoTokenizer, pipeline
from optimum.onnxruntime import ORTModelForSequenceClassification
from typing import List, Dict
from app.core.config import settings


class EmotionDetectionService:
    """
    Emotion detection service using ONNX-optimized RoBERTa model.
    
    Uses the quantized ONNX version of SamLowe/roberta-base-go_emotions
    for significantly faster inference (~10-20x speedup for small batches).
    """
    
    def __init__(self):
        # Load ONNX-optimized model with fallback
        model_id = settings.EMOTION_MODEL
        file_name = settings.EMOTION_MODEL_FILE
        
        try:
            # Try to load ONNX model first
            model = ORTModelForSequenceClassification.from_pretrained(
                model_id, 
                file_name=file_name
            )
            tokenizer = AutoTokenizer.from_pretrained(model_id)
            
            self.classifier = pipeline(
                task="text-classification",
                model=model,
                tokenizer=tokenizer,
                top_k=None,
                function_to_apply="sigmoid"  # Multi-label classification
            )
            print("✅ Loaded ONNX-optimized emotion model")
            
        except Exception as e:
            print(f"⚠️ Failed to load ONNX model: {e}")
            print("🔄 Falling back to regular PyTorch model...")
            
            try:
                # Fallback to regular model without ONNX optimization
                self.classifier = pipeline(
                    task="text-classification",
                    model="SamLowe/roberta-base-go_emotions",
                    top_k=None,
                    function_to_apply="sigmoid"
                )
                print("✅ Loaded fallback PyTorch emotion model")
                
            except Exception as fallback_error:
                print(f"❌ Failed to load fallback model: {fallback_error}")
                # Use a simple sentiment model as last resort
                self.classifier = pipeline(
                    task="sentiment-analysis",
                    model="cardiffnlp/twitter-roberta-base-sentiment-latest"
                )
                print("✅ Loaded basic sentiment model as last resort")
                self.use_sentiment_fallback = True
        
        # Initialize fallback flag if not set
        if not hasattr(self, 'use_sentiment_fallback'):
            self.use_sentiment_fallback = False
            

        
        # Comprehensive emotion-to-emoji-color mapping for all 28 GoEmotions
        self.emotion_emoji_map = {
            # Positive emotions
            "joy": {"emoji": "😊", "color": "#FEF3C7"},
            "admiration": {"emoji": "🤩", "color": "#FEF3C7"},
            "approval": {"emoji": "👍", "color": "#D1FAE5"},
            "gratitude": {"emoji": "🙏", "color": "#FEF3C7"},
            "love": {"emoji": "❤️", "color": "#FECACA"},
            "optimism": {"emoji": "😊", "color": "#D1FAE5"},
            "caring": {"emoji": "🤗", "color": "#D1FAE5"},
            "excitement": {"emoji": "🎉", "color": "#FEF3C7"},
            "amusement": {"emoji": "😄", "color": "#FEF3C7"},
            "pride": {"emoji": "😌", "color": "#FEF3C7"},
            "relief": {"emoji": "😌", "color": "#D1FAE5"},
            
            # Ambiguous emotions
            "desire": {"emoji": "🤔", "color": "#E0E7FF"},
            "realization": {"emoji": "💡", "color": "#FEF3C7"},
            "curiosity": {"emoji": "🤔", "color": "#E0E7FF"},
            "neutral": {"emoji": "😐", "color": "#F3F4F6"},
            
            # Negative emotions - sadness (enhanced detection)
            "sadness": {"emoji": "😢", "color": "#DBEAFE"},
            "disappointment": {"emoji": "😞", "color": "#DBEAFE"},
            "grief": {"emoji": "😭", "color": "#DBEAFE"},
            "remorse": {"emoji": "😔", "color": "#DBEAFE"},
            "embarrassment": {"emoji": "😳", "color": "#FEE2E2"},
            
            # Negative emotions - anger (enhanced detection)
            "anger": {"emoji": "😠", "color": "#FEE2E2"},
            "annoyance": {"emoji": "😒", "color": "#FEE2E2"},
            "disapproval": {"emoji": "👎", "color": "#FEE2E2"},
            "disgust": {"emoji": "🤢", "color": "#FEE2E2"},
            
            # Negative emotions - fear/anxiety
            "fear": {"emoji": "😰", "color": "#EDE9FE"},
            "nervousness": {"emoji": "😰", "color": "#E0E7FF"},
            
            # Confusion
            "confusion": {"emoji": "😕", "color": "#F3F4F6"},
            "surprise": {"emoji": "😲", "color": "#E0E7FF"},
        }
        
        # Enhanced emotion detection for grief/loss keywords
        self.grief_keywords = [
            'lost', 'death', 'died', 'father', 'mother', 'pet', 'grief', 'mourning',
            'funeral', 'passed away', 'gone', 'miss', 'lonely', 'empty', 'devastated'
        ]
        
        self.anger_keywords = [
            'angry', 'mad', 'furious', 'rage', 'hate', 'frustrated', 'annoyed',
            'pissed', 'irritated', 'upset', 'livid', 'outraged'
        ]
    
    def detect_emotion(
        self, 
        text: str, 
        threshold: float = 0.15
    ) -> List[Dict[str, any]]:
        """
        Detect emotions from text input using ONNX-optimized model.
        
        Args:
            text: Input text to analyze
            threshold: Minimum confidence threshold (default: 0.3)
            
        Returns:
            List of emotion dictionaries with label, confidence, emoji, and color
            
        Example:
            >>> service.detect_emotion("I'm so grateful for your help!")
            [
                {
                    "label": "gratitude",
                    "confidence": 0.92,
                    "emoji": "🙏",
                    "color": "#FEF3C7"
                },
                {
                    "label": "joy",
                    "confidence": 0.45,
                    "emoji": "😊",
                    "color": "#FEF3C7"
                }
            ]
        """
        try:
            # Run inference
            results = self.classifier([text])[0]
            
            # Enhanced emotion detection with keyword boosting
            text_lower = text.lower()
            
            # Handle different model outputs
            if hasattr(self, 'use_sentiment_fallback') and self.use_sentiment_fallback:
                # Convert sentiment to emotion format
                emotions = []
                for result in results:
                    label = result['label']
                    score = result['score']
                    
                    # Map sentiment labels to emotions
                    if 'positive' in label.lower() or 'pos' in label.lower():
                        emotion_label = "joy"
                    elif 'negative' in label.lower() or 'neg' in label.lower():
                        emotion_label = "sadness"
                    else:
                        emotion_label = "neutral"
                    
                    if score >= threshold:
                        emotion_meta = self.emotion_emoji_map.get(
                            emotion_label, 
                            {"emoji": "😐", "color": "#F3F4F6"}
                        )
                        
                        emotions.append({
                            "label": emotion_label,
                            "confidence": round(score, 3),
                            "emoji": emotion_meta["emoji"],
                            "color": emotion_meta["color"]
                        })
            else:
                # Normal emotion detection with keyword boosting
                emotions = []
                for result in results:
                    label = result['label']
                    score = result['score']
                    
                    # Boost scores for grief/anger keywords
                    if any(keyword in text_lower for keyword in self.grief_keywords):
                        if label in ['sadness', 'grief', 'disappointment']:
                            score = min(0.95, score + 0.3)  # Boost grief-related emotions
                    
                    if any(keyword in text_lower for keyword in self.anger_keywords):
                        if label in ['anger', 'annoyance', 'disapproval']:
                            score = min(0.95, score + 0.3)  # Boost anger-related emotions
                    
                    if score >= threshold:
                        emotion_meta = self.emotion_emoji_map.get(
                            label, 
                            {"emoji": "😐", "color": "#F3F4F6"}
                        )
                        
                        emotions.append({
                            "label": label,
                            "confidence": round(score, 3),
                            "emoji": emotion_meta["emoji"],
                            "color": emotion_meta["color"]
                        })
            
            # Sort by confidence (highest first)
            emotions.sort(key=lambda x: x['confidence'], reverse=True)
            
            # If no emotions above threshold, return neutral
            if not emotions:
                emotions = [{
                    "label": "neutral",
                    "confidence": 0.5,
                    "emoji": "😐",
                    "color": "#F3F4F6"
                }]
            
            return emotions
            
        except Exception as e:
            # Fallback to neutral emotion on error
            print(f"Error in emotion detection: {e}")
            return [{
                "label": "neutral",
                "confidence": 0.5,
                "emoji": "😐",
                "color": "#F3F4F6"
            }]
    
    def get_dominant_emotion(self, emotions: List[Dict]) -> Dict:
        """
        Get the emotion with highest confidence.
        
        Args:
            emotions: List of emotion dictionaries from detect_emotion()
            
        Returns:
            Single emotion dictionary with highest confidence
        """
        if not emotions:
            return {
                "label": "neutral",
                "confidence": 0.5,
                "emoji": "😐",
                "color": "#F3F4F6"
            }
        
        return emotions[0]  # Already sorted by confidence in detect_emotion()


# Singleton instance
_emotion_service = None

def get_emotion_service() -> EmotionDetectionService:
    """Get or create singleton emotion detection service instance."""
    global _emotion_service
    if _emotion_service is None:
        _emotion_service = EmotionDetectionService()
    return _emotion_service
