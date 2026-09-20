const mongoose = require('mongoose');

const blueprintSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  ideaInput: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['web', 'mobile', 'both']
  },
  generatedMarkdown: {
    type: String,
    required: true
  },
  title: {
    type: String,
    trim: true
  },
  detailLevel: {
    type: String,
    enum: ['brief', 'full'],
    default: 'full'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for common queries
blueprintSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Blueprint', blueprintSchema);
