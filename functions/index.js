/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});

admin.initializeApp();

exports.getImageBase64 = onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const { path } = req.query;
      
      if (!path) {
        logger.error("No path provided");
        return res.status(400).json({ error: 'Path parameter required' });
      }
      
      logger.info(`Getting image for path: ${path}`);
      
      const bucket = admin.storage().bucket();
      const file = bucket.file(path);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        logger.error(`File not found: ${path}`);
        return res.status(404).json({ error: 'File not found' });
      }
      
      const [buffer] = await file.download();
      const base64 = buffer.toString('base64');
      
      // Detect MIME type from file extension
      let mimeType = 'image/jpeg';
      if (path.toLowerCase().includes('.png')) {
        mimeType = 'image/png';
      } else if (path.toLowerCase().includes('.gif')) {
        mimeType = 'image/gif';
      } else if (path.toLowerCase().includes('.webp')) {
        mimeType = 'image/webp';
      }
      
      logger.info(`Successfully processed image: ${path}`);
      
      res.json({
        base64: `data:${mimeType};base64,${base64}`
      });
    } catch (error) {
      logger.error('Error processing image:', error);
      res.status(500).json({ error: 'Failed to get image' });
    }
  });
});
