const cloudinary = require('cloudinary').v2
const multer = require('multer')
const path = require('path')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  cb(null, true)
}

const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
})

const uploadMiddleware = (req, res, next) => {
  const single = multerUpload.single('image')

  single(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'La imagen supera los 10MB.' })
      }
      return res.status(400).json({ error: err.message })
    }

    if (err) {
      return res.status(400).json({ error: err.message })
    }

    if (req.file) {
      const allowed = /jpeg|jpg|png|webp|gif/
      if (!allowed.test(path.extname(req.file.originalname).toLowerCase())) {
        return res.status(400).json({
          error: 'Solo se permiten imágenes (jpg, png, webp, gif).',
        })
      }
    }

    next()
  })
}

module.exports = { upload: uploadMiddleware, cloudinary }
