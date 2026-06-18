import mongoose from 'mongoose';

/**
 * Connect to MongoDB database
 * Uses connection string from environment variables
 */
const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alumni_platform';
    
    await mongoose.connect(mongoURI);
    
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

export default connectDB;
