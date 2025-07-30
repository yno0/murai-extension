import dotenv from 'dotenv';
import mongoose from 'mongoose';
import DetectedWord from '../models/detectedWordModel.js';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function cleanupLanguages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Define allowed languages
    const allowedLanguages = ['Tagalog', 'Taglish', 'English'];

    // Find all detected words with languages not in the allowed list
    const wordsToDelete = await DetectedWord.find({
      language: { $nin: allowedLanguages }
    });

    console.log(`Found ${wordsToDelete.length} detected words with non-allowed languages:`);
    
    // Group by language to show what will be deleted
    const languageCounts = {};
    wordsToDelete.forEach(word => {
      const lang = word.language || 'Unknown';
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    });

    console.log('Languages to be removed:');
    Object.entries(languageCounts).forEach(([lang, count]) => {
      console.log(`  ${lang}: ${count} detections`);
    });

    // Delete the words
    const deleteResult = await DetectedWord.deleteMany({
      language: { $nin: allowedLanguages }
    });

    console.log(`\n✅ Successfully deleted ${deleteResult.deletedCount} detected words`);

    // Show remaining language distribution
    const remainingWords = await DetectedWord.aggregate([
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📊 Remaining language distribution:');
    remainingWords.forEach(lang => {
      console.log(`  ${lang._id || 'Unknown'}: ${lang.count} detections`);
    });

    const totalRemaining = remainingWords.reduce((sum, lang) => sum + lang.count, 0);
    console.log(`\nTotal remaining detections: ${totalRemaining}`);

  } catch (error) {
    console.error('Error cleaning up languages:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupLanguages();
