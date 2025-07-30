# Sample Data Generation Scripts

This directory contains scripts to generate sample data for the MURAi application, including **Tagalog, English, and Taglish** content for comprehensive language detection testing.

## Available Scripts

### 1. Generate Sample Data (`generateSampleData.js`)
Generates comprehensive sample data for the entire application including users, groups, detected words, and activities.

**Features:**
- **Multi-language support**: English, Tagalog, and Taglish content
- **Realistic Tagalog profanity**: putangina, gago, tanga, bobo, ulol, etc.
- **Contextual language detection**: Automatically assigns correct language based on content
- **Mixed language scenarios**: Taglish combinations like "what the putangina", "gago ka naman"
- **Authentic Filipino contexts**: "Nagsabi ng masasamang salita sa comment", "Nang-aaway sa group chat"

**Run:**
```bash
npm run generate-sample-data
```

### 2. Generate User-Specific Data (`generateUserSpecificData.js`)
Generates data for specific users with personalized detection patterns.

**Features:**
- **User-focused data**: Generates 30 days of detection history per user
- **Language variety**: Includes English, Tagalog, and Taglish detections
- **Realistic patterns**: 2-8 detections per day with varied severity levels
- **Contextual accuracy**: Language detection based on actual word and context content

**Run:**
```bash
npm run generate-user-data
```

## Language Detection Features

### Tagalog Words Included:
- **Profanity**: putangina, gago, tanga, bobo, ulol, tarantado, buwisit
- **Expressions**: pakyu, tangina, leche, peste, hudas, kingina, punyeta
- **Descriptive**: hayop, walang hiya, bastos, sira ulo, lintik, pucha
- **Intensifiers**: bwisit, hinayupak, walang kwenta, pangit, kadiri, yawa

### Taglish Combinations:
- "gago ka", "tanga mo", "bobo naman"
- "what the putangina", "tangina naman"
- "pakyu ka", "gago this", "ulol ka ba"

### Contextual Examples:
- **Tagalog**: "Nagsabi ng putangina sa post", "Nambubully sa mga kaklase"
- **Taglish**: "Nagsabi ng what the putangina sa chat", "Said tanga mo sa group"
- **English**: "Threatening message in comment section", "Inappropriate language in chat"

## Data Generated

### DetectedWords Collection:
- **word**: The harmful word detected
- **context**: Realistic context where it was found
- **language**: Auto-detected (English/Tagalog/Taglish/Other)
- **patternType**: Profanity, Harassment, Toxicity, Hate Speech
- **severity**: Low, Medium, High (based on sentiment)
- **siteType**: Social Media, Forum, Chat, Email
- **sentimentScore**: -1.0 to 0.5 (negative values for harmful content)
- **accuracy**: 75% to 98% detection accuracy
- **responseTime**: 50ms to 500ms processing time

### Language Distribution:
The scripts generate realistic language distribution:
- **English**: ~40% of detections
- **Tagalog**: ~35% of detections  
- **Taglish**: ~20% of detections
- **Other**: ~5% of detections

## Testing the Detection Analytics

After running the scripts, you can test the Detection Analytics screen:

1. **Language Distribution Pie Chart**: Will show proper English/Tagalog/Taglish breakdown
2. **Most Flagged Words**: Will include realistic Tagalog profanity
3. **Pattern Analysis**: Will categorize different types of harmful content
4. **Severity Distribution**: Will show risk levels based on sentiment scores

## Prerequisites

1. MongoDB connection configured in `.env`
2. All dependencies installed (`npm install`)
3. Database accessible and running

## Notes

- Scripts will clear existing sample data before generating new data
- Language detection is based on actual word content and context
- Realistic Filipino social media contexts included
- Proper sentiment scoring for different severity levels
- All generated data follows the DetectedWord schema requirements

## Usage Example

```bash
# Navigate to server directory
cd murai-server

# Generate comprehensive sample data
npm run generate-sample-data

# Or generate user-specific data
npm run generate-user-data
```

The generated data will provide a realistic testing environment for the Detection Analytics screen with proper multi-language support and authentic Filipino content patterns.
